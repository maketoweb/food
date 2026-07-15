import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { FoodItem, Order, StoreConfig, InAppNotification, OrderItem, AppUser, Coupon, CartItem, SelectedOption, ProductReview, FlashSale, LoyaltyTransaction, LoyaltyTier, Promotion, RewardItem } from '../types/store';
import { supabase } from './supabaseClient';

interface AppContextProps {
  foodItems: FoodItem[];
  promotions: Promotion[];
  orders: Order[];
  config: StoreConfig;
  coupons: Coupon[];
  notifications: InAppNotification[];
  cart: CartItem[];
  isAdminAuthenticated: boolean;
  favorites: string[];
  toggleFavorite: (itemId: string) => void;
  isFavorite: (itemId: string) => boolean;
  
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
  addFoodItem: (product: Omit<FoodItem, 'id'>) => void;
  updateFoodItem: (id: string, updated: Partial<FoodItem>) => void;
  deleteFoodItem: (id: string) => void;
  searchItems: (query: string, includeInactive?: boolean) => FoodItem[];
  
  // Cart Actions
  addToCart: (item: FoodItem, qty?: number, selectedOptions?: SelectedOption[], optionsTotal?: number, removedIngredients?: string[]) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
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
  fetchExchangeRate: () => Promise<boolean>;
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
  
  // Reviews
  reviews: ProductReview[];
  addReview: (productId: string, rating: number, comment?: string) => Promise<boolean>;
  getProductReviews: (productId: string) => ProductReview[];
  getProductAverageRating: (productId: string) => number;
  
  // Flash Sales
  flashSales: FlashSale[];
  getActiveFlashSale: (productId: string) => FlashSale | null;
  
  // Loyalty
  loyaltyTransactions: LoyaltyTransaction[];
  earnLoyaltyPoints: (userId: string, orderId: string, amountUsd: number, sedeId?: string) => Promise<void>;
  redeemLoyaltyPoints: (userId: string, pointsToRedeem: number, orderId?: string) => Promise<boolean>;
  getUserLoyaltyPoints: (userId: string) => number;
  getUserLoyaltyTier: (userId: string) => LoyaltyTier | null;
  adjustUserPoints: (userId: string, points: number, reason: string) => Promise<void>;
  getLoyaltyTransactions: (userId: string) => LoyaltyTransaction[];
  
  // PWA Install
  markUserAsPwaInstalled: (userId: string) => Promise<void>;
  
  // Reward Catalog
  rewardCatalog: RewardItem[];
  addRewardItem: (item: Omit<RewardItem, 'id'>) => Promise<void>;
  updateRewardItem: (id: string, updated: Partial<RewardItem>) => Promise<void>;
  deleteRewardItem: (id: string) => Promise<void>;
  redeemRewardItem: (userId: string, rewardId: string) => Promise<boolean>;
  
  // Auth
  authenticateAdmin: (email: string, pass: string) => Promise<boolean>;
  logoutAdmin: () => Promise<void>;
  updateAdminCredentials: (user: string, pass: string) => void;
  adminUser: string;
  adminPass: string;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// INITIAL PRODUCTS DATA - Hamburguesería (50 productos)
const DEFAULT_PRODUCTS: FoodItem[] = [
  // HAMBURGUESAS (10)
  {
    id: 'hmb-001',
    nombre: 'Smash Clásica',
    descripcion: 'Doble smash de carne 100% res, queso cheddar derretido, cebolla caramelizada, pickle y salsa especial de la casa.',
    categoria: 'Hamburguesas',
    precio_usd: 7.50,
    stock: 60,
    imagen_urls: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    ingredientes: ['Pan brioche', 'Carne smash 120g', 'Queso cheddar', 'Lechuga', 'Tomate', 'Cebolla', 'Salsa especial'],
    option_groups: [
      { id: 'og-size-001', nombre: 'Tamaño', min_select: 1, max_select: 1, options: [
        { id: 'opt-sm-001', nombre: 'Single (120g)', precio_usd: 0 },
        { id: 'opt-dbl-001', nombre: 'Double (240g)', precio_usd: 2.50 },
        { id: 'opt-xl-001', nombre: 'Triple (360g)', precio_usd: 4.50 }
      ]},
      { id: 'og-top-001', nombre: 'Extras', min_select: 0, max_select: 5, options: [
        { id: 'opt-cho-001', nombre: 'Extra Queso', precio_usd: 0.75 },
        { id: 'opt-bac-001', nombre: 'Tocino', precio_usd: 1.00 },
        { id: 'opt-eg-001', nombre: 'Huevo Frito', precio_usd: 0.75 },
        { id: 'opt-jal-001', nombre: 'Jalapeños', precio_usd: 0.50 },
        { id: 'opt-avo-001', nombre: 'Aguacate', precio_usd: 1.25 }
      ]},
      { id: 'og-sal-001', nombre: 'Salsas', min_select: 0, max_select: 2, options: [
        { id: 'opt-sp-001', nombre: 'Salsa Especial', precio_usd: 0 },
        { id: 'opt-bbq-001', nombre: 'BBQ', precio_usd: 0 },
        { id: 'opt-hny-001', nombre: 'Mostaza Miel', precio_usd: 0 },
        { id: 'opt-pic-001', nombre: 'Salsa Picante', precio_usd: 0 }
      ]}
    ]
  },
  {
    id: 'hmb-002',
    nombre: 'Bacon Explosion',
    descripcion: 'Doble carne smash, bacon crujiente, queso pepper jack, cebolla crispy y salsa BBQ ahumada.',
    categoria: 'Hamburguesas',
    precio_usd: 9.50,
    stock: 50,
    imagen_urls: ['https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=500'],
    es_promo: true,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    ingredientes: ['Pan brioche', 'Doble carne smash', 'Bacon crujiente', 'Queso pepper jack', 'Cebolla crispy', 'Salsa BBQ'],
    option_groups: [
      { id: 'og-size-002', nombre: 'Tamaño', min_select: 1, max_select: 1, options: [
        { id: 'opt-sm-002', nombre: 'Single', precio_usd: 0 },
        { id: 'opt-dbl-002', nombre: 'Double', precio_usd: 3.00 }
      ]},
      { id: 'og-top-002', nombre: 'Extras', min_select: 0, max_select: 5, options: [
        { id: 'opt-cho-002', nombre: 'Extra Queso', precio_usd: 0.75 },
        { id: 'opt-bac-002', nombre: 'Bacon Extra', precio_usd: 1.50 },
        { id: 'opt-rng-002', nombre: 'Onion Rings', precio_usd: 1.00 }
      ]}
    ]
  },
  {
    id: 'hmb-003',
    nombre: 'Mushroom Swiss',
    descripcion: 'Carne smash jugosa, champiñones salteados, queso suizo derretido y mayonesa de trufa.',
    categoria: 'Hamburguesas',
    precio_usd: 10.00,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Pan brioche', 'Carne smash 160g', 'Queso gruyère', 'Champiñones trufados', 'Cebolla caramelizada', 'Aceite de oliva'],
    option_groups: [
      { id: 'og-size-003', nombre: 'Tamaño', min_select: 1, max_select: 1, options: [
        { id: 'opt-sm-003', nombre: 'Single', precio_usd: 0 },
        { id: 'opt-dbl-003', nombre: 'Double', precio_usd: 3.00 }
      ]}
    ]
  },
  {
    id: 'hmb-004',
    nombre: 'BBQ Bacon Cheddar',
    descripcion: 'Carne smash, bacon, cheddar derretido, aros de cebolla y salsa BBQ de la casa.',
    categoria: 'Hamburguesas',
    precio_usd: 8.90,
    stock: 55,
    imagen_urls: ['https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    ingredientes: ['Pan brioche', 'Carne smash 120g', 'Queso Americano', 'Lechuga', 'Tomate', 'Pepinillos', 'Kétchup', 'Mostaza'],
    option_groups: [
      { id: 'og-size-004', nombre: 'Tamaño', min_select: 1, max_select: 1, options: [
        { id: 'opt-sm-004', nombre: 'Single', precio_usd: 0 },
        { id: 'opt-dbl-004', nombre: 'Double', precio_usd: 3.00 }
      ]},
      { id: 'og-top-004', nombre: 'Extras', min_select: 0, max_select: 5, options: [
        { id: 'opt-cho-004', nombre: 'Extra Queso', precio_usd: 0.75 },
        { id: 'opt-bac-004', nombre: 'Tocino Extra', precio_usd: 1.50 },
        { id: 'opt-eg-004', nombre: 'Huevo Frito', precio_usd: 0.75 }
      ]}
    ]
  },
  {
    id: 'hmb-005',
    nombre: 'Veggie Burger',
    descripcion: 'Burger de lentejas y champiñones, lechuga, tomate, aguacate y salsa de yogurt.',
    categoria: 'Hamburguesas',
    precio_usd: 8.50,
    stock: 30,
    imagen_urls: ['https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Pan integral', 'Medallón vegetal', 'Queso vegano', 'Lechuga', 'Tomate', 'Palta', 'Salsa de yogur'],
    option_groups: [
      { id: 'og-top-005', nombre: 'Extras', min_select: 0, max_select: 3, options: [
        { id: 'opt-cho-005', nombre: 'Extra Queso', precio_usd: 0.75 },
        { id: 'opt-avo-005', nombre: 'Aguacate', precio_usd: 1.25 }
      ]}
    ]
  },
  {
    id: 'hmb-006',
    nombre: 'Smash Doble Queso',
    descripcion: 'Doble carne smash, doble queso americano derretido, pepinillos y mostaza.',
    categoria: 'Hamburguesas',
    precio_usd: 8.50,
    stock: 45,
    imagen_urls: ['https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    ingredientes: ['Pan brioche', 'Doble carne smash', 'Doble queso americano', 'Pepinillos', 'Mostaza'],
    option_groups: [
      { id: 'og-size-006', nombre: 'Tamaño', min_select: 1, max_select: 1, options: [
        { id: 'opt-sm-006', nombre: 'Single', precio_usd: 0 },
        { id: 'opt-dbl-006', nombre: 'Double', precio_usd: 2.50 }
      ]}
    ]
  },
  {
    id: 'hmb-007',
    nombre: 'Crispy Chicken Burger',
    descripcion: 'Pechuga de pollo empanizada crujiente, lechuga, tomate, mayonesa y pan tostado.',
    categoria: 'Hamburguesas',
    precio_usd: 8.00,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Pan brioche', 'Pechuga empanizada', 'Lechuga', 'Tomate', 'Mayonesa'],
    option_groups: [
      { id: 'og-top-007', nombre: 'Extras', min_select: 0, max_select: 3, options: [
        { id: 'opt-cho-007', nombre: 'Extra Queso', precio_usd: 0.75 },
        { id: 'opt-bac-007', nombre: 'Tocino', precio_usd: 1.00 },
        { id: 'opt-avo-007', nombre: 'Aguacate', precio_usd: 1.25 }
      ]}
    ]
  },
  {
    id: 'hmb-008',
    nombre: 'Hawaiian Burger',
    descripcion: 'Carne smash, piña asada, jamón, queso suizo derretido y salsa teriyaki.',
    categoria: 'Hamburguesas',
    precio_usd: 9.00,
    stock: 35,
    imagen_urls: ['https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Pan brioche', 'Carne smash', 'Piña asada', 'Jamón', 'Queso suizo', 'Salsa teriyaki'],
    option_groups: []
  },
  {
    id: 'hmb-009',
    nombre: 'Texas BBQ Burger',
    descripcion: 'Triple carne smash, bacon, cheddar, onion rings, jalapeños y salsa BBQ ahumada.',
    categoria: 'Hamburguesas',
    precio_usd: 11.00,
    stock: 25,
    imagen_urls: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500'],
    es_promo: true,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Pan brioche', 'Triple carne smash', 'Bacon', 'Queso cheddar', 'Onion rings', 'Jalapeños', 'Salsa BBQ'],
    option_groups: [
      { id: 'og-top-009', nombre: 'Extras', min_select: 0, max_select: 3, options: [
        { id: 'opt-bac-009', nombre: 'Bacon Extra', precio_usd: 1.50 },
        { id: 'opt-eg-009', nombre: 'Huevo Frito', precio_usd: 0.75 }
      ]}
    ]
  },
  {
    id: 'hmb-010',
    nombre: 'Burger Infantil',
    descripcion: 'Carne smash pequeña, queso americano, papas fritas incluidas y salsa de tomate.',
    categoria: 'Hamburguesas',
    precio_usd: 5.50,
    stock: 50,
    imagen_urls: ['https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Pan suave', 'Carne smash 80g', 'Queso americano', 'Papas fritas'],
    option_groups: []
  },
  // PIZZAS (6)
  {
    id: 'pzz-001',
    nombre: 'Pizza Pepperoni',
    descripcion: 'Pizza clásica con pepperoni, queso mozzarella y salsa de tomate casera.',
    categoria: 'Pizzas',
    precio_usd: 9.00,
    stock: 30,
    imagen_urls: ['https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    ingredientes: ['Masa artesanal', 'Pepperoni', 'Queso mozzarella', 'Salsa de tomate'],
    option_groups: [
      { id: 'og-sz-pzz-001', nombre: 'Tamaño', min_select: 1, max_select: 1, options: [
        { id: 'opt-pers-001', nombre: 'Personal (8")', precio_usd: 0 },
        { id: 'opt-med-001', nombre: 'Mediana (12")', precio_usd: 3.00 },
        { id: 'opt-fam-001', nombre: 'Familiar (16")', precio_usd: 6.00 }
      ]}
    ]
  },
  {
    id: 'pzz-002',
    nombre: 'Pizza Margherita',
    descripcion: 'Pizza tradicional con mozzarella fresca, albahaca, salsa de tomate y aceite de oliva.',
    categoria: 'Pizzas',
    precio_usd: 8.50,
    stock: 30,
    imagen_urls: ['https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    ingredientes: ['Masa artesanal', 'Mozzarella fresca', 'Albahaca', 'Salsa de tomate', 'Aceite de oliva'],
    option_groups: [
      { id: 'og-sz-pzz-002', nombre: 'Tamaño', min_select: 1, max_select: 1, options: [
        { id: 'opt-pers-002', nombre: 'Personal (8")', precio_usd: 0 },
        { id: 'opt-med-002', nombre: 'Mediana (12")', precio_usd: 3.00 },
        { id: 'opt-fam-002', nombre: 'Familiar (16")', precio_usd: 6.00 }
      ]}
    ]
  },
  {
    id: 'pzz-003',
    nombre: 'Pizza BBQ Chicken',
    descripcion: 'Pizza con pollo BBQ, cebolla morada, queso mozzarella y salsa BBQ ahumada.',
    categoria: 'Pizzas',
    precio_usd: 10.50,
    stock: 25,
    imagen_urls: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Masa artesanal', 'Pollo BBQ', 'Cebolla morada', 'Queso mozzarella', 'Salsa BBQ'],
    option_groups: [
      { id: 'og-sz-pzz-003', nombre: 'Tamaño', min_select: 1, max_select: 1, options: [
        { id: 'opt-pers-003', nombre: 'Personal (8")', precio_usd: 0 },
        { id: 'opt-med-003', nombre: 'Mediana (12")', precio_usd: 3.50 },
        { id: 'opt-fam-003', nombre: 'Familiar (16")', precio_usd: 7.00 }
      ]}
    ]
  },
  {
    id: 'pzz-004',
    nombre: 'Pizza Mexicana',
    descripcion: 'Pizza con carne molida, jalapeños, pimientos, cebolla, nachos y queso picante.',
    categoria: 'Pizzas',
    precio_usd: 11.00,
    stock: 20,
    imagen_urls: ['https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Masa artesanal', 'Carne molida', 'Jalapeños', 'Pimientos', 'Cebolla', 'Nachos'],
    option_groups: [
      { id: 'og-sz-pzz-004', nombre: 'Tamaño', min_select: 1, max_select: 1, options: [
        { id: 'opt-pers-004', nombre: 'Personal (8")', precio_usd: 0 },
        { id: 'opt-med-004', nombre: 'Mediana (12")', precio_usd: 3.50 },
        { id: 'opt-fam-004', nombre: 'Familiar (16")', precio_usd: 7.00 }
      ]}
    ]
  },
  {
    id: 'pzz-005',
    nombre: 'Pizza Hawaiana',
    descripcion: 'Pizza con jamón, piña, mozzarella y salsa de tomate. Dulce y salada.',
    categoria: 'Pizzas',
    precio_usd: 9.50,
    stock: 30,
    imagen_urls: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Masa artesanal', 'Jamón', 'Piña', 'Queso mozzarella', 'Salsa de tomate'],
    option_groups: [
      { id: 'og-sz-pzz-005', nombre: 'Tamaño', min_select: 1, max_select: 1, options: [
        { id: 'opt-pers-005', nombre: 'Personal (8")', precio_usd: 0 },
        { id: 'opt-med-005', nombre: 'Mediana (12")', precio_usd: 3.00 },
        { id: 'opt-fam-005', nombre: 'Familiar (16")', precio_usd: 6.00 }
      ]}
    ]
  },
  {
    id: 'pzz-006',
    nombre: 'Pizza Vegetariana',
    descripcion: 'Pizza con champiñones, pimientos, aceitunas, cebolla, maíz y mozzarella.',
    categoria: 'Pizzas',
    precio_usd: 10.00,
    stock: 25,
    imagen_urls: ['https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Masa artesanal', 'Champiñones', 'Pimientos', 'Aceitunas', 'Cebolla', 'Maíz'],
    option_groups: [
      { id: 'og-sz-pzz-006', nombre: 'Tamaño', min_select: 1, max_select: 1, options: [
        { id: 'opt-pers-006', nombre: 'Personal (8")', precio_usd: 0 },
        { id: 'opt-med-006', nombre: 'Mediana (12")', precio_usd: 3.00 },
        { id: 'opt-fam-006', nombre: 'Familiar (16")', precio_usd: 6.00 }
      ]}
    ]
  },
  // POLLO (5)
  {
    id: 'pol-001',
    nombre: 'Alitas BBQ x6',
    descripcion: '6 alitas de pollo bañadas en salsa BBQ ahumada, acompañadas de papas fritas.',
    categoria: 'Pollo',
    precio_usd: 6.50,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    ingredientes: ['Alitas de pollo', 'Salsa BBQ', 'Papas fritas'],
    option_groups: [
      { id: 'og-sau-pol-001', nombre: 'Salsa Extra', min_select: 0, max_select: 2, options: [
        { id: 'opt-bbq-pol-001', nombre: 'BBQ Extra', precio_usd: 0.50 },
        { id: 'opt-ran-pol-001', nombre: 'Ranch', precio_usd: 0.50 }
      ]}
    ]
  },
  {
    id: 'pol-002',
    nombre: 'Alitas Buffalo x6',
    descripcion: '6 alitas de pollo con salsa buffalo picante, aderezo blue cheese y papas.',
    categoria: 'Pollo',
    precio_usd: 6.50,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Alitas de pollo', 'Salsa buffalo', 'Aderezo blue cheese', 'Papas fritas'],
    option_groups: [
      { id: 'og-sau-pol-002', nombre: 'Salsa Extra', min_select: 0, max_select: 2, options: [
        { id: 'opt-buf-pol-002', nombre: 'Buffalo Extra', precio_usd: 0.50 }
      ]}
    ]
  },
  {
    id: 'pol-003',
    nombre: 'Alitas Miel Mostaza x6',
    descripcion: '6 alitas de pollo glaseadas con salsa miel mostaza y ajonjolí.',
    categoria: 'Pollo',
    precio_usd: 6.50,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Alitas de pollo', 'Salsa miel mostaza', 'Ajonjolí'],
    option_groups: []
  },
  {
    id: 'pol-004',
    nombre: 'Chicken Tenders x4',
    descripcion: '4 tiras de pechuga empanizadas, crujientes por fuera y jugosas por dentro, con salsa de la casa.',
    categoria: 'Pollo',
    precio_usd: 7.00,
    stock: 35,
    imagen_urls: ['https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    ingredientes: ['Pechuga de pollo', 'Empanizado crujiente', 'Salsa de la casa'],
    option_groups: [
      { id: 'og-dip-pol-004', nombre: 'Salsa', min_select: 1, max_select: 1, options: [
        { id: 'opt-hny-pol-004', nombre: 'Miel Mostaza', precio_usd: 0 },
        { id: 'opt-bbq-pol-004', nombre: 'BBQ', precio_usd: 0 },
        { id: 'opt-rch-pol-004', nombre: 'Ranch', precio_usd: 0 }
      ]}
    ]
  },
  {
    id: 'pol-005',
    nombre: 'Pollo BBQ Asado',
    descripcion: 'Mitad de pollo asado con salsa BBQ, acompañado de papas y ensalada fresca.',
    categoria: 'Pollo',
    precio_usd: 8.50,
    stock: 20,
    imagen_urls: ['https://images.unsplash.com/photo-1598103442097-8b7c2fbaa3b1?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Pollo BBQ', 'Papas', 'Ensalada fresca'],
    option_groups: []
  },
  // PAPAS & SIDES (6)
  {
    id: 'ccp-001',
    nombre: 'Papas Fritas Clásicas',
    descripcion: 'Papas fritas crocantes con sal marina y salsa ketchup de la casa.',
    categoria: 'Papas & Sides',
    precio_usd: 3.50,
    stock: 100,
    imagen_urls: ['https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    ingredientes: ['Papas fritas crocantes', 'Sal'],
    option_groups: [
      { id: 'og-sz-ccp', nombre: 'Tamaño', min_select: 1, max_select: 1, options: [
        { id: 'opt-ind', nombre: 'Individual', precio_usd: 0 },
        { id: 'opt-fam', nombre: 'Familiar (+2 personas)', precio_usd: 2.50 }
      ]},
      { id: 'og-dip-ccp', nombre: 'Salsa Extra', min_select: 0, max_select: 2, options: [
        { id: 'opt-chz', nombre: 'Queso Cheddar', precio_usd: 1.00 },
        { id: 'opt-bbq', nombre: 'BBQ', precio_usd: 0.75 },
        { id: 'opt-gar', nombre: 'Ajo', precio_usd: 0.50 }
      ]}
    ]
  },
  {
    id: 'ccp-002',
    nombre: 'Onion Rings',
    descripcion: 'Aros de cebolla empanizados y fritos hasta quedar dorados y crujientes.',
    categoria: 'Papas & Sides',
    precio_usd: 4.00,
    stock: 50,
    imagen_urls: ['https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Cebolla', 'Empanizado', 'Salsa ranch'],
    option_groups: []
  },
  {
    id: 'pps-001',
    nombre: 'Papas Cheddar & Bacon',
    descripcion: 'Papas fritas cubiertas con queso cheddar derretido y bacon bits crujientes.',
    categoria: 'Papas & Sides',
    precio_usd: 5.00,
    stock: 60,
    imagen_urls: ['https://images.unsplash.com/photo-1617127365659-c47c8646ef44?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Papas', 'Queso cheddar', 'Bacon bits'],
    option_groups: [
      { id: 'og-sz-pps-001', nombre: 'Tamaño', min_select: 1, max_select: 1, options: [
        { id: 'opt-ind-pps', nombre: 'Individual', precio_usd: 0 },
        { id: 'opt-fam-pps', nombre: 'Familiar', precio_usd: 2.50 }
      ]}
    ]
  },
  {
    id: 'pps-002',
    nombre: 'Papas Cajún',
    descripcion: 'Papas fritas sazonadas con especias cajún, servidas con crema agria.',
    categoria: 'Papas & Sides',
    precio_usd: 4.50,
    stock: 50,
    imagen_urls: ['https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Papas', 'Especias cajún', 'Crema agria'],
    option_groups: []
  },
  {
    id: 'pps-003',
    nombre: 'Papas Locas',
    descripcion: 'Papas fritas con queso cheddar, bacon, jalapeños, crema agria y pico de gallo.',
    categoria: 'Papas & Sides',
    precio_usd: 6.00,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1617127365659-c47c8646ef44?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Papas', 'Queso cheddar', 'Bacon', 'Jalapeños', 'Crema agria', 'Pico de gallo'],
    option_groups: []
  },
  // ENTRADAS (4)
  {
    id: 'ent-001',
    nombre: 'Nachos Supreme',
    descripcion: 'Totopos de maíz con queso cheddar derretido, guacamole, crema agria, jalapeños y pico de gallo.',
    categoria: 'Entradas',
    precio_usd: 6.50,
    stock: 35,
    imagen_urls: ['https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    ingredientes: ['Totopos de maíz', 'Queso cheddar', 'Jalapeños', 'Guacamole', 'Crema agria'],
    option_groups: [
      { id: 'og-meat-ent', nombre: 'Proteína Extra', min_select: 0, max_select: 1, options: [
        { id: 'opt-chk-ent', nombre: 'Pollo Desmenuzado', precio_usd: 2.00 },
        { id: 'opt-beef-ent', nombre: 'Carne Molida', precio_usd: 2.00 }
      ]}
    ]
  },
  {
    id: 'ent-002',
    nombre: 'Tequeños x6',
    descripcion: '6 palitos de queso envueltos en masa hojaldrada, fritos hasta dorar, servidos con salsa de ajo.',
    categoria: 'Entradas',
    precio_usd: 4.50,
    stock: 50,
    imagen_urls: ['https://images.unsplash.com/photo-1625220194771-7ebdea0b70b7?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Queso blanco', 'Masa hojaldrada', 'Salsa de ajo'],
    option_groups: []
  },
  {
    id: 'ent-003',
    nombre: 'Empanadas de Queso x3',
    descripcion: '3 empanadas fritas rellenas de queso, doradas y crujientes.',
    categoria: 'Entradas',
    precio_usd: 4.00,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1625220194771-7ebdea0b70b7?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Masa de maíz', 'Queso blanco', 'Aceite vegetal'],
    option_groups: []
  },
  {
    id: 'ent-004',
    nombre: 'Mozzarella Sticks x6',
    descripcion: '6 palitos de mozzarella empanizados con salsa marinara y crema de ajo.',
    categoria: 'Entradas',
    precio_usd: 5.50,
    stock: 35,
    imagen_urls: ['https://images.unsplash.com/photo-1625220194771-7ebdea0b70b7?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Mozzarella', 'Empanizado', 'Salsa marinara', 'Crema de ajo'],
    option_groups: []
  },
  // COMBOS (6)
  {
    id: 'cmb-001',
    nombre: 'Combo Smash + Papas',
    descripcion: 'Hamburguesa Smash Clásica + Papas Fritas + Bebida 500ml.',
    categoria: 'Combos',
    precio_usd: 11.90,
    stock: 50,
    imagen_urls: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500'],
    es_promo: true,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    ingredientes: ['Hamburguesa a elegir', 'Papas fritas', 'Bebida 500ml'],
    option_groups: [
      { id: 'og-hmb-cmb', nombre: 'Tu Burger', min_select: 1, max_select: 1, options: [
        { id: 'opt-cla', nombre: 'Smash Clásica', precio_usd: 0 },
        { id: 'opt-bbq', nombre: 'BBQ Bacon', precio_usd: 1.00 },
        { id: 'opt-mus', nombre: 'Mushroom Swiss', precio_usd: 1.50 }
      ]},
      { id: 'og-dri-cmb', nombre: 'Bebida', min_select: 1, max_select: 1, options: [
        { id: 'opt-col', nombre: 'Coca-Cola 500ml', precio_usd: 0 },
        { id: 'opt-fan', nombre: 'Fanta 500ml', precio_usd: 0 },
        { id: 'opt-wat', nombre: 'Agua 500ml', precio_usd: 0 },
        { id: 'opt-jui', nombre: 'Jugo Natural', precio_usd: 0.75 }
      ]}
    ]
  },
  {
    id: 'cmb-002',
    nombre: 'Combo Doble + Papas Grandes',
    descripcion: 'Doble BBQ Bacon Cheddar + Papas Grandes + Bebida 500ml.',
    categoria: 'Combos',
    precio_usd: 15.90,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['2 Hamburguesas a elegir', 'Papas Grandes', '2 Bebidas 500ml'],
    option_groups: [
      { id: 'og-dri-cmb2', nombre: 'Bebida', min_select: 1, max_select: 1, options: [
        { id: 'opt-col2', nombre: 'Coca-Cola 500ml', precio_usd: 0 },
        { id: 'opt-fan2', nombre: 'Fanta 500ml', precio_usd: 0 },
        { id: 'opt-spr2', nombre: 'Sprite 500ml', precio_usd: 0 },
        { id: 'opt-jui2', nombre: 'Jugo Natural', precio_usd: 0.75 }
      ]}
    ]
  },
  {
    id: 'cmb-003',
    nombre: 'Combo Familiar (4 personas)',
    descripcion: '4 Smash Clásicas + Papas Familiares + 4 Bebidas 500ml + Onion Rings.',
    categoria: 'Combos',
    precio_usd: 34.90,
    stock: 20,
    imagen_urls: ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500'],
    es_promo: true,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: true,
    ingredientes: ['4 Smash Clásicas', 'Papas familiares', '4 Bebidas', 'Onion Rings'],
    option_groups: [
      { id: 'og-beb-fam', nombre: 'Bebidas', min_select: 1, max_select: 1, options: [
        { id: 'opt-col-f', nombre: '4x Coca-Cola', precio_usd: 0 },
        { id: 'opt-var-f', nombre: '4x Mixtas', precio_usd: 0 },
        { id: 'opt-wat-f', nombre: '4x Agua', precio_usd: 0 }
      ]}
    ]
  },
  {
    id: 'cmb-004',
    nombre: 'Combo Pizza + Papas',
    descripcion: 'Pizza Pepperoni Personal + Papas Fritas + Bebida 500ml.',
    categoria: 'Combos',
    precio_usd: 14.90,
    stock: 25,
    imagen_urls: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Pizza Pepperoni', 'Papas fritas', 'Bebida 500ml'],
    option_groups: [
      { id: 'og-dri-cmb4', nombre: 'Bebida', min_select: 1, max_select: 1, options: [
        { id: 'opt-col4', nombre: 'Coca-Cola 500ml', precio_usd: 0 },
        { id: 'opt-spr4', nombre: 'Sprite 500ml', precio_usd: 0 },
        { id: 'opt-jui4', nombre: 'Jugo Natural', precio_usd: 0.75 }
      ]}
    ]
  },
  {
    id: 'cmb-005',
    nombre: 'Combo Alitas + Papas',
    descripcion: '6 Alitas BBQ + Papas Fritas + Bebida 500ml + Aderezo.',
    categoria: 'Combos',
    precio_usd: 12.50,
    stock: 30,
    imagen_urls: ['https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['6 Alitas BBQ', 'Papas fritas', 'Bebida 500ml', 'Aderezo'],
    option_groups: [
      { id: 'og-dri-cmb5', nombre: 'Bebida', min_select: 1, max_select: 1, options: [
        { id: 'opt-col5', nombre: 'Coca-Cola 500ml', precio_usd: 0 },
        { id: 'opt-fan5', nombre: 'Fanta 500ml', precio_usd: 0 }
      ]}
    ]
  },
  {
    id: 'cmb-006',
    nombre: 'Combo Infantil',
    descripcion: 'Burger Infantil + Papas pequeñas + Jugo + Juguete sorpresa.',
    categoria: 'Combos',
    precio_usd: 8.50,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Burger Infantil', 'Papas pequeñas', 'Jugo', 'Juguete sorpresa'],
    option_groups: []
  },
  // BEBIDAS (7)
  {
    id: 'beb-001',
    nombre: 'Coca-Cola 500ml',
    descripcion: 'Refresco de cola 500ml bien frío.',
    categoria: 'Bebidas',
    precio_usd: 1.50,
    stock: 150,
    imagen_urls: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    ingredientes: ['Coca-Cola 500ml'],
    option_groups: []
  },
  {
    id: 'beb-002',
    nombre: 'Sprite 500ml',
    descripcion: 'Refresco de limón 500ml, refrescante y burbujeante.',
    categoria: 'Bebidas',
    precio_usd: 1.50,
    stock: 150,
    imagen_urls: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Sprite 500ml'],
    option_groups: []
  },
  {
    id: 'beb-003',
    nombre: 'Fanta 500ml',
    descripcion: 'Refresco de naranja 500ml, sabor frutal y refrescante.',
    categoria: 'Bebidas',
    precio_usd: 1.50,
    stock: 150,
    imagen_urls: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Fanta 500ml'],
    option_groups: []
  },
  {
    id: 'beb-004',
    nombre: 'Agua Mineral 500ml',
    descripcion: 'Agua mineral natural sin gas, pura y refrescante.',
    categoria: 'Bebidas',
    precio_usd: 1.00,
    stock: 200,
    imagen_urls: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Agua mineral 500ml'],
    option_groups: []
  },
  {
    id: 'beb-005',
    nombre: 'Milkshake de Vainilla',
    descripcion: 'Malteada cremosa de vainilla con crema batida y chips de chocolate.',
    categoria: 'Bebidas',
    precio_usd: 4.50,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Helado de vainilla', 'Leche', 'Crema batida', 'Chips de chocolate'],
    option_groups: [
      { id: 'og-shk', nombre: 'Sabor', min_select: 1, max_select: 1, options: [
        { id: 'opt-van', nombre: 'Vainilla', precio_usd: 0 },
        { id: 'opt-chc', nombre: 'Chocolate', precio_usd: 0 },
        { id: 'opt-stb', nombre: 'Fresa', precio_usd: 0 },
        { id: 'opt-oreo', nombre: 'Oreo', precio_usd: 0.50 }
      ]}
    ]
  },
  {
    id: 'beb-006',
    nombre: 'Milkshake de Chocolate',
    descripcion: 'Malteada cremosa de chocolate con crema batida y salsa de chocolate.',
    categoria: 'Bebidas',
    precio_usd: 4.50,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Helado de chocolate', 'Leche', 'Crema batida', 'Salsa de chocolate'],
    option_groups: [
      { id: 'og-shk-006', nombre: 'Sabor', min_select: 1, max_select: 1, options: [
        { id: 'opt-chc-006', nombre: 'Chocolate', precio_usd: 0 },
        { id: 'opt-van-006', nombre: 'Vainilla', precio_usd: 0 }
      ]}
    ]
  },
  {
    id: 'beb-007',
    nombre: 'Limonada Natural',
    descripcion: 'Limonada fresca preparada al momento con limón natural y hielo.',
    categoria: 'Bebidas',
    precio_usd: 2.00,
    stock: 60,
    imagen_urls: ['https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Limón', 'Agua', 'Azúcar', 'Hielo'],
    option_groups: [
      { id: 'og-lim', nombre: 'Extra', min_select: 0, max_select: 1, options: [
        { id: 'opt-lev', nombre: 'Leche (Limonada con Leche)', precio_usd: 0.50 }
      ]}
    ]
  },
  // POSTRES (6)
  {
    id: 'pst-001',
    nombre: 'Brownie con Helado',
    descripcion: 'Brownie de chocolate caliente con una bola de helado de vainilla y salsa de chocolate.',
    categoria: 'Postres',
    precio_usd: 5.50,
    stock: 30,
    imagen_urls: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: true,
    delivery_gratis: false,
    ingredientes: ['Brownie de chocolate', 'Helado de vainilla', 'Salsa de chocolate'],
    option_groups: [
      { id: 'og-hel', nombre: 'Sabor Helado', min_select: 1, max_select: 1, options: [
        { id: 'opt-van-p', nombre: 'Vainilla', precio_usd: 0 },
        { id: 'opt-chc-p', nombre: 'Chocolate', precio_usd: 0 },
        { id: 'opt-fres-p', nombre: 'Fresa', precio_usd: 0 }
      ]}
    ]
  },
  {
    id: 'pst-002',
    nombre: 'Cheesecake de Fresa',
    descripcion: 'Tajada de cheesecake cremoso con coulis de fresa fresca.',
    categoria: 'Postres',
    precio_usd: 4.50,
    stock: 25,
    imagen_urls: ['https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: true,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Cheesecake de fresa', 'Salsa de fresa'],
    option_groups: []
  },
  {
    id: 'pst-003',
    nombre: 'Crepas con Nutella',
    descripcion: '2 crepas suaves rellenas de Nutella, fresas y plátano, espolvoreadas con azúcar glass.',
    categoria: 'Postres',
    precio_usd: 5.00,
    stock: 25,
    imagen_urls: ['https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Crepas', 'Nutella', 'Fresas', 'Plátano', 'Azúcar glass'],
    option_groups: []
  },
  {
    id: 'pst-004',
    nombre: 'Sundae de Chocolate',
    descripcion: 'Helado de chocolate con crema batida, salsa de chocolate, nueces y cereza.',
    categoria: 'Postres',
    precio_usd: 4.00,
    stock: 35,
    imagen_urls: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Helado de chocolate', 'Crema batida', 'Salsa de chocolate', 'Nueces', 'Cereza'],
    option_groups: []
  },
  {
    id: 'pst-005',
    nombre: 'Flan Casero',
    descripcion: 'Flan de caramelo casero, suave y cremoso. Receta tradicional de la abuela.',
    categoria: 'Postres',
    precio_usd: 3.50,
    stock: 30,
    imagen_urls: ['https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Huevo', 'Leche condensada', 'Caramelo', 'Vainilla'],
    option_groups: []
  },
  {
    id: 'pst-006',
    nombre: 'Helado Artesanal 2 bolas',
    descripcion: '2 bolas de helado artesanal a tu elección: vainilla, chocolate, fresa o mantecado.',
    categoria: 'Postres',
    precio_usd: 3.50,
    stock: 40,
    imagen_urls: ['https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&q=80&w=500'],
    es_promo: false,
    es_nuevo: false,
    es_mas_vendido: false,
    delivery_gratis: false,
    ingredientes: ['Helado artesanal', 'Sabor a elegir'],
    option_groups: [
      { id: 'og-hel-006', nombre: 'Sabores', min_select: 2, max_select: 2, options: [
        { id: 'opt-van-006', nombre: 'Vainilla', precio_usd: 0 },
        { id: 'opt-chc-006', nombre: 'Chocolate', precio_usd: 0 },
        { id: 'opt-frs-006', nombre: 'Fresa', precio_usd: 0 },
        { id: 'opt-mnt-006', nombre: 'Mantecado', precio_usd: 0 }
      ]}
    ]
  }
];

const DEFAULT_CONFIG: StoreConfig = {
  site_nombre: 'FoodPop',
  telefono_soporte: '+584124976451',
  direccion_fisica: 'Av. Principal, Local #12, Valencia',
  coordenadas_tienda: { lat: 10.198300, lng: -68.004400 },
  banners: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1200'
  ],
  zelle_enabled: true,
  zelle_data: 'pagos@burgerpop.com.ve',
  zelle_discount_percent: 0,
  pagomovil_enabled: true,
  pagomovil_data: 'Banesco (0134) - RIF J-50123456-7 - Tel: 0412-4976451',
  pagomovil_discount_percent: 0,
  efectivo_enabled: true,
  efectivo_data: 'Paga al motorizado en efectivo (USD/Bs) al recibir tu delivery',
  efectivo_discount_percent: 0,
  transferencia_enabled: true,
  transferencia_data: 'Banesco Cuenta Corriente - 0134-1122-33-4455667788 - BurgerPop C.A. - RIF J-50123456-7',
  transferencia_discount_percent: 0,
  tasa_cambio: 612.43,
  logo_url: '',
  theme_color: '#FF6B35',
  mensaje_bienvenida: 'La mejor hamburguesería con delivery express. Hamburguesas smash, pizzas artesanales, pollo, papas, postres y más.',
  delivery_gratis: false,
  costo_delivery_km: 1.5,
  recogida_en_local: true,
  entrega_por_zonas: true,
  delivery_zonas: [
    { id: 'z1', name: 'Cercano (0-3 km)', cost: 2.00, minKm: 0, maxKm: 3 },
    { id: 'z2', name: 'Medio (3-8 km)', cost: 4.50, minKm: 3, maxKm: 8 },
    { id: 'z3', name: 'Lejano (8-18 km)', cost: 7.00, minKm: 8, maxKm: 18 },
  ],
  favicon_url: '',
  pwa_icon_url: '',
  banner_texts: [
    'Hamburguesas Smash, Pizzas y Pollo',
    'Combos que Enamoran',
    'Postres que Enloquecen'
  ],
  categories: [
    'Hamburguesas',
    'Pizzas',
    'Pollo',
    'Papas & Sides',
    'Entradas',
    'Combos',
    'Bebidas',
    'Postres',
    'Nuggets & Tenders'
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
  ],
  loyalty: {
    enabled: false,
    points_per_dollar: 1,
    min_order_for_points: 5,
    redemption_rate: 100,
    max_discount_percent: 30,
    welcome_bonus: 50,
    bonus_actions: { daily_login: 5, first_order: 25, review: 10, referral: 100 },
    tiers: [
      { id: 'tier-bronze', name: 'Bronce', min_points: 0, multiplier: 1, benefits: ['Puntos base'], color: '#CD7F32' },
      { id: 'tier-silver', name: 'Plata', min_points: 500, multiplier: 1.25, benefits: ['25% más puntos'], color: '#8E8E93' },
      { id: 'tier-gold', name: 'Oro', min_points: 1500, multiplier: 1.5, benefits: ['50% más puntos', 'Envío gratis'], color: '#FF9500' },
    ],
  },
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence state loaders
  const [products, setProducts] = useState<FoodItem[]>(() => {
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

  const [promotions, setPromotions] = useState<Promotion[]>([]);

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
        titulo: 'Bienvenidos a BurgerPop',
        mensaje: 'Las mejores hamburguesas smash, pizzas artesanales, pollo, papas y postres con delivery express en Valencia.',
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

  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    const saved = localStorage.getItem('trv_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  const [flashSales, setFlashSales] = useState<FlashSale[]>(() => {
    const saved = localStorage.getItem('trv_flash_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>(() => {
    const saved = localStorage.getItem('trv_loyalty_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [rewardCatalog, setRewardCatalog] = useState<RewardItem[]>(() => {
    const saved = localStorage.getItem('trv_reward_catalog');
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

  const playNotificationSound = (type: 'new' | 'update' | 'addToCart' | 'error' | 'swipe', status?: Order['status']) => {
    const soundUrl = type === 'new'
      ? 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'
      : type === 'addToCart'
      ? 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'
      : 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

    const audio = new Audio(soundUrl);
    audio.volume = 0.8;
    audio.play().catch((err) => {
      if (err.name === 'NotAllowedError') {
        console.warn('📢 Audio bloqueado — se necesita interacción previa del usuario.');
      } else {
        console.warn('📢 Error al reproducir audio:', err.message);
      }
    });

    if (hapticEnabledRef.current && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const patterns: Record<string, number | number[]> = {
        addToCart: 50,
        orderConfirmed: [100, 50, 100],
        error: 200,
        swipe: 30,
        new: [200, 100, 200],
        update: status === 'En camino' ? 100 : 50
      };
      navigator.vibrate(patterns[type] || 50);
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
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'store_config' }, (payload: Record<string, unknown>) => {
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
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload: Record<string, unknown>) => {
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
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload: Record<string, unknown>) => {
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
        // Escuchar cambios en FoodItems (CDC)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'products' },
          (payload: Record<string, unknown>) => {
            const inserted = (payload as any)?.new;
            if (!inserted?.id) return;

            setProducts(prev => {
              const idxById = prev.findIndex(p => p.id === inserted.id);
              if (idxById >= 0) {
                const copy = [...prev];
                copy[idxById] = { ...copy[idxById], ...inserted };
                return copy;
              }

              return [inserted as FoodItem, ...prev];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'products' },
          (payload: Record<string, unknown>) => {
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

              return [updated as FoodItem, ...prev];
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'products' },
          (payload: Record<string, unknown>) => {
            const deleted = (payload as any)?.old;
            if (!deleted) return;

            setProducts(prev => {
              return deleted.id ? prev.filter(p => p.id !== deleted.id) : prev;
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

  useEffect(() => {
    localStorage.setItem('trv_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('trv_flash_sales', JSON.stringify(flashSales));
  }, [flashSales]);

  useEffect(() => {
    localStorage.setItem('trv_loyalty_transactions', JSON.stringify(loyaltyTransactions));
  }, [loyaltyTransactions]);

  useEffect(() => {
    localStorage.setItem('trv_reward_catalog', JSON.stringify(rewardCatalog));
  }, [rewardCatalog]);

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
      if (dbProducts) {
        const merged = (dbProducts as FoodItem[]).map(p => {
          const hasDbOptions = Array.isArray(p.option_groups) && p.option_groups.length > 0;
          if (hasDbOptions) return p;
          const fallback = DEFAULT_PRODUCTS.find(d => d.nombre === p.nombre && d.categoria === p.categoria);
          return { ...p, option_groups: fallback?.option_groups || [] };
        });
        setProducts(merged);
      }

      // Cargar promociones activas
      const { data: dbPromotions } = await supabase.from('promotions').select('*');
      if (dbPromotions) {
        setPromotions(dbPromotions as Promotion[]);
      }
      
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
          recogida_en_local: dbConfig.recogida_en_local ?? prev.recogida_en_local,
          entrega_por_zonas: dbConfig.entrega_por_zonas ?? prev.entrega_por_zonas,
          delivery_zonas: dbConfig.delivery_zonas ?? prev.delivery_zonas,
          loyalty: dbConfig.loyalty ? {
            ...prev.loyalty,
            ...dbConfig.loyalty,
            tiers: dbConfig.loyalty.tiers?.length ? dbConfig.loyalty.tiers : (prev.loyalty?.tiers || []),
            bonus_actions: { ...(prev.loyalty?.bonus_actions || {}), ...(dbConfig.loyalty?.bonus_actions || {}) },
          } : prev.loyalty,
        }));
      }

      // Cargar cupones
      const { data: dbCoupons } = await supabase.from('coupons').select('*');
      if (dbCoupons) setCoupons(dbCoupons as Coupon[]);

      // Cargar reviews
      const { data: dbReviews } = await supabase.from('product_reviews').select('*').order('created_at', { ascending: false });
      if (dbReviews) setReviews(dbReviews as ProductReview[]);

      // Cargar flash sales activas
      const { data: dbFlashSales } = await supabase.from('flash_sales').select('*').eq('active', true);
      if (dbFlashSales) setFlashSales(dbFlashSales as FlashSale[]);

      // Cargar catálogo de recompensas
      const { data: dbRewards } = await supabase.from('reward_catalog').select('*').eq('active', true);
      if (dbRewards) setRewardCatalog(dbRewards as RewardItem[]);

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

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const isFavorite = (itemId: string) => {
    return favorites.includes(itemId);
  };

  // --- REVIEWS ---
  const addReview = async (productId: string, rating: number, comment?: string): Promise<boolean> => {
    if (!currentUser) return false;
    
    const newReview: ProductReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      product_id: productId,
      user_id: currentUser.id,
      user_name: currentUser.nombre,
      rating,
      comment: comment || undefined,
      created_at: new Date().toISOString()
    };

    // Save to Supabase
    const { error } = await supabase.from('product_reviews').insert({
      id: newReview.id,
      product_id: newReview.product_id,
      user_id: newReview.user_id,
      user_name: newReview.user_name,
      rating: newReview.rating,
      comment: newReview.comment
    });

    if (error) {
      console.error('Error adding review:', error);
      return false;
    }

    setReviews(prev => [...prev, newReview]);
    
    addNotification(
      'Nueva Reseña ⭐',
      `${currentUser.nombre} calificó un producto con ${rating} estrella${rating !== 1 ? 's' : ''}.`,
      'admin'
    );
    
    return true;
  };

  const getProductReviews = (productId: string): ProductReview[] => {
    return reviews.filter(r => r.product_id === productId);
  };

  const getProductAverageRating = (productId: string): number => {
    const productReviews = reviews.filter(r => r.product_id === productId);
    if (productReviews.length === 0) return 0;
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / productReviews.length;
  };

  // --- FLASH SALES ---
  const getActiveFlashSale = (productId: string): FlashSale | null => {
    const now = new Date().toISOString();
    return flashSales.find(
      fs => fs.product_id === productId && fs.active && fs.end_date > now
    ) || null;
  };

  const requestPart = async (nombre: string, telefono: string, descripcion: string, imagenUrl?: string): Promise<boolean> => {
    console.log('🛠️ AppContext: Procesando solicitud de producto:', descripcion);
    const adminRes = await addNotification(
      'Nueva Solicitud de FoodItem Especial 🍏',
      `Solicitud de: ${nombre} (${telefono})\n\nFoodItem: ${descripcion}${imagenUrl ? `\n\nImagen disponible` : ''}`,
      'request',
      telefono
    );
     // Also notify user that request was received
     const userRes = await addNotification(
      'Solicitud de FoodItem Recibida',
      `Hola ${nombre}, hemos recibido tu solicitud para "${descripcion.substring(0, 30)}...". Un agente de ${config.site_nombre || 'nuestra tienda'} te contactará pronto.`,
      'personal',
      telefono
    );
    console.log('🛠️ AppContext: Resultados de envío:', { adminRes, userRes });
    return adminRes && userRes;
  };

  // Catalog CRUD Functions
  const addProduct = (productData: Omit<FoodItem, 'id'>) => {
    // No generamos ID manual para productos para que Supabase use gen_random_uuid()
    addNotification('Procesando...', `Agregando ${productData.nombre} al catálogo.`);
    
    // Supabase Async Sync
    supabase.from('products').insert([{
      nombre: productData.nombre,
      descripcion: productData.descripcion,
      categoria: productData.categoria,
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
      if (data) setProducts(prev => [data as FoodItem, ...prev]);
    });
  };

  const updateProduct = (id: string, updated: Partial<FoodItem>) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updatedPart = { ...p, ...updated };
        
        // Supabase Async Sync
        const updatePayload: any = { ...updated };
        delete updatePayload.id; // avoid id conflicts
        supabase.from('products').update(updatePayload).eq('id', updatedPart.id)
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
      supabase.from('products').delete().eq('id', targetPart.id)
        .then(({ error }) => { if (error) {
          console.error('Delete part error:', error);
          addNotification('Error al eliminar producto', error.message || 'Error de base de datos');
        } });
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Buscador Inteligente
  const searchItems = (query: string, includeInactive = false): FoodItem[] => {
    const itemsToSearch = products || [];
    if (!query || query.trim() === '') return itemsToSearch.filter(p => includeInactive || p.activo !== false);
    
    const cleanQuery = query.toLowerCase().trim();
    const tokens = cleanQuery.split(/\s+/);
    
    return itemsToSearch.filter(item => {
      if (!includeInactive && item.activo === false) {
        return false;
      }
      
      const itemSearchText = `${item.nombre} ${item.descripcion} ${item.categoria} ${(item.ingredientes || []).join(' ')} ${item.delivery_gratis ? 'delivery gratis' : ''}`.toLowerCase();
      
      return tokens.every(tok => itemSearchText.includes(tok));
    }).sort((a, b) => {
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
  const addToCart = (item: FoodItem, qty = 1, selectedOptions?: SelectedOption[], optionsTotal = 0, removedIngredients?: string[]) => {
    setCart(prev => {
      const optionsKey = selectedOptions && selectedOptions.length > 0
        ? JSON.stringify([...selectedOptions].sort((a, b) => a.option_name.localeCompare(b.option_name)))
        : '';
      const cartKey = `${item.id}${optionsKey ? `_${optionsKey}` : ''}`;

      const idx = prev.findIndex(ci => {
        const itemOptionsKey = ci.selected_options && ci.selected_options.length > 0
          ? JSON.stringify([...ci.selected_options].sort((a, b) => a.option_name.localeCompare(b.option_name)))
          : '';
        return `${ci.item.id}${itemOptionsKey ? `_${itemOptionsKey}` : ''}` === cartKey;
      });

      if (idx > -1) {
        const currentQty = prev[idx].quantity;
        const targetQty = Math.min(item.stock, currentQty + qty);
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: targetQty };
        return copy;
      } else {
        return [...prev, {
          item: item,
          quantity: Math.min(item.stock, qty),
          selected_options: selectedOptions,
          options_total_usd: optionsTotal,
          ingredientes_removidos: removedIngredients || []
        }];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(ci => ci.item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    setCart(prev => {
      const idx = prev.findIndex(ci => ci.item.id === itemId);
      if (idx > -1) {
        const itemStock = prev[idx].item.stock;
        const targetQty = Math.max(1, Math.min(itemStock, quantity));
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
  const createOrder = async (orderData: Omit<Order, 'id' | 'subtotal_usd' | 'total_usd' | 'total_bs' | 'fecha' | 'status'> & { descuento_cupon_usd?: number; cupon_codigo?: string; guest_password?: string }, preGeneratedId?: string) => {
    // Recalculate Totals securely - includes extras/options pricing
    const items = cart.map(item => ({
      food_id: item.item.id,
      nombre: item.item.nombre,
      precio_usd: item.item.precio_usd,
      cantidad: item.quantity,
      selected_options: item.selected_options,
      options_total_usd: item.options_total_usd,
      ingredientes_removidos: item.ingredientes_removidos || []
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
      guest_phone: orderData.guest_phone || null,
      guest_email: (!currentUser && orderData.cliente_email) ? orderData.cliente_email : null,
      crear_cuenta: orderData.crear_cuenta || false,
      sede_id: (orderData as any).sede_id || '',
      notas_admin: orderData.notas_admin || '',
      fecha: new Date().toISOString()
    }]);

    if (error) {
      console.error('Insert order error:', error);
      addNotification('Error al procesar pedido', 'No se pudo crear la orden. Intente de nuevo.');
      return null;
    }

    setOrders(prev => [newOrder, ...prev]);
    clearCart();

    // Auto-register guest after successful order (siempre, sin checkbox)
    if (orderData.cliente_email && !currentUser) {
      const cleanPhone = orderData.cliente_telefono.replace(/[\s\-()]/g, '');
      const email = orderData.cliente_email.trim().toLowerCase();
      let userId = '';
      let authSucceeded = false;

      // 1. Primero intentar signIn (si ya tiene cuenta)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: cleanPhone
      });
      if (!signInError && signInData?.user) {
        userId = signInData.user.id;
        authSucceeded = true;
      }

      // 2. Si signIn falla, intentar signUp
      if (!authSucceeded) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: cleanPhone,
          options: {
            data: {
              nombre: orderData.cliente_nombre,
              telefono: cleanPhone
            }
          }
        });
        if (!authError && authData?.user) {
          userId = authData.user.id;
          authSucceeded = true;
        }
      }

      // 3. Si auth falló, usar ID local para que el usuario quede logueado
      if (!userId) {
        userId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      }

      // 4. SIEMPRE hacer setCurrentUser para que el cliente quede logueado
      const newUser: AppUser = {
        id: userId,
        nombre: orderData.cliente_nombre,
        email,
        telefono: cleanPhone,
        contrasena: 'auth_managed',
        createdAt: new Date().toISOString()
      };
      setCurrentUser(newUser);

      if (authSucceeded) {
        addNotification(
          '¡Cuenta Creada! 🎉',
          `Hola ${newUser.nombre}. Tu cuenta fue creada automáticamente. Tu contraseña es tu número de teléfono (${cleanPhone}).`,
          'personal',
          newUser.telefono
        );
      }
    }

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

    oldItems.forEach(item => {
      stockChanges.set(item.food_id, -(item.cantidad || 0));
    });

    newItems.forEach(item => {
      const current = stockChanges.get(item.food_id) || 0;
      stockChanges.set(item.food_id, current + (item.cantidad || 0));
    });

    for (const [itemId, diff] of stockChanges.entries()) {
      if (diff === 0) continue;
      const { data: p } = await supabase.from('products').select('stock').eq('id', itemId).single();
      if (p) {
        const nextStock = Math.max(0, p.stock - diff);
        await supabase.from('products').update({ stock: nextStock }).eq('id', itemId);
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

    // Load full user data from usuarios_clientes
    const { data: dbUser } = await supabase
      .from('usuarios_clientes')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const user: AppUser = {
      id: data.user.id,
      nombre: dbUser?.nombre || data.user.user_metadata?.nombre || data.user.email?.split('@')[0] || 'Usuario',
      email: dbUser?.email || data.user.email || '',
      telefono: dbUser?.telefono || data.user.user_metadata?.telefono || '',
      contrasena: 'auth_managed',
      createdAt: dbUser?.created_at || data.user.created_at || new Date().toISOString(),
      loyalty_points: dbUser?.loyalty_points || 0,
      loyalty_lifetime_points: dbUser?.loyalty_lifetime_points || 0,
      loyalty_tier_id: dbUser?.loyalty_tier_id || '',
      sede_preferida_id: dbUser?.sede_preferida_id || '',
      is_pwa_installed: dbUser?.is_pwa_installed || false,
      pwa_installed_at: dbUser?.pwa_installed_at || undefined,
    };

    setCurrentUser(user);
    addNotification(
      'Sesión Iniciada',
      `Bienvenido de vuelta, ${user.nombre}. Accede a tus notificaciones y estatus de compras desde este panel.`,
      'personal',
      user.telefono
    );

    // Check PWA install status on login
    if (!user.is_pwa_installed && detectPwaInstalled()) {
      markUserAsPwaInstalled(user.id);
    }

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
        email: updatedUser.email,
        contrasena: updatedUser.contrasena
      })
      .eq('id', currentUser.id)
      .then(({ error }) => {
        if (error) console.error('Error updating user in Supabase:', error);
      });

    addNotification(
      'Datos Actualizados ⚙️',
      `Tus datos han sido guardados. Nombre: ${updatedUser.nombre}, Teléfono: ${updatedUser.telefono}. Tus credenciales de acceso son tu correo, teléfono y contraseña guardada.`,
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
          return { ...p, categoria: 'Hamburguesas' };
        }
        return p;
      });
      localStorage.setItem('trv_foodItems', JSON.stringify(updatedProducts));
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
      localStorage.setItem('trv_foodItems', JSON.stringify(updatedProducts));
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

  // --- LOYALTY / FIDELIZACIÓN ---
  const earnLoyaltyPoints = async (userId: string, orderId: string, amountUsd: number, sedeId?: string) => {
    const loyaltyConfig = config.loyalty;
    if (!loyaltyConfig?.enabled || amountUsd < loyaltyConfig.min_order_for_points) return;
    
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const tier = getUserLoyaltyTier(userId);
    const multiplier = tier?.multiplier || 1;
    const basePoints = Math.floor(amountUsd * loyaltyConfig.points_per_dollar * multiplier);
    const pwaBonus = user.is_pwa_installed ? 1.5 : 1;
    const pointsEarned = Math.floor(basePoints * pwaBonus);
    
    if (pointsEarned <= 0) return;
    
    const tx: LoyaltyTransaction = {
      id: `loy-tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      user_id: userId,
      type: 'earn',
      points: pointsEarned,
      description: user.is_pwa_installed ? `Compra #${orderId.slice(-8)} (Bonus App x1.5)` : `Compra #${orderId.slice(-8)}`,
      order_id: orderId,
      sede_id: sedeId,
      created_at: new Date().toISOString(),
    };
    
    setLoyaltyTransactions(prev => [...prev, tx]);
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return {
        ...u,
        loyalty_points: (u.loyalty_points || 0) + pointsEarned,
        loyalty_lifetime_points: (u.loyalty_lifetime_points || 0) + pointsEarned,
      };
    }));
  };

  // --- PWA INSTALL DETECTION ---
  const markUserAsPwaInstalled = async (userId: string) => {
    localStorage.setItem('foodapp_pwa_installed', 'true');
    await supabase.from('usuarios_clientes')
      .update({ is_pwa_installed: true, pwa_installed_at: new Date().toISOString() })
      .eq('id', userId);
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, is_pwa_installed: true, pwa_installed_at: new Date().toISOString() } : u
    ));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, is_pwa_installed: true, pwa_installed_at: new Date().toISOString() } : prev);
    }
  };

  const detectPwaInstalled = (): boolean => {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if ((navigator as any).standalone === true) return true;
    if (localStorage.getItem('foodapp_pwa_installed') === 'true') return true;
    return false;
  };

  // --- REWARD CATALOG CRUD ---
  const addRewardItem = async (item: Omit<RewardItem, 'id'>) => {
    const newItem: RewardItem = { ...item, id: `reward-${Date.now()}-${Math.random().toString(36).substr(2, 6)}` };
    setRewardCatalog(prev => [...prev, newItem]);
  };

  const updateRewardItem = async (id: string, updated: Partial<RewardItem>) => {
    setRewardCatalog(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
  };

  const deleteRewardItem = async (id: string) => {
    setRewardCatalog(prev => prev.filter(r => r.id !== id));
  };

  const redeemRewardItem = async (userId: string, rewardId: string): Promise<boolean> => {
    const reward = rewardCatalog.find(r => r.id === rewardId);
    if (!reward || !reward.active) return false;
    const user = users.find(u => u.id === userId);
    if (!user || (user.loyalty_points || 0) < reward.points_cost) return false;
    
    const tx: LoyaltyTransaction = {
      id: `loy-tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      user_id: userId,
      type: 'redeem',
      points: -reward.points_cost,
      description: `Canje: ${reward.name}`,
      created_at: new Date().toISOString(),
    };
    setLoyaltyTransactions(prev => [...prev, tx]);
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return { ...u, loyalty_points: (u.loyalty_points || 0) - reward.points_cost };
    }));
    return true;
  };

  const redeemLoyaltyPoints = async (userId: string, pointsToRedeem: number, orderId?: string): Promise<boolean> => {
    const loyaltyConfig = config.loyalty;
    if (!loyaltyConfig?.enabled) return false;
    
    const user = users.find(u => u.id === userId);
    if (!user || (user.loyalty_points || 0) < pointsToRedeem) return false;
    
    const tx: LoyaltyTransaction = {
      id: `loy-tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      user_id: userId,
      type: 'redeem',
      points: -pointsToRedeem,
      description: orderId ? `Canje en pedido #${orderId.slice(-8)}` : 'Canje de puntos',
      order_id: orderId,
      created_at: new Date().toISOString(),
    };
    
    setLoyaltyTransactions(prev => [...prev, tx]);
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return { ...u, loyalty_points: (u.loyalty_points || 0) - pointsToRedeem };
    }));
    
    return true;
  };

  const getUserLoyaltyPoints = (userId: string): number => {
    const user = users.find(u => u.id === userId);
    return user?.loyalty_points || 0;
  };

  const getUserLoyaltyTier = (userId: string): LoyaltyTier | null => {
    const loyaltyConfig = config.loyalty;
    if (!loyaltyConfig?.enabled || !loyaltyConfig.tiers?.length) return null;
    
    const user = users.find(u => u.id === userId);
    const lifetimePoints = user?.loyalty_lifetime_points || 0;
    
    let bestTier: LoyaltyTier | null = null;
    for (const tier of loyaltyConfig.tiers) {
      if (lifetimePoints >= tier.min_points) {
        if (!bestTier || tier.min_points > bestTier.min_points) {
          bestTier = tier;
        }
      }
    }
    return bestTier;
  };

  const adjustUserPoints = async (userId: string, points: number, reason: string) => {
    const tx: LoyaltyTransaction = {
      id: `loy-tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      user_id: userId,
      type: 'adjustment',
      points: points,
      description: reason,
      created_at: new Date().toISOString(),
    };
    
    setLoyaltyTransactions(prev => [...prev, tx]);
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return {
        ...u,
        loyalty_points: Math.max(0, (u.loyalty_points || 0) + points),
        loyalty_lifetime_points: points > 0
          ? (u.loyalty_lifetime_points || 0) + points
          : u.loyalty_lifetime_points,
      };
    }));
  };

  const getLoyaltyTransactions = (userId: string): LoyaltyTransaction[] => {
    return loyaltyTransactions
      .filter(tx => tx.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  return (
    <AppContext.Provider value={{
      // NOTE: the store currently uses `products` as the source of truth.
      // Keeping the exposed context API consistent with the rest of the app.
      foodItems: products,
      promotions,
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
      addFoodItem: addProduct,
      updateFoodItem: updateProduct,
      deleteFoodItem: deleteProduct,
      searchItems,
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
      toggleHaptic,
      reviews,
      addReview,
      getProductReviews,
      getProductAverageRating,
      flashSales,
      getActiveFlashSale,
      loyaltyTransactions,
      earnLoyaltyPoints,
      redeemLoyaltyPoints,
      getUserLoyaltyPoints,
      getUserLoyaltyTier,
      adjustUserPoints,
      getLoyaltyTransactions,
      markUserAsPwaInstalled,
      rewardCatalog,
      addRewardItem,
      updateRewardItem,
      deleteRewardItem,
      redeemRewardItem
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
