import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { ListOrdered, Trash2, MapPin, Phone, User, CheckCircle, X, Rocket, Copy, Check, ArrowRight, ArrowLeft, Clock, Store, Truck, Navigation } from 'lucide-react';
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
  const { cart, config, addToCart, updateCartQuantity, removeFromCart, createOrder, currentUser, coupons, updateCoupon, orders } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

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
  const [customPaymentNote, setCustomPaymentNote] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Map metrics
  const [shippingLat, setShippingLat] = useState<number>(config.coordenadas_tienda.lat);
  const [shippingLng, setShippingLng] = useState<number>(config.coordenadas_tienda.lng);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [shippingDistance, setShippingDistance] = useState<number>(0);
  const [shippingZone, setShippingZone] = useState<string>('Retiro en Tienda');

  // Shipping method
  const [shippingMethod, setShippingMethod] = useState<'mapa' | 'recogida' | 'zonas'>('mapa');
  const [selectedZoneIndex, setSelectedZoneIndex] = useState<number | null>(null);

  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [cashBills, setCashBills] = useState('');
  const [processedOrder, setProcessedOrder] = useState<any>(null);

  const activeSedes = config.sedes?.filter(s => s.activa) || [];
  const hasMultipleSedes = activeSedes.length > 1;
  const [selectedSedeId, setSelectedSedeId] = useState<string>('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showAlgoMas, setShowAlgoMas] = useState(false);

  // Haversine distance between two coordinates
  const haversineDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  // Detect nearest sede from user location
  const detectNearestSede = useCallback((userLat: number, userLng: number) => {
    if (activeSedes.length === 0) return;
    let nearest = activeSedes[0];
    let minDist = Infinity;
    for (const sede of activeSedes) {
      const dist = haversineDistance(userLat, userLng, sede.coordenadas.lat, sede.coordenadas.lng);
      if (dist < minDist) { minDist = dist; nearest = sede; }
    }
    setSelectedSedeId(nearest.id);
    // Use sede's delivery settings
    if (nearest.delivery_mode === 'km' || (!nearest.delivery_mode && !config.entrega_por_zonas)) {
      setShippingMethod('mapa');
    } else if (nearest.delivery_mode === 'zonas' || (nearest.delivery_mode === 'both' && config.entrega_por_zonas)) {
      setShippingMethod('zonas');
    }
  }, [activeSedes, config.entrega_por_zonas, haversineDistance]);

  // Request user location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización');
      return;
    }
    setIsDetectingLocation(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setShippingLat(latitude);
        setShippingLng(longitude);
        // Save to localStorage for future visits
        localStorage.setItem('trv_user_location', JSON.stringify({ lat: latitude, lng: longitude }));
        // Detect nearest sede
        if (hasMultipleSedes) detectNearestSede(latitude, longitude);
        setIsDetectingLocation(false);
      },
      () => {
        setLocationError('No se pudo obtener tu ubicación. Selecciona manualmente en el mapa.');
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [hasMultipleSedes, detectNearestSede]);

  // Restore saved data
  useEffect(() => {
    if (currentUser) {
      setClientName(currentUser.nombre);
      setClientPhone(currentUser.telefono);
      setClientEmail(currentUser.email || '');
    }
    const savedContact = localStorage.getItem('trv_checkout_contact');
    if (savedContact && !currentUser) {
      try {
        const parsed = JSON.parse(savedContact);
        if (parsed.nombre) setClientName(parsed.nombre);
        if (parsed.telefono) setClientPhone(parsed.telefono);
        if (parsed.email) setClientEmail(parsed.email);
      } catch {}
    }
    // Restore saved user location
    const savedLocation = localStorage.getItem('trv_user_location');
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        if (parsed.lat && parsed.lng) {
          setShippingLat(parsed.lat);
          setShippingLng(parsed.lng);
          if (hasMultipleSedes) detectNearestSede(parsed.lat, parsed.lng);
        }
      } catch {}
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      const savedMethod = localStorage.getItem('trv_checkout_method') as 'mapa' | 'recogida' | 'zonas' | null;
      if (savedMethod) setShippingMethod(savedMethod);

      // Restaurar última dirección de entrega
      const savedDelivery = localStorage.getItem('trv_last_delivery');
      if (savedDelivery) {
        try {
          const parsed = JSON.parse(savedDelivery);
          if (parsed.lat) setShippingLat(parsed.lat);
          if (parsed.lng) setShippingLng(parsed.lng);
          if (parsed.method) setShippingMethod(parsed.method);
          if (parsed.zone) setShippingZone(parsed.zone);
          if (parsed.distance !== undefined) setShippingDistance(parsed.distance);
          if (parsed.cost !== undefined) setShippingCost(parsed.cost);
          if (parsed.zoneIndex !== undefined && parsed.zoneIndex !== null) setSelectedZoneIndex(parsed.zoneIndex);
          if (parsed.sedeId) setSelectedSedeId(parsed.sedeId);
        } catch {}
      } else if (orders.length > 0) {
        // Fallback: usar la última orden del usuario
        const lastOrder = orders.find(o =>
          o.usuario_id === currentUser.id || o.cliente_telefono === currentUser.telefono
        );
        if (lastOrder) {
          if (lastOrder.lat) setShippingLat(lastOrder.lat);
          if (lastOrder.lng) setShippingLng(lastOrder.lng);
          if (lastOrder.tipo_entrega === 'pickup') {
            setShippingMethod('recogida');
          } else if (config.entrega_por_zonas) {
            setShippingMethod('zonas');
          } else {
            setShippingMethod('mapa');
          }
          if (lastOrder.direccion_envio) {
            const zoneMatch = lastOrder.direccion_envio.match(/^(.+?)\s*\(Distancia:/);
            if (zoneMatch) setShippingZone(zoneMatch[1]);
          }
          if (lastOrder.distancia_km) setShippingDistance(lastOrder.distancia_km);
          if (lastOrder.costo_envio_usd) setShippingCost(lastOrder.costo_envio_usd);
        }
      }
    }
  }, [currentUser?.id, orders.length]);

  // Delivery method - restore saved

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton: React.FC<{ text: string; fieldId: string }> = ({ text, fieldId }) => (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); handleCopy(text, fieldId); }}
      className="shrink-0 p-1 rounded hover:bg-zinc-200 transition-colors cursor-pointer"
      title="Copiar"
    >
      {copiedField === fieldId
        ? <Check size={14} className="text-emerald-500" />
        : <Copy size={14} className="text-zinc-400 hover:text-zinc-600" />
      }
    </button>
  );

  const getWhatsAppPhone = (): string => {
    if (selectedSedeId) {
      const selectedSede = activeSedes.find(s => s.id === selectedSedeId);
      if (selectedSede) return selectedSede.whatsapp_numero || selectedSede.telefono;
    }
    if (activeSedes.length > 0) {
      return activeSedes[0].whatsapp_numero || activeSedes[0].telefono || config.telefono_soporte;
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
    const sede = activeSedes.find(s => s.id === selectedSedeId);
    const sedeCoords = sede?.coordenadas || config.coordenadas_tienda;
    if (method === 'recogida') {
      setShippingLat(sedeCoords.lat);
      setShippingLng(sedeCoords.lng);
      setShippingCost(0);
      setShippingDistance(0);
      setShippingZone('Retiro en Tienda');
    } else if (method === 'zonas') {
      setShippingLat(sedeCoords.lat);
      setShippingLng(sedeCoords.lng);
      setShippingCost(0);
      setShippingDistance(0);
      setShippingZone('Selecciona una zona');
    }
  };

  const handleZoneSelect = (index: number) => {
    const zones = activeSedes.find(s => s.id === selectedSedeId)?.delivery_zonas || config.delivery_zonas || [];
    if (index >= zones.length) return;
    setSelectedZoneIndex(index);
    const selected = zones[index];
    const sede = activeSedes.find(s => s.id === selectedSedeId);
    setShippingCost((sede?.delivery_gratis ?? config.delivery_gratis) ? 0 : selected.cost);
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
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  const validateStep1 = (): boolean => {
    if (shippingMethod === 'zonas' && selectedZoneIndex === null) {
      setValidationError('Selecciona una zona de entrega.');
      return false;
    }
    if (shippingMethod === 'mapa' && shippingLat === config.coordenadas_tienda.lat && shippingLng === config.coordenadas_tienda.lng) {
      setValidationError('Selecciona tu dirección de entrega en el mapa.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const validateGuestContact = (): boolean => {
    const cleanedPhone = clientPhone.replace(/[\s\-()]/g, '');
    if (!clientName.trim()) {
      setValidationError('Ingresa tu nombre.');
      return false;
    }
    if (!cleanedPhone) {
      setValidationError('Ingresa tu número de teléfono.');
      return false;
    }
    if (!/^\+?[0-9]{7,15}$/.test(cleanedPhone)) {
      setValidationError('El número de teléfono no es válido.');
      return false;
    }
    if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      setValidationError('El correo electrónico no es válido.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    setValidationError('');
    setCurrentStep(prev => (prev < 3 ? (prev + 1) as 1 | 2 | 3 : prev));
  };

  const handlePrevStep = () => {
    setValidationError('');
    setCurrentStep(prev => (prev > 1 ? (prev - 1) as 1 | 2 | 3 : prev));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && !validateGuestContact()) return;
    if (!paymentConfirmed) {
      setValidationError('Confirma el método de pago para continuar.');
      return;
    }
    setIsProcessing(true);

    const finalUserId = currentUser?.id;
    const finalClientName = currentUser?.nombre || clientName;
    const cleanedPhone = clientPhone.replace(/[\s\-()]/g, '');

    const deliveryLabel = shippingMethod === 'recogida'
      ? 'Recogida en Tienda'
      : shippingMethod === 'zonas'
        ? `Entrega por Zonas (${shippingZone})`
        : effectiveShippingCost === 0
          ? 'Retiro en Tienda'
          : `Delivery por Mapa (${shippingDistance} KM)`;

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

    const sedeInfo = hasMultipleSedes && selectedSedeId
      ? `\n*Sede Destino:* ${activeSedes.find(s => s.id === selectedSedeId)?.nombre || 'N/A'}`
      : '';

    const whatsappMessage =
`*Nuevo Pedido en ${config.site_nombre || 'FoodPop'}*${sedeInfo}
----------------------------------
*Pedido ID:* ${preOrderId}
*Cliente:* ${finalClientName || 'Cliente sin nombre'}
*Telefono:* ${cleanedPhone}
${clientEmail ? `*Correo:* ${clientEmail}\n` : ''}*Direccion de Entrega:* ${shippingZone}
*Ubicacion Mapa:* https://www.google.com/maps?q=${shippingLat},${shippingLng}
*Metodo Despacho:* ${deliveryLabel} - Costo: $${effectiveShippingCost.toFixed(2)}

*Detalle del Carrito:*
${productosDetailText}
*Total Neto a Pagar:* $${totalUsd.toFixed(2)} / ${totalBs.toFixed(2)} Bs.
*Metodo de Pago:* ${selectedPayment}${selectedPayment === 'Otro' && customPaymentNote ? `\n*Detalle Pago:* ${customPaymentNote}` : ''}${selectedPayment === 'Efectivo' && cashBills ? `\n*Billetes:* ${cashBills}` : ''}
----------------------------------`;

    let cleanPhone = getWhatsAppPhone().replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '58' + cleanPhone.substring(1);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;

    const created = await createOrder({
      cliente_nombre: finalClientName || 'Cliente sin nombre',
      cliente_telefono: cleanedPhone,
      cliente_email: clientEmail || '',
      usuario_id: finalUserId,
      items: cart.map(ci => ({
        food_id: ci.item.id,
        nombre: ci.item.nombre,
        precio_usd: ci.item.precio_usd,
        cantidad: ci.quantity,
        selected_options: ci.selected_options,
        options_total_usd: ci.options_total_usd,
        ingredientes_removidos: ci.ingredientes_removidos || []
      })),
      tipo_entrega: shippingMethod === 'recogida' ? 'pickup' : 'delivery',
      costo_envio_usd: effectiveShippingCost,
      descuento_cupon_usd: discountFromCoupon,
      cupon_codigo: appliedCoupon?.code,
      metodo_pago: selectedPayment,
      lat: shippingLat,
      lng: shippingLng,
      direccion_envio: `${shippingZone} (Distancia: ${shippingDistance}km)`,
      distancia_km: shippingDistance,
      notas_admin: orderNotes,
      sede_id: selectedSedeId || undefined,
      guest_phone: !currentUser ? cleanedPhone : undefined,
    }, preOrderId);

    if (created) {
      setProcessedOrder(created);
      if (appliedCoupon) {
        updateCoupon(appliedCoupon.id, { usage_count: (appliedCoupon.usage_count || 0) + 1 });
      }
      localStorage.setItem('trv_active_order_id', created.id);
      localStorage.setItem('trv_checkout_contact', JSON.stringify({ nombre: clientName, telefono: clientPhone, email: clientEmail }));
      localStorage.setItem('trv_checkout_method', shippingMethod);
      localStorage.setItem('trv_last_delivery', JSON.stringify({
        lat: shippingLat,
        lng: shippingLng,
        method: shippingMethod,
        zone: shippingZone,
        distance: shippingDistance,
        cost: shippingCost,
        zoneIndex: selectedZoneIndex,
        sedeId: selectedSedeId
      }));
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } else {
      setValidationError('Error: No se pudo registrar el pedido. Verifique su conexión.');
    }
    setIsProcessing(false);
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

  const themeColor = config.theme_color || '#E31837';
  const stepCompleted = (s: number) => s < currentStep;
  const stepActive = (s: number) => s === currentStep;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-zinc-50 text-zinc-900">
      <SEOHead title="Checkout" />

      {/* Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <div className="fixed inset-0 pointer-events-none z-[300] flex items-center justify-center">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0, y: 100 }}
                animate={{ opacity: [1, 1, 0], scale: [0, 1.5, 0.5], x: (Math.random() - 0.5) * 600, y: -(Math.random() * 500 + 200) }}
                transition={{ duration: 2.5, delay: Math.random() * 0.15 }}
                className="absolute"
              >
                <div className={`w-2 h-3 rounded-sm ${['bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'][i % 4]}`} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Processing overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
          <div className="w-14 h-14 border-4 rounded-full" style={{ borderColor: `${themeColor}20` }} />
          <div className="absolute w-14 h-14 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${themeColor} transparent` }} />
          <p className="mt-6 text-sm font-bold uppercase tracking-wide" style={{ color: themeColor }}>Procesando...</p>
        </div>
      )}

      {/* ═══════════ HEADER ═══════════ */}
      <div className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => currentStep === 1 ? setTab('home') : handlePrevStep()} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors cursor-pointer">
          <ArrowLeft size={18} className="text-zinc-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-zinc-900">Checkout</h1>
          <p className="text-[11px] text-zinc-400">Paso {currentStep} de 3</p>
        </div>
      </div>

      {/* ═══════════ TIMELINE ═══════════ */}
      <div className="bg-white border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          {[
            { step: 1, label: 'Delivery', icon: <MapPin size={14} /> },
            { step: 2, label: 'Resumen', icon: <Truck size={14} /> },
            { step: 3, label: 'Pago', icon: <CheckCircle size={14} /> },
          ].map(({ step, label, icon }, idx) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                    stepCompleted(step)
                      ? 'bg-emerald-500 text-white'
                      : stepActive(step)
                        ? 'text-white shadow-lg'
                        : 'bg-zinc-200 text-zinc-400'
                  }`}
                  style={stepActive(step) ? { backgroundColor: themeColor } : stepCompleted(step) ? {} : {}}
                >
                  {stepCompleted(step) ? <Check size={14} /> : icon}
                </div>
                <span className={`text-[11px] font-bold ${stepActive(step) ? 'text-zinc-900' : 'text-zinc-400'}`}>{label}</span>
              </div>
              {idx < 2 && (
                <div className="flex-1 h-0.5 mx-2 rounded-full mt-[-12px]" style={{ backgroundColor: stepCompleted(step + 1) ? '#10b981' : stepActive(step + 1) ? themeColor : '#e4e4e7' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ═══════════ CONTENT ═══════════ */}
      <div className="flex-1 overflow-y-auto pb-32">
        <AnimatePresence mode="wait">
          {/* ═══ PASO 1: DATOS DEL DELIVERY ═══ */}
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ListOrdered size={36} className="text-zinc-400 mb-2 mx-auto" />
                  <p className="text-sm font-bold text-zinc-800">Tu carrito está vacío</p>
                  <p className="text-xs text-zinc-500 mt-1">Agrega productos para continuar.</p>
                  <button onClick={() => setTab('catalog')} className="mt-4 text-white text-xs font-bold px-5 py-2.5 rounded-xl" style={{ backgroundColor: themeColor }}>
                    Explorar Menú
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cart summary */}
                  <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800">Tu Carrito ({cart.reduce((s, ci) => s + ci.quantity, 0)} items)</h3>
                      <button onClick={() => setTab('catalog')} className="text-[11px] font-bold underline" style={{ color: themeColor }}>Editar</button>
                    </div>
                    <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                      {cart.map(item => {
                        const extrasTotal = item.selected_options?.reduce((e, opt) => e + opt.precio_usd, 0) || 0;
                        const subTotalItem = (item.item.precio_usd + extrasTotal) * item.quantity;
                        return (
                          <div key={item.item.id} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                              <img src={item.item.imagen_urls[0]} alt={item.item.nombre} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-zinc-800 truncate">{item.item.nombre}</h4>
                              {item.selected_options && item.selected_options.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {item.selected_options.map((opt, idx) => (
                                    <span key={idx} className="text-[9px] px-1 py-0.5 rounded-full bg-violet-50 text-violet-600 font-semibold border border-violet-100">
                                      {opt.option_name}{opt.precio_usd > 0 ? ` +$${opt.precio_usd.toFixed(2)}` : ''}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center border border-zinc-200 rounded-lg bg-white h-8">
                                <button onClick={() => updateCartQuantity(item.item.id, item.quantity - 1)} className="w-7 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-800 text-xs transition-all cursor-pointer">-</button>
                                <span className="text-xs px-1.5 text-zinc-900 font-bold">{item.quantity}</span>
                                <button onClick={() => updateCartQuantity(item.item.id, item.quantity + 1)} className="w-7 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-800 text-xs transition-all cursor-pointer">+</button>
                              </div>
                              <button onClick={() => removeFromCart(item.item.id)} className="text-zinc-400 hover:text-red-500 p-1 rounded transition-all cursor-pointer">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 mb-3">Método de Entrega</h3>

                    <div className="flex gap-2 mb-4">
                      {(() => {
                        const sede = activeSedes.find(s => s.id === selectedSedeId) || activeSedes[0];
                        const allowsPickup = sede?.permite_pickup ?? config.recogida_en_local;
                        const deliveryMode = sede?.delivery_mode || (config.entrega_por_zonas ? 'zonas' : 'km');
                        const showZonas = deliveryMode === 'zonas' || deliveryMode === 'both';
                        const showMapa = deliveryMode === 'km' || deliveryMode === 'both';
                        return (
                          <>
                            {allowsPickup && (
                              <button onClick={() => handleShippingMethodChange('recogida')} className={`flex-1 p-3 rounded-xl text-center text-xs font-bold transition-all cursor-pointer border-2 ${
                                shippingMethod === 'recogida' ? 'text-white shadow-md' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                              }`} style={shippingMethod === 'recogida' ? { backgroundColor: themeColor, borderColor: themeColor } : {}}>
                                <Store size={16} className="mx-auto mb-1" />
                                Recoger en Tienda
                              </button>
                            )}
                            {showZonas && (
                              <button onClick={() => handleShippingMethodChange('zonas')} className={`flex-1 p-3 rounded-xl text-center text-xs font-bold transition-all cursor-pointer border-2 ${
                                shippingMethod === 'zonas' ? 'text-white shadow-md' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                              }`} style={shippingMethod === 'zonas' ? { backgroundColor: themeColor, borderColor: themeColor } : {}}>
                                <Truck size={16} className="mx-auto mb-1" />
                                Delivery por Zonas
                              </button>
                            )}
                            {showMapa && (
                              <button onClick={() => handleShippingMethodChange('mapa')} className={`flex-1 p-3 rounded-xl text-center text-xs font-bold transition-all cursor-pointer border-2 ${
                                shippingMethod === 'mapa' ? 'text-white shadow-md' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                              }`} style={shippingMethod === 'mapa' ? { backgroundColor: themeColor, borderColor: themeColor } : {}}>
                                <MapPin size={16} className="mx-auto mb-1" />
                                Delivery por Mapa
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Recogida */}
                    {shippingMethod === 'recogida' && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Store size={16} className="text-emerald-600" />
                          <span className="text-xs font-bold text-emerald-800">Retiro en Tienda</span>
                        </div>
                        {(() => {
                          const sede = activeSedes.find(s => s.id === selectedSedeId) || activeSedes[0];
                          return sede ? (
                            <>
                              <p className="text-xs font-bold text-emerald-800">{sede.nombre}</p>
                              <p className="text-xs text-emerald-700 font-medium">{sede.direccion || config.direccion_fisica}</p>
                              <p className="text-[10px] text-emerald-600 mt-1">{sede.horario || '10:00 AM - 10:00 PM'}</p>
                              <a
                                href={`https://www.google.com/maps?q=${sede.coordenadas.lat},${sede.coordenadas.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 underline"
                              >
                                <MapPin size={10} /> Cómo llegar
                              </a>
                              <div className="mt-3 rounded-xl overflow-hidden border border-emerald-200 h-32">
                                <LeafletMap shopCoords={sede.coordenadas} onLocationSelected={() => {}} config={config} />
                              </div>
                            </>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {/* Delivery por mapa */}
                    {shippingMethod === 'mapa' && (
                      <LeafletMap
                        shopCoords={activeSedes.find(s => s.id === selectedSedeId)?.coordenadas || config.coordenadas_tienda}
                        onLocationSelected={handleLocationPicked}
                        config={config}
                        initialUserCoords={
                          (shippingLat !== config.coordenadas_tienda.lat || shippingLng !== config.coordenadas_tienda.lng)
                            ? { lat: shippingLat, lng: shippingLng }
                            : null
                        }
                      />
                    )}

                    {/* Delivery por zonas */}
                    {shippingMethod === 'zonas' && (
                      <div className="space-y-2">
                        {(activeSedes.find(s => s.id === selectedSedeId)?.delivery_zonas || config.delivery_zonas || []).map((z, i) => (
                          <button key={z.id} onClick={() => handleZoneSelect(i)} className={`w-full p-3 rounded-xl text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer border-2 ${
                            selectedZoneIndex === i ? 'text-white shadow-md' : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                          }`} style={selectedZoneIndex === i ? { backgroundColor: themeColor, borderColor: themeColor } : {}}>
                            <span>{z.name}</span>
                            <span className="font-mono">{(activeSedes.find(s => s.id === selectedSedeId)?.delivery_gratis ?? config.delivery_gratis) ? 'Gratis' : `$${z.cost.toFixed(2)}`}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Multiple sedes */}
                    {hasMultipleSedes && (
                      <div className="mt-4">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Enviar pedido a:</span>
                        <div className="flex flex-wrap gap-2">
                          {activeSedes.map(sede => (
                            <button key={sede.id} onClick={() => setSelectedSedeId(sede.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                              selectedSedeId === sede.id ? 'text-white shadow-md' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                            }`} style={selectedSedeId === sede.id ? { backgroundColor: themeColor, borderColor: themeColor } : {}}>
                              {sede.nombre}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shipping cost summary */}
                    <div className="mt-4 flex justify-between items-center pt-3 border-t border-zinc-100">
                      <span className="text-xs text-zinc-500">Envío:</span>
                      <span className="text-xs font-bold" style={{ color: themeColor }}>
                        {hasFreeDeliveryItem ? 'GRATIS' : effectiveShippingCost === 0 ? 'Retiro / Gratis' : `$${effectiveShippingCost.toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {/* Location request */}
                  {shippingMethod !== 'recogida' && (shippingLat === config.coordenadas_tienda.lat && shippingLng === config.coordenadas_tienda.lng) && (
                    <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                      <button
                        onClick={requestLocation}
                        disabled={isDetectingLocation}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-zinc-300 text-xs font-bold text-zinc-600 hover:border-zinc-400 hover:text-zinc-800 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Navigation size={14} className={isDetectingLocation ? 'animate-spin' : ''} />
                        {isDetectingLocation ? 'Detectando ubicación...' : 'Usar mi ubicación actual'}
                      </button>
                      {locationError && <p className="text-[11px] text-amber-600 mt-2 text-center">{locationError}</p>}
                      {hasMultipleSedes && (
                        <p className="text-[10px] text-zinc-400 mt-1.5 text-center">Encontraremos la tienda más cercana a ti</p>
                      )}
                    </div>
                  )}

                  {/* Botón reusar última dirección (solo si hay pedidos anteriores en delivery) */}
                  {currentUser && shippingMethod !== 'recogida' && (shippingLat === config.coordenadas_tienda.lat && shippingLng === config.coordenadas_tienda.lng) && (() => {
                    const lastDelivery = orders.find(o =>
                      (o.usuario_id === currentUser.id || o.cliente_telefono === currentUser.telefono) &&
                      o.tipo_entrega === 'delivery' && o.lat && o.lng
                    );
                    if (!lastDelivery) return null;
                    return (
                      <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                        <button
                          onClick={() => {
                            setShippingLat(lastDelivery.lat);
                            setShippingLng(lastDelivery.lng);
                            if (lastDelivery.sede_id) setSelectedSedeId(lastDelivery.sede_id);
                            if (lastDelivery.distancia_km) setShippingDistance(lastDelivery.distancia_km);
                            if (lastDelivery.costo_envio_usd) setShippingCost(lastDelivery.costo_envio_usd);
                            if (lastDelivery.direccion_envio) {
                              const zoneMatch = lastDelivery.direccion_envio.match(/^(.+?)\s*\(Distancia:/);
                              if (zoneMatch) setShippingZone(zoneMatch[1]);
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-xs font-bold transition-all cursor-pointer"
                          style={{ borderColor: `${themeColor}40`, color: themeColor }}
                        >
                          <MapPin size={14} />
                          Usar mi última dirección
                        </button>
                        <p className="text-[10px] text-zinc-400 mt-1.5 text-center">
                          {lastDelivery.direccion_envio?.split(' (Distancia:')[0] || 'Última dirección guardada'}
                        </p>
                      </div>
                    );
                  })()}

                  {/* CartUpsell - Algo Más */}
                  <CartUpsell onAddToCart={(item: FoodItem) => addToCart(item)} />

                  {/* Notes */}
                  <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                    <label className="text-[11px] font-bold uppercase text-zinc-500 mb-2 block">Notas del pedido (opcional)</label>
                    <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Ej: Sin cebolla, extra salsa..." className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-zinc-950 resize-none" rows={2} />
                  </div>

                  {/* Coupon */}
                  <div className="bg-white rounded-2xl border border-zinc-200 p-4">
                    <label className="text-[11px] font-bold uppercase text-zinc-500 mb-2 block">Cupón</label>
                    <div className="flex gap-2">
                      <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="CÓDIGO" className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-zinc-950 font-bold uppercase" />
                      <button onClick={handleApplyCoupon} className="text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-colors" style={{ backgroundColor: themeColor }}>Aplicar</button>
                    </div>
                    {couponError && <span className="text-[11px] text-red-500 mt-1 block">{couponError}</span>}
                    {appliedCoupon && (
                      <p className="text-xs font-bold mt-2" style={{ color: themeColor }}>
                        ✓ "{appliedCoupon.code}" aplicado: -{appliedCoupon.discount_percent}%
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ PASO 2: RESUMEN DEL PEDIDO ═══ */}
          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4">
              {/* Order summary */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 mb-3">Tu Pedido</h3>
                <div className="space-y-2">
                  {cart.map(item => {
                    const extrasTotal = item.selected_options?.reduce((e, opt) => e + opt.precio_usd, 0) || 0;
                    const subTotalItem = (item.item.precio_usd + extrasTotal) * item.quantity;
                    return (
                      <div key={item.item.id} className="flex justify-between items-center text-xs">
                        <span className="text-zinc-600">{item.quantity}x {item.item.nombre}</span>
                        <span className="font-bold text-zinc-800">${subTotalItem.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 mb-3">Detalle de Costos</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Subtotal:</span>
                    <span className="font-bold">${subtotalUsd.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-xs" style={{ color: themeColor }}>
                      <span>Descuento (-{appliedCoupon.discount_percent}%):</span>
                      <span className="font-bold">-${discountFromCoupon.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Envío ({shippingMethod === 'recogida' ? 'Recogida' : shippingZone}):</span>
                    <span className="font-bold">{effectiveShippingCost === 0 ? 'Gratis' : `$${effectiveShippingCost.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-zinc-100">
                    <span className="font-bold text-zinc-900">Total:</span>
                    <div className="text-right">
                      <span className="font-black text-lg" style={{ color: themeColor }}>${totalUsd.toFixed(2)}</span>
                      <span className="text-[10px] text-zinc-400 ml-2">{totalBs.toFixed(2)} Bs.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery info */}
              {shippingMethod !== 'recogida' && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 mb-2">Dirección de Entrega</h3>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-zinc-800">{shippingZone}</p>
                      <p className="text-[11px] text-zinc-500">{shippingDistance > 0 ? `${shippingDistance.toFixed(1)} km de distancia` : ''}</p>
                      <a
                        href={`https://www.google.com/maps?q=${shippingLat},${shippingLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold underline mt-1 inline-block"
                        style={{ color: themeColor }}
                      >Ver en mapa</a>
                    </div>
                  </div>
                </div>
              )}

              {/* Pickup info */}
              {shippingMethod === 'recogida' && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 mb-2">Retiro en Tienda</h3>
                  {(() => {
                    const sede = activeSedes.find(s => s.id === selectedSedeId) || activeSedes[0];
                    return sede ? (
                      <div className="flex items-start gap-2">
                        <Store size={14} className="text-zinc-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-zinc-800">{sede.nombre}</p>
                          <p className="text-[11px] text-zinc-500">{sede.direccion || config.direccion_fisica}</p>
                          <a
                            href={`https://www.google.com/maps?q=${sede.coordenadas.lat},${sede.coordenadas.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold underline mt-1 inline-block"
                            style={{ color: themeColor }}
                          >Cómo llegar</a>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ PASO 3: DATOS + PAGO ═══ */}
          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4">
              {/* Contact data - only for guests */}
              {!currentUser && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 mb-3">Tus Datos</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-zinc-500 mb-1 block">Correo *</label>
                      <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="tu@email.com" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-zinc-950 transition-colors" required />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-zinc-500 mb-1 block">Nombre *</label>
                      <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Tu nombre" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-zinc-950 transition-colors" required />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-zinc-500 mb-1 block">Teléfono *</label>
                      <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+58412..." className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-zinc-950 transition-colors" required />
                    </div>
                  </div>
                  <div className="mt-3 p-3 rounded-xl border" style={{ backgroundColor: `${themeColor}08`, borderColor: `${themeColor}20` }}>
                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                      <span className="font-bold" style={{ color: themeColor }}>Se crea tu cuenta automáticamente.</span>{' '}
                      Tu contraseña es tu número de teléfono. Podrás cambiarla desde tu panel de cliente.
                    </p>
                  </div>
                </div>
              )}

              {/* Logged in user info */}
              {currentUser && (
                <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 text-white rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: themeColor }}>{currentUser.nombre[0]}</div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900">{currentUser.nombre}</p>
                      <p className="text-[11px] text-zinc-500">{currentUser.email || currentUser.telefono}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment methods */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 mb-3">Método de Pago</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'Pago Móvil', label: 'Pago Móvil Bs', icon: 'Bs', enabled: config.pagomovil_enabled },
                    { key: 'Zelle', label: 'Zelle USD', icon: 'USD', enabled: config.zelle_enabled },
                    { key: 'Efectivo', label: 'Efectivo', icon: '$', enabled: config.efectivo_enabled },
                    { key: 'Transferencia', label: 'Transferencia', icon: 'Bco', enabled: config.transferencia_enabled },
                    { key: 'Otro', label: 'Otro', icon: '?', enabled: true }
                  ].filter(pm => pm.enabled).map(pm => (
                    <button key={pm.key} onClick={() => setSelectedPayment(pm.key as any)} className={`p-3 rounded-xl text-left flex items-center gap-2 transition-all cursor-pointer border-2 text-xs ${
                      selectedPayment === pm.key ? 'text-white shadow-md' : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                    }`} style={selectedPayment === pm.key ? { backgroundColor: themeColor, borderColor: themeColor } : {}}>
                      <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-white/20 shrink-0">{pm.icon}</span>
                      <span className="font-bold">{pm.label}</span>
                    </button>
                  ))}
                </div>

                {/* Payment details */}
                <div className="mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] text-zinc-700 leading-relaxed font-mono">
                  {selectedPayment === 'Pago Móvil' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-zinc-200">
                        <div>
                          <span className="text-[9px] text-zinc-400 uppercase block">Banco / Titular</span>
                          <span className="text-zinc-800 font-bold">{(config.pagomovil_data || 'Banesco (0134)').split('-')[0]?.trim()}</span>
                        </div>
                        <CopyButton text={config.pagomovil_data || 'Banesco (0134)'} fieldId="pm-data" />
                      </div>
                      <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-zinc-200">
                        <div>
                          <span className="text-[9px] text-zinc-400 uppercase block">Teléfono</span>
                          <span className="text-zinc-800 font-bold">{(config.pagomovil_data || '').match(/\d{4,}/)?.[0] || '04121234567'}</span>
                        </div>
                        <CopyButton text={(config.pagomovil_data || '').match(/\d{4,}/)?.[0] || '04121234567'} fieldId="pm-phone" />
                      </div>
                      <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-zinc-200">
                        <div>
                          <span className="text-[9px] text-zinc-400 uppercase block">Cédula / RIF</span>
                          <span className="text-zinc-800 font-bold">{(config.pagomovil_data || '').match(/V-\d+[.-]?\d+[.-]?\d+|J-\d+[.-]?\d+[.-]?\d+/)?.[0] || 'V-12345678'}</span>
                        </div>
                        <CopyButton text={(config.pagomovil_data || '').match(/V-\d+[.-]?\d+[.-]?\d+|J-\d+[.-]?\d+[.-]?\d+/)?.[0] || 'V-12345678'} fieldId="pm-ci" />
                      </div>
                      <p className="text-center font-black py-1 rounded" style={{ color: themeColor }}>Calcular: {totalBs.toFixed(2)} Bs.</p>
                    </div>
                  )}
                  {selectedPayment === 'Zelle' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-zinc-200">
                        <div>
                          <span className="text-[9px] text-zinc-400 uppercase block">Correo Zelle</span>
                          <span className="text-zinc-800 font-bold">{config.zelle_data || 'pagos@email.com'}</span>
                        </div>
                        <CopyButton text={config.zelle_data || 'pagos@email.com'} fieldId="zelle-email" />
                      </div>
                      <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-zinc-200">
                        <div>
                          <span className="text-[9px] text-zinc-400 uppercase block">Monto a enviar</span>
                          <span className="font-black" style={{ color: themeColor }}>${totalUsd.toFixed(2)} USD</span>
                        </div>
                        <CopyButton text={`$${totalUsd.toFixed(2)}`} fieldId="zelle-amount" />
                      </div>
                    </div>
                  )}
                  {selectedPayment === 'Efectivo' && (
                    <div className="flex flex-col gap-2">
                      <p className="text-zinc-800 font-bold text-center">{config.efectivo_data || 'Paga al motorizado en efectivo al recibir'}</p>
                      <p className="text-center font-black py-1 rounded" style={{ color: themeColor }}>Total: ${totalUsd.toFixed(2)}</p>
                    </div>
                  )}
                  {selectedPayment === 'Transferencia' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-zinc-200">
                        <div>
                          <span className="text-[9px] text-zinc-400 uppercase block">Datos Bancarios</span>
                          <span className="text-zinc-800 font-bold">{config.transferencia_data || `Banesco - ${config.site_nombre}`}</span>
                        </div>
                        <CopyButton text={config.transferencia_data || `Banesco - ${config.site_nombre}`} fieldId="transfer-data" />
                      </div>
                      <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-zinc-200">
                        <div>
                          <span className="text-[9px] text-zinc-400 uppercase block">Monto</span>
                          <span className="font-black" style={{ color: themeColor }}>${totalUsd.toFixed(2)} USD</span>
                        </div>
                        <CopyButton text={`$${totalUsd.toFixed(2)}`} fieldId="transfer-amount" />
                      </div>
                    </div>
                  )}
                  {selectedPayment === 'Otro' && (
                    <textarea value={customPaymentNote} onChange={(e) => setCustomPaymentNote(e.target.value)} placeholder="Describe cómo vas a pagar..." className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-zinc-950 resize-none" rows={3} />
                  )}
                </div>
              </div>

              {/* Recordatorio de Pago */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-4">
                {(selectedPayment === 'Pago Móvil' || selectedPayment === 'Zelle' || selectedPayment === 'Transferencia') && (
                  <div className="mb-3 p-3 rounded-xl border" style={{ backgroundColor: `${themeColor}08`, borderColor: `${themeColor}20` }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: themeColor }}>Importante</p>
                    <p className="text-xs text-zinc-700 leading-relaxed">
                      Adjunta el <span className="font-bold">capture del pago</span> en el chat de WhatsApp al enviar el pedido para que podamos procesarlo más rápido.
                    </p>
                  </div>
                )}
                {selectedPayment === 'Efectivo' && (
                  <div className="mb-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                      Con qué billetes vas a cancelar $${totalUsd.toFixed(2)} USD
                    </label>
                    <p className="text-[11px] text-zinc-400 mb-2">Ejemplo: 1x $20, 2x $10, 1x $5...</p>
                    <textarea
                      value={cashBills}
                      onChange={(e) => setCashBills(e.target.value)}
                      placeholder="Ej: 1 billete de $20, 2 billetes de $10..."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-zinc-950 resize-none"
                      rows={2}
                    />
                  </div>
                )}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentConfirmed}
                    onChange={(e) => setPaymentConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-current cursor-pointer"
                    style={{ color: themeColor }}
                  />
                  <span className="text-xs text-zinc-600 leading-relaxed">
                    {selectedPayment === 'Efectivo'
                      ? 'Confirmo los billetes indicados para gestionar el cambio.'
                      : 'Confirmo que enviaré el capture del pago por WhatsApp.'}
                  </span>
                </label>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════ BOTTOM BAR ═══════════ */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-4 z-20">
          {validationError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 text-center">
              {validationError}
            </div>
          )}

          {currentStep < 3 ? (
            <button onClick={handleNextStep} className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer" style={{ backgroundColor: themeColor }}>
              Continuar <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleFormSubmit} disabled={isProcessing} className={`w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${isProcessing ? 'opacity-50' : ''}`} style={{ backgroundColor: isProcessing ? '#9ca3af' : themeColor }}>
              {isProcessing ? 'Procesando...' : 'Confirmar Pedido'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
