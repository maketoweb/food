import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Producto, Order, StoreConfig, InAppNotification, OrderItem, AppUser, Coupon, CartItem, SelectedOption } from '../types/store';
import { supabase } from './supabaseClient';

interface AppContextProps {
  products: Producto[];
  orders: Order[];
  config: StoreConfig;
  coupons: Coupon[];
  notifications: InAppNotification[];
  cart: CartItem[];
  isAdminAuthenticated: boolean;
  favorites: string[];
  toggleFavorite: (partId: string) => void;
  isFavorite: (partId: string) => boolean;
  
  // Haptic Feedback
  hapticEnabled: boolean;
  toggleHaptic: () => void;
  
  // User Management
  displayCurrency: 'USD' | 'BS';
  toggleCurrency: () => void;
  users: AppUser[];
  currentUser: AppUser | null;
  registerUser: (nombre: string, email: string, telefono: string, contrasena: string) => Promise<AppUser>;
  loginUser: (identifier: string, contrasena: string) => Promise<AppUser | null>;
  logoutUser: () => void;
  updateUser: (updated: Partial<AppUser>) => void;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserByAdmin: (userId: string, updated: Partial<AppUser>) => void;
  requestPart: (nombre: string, telefono: string, descripcion: string, imagenUrl?: string) => Promise<boolean>;
  
  // Catalog actions
  addProduct: (product: Omit<Producto, 'id'>) => void;
  updateProduct: (id: string, updated: Partial<Producto>) => void;
  deleteProduct: (id: string) => void;
  searchPartsSemantically: (query: string, includeInactive?: boolean) => Producto[];
  
  // Cart Actions
  addToCart: (part: Producto, qty?: number, selectedOptions?: SelectedOption[], optionsTotal?: number) => void;
  removeFromCart: (partId: string) => void;
  updateCartQuantity: (partId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Checkout & Order Actions
  createOrder: (orderData: Omit<Order, 'id' | 'subtotal_usd' | 'total_usd' | 'total_bs' | 'fecha' | 'status'> & { descuento_cupon_usd?: number; cupon_codigo?: string }, preGeneratedId?: string) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: Order['status'], estimatedTime?: string, notas?: string) => void;
  updateOrderItems: (orderId: string, newItems: OrderItem[]) => Promise<void>;

  // Coupon Actions
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usage_count'>) => Promise<void>;
  updateCoupon: (id: string, updated: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  
  // Config Actions
  updateConfig: (newConfig: Partial<StoreConfig>) => void;
  updateExchangeRate: (rate: number) => void;
  fetchExchangeRate: () => Promise<void>;
  addCategory: (categoryName: string) => void;
  deleteCategory: (categoryName: string) => void;
  updateCategory: (oldCategory: string, newCategory: string) => void;
  
  // Notification Actions
  addNotification: (title: string, message: string, tipo?: 'todos' | 'personal' | 'admin' | 'request', targetPhone?: string, imageUrl?: string, linkUrl?: string) => Promise<boolean>;
  markNotificationAsRead: (id: string) => void;
  toggleNotificationReadStatus: (id: string) => void;
  registerNotificationClick: (id: string) => Promise<void>;
  syncPushSubscription: () => Promise<{ success: boolean; error?: string }>;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // App State
  isGlobalLoading: boolean;
  
  // Auth
  authenticateAdmin: (email: string, pass: string) => Promise<boolean>;
  logoutAdmin: () => Promise<void>;
  updateAdminCredentials: (user: string, pass: string) => void;
  adminUser: string;
  adminPass: string;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// INITIAL PRODUCTS DATA - Food Delivery
const DEFAULT_PRODUCTS: Producto[] = [
  {
    id: 'food-001',
    codigo: 'HMB-001',
    nombre: 'Hamburguesa Clásica Angus',
    descripcion: 'Hamburguesa de carne Angus 100% a la parrilla, con lechuga, tomate, cebolla y salsa especial de la casa.',
    categoria: 'Hamburguesas',
    seccion: 'Hamburguesas',
    subseccion: 'Clásicas',
    marca: 'FoodApp',
    condicion: 'Nacional',
    anio_inicio: 0,
    anio_fin: 0,
    precio_usd: 8.50,
    stock: 50,
    imagen_urls: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500'],
    es_promo: true,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    detalle_adicional: 'Carne Angus 200g. Incluye papas fritas.',
    option_groups: [
      {
        id: 'og-size-001', nombre: 'Tamaño', min_select: 1, max_select: 1,
        options: [
          { id: 'opt-personal-001', nombre: 'Personal (200g)', precio_usd: 0 },
          { id: 'opt-doble-001', nombre: 'Doble (400g)', precio_usd: 3.50 },
          { id: 'opt-familiar-001', nombre: 'Familiar (600g)', precio_usd: 6.00 }
        ]
      },
      {
        id: 'og-toppings-001', nombre: 'Toppings Extra', min_select: 0, max_select: 5,
        options: [
          { id: 'opt-queso-001', nombre: 'Extra Queso', precio_usd: 1.00 },
          { id: 'opt-tocino-001', nombre: 'Tocino', precio_usd: 1.50 },
          { id: 'opt-jalapenos-001', nombre: 'Jalapeños', precio_usd: 0.75 },
          { id: 'opt-huevo-001', nombre: 'Huevo Frito', precio_usd: 1.00 },
          { id: 'opt-cebolla-001', nombre: 'Cebolla Caramelizada', precio_usd: 1.25 }
        ]
      },
      {
        id: 'og-salsas-001', nombre: 'Salsas', min_select: 0, max_select: 3,
        options: [
          { id: 'opt-ketchup-001', nombre: 'Ketchup', precio_usd: 0 },
          { id: 'opt-mostaza-001', nombre: 'Mostaza', precio_usd: 0 },
          { id: 'opt-bbq-001', nombre: 'BBQ', precio_usd: 0.50 },
          { id: 'opt-mayo-001', nombre: 'Mayonesa', precio_usd: 0 },
          { id: 'opt-picante-001', nombre: 'Salsa Picante', precio_usd: 0.50 }
        ]
      }
    ]
  },
  {
    id: 'food-002',
    codigo: 'HMB-002',
    nombre: 'Hamburguesa BBQ Bacon',
    descripcion: 'Doble carne Angus con bacon crujiente, queso cheddar derretido y salsa BBQ ahumada.',
    categoria: 'Hamburguesas',
    seccion: 'Hamburguesas',
    subseccion: 'Especiales',
    marca: 'FoodApp',
    condicion: 'Nacional',
    anio_inicio: 0,
    anio_fin: 0,
    precio_usd: 11.90,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: true,
    delivery_gratis: false,
    detalle_adicional: 'Doble carne 400g total. Incluye papas fritas.',
    option_groups: [
      {
        id: 'og-size-002', nombre: 'Tamaño', min_select: 1, max_select: 1,
        options: [
          { id: 'opt-personal-002', nombre: 'Personal (400g)', precio_usd: 0 },
          { id: 'opt-doble-002', nombre: 'Doble (800g)', precio_usd: 5.00 }
        ]
      },
      {
        id: 'og-toppings-002', nombre: 'Toppings Extra', min_select: 0, max_select: 5,
        options: [
          { id: 'opt-queso-002', nombre: 'Extra Queso Cheddar', precio_usd: 1.50 },
          { id: 'opt-tocino-002', nombre: 'Bacon Extra', precio_usd: 2.00 },
          { id: 'opt-jalapenos-002', nombre: 'Jalapeños', precio_usd: 0.75 },
          { id: 'opt-huevo-002', nombre: 'Huevo Frito', precio_usd: 1.00 }
        ]
      },
      {
        id: 'og-salsas-002', nombre: 'Salsas', min_select: 0, max_select: 3,
        options: [
          { id: 'opt-bbq-002', nombre: 'BBQ Extra', precio_usd: 0.50 },
          { id: 'opt-ketchup-002', nombre: 'Ketchup', precio_usd: 0 },
          { id: 'opt-mostaza-002', nombre: 'Mostaza', precio_usd: 0 },
          { id: 'opt-mayo-002', nombre: 'Mayonesa', precio_usd: 0 }
        ]
      }
    ]
  },
  {
    id: 'food-003',
    codigo: 'PST-001',
    nombre: 'Pasta Alfredo con Pollo',
    descripcion: 'Fettuccine al dente en salsa cremosa alfredo con pechuga de pollo a la plancha y parmesano.',
    categoria: 'Pastas',
    seccion: 'Pastas',
    subseccion: 'Cremas',
    marca: 'FoodApp',
    condicion: 'Nacional',
    anio_inicio: 0,
    anio_fin: 0,
    precio_usd: 9.90,
    stock: 35,
    imagen_urls: ['https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    detalle_adicional: 'Porción generosa. Pasta fresca del día.'
  },
  {
    id: 'food-004',
    codigo: 'PST-002',
    nombre: 'Spaghetti Boloñesa Artesanal',
    descripcion: 'Espagueti con salsa boloñesa casera de carne molida, tomate natural, albahaca y ajo.',
    categoria: 'Pastas',
    seccion: 'Pastas',
    subseccion: 'Salsas',
    marca: 'FoodApp',
    condicion: 'Nacional',
    anio_inicio: 0,
    anio_fin: 0,
    precio_usd: 8.90,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=500'],
    es_promo: true,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    detalle_adicional: 'Salsa cocida por 4 horas. Receta de la abuela.'
  },
  {
    id: 'food-005',
        codigo: 'PZZ-001',
    nombre: 'Pizza Pepperoni Clásica',
    descripcion: 'Pizza artesanal con masa crujiente, salsa de tomate San Marzano, mozzarella fresca y pepperoni importado.',
    categoria: 'Pizzas',
    seccion: 'Pizzas',
    subseccion: 'Clásicas',
    marca: 'FoodApp',
    condicion: 'Nacional',
    anio_inicio: 0,
    anio_fin: 0,
    precio_usd: 10.50,
    stock: 30,
    imagen_urls: ['https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    detalle_adicional: 'Tamaño familiar. Masa artesanal fermentada 24h.',
    option_groups: [
      {
        id: 'og-size-pzz', nombre: 'Tamaño', min_select: 1, max_select: 1,
        options: [
          { id: 'opt-personal-pzz', nombre: 'Personal (25cm)', precio_usd: 0 },
          { id: 'opt-mediana-pzz', nombre: 'Mediana (30cm)', precio_usd: 3.00 },
          { id: 'opt-familiar-pzz', nombre: 'Familiar (40cm)', precio_usd: 6.00 }
        ]
      },
      {
        id: 'og-masa-pzz', nombre: 'Tipo de Masa', min_select: 1, max_select: 1,
        options: [
          { id: 'opt-tradicional-pzz', nombre: 'Tradicional', precio_usd: 0 },
          { id: 'opt-fina-pzz', nombre: 'Fina y Crujiente', precio_usd: 0 },
          { id: 'opt-gruesa-pzz', nombre: 'Gruesa y Esponjosa', precio_usd: 0.75 }
        ]
      },
      {
        id: 'og-extras-pzz', nombre: 'Extras', min_select: 0, max_select: 5,
        options: [
          { id: 'opt-queso-extra-pzz', nombre: 'Extra Queso', precio_usd: 1.50 },
          { id: 'opt-jamon-pzz', nombre: 'Jamón', precio_usd: 1.25 },
          { id: 'opt-champ-pzz', nombre: 'Champiñones', precio_usd: 1.00 },
          { id: 'opt-aceitunas-pzz', nombre: 'Aceitunas', precio_usd: 0.75 }
        ]
      }
    ]
  },
  {
    id: 'food-006',
    codigo: 'PST-003',
    nombre: 'Penne a la Arrabiata',
    descripcion: 'Penne rigatoni en salsa picante arrabiata con tomate, ajo, chile rojo y albahaca fresca.',
    categoria: 'Pastas',
    seccion: 'Pastas',
    subseccion: 'Salsas',
    marca: 'FoodApp',
    condicion: 'Nacional',
    anio_inicio: 0,
    anio_fin: 0,
    precio_usd: 7.90,
    stock: 45,
    imagen_urls: ['https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    detalle_adicional: 'Picante nivel medio. Sin lácteos.'
  },
  {
    id: 'food-007',
    codigo: 'PST-004',
    nombre: 'Tallarines Verdes con Res',
    descripcion: 'Tallarines caseros en salsa de espinaca y cilantro con tiras de res salteada al wok.',
    categoria: 'Pastas',
    seccion: 'Pastas',
    subseccion: 'Especiales',
    marca: 'FoodApp',
    condicion: 'Nacional',
    anio_inicio: 0,
    anio_fin: 0,
    precio_usd: 10.90,
    stock: 25,
    imagen_urls: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    detalle_adicional: 'Pasta fresca hecha en casa. Res premium.'
  },
  {
    id: 'food-008',
    codigo: 'PZZ-002',
    nombre: 'Pizza 4 Quesos',
    descripcion: 'Pizza con mezcla de mozzarella, gorgonzola, parmesano y provolone sobre base de tomate.',
    categoria: 'Pizzas',
    seccion: 'Pizzas',
    subseccion: 'Especiales',
    marca: 'FoodApp',
    condicion: 'Nacional',
    anio_inicio: 0,
    anio_fin: 0,
    precio_usd: 12.50,
    stock: 20,
    imagen_urls: ['https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    detalle_adicional: 'Quesos importados de Italia.'
  },
  {
    id: 'food-009',
    codigo: 'POS-001',
    nombre: 'Cheesecake de Fresa',
    descripcion: 'Cheesecake cremoso con base de galleta, cobertura de fresa fresca natural y glaseado.',
    categoria: 'Postres',
    seccion: 'Postres',
    subseccion: 'Tortas',
    marca: 'FoodApp',
    condicion: 'Nacional',
    anio_inicio: 0,
    anio_fin: 0,
    precio_usd: 5.50,
    stock: 30,
    imagen_urls: ['https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=500'],
    es_promo: true,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    detalle_adicional: 'Porción individual. Elaborado artesanalmente.'
  },
  {
    id: 'food-010',
    codigo: 'BEB-001',
    nombre: 'Limonada Natural Fresca',
    descripcion: 'Limonada recién exprimida con hielo y un toque de menta fresca. Refrescante y natural.',
    categoria: 'Bebidas',
    seccion: 'Bebidas',
    subseccion: 'Sin Alcohol',
    marca: 'FoodApp',
    condicion: 'Nacional',
    anio_inicio: 0,
    anio_fin: 0,
    precio_usd: 2.50,
    stock: 100,
    imagen_urls: ['https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    detalle_adicional: 'Sin azúcar agregada. 100% natural.'
  },
  {
    id: 'food-011',
    codigo: 'ENT-001',
    nombre: 'Alitas BBQ x12 unidades',
    descripcion: 'Alitas de pollo crujientes bañadas en salsa BBQ ahumada de la casa, con aderezo blue cheese.',
    categoria: 'Entradas',
    seccion: 'Entradas',
    subseccion: 'Para Compartir',
    marca: 'FoodApp',
    condicion: 'Nacional',
    anio_inicio: 0,
    anio_fin: 0,
    precio_usd: 7.90,
    stock: 35,
    imagen_urls: ['https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    detalle_adicional: 'Crujientes por fuera, jugosas por dentro.'
  },
  {
    id: 'food-012',
    codigo: 'ENS-001',
    nombre: 'Ensalada César con Pollo',
    descripcion: 'Lechuga romana fresca, pollo a la parrilla, crutones, parmesano y aderezo César casero.',
    categoria: 'Ensaladas',
    seccion: 'Ensaladas',
    subseccion: 'Con Proteína',
    marca: 'FoodApp',
    condicion: 'Nacional',
    anio_inicio: 0,
    anio_fin: 0,
    precio_usd: 7.50,
    stock: 30,
    imagen_urls: ['https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    detalle_adicional: 'Opción saludable y deliciosa.'
  },
  {
    id: 'food-013',
    codigo: 'CMB-001',
    nombre: 'Combo Burger + Papas + Bebida',
    descripcion: 'Hamburguesa clásica Angus + papas fritas crujientes + limonada natural. El combo perfecto.',
    categoria: 'Combos',
    seccion: 'Combos',
    subseccion: 'Especiales',
    marca: 'FoodApp',
    condicion: 'Nacional',
    anio_inicio: 0,
    anio_fin: 0,
    precio_usd: 12.90,
    stock: 50,
    imagen_urls: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500'],
    es_promo: true,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    detalle_adicional: 'Ahorra $2.50 con el combo. Incluye todo.'
  },
  {
    id: 'food-014',
    codigo: 'POS-002',
    nombre: 'Brownie con Helado de Vainilla',
    descripcion: 'Brownie de chocolate oscuro tibio con bola de helado de vainilla artesanal y salsa de chocolate.',
    categoria: 'Postres',
    seccion: 'Postres',
    subseccion: 'Con Helado',
    marca: 'FoodApp',
    condicion: 'Nacional',
    anio_inicio: 0,
    anio_fin: 0,
    precio_usd: 6.50,
    stock: 25,
    imagen_urls: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    detalle_adicional: 'Chocolate 70% cacao. Helado artesanal.'
  },
  {
    id: 'food-015',
    codigo: 'BEB-002',
    nombre: 'Malteada de Fresa',
    descripcion: 'Malteada cremosa de fresa natural con crema batida y fresa fresca decorativa.',
    categoria: 'Bebidas',
    seccion: 'Bebidas',
    subseccion: 'Malteadas',
    marca: 'FoodApp',
    condicion: 'Nacional',
    anio_inicio: 0,
    anio_fin: 0,
    precio_usd: 4.50,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    detalle_adicional: 'Helado artesanal de fresa natural.'
  }
];

const DEFAULT_CONFIG: StoreConfig = {
  site_nombre: 'FoodApp',
  telefono_soporte: '+584124976451',
  direccion_fisica: 'Av. Principal, Local #12, Ciudad',
  coordenadas_tienda: { lat: 10.198300, lng: -68.004400 },
  banners: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=1200'
  ],
  zelle_enabled: true,
  zelle_data: 'pagos@foodapp.com.ve',
  zelle_discount_percent: 0,
  pagomovil_enabled: true,
  pagomovil_data: 'Banesco (0134) - RIF J-50123456-7 - Tel: 0412-4976451',
  pagomovil_discount_percent: 0,
  efectivo_enabled: true,
  efectivo_data: 'Paga al motorizado en efectivo (USD/Bs) al recibir tu delivery',
  efectivo_discount_percent: 0,
  transferencia_enabled: true,
  transferencia_data: 'Banesco Cuenta Corriente - 0134-1122-33-4455667788 - FoodApp C.A. - RIF J-50123456-7',
  transferencia_discount_percent: 0,
  tasa_cambio: 612.43,
  logo_url: '',
  theme_color: '#FF6B35',
  mensaje_bienvenida: 'Pide tu comida favorita con delivery express. Hamburguesas, pastas, postres y más.',
  delivery_gratis: false,
  costo_delivery_km: 1.5,
  envio_nacional: true,
  costo_envio_nacional: 5.0,
  recogida_en_local: true,
  entrega_por_zonas: true,
  delivery_zonas: [
    { id: 'z1', name: 'Cercano (0-3 km)', cost: 2.00, minKm: 0, maxKm: 3 },
    { id: 'z2', name: 'Medio (3-8 km)', cost: 4.50, minKm: 3, maxKm: 8 },
    { id: 'z3', name: 'Lejano (8-18 km)', cost: 7.00, minKm: 8, maxKm: 18 },
  ],
  favicon_url: '',
  banner_texts: [
    'Platos Especiales del Día',
    'Menú Premium Delivery',
    'Postres Artesanales'
  ],
  categories: [
    'Hamburguesas',
    'Pastas',
    'Pizzas',
    'Postres',
    'Bebidas',
    'Entradas',
    'Ensaladas',
    'Combos'
  ],
  push_webhook_url: import.meta.env.VITE_PUSH_WEBHOOK_URL || '',
  push_webhook_secret: import.meta.env.VITE_WEBHOOK_SECRET || '',
  esta_abierta: true,
  sedes: [
    {
      id: 'sede-1',
      nombre: 'Sede Principal',
      direccion: 'Av. Principal, Local #12, Ciudad',
      telefono: '+584124976451',
      coordenadas: { lat: 10.198300, lng: -68.004400 },
      horario: '11am - 10pm',
      activa: true,
      es_principal: true
    }
  ]
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence state loaders
  const [products, setProducts] = useState<Producto[]>(() => {
    const saved = localStorage.getItem('trv_products');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('trv_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('trv_coupons');
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState<StoreConfig>(() => {
    const saved = localStorage.getItem('trv_config');
    if (saved) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });

  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    const saved = localStorage.getItem('trv_notifications');
    return saved ? JSON.parse(saved) : [
      {
        id: 'init-notif',
        titulo: 'Bienvenidos a Marketo',
        mensaje: 'Encuentra los mejores cortes de carne, quesos madurados y viveres frescos con delivery express en Valencia.',
        fecha: new Date().toLocaleDateString(),
        tipo: 'todos',
        leida: false,
        click_count: 0
      }
    ];
  });

  const [isGlobalLoading, setIsGlobalLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('trv_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('trv_admin_auth') === 'true';
  });

  const [adminUser] = useState<string>(import.meta.env.VITE_ADMIN_USER || '');
  const [adminPass] = useState<string>(import.meta.env.VITE_ADMIN_PASS || '');

  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'BS'>(() => {
    return (localStorage.getItem('trv_currency') as 'USD' | 'BS') || 'USD';
  });

  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('trv_haptic_enabled');
    return saved === null ? true : saved === 'true';
  });

  const hapticEnabledRef = useRef(hapticEnabled);
  useEffect(() => {
    hapticEnabledRef.current = hapticEnabled;
  }, [hapticEnabled]);

  const toggleHaptic = () => {
    const newVal = !hapticEnabled;
    setHapticEnabled(newVal);
    localStorage.setItem('trv_haptic_enabled', String(newVal));
  };

  const toggleCurrency = () => {
    const newCurrency = displayCurrency === 'USD' ? 'BS' : 'USD';
    setDisplayCurrency(newCurrency);
    localStorage.setItem('trv_currency', newCurrency);
  };

  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('trv_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('trv_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('trv_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // --- MOTOR DE TIEMPO REAL (SUPABASE CHANNELS) ---
  const currentUserRef = useRef<AppUser | null>(currentUser);
  const isAdminAuthenticatedRef = useRef(isAdminAuthenticated);
  const configSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    isAdminAuthenticatedRef.current = isAdminAuthenticated;
  }, [isAdminAuthenticated]);

  // --- SISTEMA DE LIMPIEZA AUTOMÁTICA DE NOTIFICACIONES ---
  // Limpia del estado local las notificaciones ya leídas que tengan más de 7 días de antigüedad.
  useEffect(() => {
    if (isGlobalLoading) return;

    const now = new Date().getTime();
    const limit = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos

    setNotifications(prev => prev.filter(n => {
      // Conservar siempre las no leídas para que el usuario las gestione
      if (!n.leida) return true;

      // Usamos 'created_at' de la DB. Si no existe (notificación local muy reciente), se conserva.
      const createdAt = (n as any).created_at;
      if (!createdAt) return true; 

      return (now - new Date(createdAt).getTime()) < limit;
    }));
  }, [isGlobalLoading]);

  const playNotificationSound = (type: 'new' | 'update', status?: Order['status']) => {
    const soundUrl = type === 'new'
      ? 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'
      : 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

    // Reproducir directamente en el cliente (contexto de ventana, NO de SW)
    const audio = new Audio(soundUrl);
    audio.volume = 0.8;
    audio.play().catch((err) => {
      if (err.name === 'NotAllowedError') {
        console.warn('📢 Marketo: Audio bloqueado — se necesita interacción previa del usuario.');
      } else {
        console.warn('📢 Marketo: Error al reproducir audio:', err.message);
      }
    });

    if (hapticEnabledRef.current && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'update' && status === 'En camino') {
        navigator.vibrate(100);
      }
      if (type === 'new') {
        navigator.vibrate([200, 100, 200]);
      }
    }
  };

  // ✅ FIX: Escuchar mensajes del Service Worker para reproducir sonido desde el cliente
  // (Audio API no está disponible en SW — el SW hace postMessage y el cliente reproduce)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PLAY_NOTIFICATION_SOUND') {
        const url = event.data.soundUrl || '/sounds/notification.mp3';
        const audio = new Audio(url);
        audio.volume = 0.8;
        audio.play().catch(err =>
          console.warn('[SW→Client] No se pudo reproducir sonido:', err.message)
        );
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleSWMessage);
  }, []);

  // ✅ FIX: Sincronizar suscripción push automáticamente cuando el usuario inicia sesión
  // Si el usuario ya tiene permisos de notificación granted, sincronizar su suscripción con la DB
  useEffect(() => {
    if (!currentUser) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const syncOnLogin = async () => {
      try {
        const permission = Notification.permission;
        if (permission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          const existingSub = await registration.pushManager.getSubscription();
          if (existingSub) {
            console.log('🔔 Marketo: Sincronizando suscripción push automáticamente tras login...');
            await syncPushSubscription();
          }
        }
      } catch (err) {
        console.warn('⚠️ Marketo: No se pudo sincronizar push automáticamente:', err);
      }
    };

    syncOnLogin();
  }, [currentUser]);

  useEffect(() => {
    let mainChannel: any = null;

    try {
      // CANAL UNIFICADO PARA BROADCAST Y POSTGRES CHANGES
      mainChannel = supabase.channel('marketo_realtime_system');

      mainChannel
        // Escuchar cambios en Configuración
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'store_config' }, payload => {
          const newRow = (payload as any)?.new;
          if (newRow) {
            setConfig(prev => ({
              ...prev,
              ...newRow,
              tasa_cambio: Number(newRow.tasa_cambio) || prev.tasa_cambio,
              coordenadas_tienda: newRow.tienda_lat ? { lat: newRow.tienda_lat, lng: newRow.tienda_lng } : prev.coordenadas_tienda,
              banners: [newRow.banner_url_1, newRow.banner_url_2, newRow.banner_url_3].filter(Boolean).length > 0 
                ? [newRow.banner_url_1, newRow.banner_url_2, newRow.banner_url_3].filter(Boolean)
                : prev.banners
            }));
          }
        })
        // Escuchar cambios en Pedidos (CDC)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
          const updated = payload.new as Order;
          const old = payload.old as Order;

          if (!updated?.id) return;
          
          // Si el status cambió, emitir sonido
          if (old && old.status !== updated.status) {
            playNotificationSound('update', updated.status);
          }

          setOrders(prev =>
            prev.map(o =>
              o.id === updated.id
                ? { ...o, status: updated.status, tiempo_estimado_entrega: updated.tiempo_estimado_entrega }
                : o
            )
          );

          const cu = currentUserRef.current;
          if (cu && updated.cliente_telefono === cu.telefono) {
            // ✅ FIX: Usar SW showNotification (aparece en pantalla inicial del móvil)
            if ('serviceWorker' in navigator && Notification.permission === 'granted') {
              const direccion = updated.direccion_envio || '';
              const tiempo = updated.tiempo_estimado_entrega || '';
              const extras = [direccion ? `Ubicación: ${direccion}` : '', tiempo ? `Tiempo estimado: ${tiempo}` : '']
                .filter(Boolean)
                .join(' • ');

              navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(`${config.site_nombre || 'App'}: Actualización de Pedido`, {
                  body: `Tu pedido ${updated.id} ahora está: ${updated.status}${extras ? `\n${extras}` : ''}`,
                  icon: '/icon.png',
                  badge: '/badge.png',
                  tag: `order-update-${updated.id}`,
                  renotify: true,
                  vibrate: [200, 100, 200],
                  requireInteraction: true,
                  data: { url: '/' }
                } as any);
              });
            }
          }
        })
        // Escuchar Pedidos Nuevos vía BROADCAST (Ultra Rápido)
        .on('broadcast', { event: 'new_order_broadcast' }, (payload: any) => {
          const newOrder = payload.payload;
          setOrders(prev => [newOrder, ...prev]);
          window.dispatchEvent(new CustomEvent('new_order_received', { detail: newOrder }));
          playNotificationSound('new');
          
          // ✅ FIX: Usar SW showNotification para que aparezca en pantalla bloqueada
          if ('serviceWorker' in navigator && Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification('¡NUEVO PEDIDO! 🛒', {
                body: `Cliente: ${newOrder.cliente_nombre} — Total: $${newOrder.total_usd?.toFixed(2)}`,
                icon: '/icon.png',
                badge: '/badge.png',
                tag: `new-order-${newOrder.id}`,
                renotify: true,
                vibrate: [200, 100, 200],
                requireInteraction: true,
                data: { url: '/admin' }
              } as any);
            });
          }
        })
        // Escuchar Notificaciones (CDC)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
          const newNotif = payload.new as InAppNotification;
          
          // Validar si es para todos o específicamente para el usuario actual
          const cu = currentUserRef.current;
          const isForMe = (newNotif.tipo === 'todos') || 
                         (cu && newNotif.tipo === 'personal' && newNotif.destinatario_telefono === cu.telefono) ||
                         (isAdminAuthenticatedRef.current && (newNotif.tipo === 'request' || newNotif.tipo === 'admin'));

          if (isForMe) {
            setNotifications(prev => {
              if (prev.some(n => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev];
            });
            playNotificationSound('update'); // Activar sonido para nuevos mensajes
            if ('serviceWorker' in navigator && Notification.permission === 'granted') {
              navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(`${config.site_nombre}: ${newNotif.titulo}`, {
                  body: newNotif.mensaje,
                  icon: config.logo_url || '/icon.png',
                  image: newNotif.imagen_url,
                  badge: '/icon.png',
                  tag: `notif-${newNotif.id}`,
                  renotify: true,
                  requireInteraction: true,
                  vibrate: [200, 100, 200],
                  silent: false,
                  data: { url: newNotif.link_url || '/' }
                } as any);
              });
            }
          }
        })
        // Escuchar cambios en Productos (CDC)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'products' },
          payload => {
            const inserted = (payload as any)?.new;
            if (!inserted?.id) return;

            setProducts(prev => {
              const idxById = prev.findIndex(p => p.id === inserted.id);
              if (idxById >= 0) {
                const copy = [...prev];
                copy[idxById] = { ...copy[idxById], ...inserted };
                return copy;
              }

              // fallback por codigo
              const idxByCode = prev.findIndex(p => p.codigo === inserted.codigo);
              if (idxByCode >= 0) {
                const copy = [...prev];
                copy[idxByCode] = { ...copy[idxByCode], ...inserted };
                return copy;
              }

              return [inserted as Producto, ...prev];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'products' },
          payload => {
            const updated = (payload as any)?.new;
            if (!updated?.id) return;

            setProducts(prev => {
              // Upsert por id
              const idxById = prev.findIndex(p => p.id === updated.id);
              if (idxById >= 0) {
                const copy = [...prev];
                copy[idxById] = { ...copy[idxById], ...updated };
                return copy;
              }

              // fallback por codigo
              const idxByCode = prev.findIndex(p => p.codigo === updated.codigo);
              if (idxByCode >= 0) {
                const copy = [...prev];
                copy[idxByCode] = { ...copy[idxByCode], ...updated };
                return copy;
              }

              return [updated as Producto, ...prev];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'products' },
          payload => {
            const deleted = (payload as any)?.old;
            if (!deleted) return;

            setProducts(prev => {
              const byId = deleted.id ? prev.filter(p => p.id !== deleted.id) : prev;
              const byCode = deleted.codigo ? byId.filter(p => p.codigo !== deleted.codigo) : byId;
              return byCode;
            });
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Conectado al sistema Realtime de Marketo');
          }
        });

    } catch (e) {
      console.error('Realtime channels failed:', e);
    }

    setIsGlobalLoading(false);
    return () => {
      if (mainChannel) supabase.removeChannel(mainChannel);
    };
  }, [currentUser]);
  useEffect(() => {
    localStorage.setItem('trv_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('trv_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('trv_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('trv_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('trv_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('trv_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('trv_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('trv_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Daily Exchange Rate Update Routine (BCV Oficial)
  const fetchExchangeRate = async (retryCount = 0): Promise<boolean> => {
    const MAX_RETRIES = 2;
    const endpoints = [
      'https://ve.dolarapi.com/v1/dolares',
      'https://pydolarve.org/api/v1/dollar'
    ];

    for (const url of endpoints) {
      try {
        console.log(`🔍 Marketo: Intentando obtener tasa BCV desde ${url}...`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) continue;
        const data = await response.json();
        let newRate: number | null = null;

        if (Array.isArray(data)) {
          const oficial = data.find((d: any) => d.nombre === 'Oficial' || d.fuente === 'oficial');
          if (oficial) {
            newRate = parseFloat(oficial.promedio || oficial.venta || oficial.compra);
          }
        } else if (data && typeof data === 'object') {
          if (data.venta) newRate = parseFloat(data.venta);
          else if (data.valor) newRate = parseFloat(data.valor);
          else if (data.dollar && data.dollar.price) newRate = parseFloat(data.dollar.price);
          else if (data.promedio) newRate = parseFloat(data.promedio);
        }

        // Validar: debe ser un número razonable para Bs/USD en Venezuela (actual ~600+)
        if (newRate && !isNaN(newRate) && newRate > 10 && newRate < 10000) {
          updateExchangeRate(newRate);
          const now = Date.now();
          localStorage.setItem('trv_last_rate_fetch', now.toString());
          console.log(`✅ Tasa BCV actualizada automáticamente: ${newRate} Bs/USD.`);
          return true;
        }
      } catch (error: any) {
        console.warn(`⚠️ Marketo: Error con ${url}:`, error.message || error);
      }
    }

    // Reintentar si quedan intentos
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Marketo: Reintentando obtener tasa BCV (intento ${retryCount + 2}/${MAX_RETRIES + 1})...`);
      await new Promise(r => setTimeout(r, 3000));
      return fetchExchangeRate(retryCount + 1);
    }

    console.error('❌ Marketo: No se pudo obtener la tasa BCV de ninguna fuente tras varios intentos.');
    return false;
  };

  // Verificar si la tasa necesita actualización
  const needsRateUpdate = (): boolean => {
    const lastFetch = localStorage.getItem('trv_last_rate_fetch');
    if (!lastFetch) return true;
    const lastFetchTime = parseInt(lastFetch, 10);
    if (isNaN(lastFetchTime)) return true;
    // Actualizar si pasaron más de 4 horas desde la última obtención exitosa
    const FOUR_HOURS = 4 * 60 * 60 * 1000;
    return Date.now() - lastFetchTime > FOUR_HOURS;
  };

  useEffect(() => {
    const initData = async () => {
      setIsGlobalLoading(true);

      // BUG FIX: Si es admin, cargar TODO. Obtener sesión primero.
      const { data: { session } } = await supabase.auth.getSession();
      const isAdmin = session?.user?.email === 'kecho8a@gmail.com' || session?.user?.app_metadata?.role === 'admin';

      // Si localStorage dice admin pero no hay sesión real, limpiar el flag
      if (!isAdmin && localStorage.getItem('trv_admin_auth') === 'true') {
        localStorage.removeItem('trv_admin_auth');
        setIsAdminAuthenticated(false);
      }

      // Cargar productos de Supabase (si es admin, incluir inactivos)
      let productsQuery = supabase.from('products').select('*');
      if (!isAdmin) {
        productsQuery = productsQuery.eq('activo', true);
      }
      const { data: dbProducts } = await productsQuery;
      if (dbProducts) setProducts(dbProducts as Producto[]);
      
      // Cargar configuración COMPLETA de la tienda
      const { data: dbConfig } = await supabase.from('store_config').select('*').single();
      if (dbConfig) {
        setConfig(prev => ({
          ...prev,
          esta_abierta: dbConfig.esta_abierta,
          site_nombre: dbConfig.site_nombre || prev.site_nombre,
          telefono_soporte: dbConfig.telefono_soporte || prev.telefono_soporte,
          direccion_fisica: dbConfig.direccion_fisica || prev.direccion_fisica,
          tasa_cambio: dbConfig.tasa_cambio || prev.tasa_cambio,
          coordenadas_tienda: { lat: dbConfig.tienda_lat, lng: dbConfig.tienda_lng },
          banners: [dbConfig.banner_url_1, dbConfig.banner_url_2, dbConfig.banner_url_3].filter(Boolean),
          pagomovil_data: dbConfig.pagomovil_data,
          pagomovil_enabled: dbConfig.pagomovil_enabled ?? prev.pagomovil_enabled,
          pagomovil_discount_percent: dbConfig.pagomovil_discount_percent ?? prev.pagomovil_discount_percent,
          zelle_data: dbConfig.zelle_data,
          zelle_enabled: dbConfig.zelle_enabled ?? prev.zelle_enabled,
          zelle_discount_percent: dbConfig.zelle_discount_percent ?? prev.zelle_discount_percent,
          efectivo_data: dbConfig.efectivo_data,
          efectivo_enabled: dbConfig.efectivo_enabled ?? prev.efectivo_enabled,
          efectivo_discount_percent: dbConfig.efectivo_discount_percent ?? prev.efectivo_discount_percent,
          transferencia_data: dbConfig.transferencia_data,
          transferencia_enabled: dbConfig.transferencia_enabled ?? prev.transferencia_enabled,
          transferencia_discount_percent: dbConfig.transferencia_discount_percent ?? prev.transferencia_discount_percent,
          push_webhook_url: dbConfig.push_webhook_url,
          push_webhook_secret: dbConfig.push_webhook_secret,
          logo_url: dbConfig.logo_url ?? prev.logo_url,
          theme_color: dbConfig.theme_color || prev.theme_color,
          favicon_url: dbConfig.favicon_url || prev.favicon_url,
          banner_texts: dbConfig.banner_texts || prev.banner_texts,
          categories: dbConfig.categories || prev.categories,
          mensaje_bienvenida: dbConfig.mensaje_bienvenida || prev.mensaje_bienvenida,
          delivery_gratis: dbConfig.delivery_gratis ?? prev.delivery_gratis,
          costo_delivery_km: dbConfig.costo_delivery_km ?? prev.costo_delivery_km,
          envio_nacional: dbConfig.envio_nacional ?? prev.envio_nacional,
          costo_envio_nacional: dbConfig.costo_envio_nacional ?? prev.costo_envio_nacional,
          recogida_en_local: dbConfig.recogida_en_local ?? prev.recogida_en_local,
          entrega_por_zonas: dbConfig.entrega_por_zonas ?? prev.entrega_por_zonas,
          delivery_zonas: dbConfig.delivery_zonas ?? prev.delivery_zonas
        }));
      }

      // Cargar cupones
      const { data: dbCoupons } = await supabase.from('coupons').select('*');
      if (dbCoupons) setCoupons(dbCoupons as Coupon[]);

      if (isAdmin) {
        setIsAdminAuthenticated(true);
        // Cargar TODO para el admin ignorando filtros de usuario
        const [ordersRes, usersRes, notifsRes] = await Promise.all([
          supabase.from('orders').select('*').order('fecha', { ascending: false }),
          supabase.from('usuarios_clientes').select('*'),
          supabase.from('notifications').select('*').order('created_at', { ascending: false })
        ]);

        if (ordersRes.data) setOrders(ordersRes.data as Order[]);
        if (usersRes.data) setUsers(usersRes.data.map(u => ({ ...u, createdAt: u.created_at, contrasena: 'managed' })));
        if (notifsRes.data) setNotifications(notifsRes.data as InAppNotification[]);
      } else if (currentUser) {
        // Cargar Pedidos del usuario (por teléfono o ID)
        const { data: dbOrders } = await supabase.from('orders')
          .select('*')
          .or(`cliente_telefono.eq."${currentUser.telefono}",cliente_uid.eq."${currentUser.id}"`)
          .order('fecha', { ascending: false });
        if (dbOrders) setOrders(dbOrders as Order[]);

        // Cargar Notificaciones (Solo globales o personales del usuario)
        const { data: dbNotifs } = await supabase.from('notifications')
          .select('*')
          .or(`tipo.eq.todos,and(tipo.eq.personal,destinatario_telefono.eq.${currentUser.telefono})`)
          .order('id', { ascending: false });
        if (dbNotifs) setNotifications(dbNotifs as InAppNotification[]);
      }

      if (needsRateUpdate()) {
        await fetchExchangeRate();
      }
      setIsGlobalLoading(false);
    };
    initData();

    // Intervalo: re-intentar cada 30 minutos si la tasa no se ha actualizado
    const rateInterval = setInterval(() => {
      if (needsRateUpdate()) {
        fetchExchangeRate();
      }
    }, 30 * 60 * 1000); // 30 minutos

    return () => clearInterval(rateInterval);
  }, [currentUser, isAdminAuthenticated]); // Re-ejecutar al cambiar login o admin

  // Listener de auth state para sincronizar sesión de Supabase con estado local
  useEffect(() => {
    if (!supabase?.auth?.onAuthStateChange) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          const isAdmin = session.user?.email === 'kecho8a@gmail.com' || session.user?.app_metadata?.role === 'admin';
          if (isAdmin) {
            setIsAdminAuthenticated(true);
            localStorage.setItem('trv_admin_auth', 'true');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAdminAuthenticated(false);
        localStorage.removeItem('trv_admin_auth');
      }
    });

    return () => subscription?.unsubscribe?.();
  }, []);

  const toggleFavorite = (partId: string) => {
    setFavorites(prev => 
      prev.includes(partId) ? prev.filter(id => id !== partId) : [...prev, partId]
    );
  };

  const isFavorite = (partId: string) => {
    return favorites.includes(partId);
  };

  const requestPart = async (nombre: string, telefono: string, descripcion: string, imagenUrl?: string): Promise<boolean> => {
    console.log('🛠️ AppContext: Procesando solicitud de producto:', descripcion);
    const adminRes = await addNotification(
      'Nueva Solicitud de Producto Especial 🍏',
      `Solicitud de: ${nombre} (${telefono})\n\nProducto: ${descripcion}${imagenUrl ? `\n\nImagen disponible` : ''}`,
      'request',
      telefono
    );
     // Also notify user that request was received
     const userRes = await addNotification(
      'Solicitud de Producto Recibida',
      `Hola ${nombre}, hemos recibido tu solicitud para "${descripcion.substring(0, 30)}...". Un agente de ${config.site_nombre || 'nuestra tienda'} te contactará pronto.`,
      'personal',
      telefono
    );
    console.log('🛠️ AppContext: Resultados de envío:', { adminRes, userRes });
    return adminRes && userRes;
  };

  // Catalog CRUD Functions
  const addProduct = (productData: Omit<Producto, 'id'>) => {
    // No generamos ID manual para productos para que Supabase use gen_random_uuid()
    addNotification('Procesando...', `Agregando ${productData.nombre} al catálogo.`);
    
    // Supabase Async Sync
    supabase.from('products').insert([{
      codigo: productData.codigo,
      nombre: productData.nombre,
      descripcion: productData.descripcion,
      categoria: productData.categoria,
      seccion: productData.seccion,
      subseccion: productData.subseccion,
      precio_usd: productData.precio_usd,
      stock: productData.stock,
      imagen_urls: productData.imagen_urls || [],
      es_promo: productData.es_promo,
      es_nuevo: productData.es_nuevo,
      es_mas_vendido: productData.es_mas_vendido
    }]).select().single().then(({ data, error }) => { 
      if (error) {
        console.error('Add part error:', error);
        addNotification('Error al agregar producto', error.message || 'Error de base de datos');
      }
      if (data) setProducts(prev => [data as Producto, ...prev]);
    });
  };

  const updateProduct = (id: string, updated: Partial<Producto>) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updatedPart = { ...p, ...updated };
        
        // Supabase Async Sync
        const updatePayload: any = { ...updated };
        delete updatePayload.id; // avoid id conflicts
        supabase.from('products').update(updatePayload).eq('codigo', updatedPart.codigo)
          .then(({ error }) => { if (error) {
            console.error('Update part error:', error);
            addNotification('Error al actualizar producto', error.message || 'Error de base de datos');
          } });
          
        return updatedPart;
      }
      return p;
    }));
  };

  const deleteProduct = (id: string) => {
    const targetPart = products.find(p => p.id === id);
    if (targetPart) {
      supabase.from('products').delete().eq('codigo', targetPart.codigo)
        .then(({ error }) => { if (error) {
          console.error('Delete part error:', error);
          addNotification('Error al eliminar producto', error.message || 'Error de base de datos');
        } });
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Buscador Inteligente de Supermercado (Lógica Semántica)
  const searchPartsSemantically = (query: string, includeInactive = false): Producto[] => {
    const partsToSearch = products || [];
    if (!query || query.trim() === '') return partsToSearch.filter(p => includeInactive || p.activo !== false);
    
    const cleanQuery = query.toLowerCase().trim();
    const tokens = cleanQuery.split(/\s+/);
    
    // Filtrado opcional por año (útil para añadas de licores o vigencia de combos)
    let queryYear: number | null = null;
    const remainingTokens: string[] = [];
    
    for (const token of tokens) {
      const parsedNum = parseInt(token);
      if (!isNaN(parsedNum) && parsedNum >= 1980 && parsedNum <= 2026) {
        queryYear = parsedNum;
      } else {
        remainingTokens.push(token);
      }
    }
    
    return partsToSearch.filter(part => {
      // 0. Only active parts
      if (!includeInactive && part.activo === false) {
        return false;
      }

      // 1. Year Match (anio_inicio <= queryYear <= anio_fin)
      if (queryYear !== null) {
        if (part.anio_inicio > queryYear || part.anio_fin < queryYear) {
          return false;
        }
      }
      
      // If there are no other keywords, just filter by compatible year
      if (remainingTokens.length === 0) return true;
      
      // Búsqueda por palabras clave en campos relevantes (Nombre, Marca, Sección, etc.)
      const partSearchText = `${part.nombre} ${part.codigo} ${part.descripcion} ${part.categoria} ${part.seccion} ${part.subseccion} ${part.marca} ${part.condicion} ${part.delivery_gratis ? 'delivery gratis' : ''} ${part.detalle_adicional || ''}`.toLowerCase();
      
      // Enforce AND logic or highly relevant matching
      return remainingTokens.every(tok => partSearchText.includes(tok));
    }).sort((a, b) => {
      // Inteligencia Predictiva: Priorizar coincidencias al inicio del nombre
      const aName = a.nombre.toLowerCase();
      const bName = b.nombre.toLowerCase();
      
      const aStarts = aName.startsWith(cleanQuery);
      const bStarts = bName.startsWith(cleanQuery);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return 0;
    });
  };

  // Cart Actions
  const addToCart = (part: Producto, qty = 1, selectedOptions?: SelectedOption[], optionsTotal = 0) => {
    setCart(prev => {
      // Generate composite key for same product with different options
      const optionsKey = selectedOptions && selectedOptions.length > 0
        ? JSON.stringify([...selectedOptions].sort((a, b) => a.option_name.localeCompare(b.option_name)))
        : '';
      const cartKey = `${part.id}${optionsKey ? `_${optionsKey}` : ''}`;

      const idx = prev.findIndex(item => {
        const itemOptionsKey = item.selected_options && item.selected_options.length > 0
          ? JSON.stringify([...item.selected_options].sort((a, b) => a.option_name.localeCompare(b.option_name)))
          : '';
        return `${item.item.id}${itemOptionsKey ? `_${itemOptionsKey}` : ''}` === cartKey;
      });

      if (idx > -1) {
        const currentQty = prev[idx].quantity;
        const targetQty = Math.min(part.stock, currentQty + qty);
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: targetQty };
        return copy;
      } else {
        return [...prev, {
          item: part,
          quantity: Math.min(part.stock, qty),
          selected_options: selectedOptions,
          options_total_usd: optionsTotal
        }];
      }
    });
  };

  const removeFromCart = (partId: string) => {
    setCart(prev => prev.filter(item => item.item.id !== partId));
  };

  const updateCartQuantity = (partId: string, quantity: number) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.item.id === partId);
      if (idx > -1) {
        const partStock = prev[idx].item.stock;
        const targetQty = Math.max(1, Math.min(partStock, quantity));
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: targetQty };
        return copy;
      }
      return prev;
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  // Orders Management
  const createOrder = async (orderData: Omit<Order, 'id' | 'subtotal_usd' | 'total_usd' | 'total_bs' | 'fecha' | 'status'> & { descuento_cupon_usd?: number; cupon_codigo?: string }, preGeneratedId?: string) => {
    // Recalculate Totals securely - includes extras/options pricing
    const items = cart.map(item => ({
      part_id: item.item.id,
      nombre: item.item.nombre,
      codigo: item.item.codigo,
      precio_usd: item.item.precio_usd,
      cantidad: item.quantity,
      selected_options: item.selected_options,
      options_total_usd: item.options_total_usd
    }));

    const subtotal = items.reduce((acc, item) => {
      const itemTotal = (item.precio_usd + (item.options_total_usd || 0)) * item.cantidad;
      return acc + itemTotal;
    }, 0);
    console.log('Subtotal:', subtotal);
    
    // Apply discount based on payment method
    let discountPercent = 0;
    if (orderData.metodo_pago === 'Pago Móvil') discountPercent = config.pagomovil_discount_percent || 0;
    else if (orderData.metodo_pago === 'Zelle') discountPercent = config.zelle_discount_percent || 0;
    else if (orderData.metodo_pago === 'Efectivo') discountPercent = config.efectivo_discount_percent || 0;
    else if (orderData.metodo_pago === 'Transferencia') discountPercent = config.transferencia_discount_percent || 0;
    
    console.log('Discount Percent:', discountPercent, 'Payment Method:', orderData.metodo_pago);
    
    const discountAmount = (subtotal || 0) * ((discountPercent || 0) / 100);
    const subtotalAfterDiscount = (subtotal || 0) - (discountAmount || 0) - (orderData.descuento_cupon_usd || 0);
    
    console.log('Discount Amount:', discountAmount, 'Costo Envío:', orderData.costo_envio_usd);
    
    const totalUsd = (subtotalAfterDiscount || 0) + (orderData.costo_envio_usd || 0);
    const totalBs = (totalUsd || 0) * (config.tasa_cambio || 1);

    console.log('Total USD:', totalUsd, 'Total BS:', totalBs);



    const newOrder: Order = {
      ...orderData,
      id: preGeneratedId || `PED-${Math.floor(1000 + Math.random() * 9000)}-VAL-${new Date().getFullYear()}`,
      usuario_id: orderData.usuario_id || (currentUser ? currentUser.id : undefined),
      items,
      subtotal_usd: subtotal,
      total_usd: totalUsd,
      total_bs: totalBs,
      status: 'Pendiente',
      fecha: new Date().toLocaleString()
    };

    // 1. Rebajar stock en Supabase (Persistencia Real)
    for (const cartItem of cart) {
      const nextStock = Math.max(0, cartItem.item.stock - cartItem.quantity);
      await supabase.from('products').update({ stock: nextStock }).eq('id', cartItem.item.id);
      
      if (cartItem.item.stock >= 5 && nextStock < 5) {
        addNotification(
          'Alerta de Stock Bajo (Admin)',
          `El producto "${cartItem.item.nombre}" tiene un nivel crítico de ${nextStock} unidades.`,
          'admin'
        );
      }
    }

    // Supabase Insert
    const { error } = await supabase.from('orders').insert([{
      id: newOrder.id,
      cliente_nombre: newOrder.cliente_nombre,
      cliente_telefono: newOrder.cliente_telefono,
      cliente_email: newOrder.cliente_email,
      cliente_uid: newOrder.usuario_id,
      items: newOrder.items,
      descuento_cupon_usd: orderData.descuento_cupon_usd || 0,
      cupon_codigo: orderData.cupon_codigo || null,
      subtotal_usd: newOrder.subtotal_usd,
      costo_envio_usd: newOrder.costo_envio_usd,
      total_usd: newOrder.total_usd,
      total_bs: newOrder.total_bs,
      metodo_pago: newOrder.metodo_pago,
      lat: newOrder.lat,
      lng: newOrder.lng,
      direccion_envio: newOrder.direccion_envio,
      distancia_km: newOrder.distancia_km,
      status: newOrder.status,
      tiempo_estimado_entrega: newOrder.tiempo_estimado_entrega,
      fecha: new Date().toISOString()
    }]);

    if (error) {
      console.error('Insert order error:', error);
      addNotification('Error al procesar pedido', 'No se pudo crear la orden. Intente de nuevo.');
      return null;
    }

    setOrders(prev => [newOrder, ...prev]);
    clearCart();

    // BROADCAST: Enviar señal inmediata al Admin sin esperar a la DB
    supabase.channel('marketo_realtime_system').send({
      type: 'broadcast',
      event: 'new_order_broadcast',
      payload: newOrder
    });

    // Trigger Notification for the store and the client
    addNotification('Nuevo Pedido Recibido', `Pedido ${newOrder.id} fue procesado correctamente para ${newOrder.cliente_nombre}.`);

    // Add notification specifically for the admin
    addNotification(
      'Nuevo Pedido Recibido',
      `Se ha recibido un nuevo pedido con el ID: ${newOrder.id} del cliente "${newOrder.cliente_nombre}".`,
      'admin'
    );

    // If the order has a targeted user or phone, notify them
    if (newOrder.cliente_telefono) {
      addNotification(
        'Pedido Recibido con Éxito 📦',
        `Hola ${newOrder.cliente_nombre}! Tu pedido con ID ${newOrder.id} por un monto de $${newOrder.total_usd.toFixed(2)} (${newOrder.total_bs.toFixed(2)} Bs) ha sido ingresado en estado: Pendiente. Estamos listos para atenderte.`,
        'personal',
        newOrder.cliente_telefono
      );
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['status'], estimatedTime?: string, notas?: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { 
      ...o, 
      status, 
      tiempo_estimado_entrega: estimatedTime !== undefined ? estimatedTime : o.tiempo_estimado_entrega,
      notas_admin: notas !== undefined ? notas : o.notas_admin 
    } : o));
    
    // Find who placed the order and send a profile notification
    const orderObj = orders.find(o => o.id === orderId);
    const targetPhone = orderObj?.cliente_telefono;
    const clientName = orderObj?.cliente_nombre || 'Cliente';
    
    let statusMsg = `Tu pedido ${orderId} ahora se encuentra en estado: ${status}.`;
    if (status === 'En preparación') {
      statusMsg = `🥬 ¡Buenas noticias, ${clientName}! Tu pedido ${orderId} ya está en preparación en nuestros almacenes de Las Acacias.`;
    } else if (status === 'En camino') {
      statusMsg = `🛵 ¡Tu pedido ${orderId} va en camino! Nuestro motorizado se dirige a tu ubicación en Valencia con cadena de frío.`;
    } else if (status === 'Entregado') {
      statusMsg = `✅ Pedido ${orderId} entregado con éxito. ¡Gracias por preferir a ${config.site_nombre || 'nuestra tienda'}!`;
    } else {
      statusMsg = `El pedido ${orderId} ahora se encuentra en estado: ${status}.`;
    }
    
    if (estimatedTime) {
      statusMsg += ` Tiempo estimado de entrega: ${estimatedTime}.`;
    }
    
    addNotification('Estado de Pedido Actualizado', statusMsg, 'todos');
    
    if (targetPhone) {
      addNotification('Estado de Pedido Actualizado', statusMsg, 'personal', targetPhone);
    }
    
    if (orderObj) {
      const updatePayload: any = { status };
      if (estimatedTime !== undefined) {
        updatePayload.tiempo_estimado_entrega = estimatedTime;
      }
      if (notas !== undefined) {
        updatePayload.notas_admin = notas;
      }
      supabase.from('orders')
        .update(updatePayload)
        .eq('id', orderId)
        .then(({ error }) => { if (error) console.error('Update order status error:', error); });
    }
  };

  const updateOrderItems = async (orderId: string, newItems: OrderItem[]) => {
    const originalOrder = orders.find(o => o.id === orderId);
    if (!originalOrder) return;

    const oldItems = originalOrder.items;

    // Lógica para sincronizar stock automáticamente
    const stockChanges = new Map<string, number>();

    // Restamos las cantidades viejas del balance (las devolvemos al stock teóricamente)
    oldItems.forEach(item => {
      stockChanges.set(item.part_id, -(item.cantidad || 0));
    });

    // Sumamos las cantidades nuevas (las restamos del stock teóricamente)
    newItems.forEach(item => {
      const current = stockChanges.get(item.part_id) || 0;
      stockChanges.set(item.part_id, current + (item.cantidad || 0));
    });

    // Aplicar cambios en la base de datos
    for (const [partId, diff] of stockChanges.entries()) {
      if (diff === 0) continue;
      const { data: p } = await supabase.from('products').select('stock').eq('id', partId).single();
      if (p) {
        const nextStock = Math.max(0, p.stock - diff);
        await supabase.from('products').update({ stock: nextStock }).eq('id', partId);
      }
    }

    // Recalcular totales basados en la nueva lista de items
    const subtotal = newItems.reduce((acc, item) => acc + (item.precio_usd * item.cantidad), 0);
    
    let discountPercent = 0;
    if (originalOrder.metodo_pago === 'Pago Móvil') discountPercent = config.pagomovil_discount_percent || 0;
    else if (originalOrder.metodo_pago === 'Zelle') discountPercent = config.zelle_discount_percent || 0;
    else if (originalOrder.metodo_pago === 'Efectivo') discountPercent = config.efectivo_discount_percent || 0;
    else if (originalOrder.metodo_pago === 'Transferencia') discountPercent = config.transferencia_discount_percent || 0;

    const discountAmount = subtotal * (discountPercent / 100);
    const subtotalAfterDiscount = subtotal - discountAmount - (originalOrder.descuento_cupon_usd || 0);
    const totalUsd = subtotalAfterDiscount + (originalOrder.costo_envio_usd || 0);
    const totalBs = totalUsd * config.tasa_cambio;

    const updatePayload = {
      items: newItems,
      subtotal_usd: subtotal,
      total_usd: totalUsd,
      total_bs: totalBs
    };

    const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
    if (error) {
      console.error('Update order items error:', error);
      throw error;
    }

    // Actualizar estado local y notificar al cliente
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatePayload } : o));
    addNotification('Pedido Modificado', `Se han actualizado los productos de tu pedido ${orderId}. El nuevo total es $${totalUsd.toFixed(2)}.`, 'personal', originalOrder.cliente_telefono);
  };

  // --- COUPON MANAGEMENT ---
  const addCoupon = async (coupon: Omit<Coupon, 'id' | 'usage_count'>) => {
    const { data, error } = await supabase.from('coupons').insert([coupon]).select().single();
    if (error) {
      console.error('Error adding coupon:', error);
      return;
    }
    if (data) setCoupons(prev => [...prev, data as Coupon]);
  };

  const updateCoupon = async (id: string, updated: Partial<Coupon>) => {
    const { error } = await supabase.from('coupons').update(updated).eq('id', id);
    if (error) {
      console.error('Error updating coupon:', error);
      return;
    }
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const deleteCoupon = async (id: string) => {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) return;
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  // User Management Implementation
  const registerUser = async (nombre: string, email: string, telefono: string, contrasena: string): Promise<AppUser> => {
    // 1. Registrar primero en Supabase Auth para obtener el UID oficial
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: contrasena.trim(),
      options: { data: { nombre: nombre.trim(), telefono: telefono.trim() } }
    });

    if (authError) {
      if (authError.status === 429) {
        throw new Error("Límite de intentos alcanzado. Por favor, espere un minuto antes de intentar de nuevo.");
      }
      throw authError;
    }

    const newUser: AppUser = {
      id: authData.user?.id || `user-${Date.now()}`, // Sincronizar con el ID de Auth
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim(),
      contrasena: contrasena.trim(),
      createdAt: new Date().toISOString()
    };

    // NOTA: El insert en 'usuarios_clientes' lo maneja el Trigger 'on_auth_user_created' 
    // en la base de datos para evitar errores 409 de duplicidad y asegurar atomicidad.

    setUsers(prev => {
      // Remove any existing user with the same phone to avoid duplicates
      const filtered = prev.filter(u => u.telefono.trim() !== newUser.telefono.trim());
      return [...filtered, newUser];
    });
    setCurrentUser(newUser);

    addNotification(
      '¡Registro Exitoso! 🎉',
      `Hola ${newUser.nombre}. Te has registrado con éxito. Recuerda que con tu nombre, teléfono (${newUser.telefono}) y tu clave secreta podrás acceder siempre a tu panel de usuario.`,
      'personal',
      newUser.telefono
    );
    
    return newUser;
  };

  const loginUser = async (identifier: string, contrasena: string): Promise<AppUser | null> => {
    const cleanId = identifier.trim().toLowerCase();
    
    // Determine if identifier is email or phone
    const isEmail = cleanId.includes('@');
    
    // Use Supabase Auth for secure login
    let authEmail = cleanId;
    if (!isEmail) {
      // If phone number, look up the email from usuarios_clientes
      const { data: lookupData } = await supabase
        .from('usuarios_clientes')
        .select('email')
        .eq('telefono', identifier.trim())
        .single();
      
      if (lookupData?.email) {
        authEmail = lookupData.email;
      } else {
        return null; // No account found for this phone
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: contrasena.trim()
    });

    if (error || !data.user) {
      console.error('Login error:', error?.message);
      return null;
    }

    // Build user from Supabase Auth data
    const user: AppUser = {
      id: data.user.id,
      nombre: data.user.user_metadata?.nombre || data.user.email?.split('@')[0] || 'Usuario',
      email: data.user.email || '',
      telefono: data.user.user_metadata?.telefono || '',
      contrasena: 'auth_managed',
      createdAt: data.user.created_at || new Date().toISOString()
    };

    setCurrentUser(user);
    addNotification(
      'Sesión Iniciada',
      `Bienvenido de vuelta, ${user.nombre}. Accede a tus notificaciones y estatus de compras desde este panel.`,
      'personal',
      user.telefono
    );
    return user;
  };

  const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profile?reset=true`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  const updateUser = (updated: Partial<AppUser>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updated };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    // Update in Supabase in background
    supabase.from('usuarios_clientes')
      .update({
        nombre: updatedUser.nombre,
        telefono: updatedUser.telefono,
        contrasena: updatedUser.contrasena
      })
      .eq('id', currentUser.id)
      .then(({ error }) => {
        if (error) console.error('Error updating user in Supabase:', error);
      });

    addNotification(
      'Datos Actualizados ⚙️',
      `Tus datos han sido guardados. Nombre: ${updatedUser.nombre}, Teléfono: ${updatedUser.telefono}. Tus credenciales de acceso son tu nombre, teléfono y contraseña guardada.`,
      'personal',
      updatedUser.telefono
    );
  };

  const updateUserByAdmin = (userId: string, updated: Partial<AppUser>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updated } : u));
    
    // If the updated user is the current user, update current user too
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updated } : null);
    }

    // Sync to Supabase in background
    const updatePayload: any = {};
    if (updated.nombre !== undefined) updatePayload.nombre = updated.nombre;
    if (updated.telefono !== undefined) updatePayload.telefono = updated.telefono;
    if (updated.contrasena !== undefined) updatePayload.contrasena = updated.contrasena;

    if (Object.keys(updatePayload).length > 0) {
      supabase.from('usuarios_clientes')
        .update(updatePayload)
        .eq('id', userId)
        .then(({ error }) => {
          if (error) console.error('Error updating user by admin in Supabase:', error);
        });
    }
  };

  const addCategory = (categoryName: string) => {
    setConfig(prev => {
      const currentCats = prev.categories || [];
      if (currentCats.includes(categoryName)) return prev;
      const updated = { ...prev, categories: [...currentCats, categoryName] };
      localStorage.setItem('trv_config', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteCategory = (categoryName: string) => {
    setConfig(prev => {
      const currentCats = prev.categories || [];
      const updated = { ...prev, categories: currentCats.filter(c => c !== categoryName) };
      localStorage.setItem('trv_config', JSON.stringify(updated));
      return updated;
    });

    setProducts(prevProducts => {
      const updatedProducts = prevProducts.map(p => {
        if (p.categoria === categoryName) {
          return { ...p, categoria: 'Víveres y Despensa' };
        }
        return p;
      });
      localStorage.setItem('trv_parts', JSON.stringify(updatedProducts));
      return updatedProducts;
    });
  };

  const updateCategory = (oldCategory: string, newCategory: string) => {
    setConfig(prev => {
      const currentCats = prev.categories || [];
      const updated = {
        ...prev,
        categories: currentCats.map(c => c === oldCategory ? newCategory : c)
      };
      localStorage.setItem('trv_config', JSON.stringify(updated));
      return updated;
    });
    setProducts(prevProducts => {
      const updatedProducts = prevProducts.map(p => {
        if (p.categoria === oldCategory) {
          return { ...p, categoria: newCategory };
        }
        return p;
      });
      localStorage.setItem('trv_parts', JSON.stringify(updatedProducts));
      return updatedProducts;
    });
  };

  // Configurations
  const updateConfig = (newSettings: Partial<StoreConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('trv_config', JSON.stringify(updated));
      
      // Supabase Async Sync con debounce
      if (configSaveTimeoutRef.current) {
        clearTimeout(configSaveTimeoutRef.current);
      }
      configSaveTimeoutRef.current = setTimeout(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.warn('[Config] No hay sesión activa, omitiendo sync a Supabase');
            return;
          }

          const updatePayload: any = { id: 1 };

          Object.keys(newSettings).forEach(key => {
            const value = (newSettings as any)[key];
            if (value !== undefined) {
              if (key === 'coordenadas_tienda' && value) {
                updatePayload.tienda_lat = value.lat;
                updatePayload.tienda_lng = value.lng;
              } else if (key === 'banners' && Array.isArray(value)) {
                if (value[0] !== undefined) updatePayload.banner_url_1 = value[0];
                if (value[1] !== undefined) updatePayload.banner_url_2 = value[1];
                if (value[2] !== undefined) updatePayload.banner_url_3 = value[2];
              } else {
                updatePayload[key] = value;
              }
            }
          });
          
          if (Object.keys(updatePayload).length > 1) {
            await supabase.from('store_config').upsert(updatePayload);
          }
        } catch (e) {
          console.error('[Config] Failed to sync config', e);
        }
      }, 500);
      
      return updated;
    });
  };

  const updateExchangeRate = (rate: number) => {
    if (isNaN(rate) || rate <= 10 || rate > 10000) {
      console.warn('Tasa de cambio rechazada por seguridad:', rate);
      return;
    }
    setConfig(prev => ({ ...prev, tasa_cambio: rate }));
    
    // Sincronizar con Supabase (con auth check)
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('[Config] No hay sesión activa, omitiendo sync de tasa a Supabase');
          return;
        }
        const { error } = await supabase.from('store_config').update({ tasa_cambio: rate }).eq('id', 1);
        if (error) console.error('[Config] Error syncing rate to DB:', error);
      } catch (e) {
        console.error('[Config] Error syncing rate:', e);
      }
    })();
  };

  // Log notifications
  const addNotification = async (title: string, message: string, tipo: 'todos' | 'personal' | 'admin' | 'request' = 'todos', targetPhone?: string, imageUrl?: string, linkUrl?: string): Promise<boolean> => {
    console.log(`🔔 Marketo System: Registrando notificación [${tipo}]...`);
    
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newNotif: InAppNotification = {
      id: notifId,
      titulo: title,
      mensaje: message,
      fecha: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tipo,
      destinatario_telefono: targetPhone,
      imagen_url: imageUrl,
      link_url: linkUrl,
      leida: false
    };

    // Actualización optimista local para que el mensaje aparezca inmediatamente en el emisor
    setNotifications(prev => {
      if (prev.some(n => n.id === notifId)) return prev;
      return [newNotif, ...prev];
    });

    // Sincronización con Supabase
    const { error } = await supabase.from('notifications').insert({
      id: notifId,
      titulo: newNotif.titulo,
      mensaje: newNotif.mensaje,
      fecha: newNotif.fecha,
      tipo: newNotif.tipo,
      destinatario_telefono: newNotif.destinatario_telefono,
      leida: newNotif.leida,
      imagen_url: newNotif.imagen_url,
      link_url: newNotif.link_url
    }).select();

    if (error) {
      console.error('❌ Marketo Error (SQL):', error.message, '| Hint:', error.hint);
      addNotification('Error de notificación', 'No se pudo guardar la notificación en el servidor.');
      return false;
    }
    
    console.log('✅ Notificación guardada en Supabase:', notifId);

    // El disparo del Webhook Push ya no se hace desde el frontend por seguridad y para evitar errores 401.
    // Ahora lo gestiona exclusivamente el trigger "trigger_notify_push" en Supabase 
    // (definido en schema_definitivo.sql) usando la extensión pg_net, garantizando que el 
    // secreto de autenticación nunca viaje por el navegador del cliente.

    return true;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  const toggleNotificationReadStatus = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: !n.leida } : n));
  };

  const registerNotificationClick = async (id: string) => {
    // Incrementar en Supabase mediante RPC (evita problemas de RLS de escritura)
    const { error } = await supabase.rpc('increment_notification_click', { notif_id: id });
    
    if (error) {
      console.error('❌ Error al registrar clic:', error.message);
    } else {
      // Actualizar localmente para feedback inmediato en el Admin si está viendo
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, click_count: ((n as any).click_count || 0) + 1 } : n));
    }
  };

  /**
   * Sincroniza la suscripción Push del navegador con el teléfono actual del usuario en la DB.
   * Se debe llamar siempre que el teléfono cambie.
   */
  const syncPushSubscription = async (): Promise<{ success: boolean; error?: string }> => {
    if (typeof window === 'undefined') {
      return { success: false, error: 'window no disponible (SSR?)' };
    }
    if (!('serviceWorker' in navigator)) {
      return { success: false, error: 'Service Worker no soportado en este navegador' };
    }
    if (!('PushManager' in window)) {
      return { success: false, error: 'PushManager no disponible en este navegador' };
    }
    if (!currentUser) {
      console.error('❌ Marketo Sync Error: Intento de sincronizar push sin usuario logueado');
      return { success: false, error: 'No hay usuario logueado. Inicia sesión para activar notificaciones.' };
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();

      if (!existingSub) {
        console.warn('⚠️ Marketo Sync: No se encontró suscripción push activa en este navegador.');
        return { success: false, error: 'No existe suscripción push activa. Activa las notificaciones desde tu Perfil.' };
      }

      const subJSON = existingSub.toJSON();

      // Validar que tenemos las keys necesarias
      if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) {
        return { success: false, error: 'Suscripción push corrupta. Renuncia y activa las notificaciones de nuevo.' };
      }

      // Actualizamos la suscripción en la tabla push_subscriptions.
      // El upsert usa 'endpoint' como unique constraint (creado en schema_definitivo.sql).
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: currentUser.id,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys?.p256dh,
        auth_secret: subJSON.keys?.auth,
        destinatario_telefono: currentUser.telefono.trim()
      }, { onConflict: 'endpoint' });

      if (error) {
        const msg = 'Error sincronizando suscripción push: ' + error.message;
        console.error('❌ Marketo:', msg);
        return { success: false, error: msg };
      } else {
        console.log('✅ Marketo: Suscripción Push sincronizada con el teléfono:', currentUser.telefono);
        return { success: true };
      }
    } catch (err: any) {
      const msg = 'Fallo crítico en syncPushSubscription: ' + (err?.message || String(err));
      console.error('❌ Marketo:', msg);
      return { success: false, error: msg };
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Admin Auth functions
  const authenticateAdmin = async (email: string, pass: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass.trim()
      });
      if (error) {
        console.error('Supabase Auth Error:', error.message);
        return false;
      }
      if (data.session) {
        setIsAdminAuthenticated(true);
        localStorage.setItem('trv_admin_auth', 'true');
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const logoutAdmin = async () => {
    await supabase.auth.signOut();
    setIsAdminAuthenticated(false);
    localStorage.removeItem('trv_admin_auth');
  };

  const updateAdminCredentials = async (email: string, pass: string) => {
    const { error } = await supabase.auth.updateUser({
      email: email.trim(),
      password: pass.trim()
    });
    if (error) {
      alert('Error al actualizar credenciales: ' + error.message);
    } else {
      alert('Credenciales de acceso administrativo actualizadas correctamente en Supabase Auth.');
    }
  };

  return (
    <AppContext.Provider value={{
      // NOTE: the store currently uses `products` as the source of truth.
      // Keeping the exposed context API consistent with the rest of the app.
      parts: products,
      orders,
      config,
      coupons,
      notifications,
      cart,
      isAdminAuthenticated,
      isGlobalLoading,
      favorites,
      toggleFavorite,
      isFavorite,
      users,
      currentUser,
      registerUser,
      loginUser,
      logoutUser,
      sendPasswordResetEmail,
      updateUser,
      updateUserByAdmin,
      // Catalog CRUD compatibility: map legacy API names to current implementations
      addCoupon,
      updateCoupon,
      deleteCoupon,
      addPart: addProduct,
      updatePart: updateProduct,
      deletePart: deleteProduct,
      searchPartsSemantically,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      createOrder,
      updateOrderStatus,
      updateOrderItems,
      updateConfig,
      updateExchangeRate,
      fetchExchangeRate,
      addCategory,
      deleteCategory,
      updateCategory,
      addNotification,
      markNotificationAsRead,
      toggleNotificationReadStatus,
      registerNotificationClick,
      syncPushSubscription,
      deleteNotification,
      clearAllNotifications,
      authenticateAdmin,
      logoutAdmin,
      updateAdminCredentials,
      adminUser,
      adminPass,
      requestPart,
      displayCurrency,
      toggleCurrency,
      hapticEnabled,
      toggleHaptic
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside an AppProvider');
  }
  return context;
};
