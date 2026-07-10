import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { ListOrdered, Trash2, MapPin, Phone, User, CheckCircle, Info, X, Rocket, Copy, Check, Mail, Key, ArrowRight, Shield } from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { SEOHead } from '../components/SEOHead';
import { CartUpsell } from '../components/CartUpsell';
import { OrderTracker } from '../components/OrderTracker';
import { FoodItem } from '../types/store';

interface CheckoutProps {
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile' | 'checkout') => void;
  onClose?: () => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ setTab, onClose }) => {
  const { cart, config, updateCartQuantity, removeFromCart, createOrder, currentUser, coupons, updateCoupon, registerUser } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showPopupHelp, setShowPopupHelp] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  const hasFreeDeliveryItem = cart.some(item => item.item.delivery_gratis);

  // Guest form fields
  const [clientName, setClientName] = useState(currentUser?.nombre || '');
  const [clientPhone, setClientPhone] = useState(currentUser?.telefono || '');
  const [clientEmail, setClientEmail] = useState(currentUser?.email || '');
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<'Pago Móvil' | 'Zelle' | 'Efectivo' | 'Transferencia' | 'Otro'>('Pago Móvil');
  const [validationError, setValidationError] = useState('');
  const [crearCuenta, setCrearCuenta] = useState(true);
  const [customPaymentNote, setCustomPaymentNote] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Registration modal after order
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword] = useState(() => {
    const phone = clientPhone.replace(/[\s\-()]/g, '');
    return phone;
  });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // Map metrics
  const [shippingLat, setShippingLat] = useState<number>(config.coordenadas_tienda.lat);
  const [shippingLng, setShippingLng] = useState<number>(config.coordenadas_tienda.lng);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [shippingDistance, setShippingDistance] = useState<number>(0);
  const [shippingZone, setShippingZone] = useState<string>('Retiro en Tienda');

  // Shipping method
  const [shippingMethod, setShippingMethod] = useState<'mapa' | 'recogida' | 'zonas'>('mapa');
  const [selectedZoneIndex, setSelectedZoneIndex] = useState<number | null>(null);

  const [processedOrder, setProcessedOrder] = useState<any>(null);

  const activeSedes = config.sedes?.filter(s => s.activa) || [];
  const hasMultipleSedes = activeSedes.length > 1;
  const [selectedSedeId, setSelectedSedeId] = useState<string>('');

  // Restore saved shipping data for logged-in users
  useEffect(() => {
    if (currentUser) {
      const savedMethod = localStorage.getItem('trv_last_shipping_method') as 'mapa' | 'recogida' | 'zonas' | null;
      const savedLat = localStorage.getItem('trv_last_shipping_lat');
      const savedLng = localStorage.getItem('trv_last_shipping_lng');
      const savedZone = localStorage.getItem('trv_last_shipping_zone');
      const savedSede = localStorage.getItem('trv_last_sede_id');

      if (savedMethod) {
        setShippingMethod(savedMethod);
        if (savedMethod === 'recogida') {
          setShippingLat(config.coordenadas_tienda.lat);
          setShippingLng(config.coordenadas_tienda.lng);
          setShippingCost(0);
          setShippingDistance(0);
          setShippingZone('Retiro en Tienda');
        } else if (savedMethod === 'zonas') {
          setShippingLat(config.coordenadas_tienda.lat);
          setShippingLng(config.coordenadas_tienda.lng);
          setShippingCost(0);
          setShippingDistance(0);
          setShippingZone(savedZone || 'Selecciona una zona');
        } else if (savedLat && savedLng) {
          setShippingLat(parseFloat(savedLat));
          setShippingLng(parseFloat(savedLng));
          if (savedZone) setShippingZone(savedZone);
        }
      }
      if (savedSede) setSelectedSedeId(savedSede);
    }
  }, [currentUser?.id]);

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const CopyButton: React.FC<{ text: string; fieldId: string }> = ({ text, fieldId }) => (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); handleCopy(text, fieldId); }}
      className="shrink-0 p-1 rounded hover:bg-zinc-200 transition-colors cursor-pointer"
      title="Copiar"
    >
      {copiedField === fieldId
        ? <Check size={12} className="text-emerald-500" />
        : <Copy size={12} className="text-zinc-400 hover:text-zinc-600" />
      }
    </button>
  );

  const getWhatsAppPhone = (): string => {
    if (selectedSedeId) {
      const selectedSede = activeSedes.find(s => s.id === selectedSedeId);
      if (selectedSede) return selectedSede.telefono;
    }
    if (hasMultipleSedes && shippingLat && shippingLng) {
      let closestSede = activeSedes[0];
      let minDist = Infinity;
      for (const sede of activeSedes) {
        const R = 6371;
        const dLat = (sede.coordenadas.lat - shippingLat) * Math.PI / 180;
        const dLng = (sede.coordenadas.lng - shippingLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(shippingLat * Math.PI / 180) * Math.cos(sede.coordenadas.lat * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        if (dist < minDist) { minDist = dist; closestSede = sede; }
      }
      return closestSede.telefono;
    }
    return config.telefono_soporte || '584124976451';
  };

  const subtotalUsd = cart.reduce((acc, ci) => {
    const extrasTotal = ci.selected_options?.reduce((e, opt) => e + opt.precio_usd, 0) || 0;
    return acc + ((ci.item.precio_usd + extrasTotal) * ci.quantity);
  }, 0);
  const effectiveShippingCost = hasFreeDeliveryItem ? 0 : shippingCost;
  const discountFromCoupon = appliedCoupon ? (subtotalUsd * (appliedCoupon.discount_percent / 100)) : 0;
  const totalUsd = subtotalUsd - discountFromCoupon + effectiveShippingCost;
  const totalBs = totalUsd * config.tasa_cambio;

  const handleLocationPicked = (lat: number, lng: number, distance: number, cost: number, zoneName: string) => {
    setShippingLat(lat);
    setShippingLng(lng);
    setShippingDistance(distance);
    setShippingCost(cost);
    setShippingZone(zoneName);
  };

  const handleShippingMethodChange = (method: 'mapa' | 'recogida' | 'zonas') => {
    setShippingMethod(method);
    setSelectedZoneIndex(null);
    if (method === 'recogida') {
      setShippingLat(config.coordenadas_tienda.lat);
      setShippingLng(config.coordenadas_tienda.lng);
      setShippingCost(0);
      setShippingDistance(0);
      setShippingZone('Retiro en Tienda');
    } else if (method === 'zonas') {
      setShippingLat(config.coordenadas_tienda.lat);
      setShippingLng(config.coordenadas_tienda.lng);
      setShippingCost(0);
      setShippingDistance(0);
      setShippingZone('Selecciona una zona');
    }
  };

  const handleZoneSelect = (index: number) => {
    const zones = config.delivery_zonas || [];
    if (index >= zones.length) return;
    setSelectedZoneIndex(index);
    const selected = zones[index];
    setShippingCost(config.delivery_gratis ? 0 : selected.cost);
    setShippingDistance((selected.minKm + selected.maxKm) / 2);
    setShippingZone(selected.name);
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    const found = coupons.find(c => c.code === couponInput.toUpperCase().trim());
    if (!found) { setCouponError('Cupón no válido'); return; }
    if (!found.active) { setCouponError('Este cupón ya no está activo'); return; }
    if (found.usage_limit && found.usage_count >= found.usage_limit) { setCouponError('Este cupón ha agotado sus usos'); return; }
    setAppliedCoupon(found);
    setCouponInput('');
    const applause = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3');
    applause.play().catch((err) => console.error('Error al reproducir aplausos:', err.message));
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalUserId: string | undefined = currentUser ? currentUser.id : undefined;
    const finalClientName = currentUser ? currentUser.nombre : clientName;
    const finalClientPhone = currentUser ? currentUser.telefono : clientPhone;
    const finalClientEmail = currentUser ? currentUser.email : clientEmail;

    // Guest validation: phone required, email optional but validated if provided
    const cleanedPhone = finalClientPhone.replace(/[\s\-()]/g, '');
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!cleanedPhone) {
      setValidationError('Por favor, ingrese su número de teléfono.');
      return;
    }
    if (!phoneRegex.test(cleanedPhone)) {
      setValidationError('El número de teléfono no es válido. Debe contener de 7 a 15 números (ej: +584124976451).');
      return;
    }
    if (finalClientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalClientEmail)) {
      setValidationError('El correo electrónico no es válido.');
      return;
    }
    setValidationError('');
    setIsProcessing(true);

    const preOrderId = `PED-${Math.floor(1000 + Math.random() * 9000)}-VAL-${new Date().getFullYear()}`;

    let productosDetailText = '';
    cart.forEach(ci => {
      const extrasTotal = ci.selected_options?.reduce((e, opt) => e + opt.precio_usd, 0) || 0;
      const itemTotal = (ci.item.precio_usd + extrasTotal) * ci.quantity;
      productosDetailText += `- ${ci.quantity}x ${ci.item.nombre} - $${itemTotal.toFixed(2)}\n`;
      if (ci.selected_options && ci.selected_options.length > 0) {
        ci.selected_options.forEach(opt => {
          productosDetailText += opt.precio_usd > 0
            ? `   + ${opt.option_name} (+$${opt.precio_usd.toFixed(2)})\n`
            : `   + ${opt.option_name}\n`;
        });
      }
    });

    const deliveryLabel = shippingMethod === 'recogida'
      ? 'Recogida en Tienda'
      : shippingMethod === 'zonas'
        ? `Entrega por Zonas (${shippingZone})`
        : effectiveShippingCost === 0
          ? 'Retiro en Tienda'
          : `Delivery por Mapa (${shippingDistance} KM)`;

    const finalTotalUsd = (subtotalUsd + effectiveShippingCost).toFixed(2);
    const finalTotalBs = ((subtotalUsd + effectiveShippingCost) * config.tasa_cambio).toFixed(2);
    const sedeInfo = hasMultipleSedes && selectedSedeId
      ? `\n*Sede Destino:* ${activeSedes.find(s => s.id === selectedSedeId)?.nombre || 'N/A'}`
      : '';

    const whatsappMessage =
`*Nuevo Pedido en ${config.site_nombre || 'BurgerPop'}*${sedeInfo}
----------------------------------
*Pedido ID:* ${preOrderId}
*Cliente:* ${finalClientName || 'Cliente sin nombre'}
*Telefono:* ${cleanedPhone}
${finalClientEmail ? `*Correo:* ${finalClientEmail}\n` : ''}*Direccion de Entrega:* ${shippingZone}
*Ubicacion Mapa:* https://www.google.com/maps?q=${shippingLat},${shippingLng}
*Metodo Despacho:* ${deliveryLabel} - Costo: $${effectiveShippingCost.toFixed(2)}

*Detalle del Carrito:*
${productosDetailText}
*Total Neto a Pagar:* $${finalTotalUsd} / ${finalTotalBs} Bs.
*Metodo de Pago:* ${selectedPayment}${selectedPayment === 'Otro' && customPaymentNote ? `\n*Detalle Pago:* ${customPaymentNote}` : ''}
----------------------------------`;

    let cleanConfigPhone = getWhatsAppPhone().replace(/\D/g, '');
    if (cleanConfigPhone.startsWith('0')) {
      cleanConfigPhone = '58' + cleanConfigPhone.substring(1);
    }
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${cleanConfigPhone}?text=${encodedMessage}`;

    const created = await createOrder({
      cliente_nombre: finalClientName || 'Cliente sin nombre',
      cliente_telefono: cleanedPhone,
      cliente_email: finalClientEmail || '',
      usuario_id: finalUserId,
      guest_phone: currentUser ? undefined : cleanedPhone,
      guest_email: currentUser ? undefined : (finalClientEmail || undefined),
      crear_cuenta: !currentUser && crearCuenta,
      items: cart.map(ci => ({
        food_id: ci.item.id,
        nombre: ci.item.nombre,
        precio_usd: ci.item.precio_usd,
        cantidad: ci.quantity,
        selected_options: ci.selected_options,
        options_total_usd: ci.options_total_usd,
        ingredientes_removidos: ci.ingredientes_removidos || []
      })),
      tipo_entrega: 'delivery',
      costo_envio_usd: effectiveShippingCost,
      descuento_cupon_usd: discountFromCoupon,
      cupon_codigo: appliedCoupon?.code,
      metodo_pago: selectedPayment,
      lat: shippingLat,
      lng: shippingLng,
      direccion_envio: `${shippingZone} (Distancia: ${shippingDistance}km)`,
      distancia_km: shippingDistance,
      notas_admin: orderNotes
    }, preOrderId);

    if (created) {
      setProcessedOrder(created);
      if (appliedCoupon) {
        updateCoupon(appliedCoupon.id, { usage_count: (appliedCoupon.usage_count || 0) + 1 });
      }
      localStorage.setItem('trv_active_order_id', created.id);
      // Save shipping data for logged-in users
      if (currentUser) {
        localStorage.setItem('trv_last_shipping_method', shippingMethod);
        localStorage.setItem('trv_last_shipping_lat', String(shippingLat));
        localStorage.setItem('trv_last_shipping_lng', String(shippingLng));
        localStorage.setItem('trv_last_shipping_zone', shippingZone);
        if (selectedSedeId) localStorage.setItem('trv_last_sede_id', selectedSedeId);
      }
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      // Show registration modal for guests
      if (!currentUser && crearCuenta) {
        setShowRegistrationModal(true);
      }
    } else {
      setValidationError('Error crítico: No se pudo registrar el pedido en el servidor. Verifique su conexión e intente de nuevo.');
    }
    setIsProcessing(false);
  };

  const handleCreateAccount = async () => {
    setRegError('');
    if (!regEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      setRegError('Ingrese un correo válido.');
      return;
    }
    setRegLoading(true);
    try {
      const phone = clientPhone.replace(/[\s\-()]/g, '');
      await registerUser(
        clientName || 'Cliente',
        regEmail.trim().toLowerCase(),
        phone,
        phone
      );
      setRegSuccess(true);
    } catch (err: any) {
      setRegError(err?.message || 'Error al crear la cuenta.');
    }
    setRegLoading(false);
  };

  if (processedOrder) {
    return (
      <OrderTracker
        order={processedOrder}
        onClose={() => { setProcessedOrder(null); if (onClose) onClose(); else setTab('home'); }}
        onContinueShopping={() => { setProcessedOrder(null); setTab('catalog'); }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-24 text-zinc-900">
      <SEOHead title="Checkout Rapido" />

      {/* Celebration animation */}
      <AnimatePresence>
        {showCelebration && (
          <div className="fixed inset-0 pointer-events-none z-[300] flex items-center justify-center overflow-hidden">
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0, x: 0, y: 100 }}
                animate={{ opacity: [1, 1, 0], scale: [0, 1.5, 0.5], x: (Math.random() - 0.5) * 800, y: -(Math.random() * 600 + 200), rotate: Math.random() * 1080 }}
                transition={{ duration: 2.5, ease: [0.23, 1, 0.32, 1], delay: Math.random() * 0.15 }}
                className="absolute"
              >
                {i % 10 === 0 ? (
                  <Rocket size={32} style={{ color: config.theme_color || '#0f5d34', fill: `${config.theme_color || '#0f5d34'}30` }} />
                ) : (
                  <div className={`w-2.5 h-5 rounded-sm shadow-sm ${['bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-rose-500'][i % 5]}`} style={{ transform: `rotate(${Math.random() * 90}deg)` }} />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Processing overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/70 backdrop-blur-md">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 border-4 rounded-full" style={{ borderColor: `${config.theme_color || '#0f5d34'}20` }}></div>
            <div className="absolute w-16 h-16 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${config.theme_color || '#0f5d34'} transparent` }}></div>
          </div>
          <div className="mt-6 flex flex-col items-center gap-1">
            <p className="text-sm font-black font-display text-zinc-900 uppercase tracking-tight">Procesando Pedido</p>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Sincronizando con {config.site_nombre || ''} Cloud...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: config.theme_color || '#0f5d34' }}>Compra Segura</span>
        <h2 className="text-[21px] font-bold font-display text-zinc-900">Tu Pedido</h2>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center justify-center p-6 bg-zinc-50/50 border border-zinc-200 rounded-lg">
          <ListOrdered size={36} className="text-zinc-400 mb-2" />
          <p className="text-xs font-bold font-display text-zinc-800">Tu carrito esta vacio</p>
          <p className="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed">Agrega productos para continuar.</p>
          <button type="button" onClick={() => setTab('catalog')} className="mt-4 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer hover:opacity-90" style={{ backgroundColor: config.theme_color || '#0f5d34' }}>
            Explorar el Menu
          </button>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
          {/* SECTION: Cart summary */}
          <div className="p-4 border border-zinc-200 rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-zinc-800">Tu Carrito ({cart.reduce((s, ci) => s + ci.quantity, 0)} items)</h3>
              <button type="button" onClick={() => setTab('catalog')} className="text-[10px] font-bold underline" style={{ color: config.theme_color || '#0f5d34' }}>Editar</button>
            </div>
            <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
              {cart.map(item => {
                const extrasTotal = item.selected_options?.reduce((e, opt) => e + opt.precio_usd, 0) || 0;
                const subTotalItem = (item.item.precio_usd + extrasTotal) * item.quantity;
                return (
                  <div key={item.item.id} className="flex items-center gap-3 text-zinc-900">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                      <img src={item.item.imagen_urls[0]} alt={item.item.nombre} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-bold text-zinc-800 line-clamp-1">{item.item.nombre}</h4>
                      {item.selected_options && item.selected_options.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {item.selected_options.map((opt, idx) => (
                            <span key={idx} className="text-[8px] px-1 py-0.5 rounded-full bg-violet-50 text-violet-600 font-semibold border border-violet-100">
                              {opt.option_name}{opt.precio_usd > 0 ? ` +$${opt.precio_usd.toFixed(2)}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-zinc-200 rounded-lg bg-white h-7">
                        <button type="button" onClick={() => updateCartQuantity(item.item.id, item.quantity - 1)} className="w-6 h-full flex items-center justify-center text-zinc-500 hover:text-violet-600 text-[10px] transition-all active:scale-90 cursor-pointer">-</button>
                        <span className="text-[10px] px-1.5 text-zinc-900 font-mono font-semibold">{item.quantity}</span>
                        <button type="button" onClick={() => updateCartQuantity(item.item.id, item.quantity + 1)} className="w-6 h-full flex items-center justify-center text-zinc-500 hover:text-violet-600 text-[10px] transition-all active:scale-90 cursor-pointer">+</button>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.item.id)} className="text-zinc-400 hover:text-red-500 p-1 rounded transition-all cursor-pointer">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Coupon */}
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-zinc-100">
              <label className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">Cupon</label>
              <div className="flex gap-2">
                <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="CODIGO" className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-[10px] outline-none focus:border-violet-600 font-mono" />
                <button type="button" onClick={handleApplyCoupon} className="text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:opacity-90 transition-colors" style={{ backgroundColor: config.theme_color || '#0f5d34' }}>Aplicar</button>
              </div>
              {couponError && <span className="text-[9px] text-red-500 font-medium">{couponError}</span>}
              {appliedCoupon && (
                <div className="text-[10px] font-bold flex items-center gap-1" style={{ color: config.theme_color || '#0f5d34' }}>
                  Cupon "{appliedCoupon.code}" aplicado: -{appliedCoupon.discount_percent}%
                </div>
              )}
            </div>
          </div>

          {/* SECTION: Cart Upsell */}
          <CartUpsell onAddToCart={(item: FoodItem) => {}} />

          {/* SECTION: Shipping */}
          <div className="p-4 border border-zinc-200 rounded-lg bg-white shadow-sm">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-zinc-800 mb-3 flex items-center gap-1.5">
              <MapPin size={14} /> Direccion de Entrega
            </h3>
            {/* Shipping method buttons */}
            <div className="flex gap-1.5 mb-3">
              {config.recogida_en_local && (
                <button type="button" onClick={() => handleShippingMethodChange('recogida')} className={`border p-2 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer flex-1 ${shippingMethod === 'recogida' ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}>
                  Recogida
                </button>
              )}
              {config.entrega_por_zonas && (
                <button type="button" onClick={() => handleShippingMethodChange('zonas')} className={`border p-2 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer flex-1 ${shippingMethod === 'zonas' ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}>
                  Zonas
                </button>
              )}
              {!config.entrega_por_zonas && (
                <button type="button" onClick={() => handleShippingMethodChange('mapa')} className={`border p-2 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer flex-1 ${shippingMethod === 'mapa' ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}>
                  Mapa
                </button>
              )}
            </div>

            {shippingMethod === 'mapa' && (
              <LeafletMap shopCoords={config.coordenadas_tienda} onLocationSelected={handleLocationPicked} config={config} />
            )}
            {shippingMethod === 'recogida' && (
              <div className="p-3 border border-emerald-200 rounded-lg bg-emerald-50/50 text-[10px] text-emerald-700">
                <p className="font-bold text-emerald-800">Retiro en Tienda</p>
                <p className="mt-1">{config.direccion_fisica || 'Direccion de la tienda'}</p>
              </div>
            )}
            {shippingMethod === 'zonas' && (
              <div className="flex flex-col gap-1.5">
                {(config.delivery_zonas || []).map((z, i) => (
                  <button type="button" key={z.id} onClick={() => handleZoneSelect(i)} className={`border p-3 rounded-lg text-left flex items-center justify-between text-[10px] font-bold transition-all cursor-pointer ${selectedZoneIndex === i ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'}`}>
                    <span>{z.name}</span>
                    <span className="font-mono">{config.delivery_gratis ? 'Gratis' : `$${z.cost.toFixed(2)}`}</span>
                  </button>
                ))}
              </div>
            )}

            {hasMultipleSedes && (
              <div className="flex flex-col gap-1.5 mt-3">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Enviar pedido a:</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeSedes.map(sede => (
                    <button key={sede.id} type="button" onClick={() => setSelectedSedeId(sede.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-semibold transition-all border cursor-pointer ${selectedSedeId === sede.id ? 'text-white' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'}`}
                      style={selectedSedeId === sede.id ? { borderColor: config.theme_color || '#FF6B35', backgroundColor: config.theme_color || '#FF6B35' } : undefined}>
                      <span>{sede.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-3 pt-2 border-t border-zinc-100 text-[10px]">
              <span className="text-zinc-500">Envio:</span>
              <span className="font-mono font-bold" style={{ color: config.theme_color || '#0f5d34' }}>
                {hasFreeDeliveryItem ? 'GRATIS' : shippingCost === 0 ? 'Retiro / Gratis' : `$${shippingCost.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* SECTION: Contact */}
          <div className="p-4 border border-zinc-200 rounded-lg bg-white shadow-sm">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-zinc-800 mb-3 flex items-center gap-1.5">
              <Phone size={14} /> Tu Telefono
            </h3>
            {currentUser ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: `${config.theme_color || '#0f5d34'}08`, borderColor: `${config.theme_color || '#0f5d34'}20` }}>
                <div className="w-8 h-8 text-white rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: config.theme_color || '#0f5d34' }}>{currentUser.nombre[0]}</div>
                <div>
                  <p className="text-[11px] font-bold text-zinc-900">{currentUser.nombre}</p>
                  <p className="text-[9px] text-zinc-500">{currentUser.email || currentUser.telefono}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1"><Phone size={9} /> Telefono (obligatorio)</span>
                  <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+58412..." className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-950" required />
                </div>
                <div className="flex flex-col gap-1.5 mt-2">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1"><User size={9} /> Nombre (opcional)</span>
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Tu nombre" className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-950" />
                </div>
                <div className="flex flex-col gap-1.5 mt-2">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">✉️ Correo (opcional)</span>
                  <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="tu@email.com" className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-950" />
                </div>
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input type="checkbox" checked={crearCuenta} onChange={(e) => setCrearCuenta(e.target.checked)} className="w-4 h-4 rounded border-zinc-300 accent-current" style={{ accentColor: config.theme_color || '#0f5d34' }} />
                  <span className="text-[10px] text-zinc-600">Crear cuenta con estos datos (para futuros pedidos)</span>
                </label>
              </>
            )}
          </div>

          {/* SECTION: Payment */}
          <div className="p-4 border border-zinc-200 rounded-lg bg-white shadow-sm">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-zinc-800 mb-3">Metodo de Pago</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'Pago Móvil', label: 'Pago Movil Bs', icon: 'Bs', enabled: config.pagomovil_enabled },
                { key: 'Zelle', label: 'Zelle USD', icon: 'USD', enabled: config.zelle_enabled },
                { key: 'Efectivo', label: 'Efectivo', icon: 'Cash', enabled: config.efectivo_enabled },
                { key: 'Transferencia', label: 'Transferencia', icon: 'Bco', enabled: config.transferencia_enabled },
                { key: 'Otro', label: 'Otro', icon: '?', enabled: true }
              ].filter(pm => pm.enabled).map(pm => (
                <button type="button" key={pm.key} onClick={() => setSelectedPayment(pm.key as any)} className={`border p-2.5 rounded-lg text-left flex items-center gap-2 transition-all cursor-pointer text-[10px] ${selectedPayment === pm.key ? 'bg-zinc-950 text-white border-zinc-950 font-bold' : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'}`}>
                  <span className="text-[8px] uppercase font-mono font-bold px-1 py-0.5 rounded bg-zinc-200 text-zinc-800 shrink-0">{pm.icon}</span>
                  <span className="font-semibold">{pm.label}</span>
                </button>
              ))}
            </div>

            {/* Payment details with copy buttons */}
            <div className="mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] text-zinc-700 leading-relaxed font-mono">
              <span className="font-bold font-display text-[11px] mb-2 block" style={{ color: config.theme_color || '#0f5d34' }}>Instrucciones:</span>

              {selectedPayment === 'Pago Móvil' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-zinc-200">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-400 uppercase">Banco / Titular</span>
                      <span className="text-zinc-800 font-bold">{(config.pagomovil_data || 'Banesco (0134)').split('-')[0]?.trim()}</span>
                    </div>
                    <CopyButton text={config.pagomovil_data || 'Banesco (0134) - RIF J-50123456-7'} fieldId="pm-data" />
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-zinc-200">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-400 uppercase">Telefono</span>
                      <span className="text-zinc-800 font-bold">{(config.pagomovil_data || '').match(/\d{4,}/)?.[0] || '04121234567'}</span>
                    </div>
                    <CopyButton text={(config.pagomovil_data || '').match(/\d{4,}/)?.[0] || '04121234567'} fieldId="pm-phone" />
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-zinc-200">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-400 uppercase">Cedula / RIF</span>
                      <span className="text-zinc-800 font-bold">{(config.pagomovil_data || '').match(/V-\d+[.-]?\d+[.-]?\d+|J-\d+[.-]?\d+[.-]?\d+/)?.[0] || 'V-12345678'}</span>
                    </div>
                    <CopyButton text={(config.pagomovil_data || '').match(/V-\d+[.-]?\d+[.-]?\d+|J-\d+[.-]?\d+[.-]?\d+/)?.[0] || 'V-12345678'} fieldId="pm-ci" />
                  </div>
                  <div className="font-black mt-1 text-center py-1 rounded" style={{ color: config.theme_color || '#0f5d34', backgroundColor: `${config.theme_color || '#0f5d34'}10` }}>
                    Calcular: {totalBs.toFixed(2)} Bs.
                  </div>
                </div>
              )}

              {selectedPayment === 'Zelle' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-zinc-200">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-400 uppercase">Correo Zelle</span>
                      <span className="text-zinc-800 font-bold">{config.zelle_data || 'pagos@marketo.com.ve'}</span>
                    </div>
                    <CopyButton text={config.zelle_data || 'pagos@marketo.com.ve'} fieldId="zelle-email" />
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-zinc-200">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-400 uppercase">Monto a enviar</span>
                      <span className="font-black" style={{ color: config.theme_color || '#0f5d34' }}>${totalUsd.toFixed(2)} USD</span>
                    </div>
                    <CopyButton text={`$${totalUsd.toFixed(2)}`} fieldId="zelle-amount" />
                  </div>
                </div>
              )}

              {selectedPayment === 'Efectivo' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-zinc-200">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-400 uppercase">Instruccion</span>
                      <span className="text-zinc-800 font-bold">{config.efectivo_data || 'Paga al motorizado en efectivo al recibir'}</span>
                    </div>
                  </div>
                  <div className="font-black mt-1 text-center py-1 rounded" style={{ color: config.theme_color || '#0f5d34', backgroundColor: `${config.theme_color || '#0f5d34'}10` }}>
                    Total a pagar: ${totalUsd.toFixed(2)} / {totalBs.toFixed(2)} Bs.
                  </div>
                </div>
              )}

              {selectedPayment === 'Transferencia' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-zinc-200">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-400 uppercase">Datos Bancarios</span>
                      <span className="text-zinc-800 font-bold">{config.transferencia_data || `Banesco - ${config.site_nombre || 'Tienda'} C.A.`}</span>
                    </div>
                    <CopyButton text={config.transferencia_data || `Banesco - ${config.site_nombre || 'Tienda'} C.A.`} fieldId="transfer-data" />
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-zinc-200">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-400 uppercase">Monto</span>
                      <span className="font-black" style={{ color: config.theme_color || '#0f5d34' }}>${totalUsd.toFixed(2)} USD</span>
                    </div>
                    <CopyButton text={`$${totalUsd.toFixed(2)}`} fieldId="transfer-amount" />
                  </div>
                </div>
              )}

              {selectedPayment === 'Otro' && (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={customPaymentNote}
                    onChange={(e) => setCustomPaymentNote(e.target.value)}
                    placeholder="Describe como vas a pagar (ej: Pago con Binance, Pago con另一个 app, etc)"
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-[10px] outline-none focus:border-violet-600 resize-none font-mono"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION: Notes */}
          <div className="p-4 border border-zinc-200 rounded-lg bg-white shadow-sm">
            <label className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">Notas (opcional)</label>
            <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Ej: Sin cebolla..." className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-[10px] outline-none focus:border-violet-600 resize-none mt-1.5" rows={2} />
          </div>

          {/* SECTION: Summary */}
          <div className="p-5 border border-zinc-900 bg-zinc-950 text-white rounded-xl flex flex-col gap-2.5 text-xs shadow-md">
            <div className="flex justify-between text-zinc-400">
              <span className="font-medium text-[12px]">Productos:</span>
              <span className="font-mono font-bold text-white text-[12px]">${subtotalUsd.toFixed(2)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between" style={{ color: config.theme_color || '#0f5d34' }}>
                <span className="font-medium text-[12px]">Descuento ({appliedCoupon.discount_percent}%):</span>
                <span className="font-mono font-bold text-[12px]">-${discountFromCoupon.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400">
              <span className="font-medium text-[12px]">Envio:</span>
              <span className="font-mono text-[12px]">
                {hasFreeDeliveryItem ? <span className="uppercase animate-pulse" style={{ color: `${config.theme_color || '#0f5d34'}cc` }}>Gratis</span> : shippingCost === 0 ? 'Retiro' : `$${shippingCost.toFixed(2)}`}
              </span>
            </div>
            <div className="border-t border-zinc-800 pt-2.5 flex justify-between items-center">
              <span className="font-bold text-[11px] uppercase tracking-wider text-zinc-200">Total:</span>
              <div className="text-right">
                <p className="font-mono text-lg font-black text-white leading-none">${totalUsd.toFixed(2)}</p>
                <p className="font-mono text-[10px] font-bold mt-1" style={{ color: `${config.theme_color || '#0f5d34'}cc` }}>{totalBs.toFixed(2)} Bs.</p>
              </div>
            </div>
          </div>

          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600 text-center animate-pulse">
              {validationError}
            </div>
          )}

          {/* CTA Button */}
          <button type="submit" disabled={isProcessing} className={`sticky bottom-0 z-10 w-full ${isProcessing ? 'bg-zinc-400' : 'bg-[#25D366] hover:bg-[#128C7E]'} text-white font-bold font-display py-4 rounded-xl text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg`}>
            {isProcessing ? 'Procesando...' : 'Procesar y Enviar WhatsApp'}
          </button>
        </form>
      )}
    </div>
  );
};
