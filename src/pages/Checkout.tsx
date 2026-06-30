import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { ListOrdered, Trash2, MapPin, Phone, User, CheckCircle, Info, X, Rocket } from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { SEOHead } from '../components/SEOHead';
import { CartUpsell } from '../components/CartUpsell';
import { FoodItem } from '../types/store';

interface CheckoutProps {
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile' | 'checkout') => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ setTab }) => {
  const { cart, config, updateCartQuantity, removeFromCart, createOrder, currentUser, coupons, updateCoupon } = useApp();

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
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<'Pago Móvil' | 'Zelle' | 'Efectivo' | 'Transferencia'>('Pago Móvil');
  const [validationError, setValidationError] = useState('');
  const [crearCuenta, setCrearCuenta] = useState(true);

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

    // Guest validation: phone required, name optional
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
*Direccion de Entrega:* ${shippingZone}
*Ubicacion Mapa:* https://www.google.com/maps?q=${shippingLat},${shippingLng}
*Metodo Despacho:* ${deliveryLabel} - Costo: $${effectiveShippingCost.toFixed(2)}

*Detalle del Carrito:*
${productosDetailText}
*Total Neto a Pagar:* $${finalTotalUsd} / ${finalTotalBs} Bs.
*Metodo de Pago:* ${selectedPayment}
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
      cliente_email: currentUser?.email || '',
      usuario_id: finalUserId,
      guest_phone: currentUser ? undefined : cleanedPhone,
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
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } else {
      setValidationError('Error crítico: No se pudo registrar el pedido en el servidor. Verifique su conexión e intente de nuevo.');
    }
    setIsProcessing(false);
  };

  if (processedOrder) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center py-16 gap-4 text-zinc-900 bg-white rounded-lg border border-zinc-200 shadow-sm">
        <SEOHead title="Pedido Confirmado" />
        <div className="w-16 h-16 rounded-full border font-bold flex items-center justify-center text-3xl animate-bounce shadow-sm" style={{ backgroundColor: `${config.theme_color || '#0f5d34'}15`, borderColor: `${config.theme_color || '#0f5d34'}60`, color: config.theme_color || '#0f5d34' }}>
          <CheckCircle size={32} />
        </div>
        <h3 className="text-[21px] font-bold font-display text-zinc-900">¡Su Compra ha sido Procesada!</h3>
        <p className="text-[13px] text-zinc-600 max-w-sm leading-relaxed">
          Hemos recibido su pedido con el ID <strong>{processedOrder.id}</strong>.
          Para agilizar el despacho y coordinar el pago, por favor envíe su factura por WhatsApp.
        </p>
        {!currentUser && crearCuenta && (
          <div className="w-full max-w-sm bg-violet-50 border border-violet-200 p-3 rounded-lg text-xs text-violet-700">
            Se creó una cuenta con su teléfono <strong>{processedOrder.cliente_telefono}</strong>. Podrá acceder desde "Mi Perfil" con su número y cualquier contraseña temporal.
          </div>
        )}
        <div className="w-full max-w-sm bg-zinc-50 border border-zinc-200 p-4 rounded-lg text-left text-xs text-zinc-700 flex flex-col gap-2 font-mono mt-2">
          <span className="font-bold font-display text-[15px] tracking-tight border-b border-zinc-200 pb-1 block" style={{ color: config.theme_color || '#0f5d34' }}>Recibo de Compra {config.site_nombre || ''}</span>
          <div>ID: <span className="text-zinc-900 font-bold">{processedOrder.id}</span></div>
          <div>Cliente: <span className="text-zinc-900">{processedOrder.cliente_nombre}</span></div>
          <div>Monto USD: <span className="font-bold" style={{ color: config.theme_color || '#0f5d34' }}>${(processedOrder.total_usd || 0).toFixed(2)}</span></div>
          <div>Monto Bs: <span className="font-bold" style={{ color: config.theme_color || '#0f5d34' }}>{(processedOrder.total_bs || 0).toFixed(2)} Bs</span></div>
          <div>Metodo: <span className="text-zinc-900 font-bold">{processedOrder.metodo_pago}</span></div>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs mt-6">
          <button
            type="button"
            onClick={() => {
              let details = '';
              processedOrder.items.forEach((it: any) => {
                details += `- ${it.quantity || it.cantidad}x ${it.nombre} - $${(it.precio_usd * (it.quantity || it.cantidad)).toFixed(2)}\n`;
              });
              const msg = `*Nuevo Pedido en ${config.site_nombre || 'BurgerPop'}*\n----------------------------------\n*Pedido ID:* ${processedOrder.id}\n*Cliente:* ${processedOrder.cliente_nombre}\n*Telefono:* ${processedOrder.cliente_telefono}\n*Direccion de Entrega:* ${processedOrder.direccion_envio}\n*Ubicacion Mapa:* https://www.google.com/maps?q=${processedOrder.lat},${processedOrder.lng}\n*Metodo Despacho:* Delivery Express - Costo: $${processedOrder.costo_envio_usd.toFixed(2)}\n\n*Productos:*\n${details}\n*Total Neto a Pagar:* $${processedOrder.total_usd.toFixed(2)} / ${processedOrder.total_bs.toFixed(2)} Bs.\n*Metodo de Pago:* ${processedOrder.metodo_pago}\n----------------------------------`;
              let cleanPhone = (config.telefono_soporte || '584124976451').replace(/\D/g, '');
              if (cleanPhone.startsWith('0')) cleanPhone = '58' + cleanPhone.substring(1);
              const retryUrlMobile = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
              const isMob = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
              if (isMob) {
                window.location.href = retryUrlMobile;
              } else {
                const tab = window.open(retryUrlMobile, '_blank', 'noopener,noreferrer');
                if (!tab) window.location.href = retryUrlMobile;
              }
            }}
            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-4 rounded-lg text-xs transition-transform tracking-wider flex items-center justify-center gap-1.5 uppercase font-display cursor-pointer shadow-md"
          >
            Enviar a WhatsApp
          </button>
          <div className="text-[10px] text-zinc-500 mb-2 flex items-start gap-2">
            <Info className="mt-0.5 flex-shrink-0 text-zinc-400" size={14} />
            <span>Si WhatsApp no se abrió automáticamente, habilite los pop-ups y presione el botón verde.</span>
            <button type="button" onClick={() => setShowPopupHelp(true)} className="ml-auto text-xs underline" style={{ color: config.theme_color || '#0f5d34' }}>
              ¿Cómo?
            </button>
          </div>
          {showPopupHelp && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-zinc-800">Habilitar pop-ups</h3>
                  <button onClick={() => setShowPopupHelp(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
                </div>
                <ol className="list-decimal list-inside text-sm text-zinc-600 space-y-2">
                  <li>En Chrome: menú (⋮) → Configuración → Privacidad → Pop-ups → Permitir <code>wa.me</code>.</li>
                  <li>En Firefox: menú (☰) → Opciones → Privacidad → Pop-ups → Excepciones → Añade <code>https://wa.me</code>.</li>
                  <li>En Edge: Configuración → Cookies → Pop-ups → Añade <code>https://wa.me</code>.</li>
                </ol>
                <button onClick={() => setShowPopupHelp(false)} className="mt-4 w-full text-white py-2 rounded hover:opacity-90" style={{ backgroundColor: config.theme_color || '#0f5d34' }}>
                  Entendido
                </button>
              </div>
            </div>
          )}
          <button type="button" onClick={() => setTab('profile')} className="w-full text-white font-bold py-3 px-4 rounded-lg text-xs transition-all tracking-wider flex items-center justify-center gap-1.5 uppercase font-display cursor-pointer hover:opacity-90" style={{ backgroundColor: config.theme_color || '#0f5d34' }}>
            Ver Estatus de mi Pedido
          </button>
          <button type="button" onClick={() => setTab('home')} className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 text-xs py-2 rounded-lg transition-all cursor-pointer font-medium">
            Ir a la Tienda
          </button>
        </div>
      </div>
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
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {config.recogida_en_local && (
                <button type="button" onClick={() => handleShippingMethodChange('recogida')} className={`border p-2 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer ${shippingMethod === 'recogida' ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}>
                  Recogida
                </button>
              )}
              {config.entrega_por_zonas && (
                <button type="button" onClick={() => handleShippingMethodChange('zonas')} className={`border p-2 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer ${shippingMethod === 'zonas' ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}>
                  Zonas
                </button>
              )}
              <button type="button" onClick={() => handleShippingMethodChange('mapa')} className={`border p-2 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer ${shippingMethod === 'mapa' ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}>
                Mapa
              </button>
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
                {config.envio_nacional && (
                  <button type="button" onClick={() => { setSelectedZoneIndex((config.delivery_zonas || []).length); setShippingCost(config.delivery_gratis ? 0 : (config.costo_envio_nacional || 0)); setShippingDistance(100); setShippingZone('Envio Nacional'); }}
                    className={`border p-3 rounded-lg text-left flex items-center justify-between text-[10px] font-bold transition-all cursor-pointer ${selectedZoneIndex === (config.delivery_zonas || []).length ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'}`}>
                    <span>Envio Nacional</span>
                    <span className="font-mono">{config.delivery_gratis ? 'Gratis' : `$${(config.costo_envio_nacional || 0).toFixed(2)}`}</span>
                  </button>
                )}
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
                { key: 'Transferencia', label: 'Transferencia', icon: 'Bco', enabled: config.transferencia_enabled }
              ].filter(pm => pm.enabled).map(pm => (
                <button type="button" key={pm.key} onClick={() => setSelectedPayment(pm.key as any)} className={`border p-2.5 rounded-lg text-left flex items-center gap-2 transition-all cursor-pointer text-[10px] ${selectedPayment === pm.key ? 'bg-zinc-950 text-white border-zinc-950 font-bold' : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'}`}>
                  <span className="text-[8px] uppercase font-mono font-bold px-1 py-0.5 rounded bg-zinc-200 text-zinc-800 shrink-0">{pm.icon}</span>
                  <span className="font-semibold">{pm.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] text-zinc-700 leading-relaxed font-mono">
              <span className="font-bold font-display text-[11px] mb-1 block" style={{ color: config.theme_color || '#0f5d34' }}>Instrucciones:</span>
              {selectedPayment === 'Pago Móvil' && (
                <>
                  <div>{config.pagomovil_data || 'Banesco (0134) - RIF J-50123456-7'}</div>
                  <div className="font-black mt-1" style={{ color: config.theme_color || '#0f5d34' }}>Calcular: {totalBs.toFixed(2)} Bs.</div>
                </>
              )}
              {selectedPayment === 'Zelle' && (
                <>
                  <div>{config.zelle_data || 'pagos@marketo.com.ve'}</div>
                  <div className="font-black mt-1" style={{ color: config.theme_color || '#0f5d34' }}>Monto: ${totalUsd.toFixed(2)} USD</div>
                </>
              )}
              {selectedPayment === 'Efectivo' && <div>{config.efectivo_data || 'Paga al motorizado en efectivo al recibir'}</div>}
              {selectedPayment === 'Transferencia' && <div>{config.transferencia_data || `Banesco - ${config.site_nombre || 'Tienda'} C.A.`}</div>}
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
          <button type="submit" disabled={isProcessing} className={`fixed bottom-20 left-4 right-4 md:relative md:bottom-auto md:left-auto md:right-auto z-50 ${isProcessing ? 'bg-zinc-400' : 'bg-[#25D366] hover:bg-[#128C7E]'} text-white font-bold font-display py-4 rounded-xl text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg`}>
            {isProcessing ? 'Procesando...' : 'Procesar y Enviar WhatsApp'}
          </button>
        </form>
      )}
    </div>
  );
};
