export interface AppUser {
  id: string;
  nombre: string;
  telefono: string;
  contrasena: string;
  email?: string;
  createdAt: string;
}

// ========================
// PRODUCT OPTIONS (EXTRAS)
// ========================

export interface ProductOption {
  id: string;
  nombre: string;
  precio_usd: number;
  activo?: boolean;
}

export interface ProductOptionGroup {
  id: string;
  nombre: string;
  min_select: number;
  max_select: number;
  options: ProductOption[];
}

// ========================
// PRODUCTO
// ========================

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  seccion: string;
  subseccion: string;
  marca: string;
  condicion: 'Nacional' | 'Importado';
  anio_inicio: number;
  anio_fin: number;
  precio_usd: number;
  stock: number;
  imagen_urls: string[];
  es_promo: boolean;
  es_nuevo: boolean;
  es_mas_vendido: boolean;
  delivery_gratis?: boolean;
  detalle_adicional?: string;
  activo?: boolean;
  option_groups?: ProductOptionGroup[];
}

// ========================
// ORDER
// ========================

export interface SelectedOption {
  group_name: string;
  option_name: string;
  precio_usd: number;
}

export interface OrderItem {
  part_id: string;
  nombre: string;
  codigo: string;
  precio_usd: number;
  cantidad: number;
  selected_options?: SelectedOption[];
  options_total_usd?: number;
}

export interface Order {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email?: string;
  usuario_id?: string;
  items: OrderItem[];
  subtotal_usd: number;
  costo_envio_usd: number;
  descuento_cupon_usd?: number;
  cupon_codigo?: string;
  total_usd: number;
  total_bs: number;
  metodo_pago: 'Pago Móvil' | 'Zelle' | 'Efectivo' | 'Transferencia';
  lat: number;
  lng: number;
  direccion_envio: string;
  distancia_km: number;
  status: 'Pendiente' | 'Procesando' | 'Enviado' | 'En preparación' | 'En camino' | 'Entregado' | 'Cancelado';
  tiempo_estimado_entrega?: string;
  notas_admin?: string;
  fecha: string;
  sede_id?: string;
}

// ========================
// SEDE (MULTI-LOCATION)
// ========================

export interface Sede {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  coordenadas: { lat: number; lng: number };
  horario?: string;
  activa: boolean;
  es_principal: boolean;
}

// ========================
// STORE CONFIG
// ========================

export interface StoreConfig {
  site_nombre: string;
  telefono_soporte: string;
  direccion_fisica: string;
  logo_url?: string;
  coordenadas_tienda: {
    lat: number;
    lng: number;
  };
  banners: string[];
  zelle_enabled: boolean;
  zelle_data: string;
  zelle_discount_percent: number;
  pagomovil_enabled: boolean;
  pagomovil_data: string;
  pagomovil_discount_percent: number;
  efectivo_enabled: boolean;
  efectivo_data: string;
  efectivo_discount_percent: number;
  transferencia_enabled: boolean;
  transferencia_data: string;
  transferencia_discount_percent: number;
  tasa_cambio: number;
  theme_color?: string;
  secondary_color?: string;
  accent_color?: string;
  delivery_gratis?: boolean;
  costo_delivery_km?: number;
  envio_nacional?: boolean;
  costo_envio_nacional?: number;
  recogida_en_local?: boolean;
  entrega_por_zonas?: boolean;
  delivery_zonas?: DeliveryZone[];
  favicon_url?: string;
  banner_texts?: string[];
  categories?: string[];
  mensaje_bienvenida?: string;
  push_webhook_url?: string;
  push_webhook_secret?: string;
  sedes?: Sede[];
  sede_activa_id?: string;
  esta_abierta?: boolean;
}

// ========================
// DELIVERY ZONE
// ========================

export interface DeliveryZone {
  id: string;
  name: string;
  cost: number;
  minKm: number;
  maxKm: number;
}

// ========================
// COUPON
// ========================

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  active: boolean;
  usage_limit?: number;
  usage_count: number;
  valid_until?: string;
  created_at?: string;
}

// ========================
// NOTIFICATION
// ========================

export interface InAppNotification {
  id: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  tipo: 'todos' | 'personal' | 'admin' | 'request';
  destinatario_telefono?: string;
  leida: boolean;
  imagen_url?: string;
  link_url?: string;
}

// ========================
// CART ITEM (with extras)
// ========================

export interface CartItem {
  item: Producto;
  quantity: number;
  selected_options?: SelectedOption[];
  options_total_usd?: number;
}
