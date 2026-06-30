# MEJORA - PLAN DE IMPLEMENTACION COMPLETO
## FoodapP - Plataforma White Label de Delivery | Venezuela

**Administrador:** sugolo28@gmail.com
**Tipo:** PWA First Mobile - Experiencia App Nativa
**Mercado:** Venezuela (USD/BS, WhatsApp, Pago Móvil, Zelle)
**Filosofía:** 100% Auto-gestionable por el admin. Sin intervención del desarrollador.

---

## INDICE

1. [Visión del Producto](#1-visión-del-producto)
2. [Arquitectura Técnica](#2-arquitectura-técnica)
3. [FASE 1: Fundación y Testing](#3-fase-1-fundación-y-testing)
4. [FASE 2: Conversión y Checkout](#4-fase-2-conversión-y-checkout)
5. [FASE 3: Engagement y Retención](#5-fase-3-engagement-y-retención)
6. [FASE 4: Refactor Admin White Label](#6-fase-4-refactor-admin-white-label)
7. [FASE 5: PWA Nativa](#7-fase-5-pwa-nativa)
8. [FASE 6: UI/UX Premium](#8-fase-6-uiux-premium)
9. [Reglamento Admin - Autogestión Total](#9-reglamento-admin---autogestión-total)
10. [Métricas de Éxito](#10-métricas-de-exito)

---

## 1. VISIÓN DEL PRODUCTO

### ¿Qué es FoodaPp?
Plataforma **white label** de delivery de comida para restaurantes en Venezuela. El admin (sugolo28@gmail.com) puede:

- **Gestionar 100% del catálogo** (productos, precios, fotos, opciones)
- **Administrar pedidos en tiempo real** con notificaciones push
- **Configurar zonas de delivery** con costos por distancia
- **Crear cupones y promociones** sin código
- **Gestionar múltiples sedes** con coordenadas GPS
- **Personalizar toda la marca** (colores, logo, banners, textos)
- **Ver reportes de ventas** con gráficas interactivas
- **Administrar clientes** y mensajería directa por WhatsApp

### Regla de Oro
> **TODO lo que el admin necesite cambiar, debe poder hacerlo desde el panel.**
> **NADA que requiera tocar código o contactar al desarrollador.**

---

## 2. ARQUITECTURA TÉCNICA

### Stack Actual
| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite 6 |
| Estilos | Tailwind CSS v4 |
| Animaciones | Framer Motion (motion) |
| Backend | Supabase (PostgreSQL + Realtime + Storage) |
| Deploy | Cloudflare Pages + Functions |
| PWA | vite-plugin-pwa + Workbox |
| Maps | Leaflet + OpenStreetMap |
| Charts | Recharts |
| Push | Web Push (VAPID) |

### Stack a Agregar
| Capa | Tecnología | Razón |
|------|-----------|-------|
| Testing | Vitest + React Testing Library | Tests unitarios e integración |
| E2E | Playwright | Tests de flujo completo |
| Linting | ESLint + Prettier | Code quality |
| State | Zustand (parcial) | Reducir complejidad de Context |
| i18n | NO APLICA | Solo español |

---

## 3. FASE 1: FUNDACIÓN Y TESTING
**Duración:** Semana 1-2
**Objetivo:** Base sólida para refactorizar sin romper nada

### 3.1 Configurar Entorno de Testing
```
Archivos a crear/modificar:
- [ ] vite.config.ts → Agregar test config con Vitest
- [ ] vitest.config.ts → Configuración de Vitest
- [ ] src/test/setup.ts → Setup de testing library
- [ ] package.json → Scripts de test
```

**Dependencias a instalar:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Scripts en package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx,css}"
  }
}
```

### 3.2 Configurar ESLint + Prettier
```
Archivos a crear:
- [ ] .eslintrc.cjs → Reglas ESLint para React + TypeScript
- [ ] .prettierrc → Reglas de formato
- [ ] .prettierignore → Excluir dist, node_modules
```

### 3.3 Activar TypeScript Strict
```
Archivos a modificar:
- [ ] tsconfig.json → Agregar "strict": true gradualmente
```

**Estrategia gradual:**
1. Activar `strictNullChecks` primero
2. Activar `noImplicitAny` después
3. Activar `strictFunctionTypes` al final

### 3.4 Tests Unitarios Core
```
Archivos a crear:
- [ ] src/store/__tests__/AppContext.test.tsx
  - Test: addToCart agrega producto correctamente
  - Test: removeFromCart elimina producto
  - Test: updateCartQuantity actualiza cantidad
  - Test: createOrder crea pedido en Supabase
  - Test: toggleFavorite agrega/quita favorito
  - Test: applyCoupon valida y aplica descuento

- [ ] src/utils/__tests__/categoryColors.test.ts
  - Test: getCategoryColor retorna colores válidos

- [ ] src/components/__tests__/ProductCard.test.tsx
  - Test: Renderiza nombre, precio, imagen
  - Test: Click en card abre detalle
  - Test: Botón + agrega al carrito
  - Test: Badge PROMO se muestra cuando es_promo=true
  - Test: Badge AGOTADO se muestra cuando stock=0

- [ ] src/components/__tests__/Navigation.test.tsx
  - Test: Muestra 5 tabs en mobile
  - Test: Badge del carrito muestra cantidad correcta
  - Test: Click en tab cambia de vista
```

### 3.5 Tests de Integración - Flujo de Compra
```
Archivos a crear:
- [ ] src/__tests__/checkout-flow.test.tsx
  - Test: Flujo completo agregar → checkout → pedido creado
  - Test: Cupón se aplica y descuenta correctamente
  - Test: Envío gratis se aplica para productos con delivery_gratis
  - Test: Cambio USD/BS funciona correctamente
  - Test: Método de pago se selecciona correctamente
```

### 3.6 Verificación
```bash
# Ejecutar todos los tests
npm run test

# Ejecutar con cobertura
npm run test:coverage

# Ejecutar lint
npm run lint

# Ejecutar typecheck
npm run lint  # (tsc --noEmit)
```

---

## 4. FASE 2: CONVERSIÓN Y CHECKOUT
**Duración:** Semana 3-4
**Objetivo:** Aumentar tasa de completado del checkout de ~30% a 55%+

### 4.1 Guest Checkout (CRÍTICO)
**Problema actual:** Paso 3 obliga a registrarse o loguearse ANTES de pagar.
**Solución:** Permitir pedido con solo teléfono, registrar DESPUÉS.

```
Archivos a modificar:
- [ ] src/pages/Checkout.tsx
  - Eliminar tab "Nuevo Cliente / Ya tengo cuenta"
  - Campo único: Teléfono (obligatorio)
  - Campo opcional: Nombre
  - Checkbox: "Crear cuenta con estos datos" (default: checked)
  - Solo pedir contraseña DESPUÉS del pedido exitoso

- [ ] src/types/store.ts
  - Agregar campo: guest_phone?: string en Order

- [ ] src/store/AppContext.tsx
  - Modificar createOrder para aceptar pedidos guest
  - Auto-crear usuario después del pedido si checkbox activo
```

**Flujo nuevo:**
```
 Checkout (1 página)
 ├── 📍 Tu ubicación (Mapa Leaflet)
 ├── 📱 Tu teléfono (1 campo obligatorio)
 ├── 💳 Método de pago
 ├── 📋 Resumen del pedido
 └── [🟢 ENVIAR PEDIDO]
      └── Si no tiene cuenta → Auto-crear con teléfono
```

### 4.2 Checkout de 1 Página
**Problema actual:** 3 pasos separados (Carrito → Envío → Pago).
**Solución:** Una sola página scrollable con todo visible.

```
Archivos a modificar:
- [ ] src/pages/Checkout.tsx → Reescribir completamente
  - Eliminar wizard de 3 pasos
  - Layout de 1 página con secciones colapsables
  - Resumen del carrito siempre visible arriba
  - Mapa inline (no en paso separado)
  - Pago integrado al final
  - Botón CTA fijo en bottom mobile

- [ ] src/components/CheckoutSummary.tsx → NUEVO
  - Resumen compacto del carrito
  - Subtotal, envío, total
  - Siempre visible durante scroll

- [ ] src/components/LocationPicker.tsx → NUEVO (extraer de Checkout)
  - Mapa Leaflet inline
  - Detección de zona automática
  - Costo de envío calculado en vivo
```

### 4.3 ETA en Product Cards
**Problema actual:** No se muestra tiempo estimado de entrega.
**Solución:** Mostrar "~25-35 min" en cada ProductCard.

```
Archivos a modificar:
- [ ] src/components/ProductCard.tsx
  - Agregar badge de tiempo: "~25 min"
  - Agregar costo de envío: "$1.50 envío"
  - Agregar badge social: "👥 127 pedidos"

- [ ] src/types/store.ts
  - Agregar campo: estimated_prep_time?: number (minutos) en FoodItem
  - Agregar campo: order_count?: number en FoodItem

- [ ] src/pages/Admin.tsx (sección productos)
  - Agregar campo "Tiempo de preparación (min)" en editor
  - Agregar campo "Contador de pedidos" (auto-incrementado)
```

### 4.4 Upselling Inteligente en Carrito
**Problema actual:** Solo se muestran agregados al personalizar producto.
**Solución:** Sugerencias contextuales en carrito y checkout.

```
Archivos a crear:
- [ ] src/components/CartUpsell.tsx → NUEVO
  - "¿Agregá una bebida por $1.50?" (si no hay bebidas en carrito)
  - "¿Completá tu combo con papas por $2?" (si solo hay hamburguesa)
  - Lógica: Analizar carrito → sugerir categoría faltante

Archivos a modificar:
- [ ] src/pages/Checkout.tsx (o nuevo componente)
  - Insertar <CartUpsell /> después del resumen del carrito
```

### 4.5 Reordenar con 1 Tap
**Problema actual:** No hay forma rápida de repetir un pedido.
**Solución:** Botón "Reordenar" en historial + "Tu favorito" en Home.

```
Archivos a crear:
- [ ] src/components/ReorderButton.tsx → NUEVO
  - Toma un Order completo
  - Agrega todos los items al carrito
  - Navega al checkout

Archivos a modificar:
- [ ] src/pages/UserProfile.tsx (sección historial)
  - Agregar botón "🔄 Reordenar" en cada pedido del historial
  - Al presionar: agregar items al carrito + navegar a checkout

- [ ] src/pages/Home.tsx
  - Sección "Tu Pedido Favorito" (basado en historial)
  - Mostrar último pedido del usuario
  - Botón "Reordenar esto" prominente
```

### 4.6 Carrito Persistente por Usuario
**Problema actual:** Carrito en localStorage se pierde entre dispositivos.
**Solución:** Sincronizar carrito con Supabase por usuario.

```
Archivos a modificar:
- [ ] src/store/AppContext.tsx
  - Agregar tabla Supabase: user_carts
  - Sincronizar carrito al login/logout
  - Merge de carritos si hay guest → login

- [ ] schema_definitivo.sql
  - Agregar tabla:
    CREATE TABLE user_carts (
      user_id UUID REFERENCES users(id),
      cart_data JSONB,
      updated_at TIMESTAMP DEFAULT NOW()
    );
```

---

## 5. FASE 3: ENGAGEMENT Y RETENCIÓN
**Duración:** Semana 5-6
**Objetivo:** Convertir compradores únicos en clientes recurrentes

### 5.1 Sistema de Calificaciones y Reviews
**Problema actual:** No hay estrellas ni comentarios en productos.
**Solución:** Estrellas + texto + "X personas pidieron esto".

```
Archivos a crear:
- [ ] src/components/StarRating.tsx → NUEVO
  - Componente de estrellas interactivo (1-5)
  - Solo usuarios con pedido pueden calificar

- [ ] src/components/ProductReviews.tsx → NUEVO
  - Lista de reviews de un producto
  - Promedio de estrellas
  - Formulario para dejar review

- [ ] src/types/store.ts
  - Agregar interfaz:
    export interface ProductReview {
      id: string;
      product_id: string;
      user_id: string;
      user_name: string;
      rating: number; // 1-5
      comment?: string;
      created_at: string;
    }

- [ ] schema_definitivo.sql
  - Agregar tabla:
    CREATE TABLE product_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID REFERENCES food_items(id),
      user_id UUID REFERENCES users(id),
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

Archivos a modificar:
- [ ] src/store/AppContext.tsx
  - Agregar funciones: addReview, getProductReviews, getProductRating

- [ ] src/components/ProductCard.tsx
  - Mostrar promedio de estrellas debajo del nombre
  - Mostrar cantidad de reviews

- [ ] src/App.tsx (modal de producto)
  - Agregar sección "Reviews" al final del modal
  - Agregar botón "Calificar este producto" post-compra
```

### 5.2 Badges de Social Proof
**Problema actual:** No hay indicadores de popularidad.
**Solución:** Badges visibles que generan confianza.

```
Archivos a modificar:
- [ ] src/components/ProductCard.tsx
  - Badge: "👥 127 pedidos" (order_count)
  - Badge: "⭐ 4.8" (rating promedio)
  - Badge: "🔥 Más pedido esta semana"

- [ ] src/pages/Home.tsx
  - Sección "Lo que todos piden" (top 5 por order_count)
  - Badge: "⚡ Vendiendo rápido" (productos con stock bajo)
```

### 5.3 Badges de Urgencia y Escasez
**Problema actual:** No hay elementos de urgencia.
**Solución:** Badges que generan FOMO (Fear of Missing Out).

```
Archivos a modificar:
- [ ] src/components/ProductCard.tsx
  - Badge: "¡Solo quedan 3!" (cuando stock < 5)
  - Badge: "⏰ Oferta termina en 2h" (para promos con fecha fin)

- [ ] src/types/store.ts
  - Agregar campo: promo_end_date?: string en FoodItem
  - Agregar campo: stock_alert_threshold?: number en StoreConfig

- [ ] src/pages/Admin.tsx (editor de productos)
  - Agregar campo "Fecha fin de promo" en editor
  - Agregar campo "Umbral de alerta de stock"
```

### 5.4 Push Notifications Inteligentes
**Problema actual:** Solo push para status de pedidos.
**Solución:** Push segmentadas para promos (máx 3/semana).

```
Archivos a crear:
- [ ] src/components/PromoPushSender.tsx → Componente Admin
  - Selector de audiencia: Todos / Por categoría / Por usuario
  - Template: "Tu {producto_favorito} está en 2x1 hoy"
  - Limitar a 3 push por semana por usuario
  - Programar push para hora pico (11am-1pm, 6pm-8pm)

Archivos a modificar:
- [ ] src/pages/Admin.tsx (sección notificaciones)
  - Agregar "Push Promocional" como tipo de notificación
  - Agregar scheduling de push
  - Agregar límite automático de 3/semana

- [ ] src/store/AppContext.tsx
  - Agregar función: sendPromoPush
  - Agregar tracking de pushes enviadas por usuario/semana
```

### 5.5 Timer de Ofertas Flash
**Problema actual:** No hay ofertas temporales.
**Solución:** Sección de ofertas con countdown timer.

```
Archivos a crear:
- [ ] src/components/FlashSaleTimer.tsx → NUEVO
  - Countdown timer visual (horas:min:seg)
  - Solo se muestra cuando hay promo activa con fecha fin
  - Estilo urgente: rojo, parpadeante

- [ ] src/types/store.ts
  - Agregar interfaz:
    export interface FlashSale {
      id: string;
      product_id: string;
      discount_percent: number;
      end_date: string;
      max_quantity?: number;
      sold_quantity: number;
    }

- [ ] schema_definitivo.sql
  - Agregar tabla:
    CREATE TABLE flash_sales (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID REFERENCES food_items(id),
      discount_percent INTEGER NOT NULL,
      end_date TIMESTAMP NOT NULL,
      max_quantity INTEGER,
      sold_quantity INTEGER DEFAULT 0,
      active BOOLEAN DEFAULT true
    );

Archivos a modificar:
- [ ] src/pages/Home.tsx
  - Agregar sección "⏰ Oferta Flash" antes de categorías
  - Solo visible si hay flash_sale activa

- [ ] src/pages/Admin.tsx
  - Agregar gestión de Flash Sales en sección de productos
```

---

## 6. FASE 4: REFACTOR ADMIN WHITE LABEL
**Duración:** Semana 7-8
**Objetivo:** Admin modular, mantenible, 100% auto-gestionable

### 6.1 Descomponer Admin.tsx (3,777 líneas → 15+ componentes)

**Estructura actual:**
```
src/pages/Admin.tsx (3,777 líneas)
├── SedeForm (interno)
├── ExtrasManager (interno)
└── Admin (principal, 70+ useState)
```

**Estructura objetivo:**
```
src/pages/admin/
├── index.tsx                    → Admin principal (routing de secciones)
├── AdminHeader.tsx              → Header con toggle tienda, tasa BCV
├── AdminSidebar.tsx             → Sidebar de navegación
├── sections/
│   ├── DashboardSection.tsx     → KPIs y gráficas Recharts
│   ├── OrdersSection.tsx        → Cola de pedidos + status
│   ├── ProductsSection.tsx      → CRUD productos + import/export
│   ├── MesasSection.tsx         → Grid visual de mesas
│   ├── CustomersSection.tsx     → Lista de clientes
│   ├── CouponsSection.tsx       → CRUD cupones
│   ├── NotificationsSection.tsx → Centro de notificaciones/chat
│   └── SettingsSection.tsx      → Configuración general
├── components/
│   ├── OrderCard.tsx            → Card de pedido individual
│   ├── OrderTimeline.tsx        → Timeline de status
│   ├── ProductForm.tsx          → Formulario crear/editar producto
│   ├── ZoneEditor.tsx           → Editor de zonas de delivery
│   ├── SedeForm.tsx             → Formulario de sedes
│   ├── BrandingEditor.tsx       → Editor de colores/logo
│   ├── PaymentConfig.tsx        → Config de métodos de pago
│   └── PushNotificationSender.tsx → Envío de push promocional
└── hooks/
    ├── useOrders.ts             → Lógica de pedidos
    ├── useProducts.ts           → Lógica de productos
    ├── useDashboard.ts          → Lógica de reportes
    └── useNotifications.ts      → Lógica de notificaciones
```

### 6.2 Lazy Loading por Sección
```
Archivos a modificar:
- [ ] src/pages/admin/index.tsx
  - React.lazy() para cada sección
  - Suspense con loading spinner
  - Solo cargar sección cuando se selecciona

Ejemplo:
const DashboardSection = React.lazy(() => import('./sections/DashboardSection'));
const OrdersSection = React.lazy(() => import('./sections/OrdersSection'));
```

### 6.3 Extraer Estado a Zustand (Parcial)
```
Archivos a crear:
- [ ] src/store/adminStore.ts → Zustand store para admin
  - Secciones de admin (activeSection)
  - Filtros de pedidos (orderFilter)
  - Estado del sidebar (sidebarOpen)

- [ ] src/store/cartStore.ts → Zustand store para carrito
  - Items del carrito
  - Persistencia en localStorage + Supabase

Archivos a modificar:
- [ ] src/store/AppContext.tsx
  - Mantener solo estado global de app
  - Mover carrito a cartStore
  - Mover estado admin a adminStore
```

---

## 7. FASE 5: PWA NATIVA
**Duración:** Semana 9-10
**Objetivo:** Experiencia indistinguible de app nativa

### 7.1 Optimización de Manifest
```
Archivos a modificar:
- [ ] vite.config.ts → manifest dinámico desde Supabase
  - name: config.site_nombre
  - short_name: config.site_nombre (máx 12 chars)
  - theme_color: config.theme_color
  - icons: logo del admin

- [ ] public/manifest.json → Generado dinámicamente
  - Agregar shortcuts:
    - "Hacer Pedido" → /catalog
    - "Mis Pedidos" → /profile
    - "Carrito" → /checkout
  - Agregar screenshots para install prompt
```

### 7.2 Splash Screen Premium
```
Archivos a crear:
- [ ] src/components/SplashScreen.tsx → NUEVO
  - Animación de carga con logo
  - Transición suave al contenido
  - Solo se muestra la primera vez

Archivos a modificar:
- [ ] src/App.tsx
  - Agregar SplashScreen antes del contenido
  - Detectar si es primera visita
```

### 7.3 Bottom Sheet Nativo (Mobile)
```
Archivos a crear:
- [ ] src/components/BottomSheet.tsx → NUEVO
  - Componente tipo app nativa
  - Swipe down para cerrar
  - Backdrop blur
  - Para: detalles de producto, checkout, filtros

Archivos a modificar:
- [ ] src/App.tsx (modal de producto)
  - Reemplazar modal por BottomSheet en mobile

- [ ] src/pages/Catalog.tsx
  - Filtros en BottomSheet en mobile
```

### 7.4 Pull to Refresh
```
Archivos a crear:
- [ ] src/components/PullToRefresh.tsx → NUEVO
  - Detección de pull down
  - Animación de refresh
  - Recargar datos desde Supabase

Archivos a modificar:
- [ ] src/pages/Home.tsx
  - Envolver contenido en PullToRefresh

- [ ] src/pages/Catalog.tsx
  - Envolver contenido en PullToRefresh
```

### 7.5 Gestos Nativos
```
Archivos a crear:
- [ ] src/hooks/useSwipeGesture.ts → NUEVO
  - Swipe left/right para navegar
  - Swipe up en BottomSheet para expandir

Archivos a modificar:
- [ ] src/pages/Home.tsx
  - Swipe left/right para cambiar banners

- [ ] src/components/ProductCard.tsx
  - Swipe left para agregar al carrito rápido
```

### 7.6 Haptic Feedback Mejorado
```
Archivos a modificar:
- [ ] src/store/AppContext.tsx
  - Agregar haptic patterns:
    - addToCart: [50ms] (corto)
    - orderConfirmed: [100ms, 50ms, 100ms] (doble pulso)
    - error: [200ms] (largo)
    - swipe: [30ms] (muy corto)
```

### 7.7 Offline First
```
Archivos a modificar:
- [ ] vite.config.ts → workbox config
  - Agregar cache de catálogo completo
  - Agregar cache de imágenes de productos
  - Agregar cache de configuración de tienda
  - Página offline personalizada

- [ ] src/components/OfflineBanner.tsx → NUEVO
  - Banner fijo cuando no hay conexión
  - "Modo offline - Los pedidos se enviarán cuando vuelva la conexión"
```

---

## 8. FASE 6: UI/UX PREMIUM
**Duración:** Semana 11-12
**Objetivo:** Experiencia visual de nivel Uber Eats/DoorDash

### 8.1 Home Page Rediseñada
```
Estructura optimizada para conversión:

┌─────────────────────────────────────────┐
│  HEADER (fijo)                          │
│  [Logo] [🔍 Buscar...] [🛒][👤]       │
├─────────────────────────────────────────┤
│  STATUS BAR                             │
│  🟢 ABIERTO · ~25 min · $1.50 envío    │
├─────────────────────────────────────────┤
│  HERO BANNER (rotativo, 5s)             │
│  "Hoy: 2x1 en Hamburguesas"            │
│  [Ordenar Ahora →]                      │
├─────────────────────────────────────────┤
│  PEDIDO RÁPIDO (si usuario logueado)    │
│  "Tu favorito: Smash Clásica"           │
│  [🔄 Reordenar · $7.50]                │
├─────────────────────────────────────────┤
│  CATEGORÍAS (scroll horizontal)         │
│  🍔 🍕 🍗 🍟 🥤 🍰 🎁 🥗           │
├─────────────────────────────────────────┤
│  🔥 MÁS PEDIDOS (con badges)           │
│  [Card] [Card] [Card] [Card]           │
│  👥127  ⭐4.8  ~25min                  │
├─────────────────────────────────────────┤
│  ⏰ OFERTA FLASH (timer)               │
│  [Producto] $9.50 → $6.50              │
│  ⏰ 02:15:33 restantes                 │
├─────────────────────────────────────────┤
│  🍔 HAMBURGUESAS                        │
│  [Card] [Card] [Card] [Card]           │
├─────────────────────────────────────────┤
│  🍕 PIZZAS                              │
│  [Card] [Card] [Card] [Card]           │
├─────────────────────────────────────────┤
│  📱 INSTALA LA APP                      │
│  [Botón: Descargar App]                │
├─────────────────────────────────────────┤
│  🎉 ¿PEDIDO PARA EVENTO?               │
│  [Solicitar Cotización]                │
├─────────────────────────────────────────┤
│  FOOTER                                 │
│  Dirección · Horario · Contacto        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  BOTÓN FLotante (bottom)               │
│  🛒 Ver Carrito · 3 items · $16.50     │
└─────────────────────────────────────────┘
```

### 8.2 ProductCard Rediseñado
```
┌──────────────────────────────┐
│  [Imagen]                    │
│  🔥 PROMO                    │
│  👥 127 pedidos              │
│                    [+ ]      │
├──────────────────────────────┤
│  Smash Clásica               │
│  ⭐⭐⭐⭐⭐ (42)             │
│  ~25 min · $1.50 envío       │
│  ─────────────────────       │
│  $7.50            [Pedir]    │
└──────────────────────────────┘

Elementos clave:
- Imagen grande (4:3 ratio)
- Badges: PROMO/NUEVO/TOP/AGOTADO
- Badge social: "👥 127 pedidos"
- Badge rating: "⭐ 4.8"
- Badge ETA: "~25 min"
- Badge costo envío: "$1.50 envío"
- Botón [+] para quick-add
- Botón [Pedir] para detalle
```

### 8.3 Checkout Rediseñado (1 Página)
```
┌─────────────────────────────────────────┐
│  🛒 TU PEDIDO (3 items)           [editar]│
│  ─────────────────────────────────────  │
│  Smash Clásica x2           $15.00     │
│  + Extra Queso              +$1.50     │
│  Papas Fritas x1            $3.00      │
│  ─────────────────────────────────────  │
│  Subtotal:                   $19.50    │
├─────────────────────────────────────────┤
│  📍 ¿DÓNDE LO LLEVAMOS?                │
│  ┌─────────────────────────────────┐   │
│  │      [Mapa Leaflet inline]      │   │
│  │   📍 Tu ubicación marcada       │   │
│  └─────────────────────────────────┘   │
│  Zona: Las Acacias · 2.3 km            │
│  Envío: $1.50                          │
├─────────────────────────────────────────┤
│  📱 TU TELÉFONO                        │
│  [+58 412-xxxx] (obligatorio)          │
│  ☑ Crear cuenta con estos datos        │
├─────────────────────────────────────────┤
│  💳 MÉTODO DE PAGO                     │
│  [Pago Móvil Bs] [Zelle] [Efectivo]   │
│  [Transferencia]                       │
│  ─────────────────────────────────────  │
│  📋 Instrucciones:                     │
│  Banesco (0134) - RIF J-xxx            │
│  Calcular: 975.00 Bs                  │
├─────────────────────────────────────────┤
│  📋 RESUMEN FINAL                      │
│  Productos:          $19.50            │
│  Envío:               $1.50            │
│  ─────────────────────────────────────  │
│  TOTAL:             $21.00             │
│                  1,050.00 Bs           │
├─────────────────────────────────────────┤
│  [🟢 PROCESAR Y ENVIAR WHATSAPP]       │
│         (botón fijo, full-width)        │
└─────────────────────────────────────────┘
```

### 8.4 Transiciones y Animaciones
```
Archivos a modificar:
- [ ] src/index.css
  - Agregar animaciones:
    - slide-up (para modales)
    - fade-in (para contenido)
    - scale-in (para botones)
    - shimmer (para loading)

- [ ] src/components/BottomSheet.tsx
  - Animación de apertura/cierre
  - Spring physics para swipe

- [ ] src/components/ProductCard.tsx
  - Hover effect: scale 1.02 + shadow
  - Tap effect: scale 0.98
  - Add to cart: animación de vuelo al carrito
```

### 8.5 Skeleton Loading
```
Archivos a crear:
- [ ] src/components/SkeletonCard.tsx → NUEVO
  - Skeleton loader para ProductCard
  - Animación shimmer

- [ ] src/components/SkeletonGrid.tsx → NUEVO
  - Grid de skeletons para catálogo

Archivos a modificar:
- [ ] src/pages/Home.tsx
  - Mostrar skeletons mientras carga

- [ ] src/pages/Catalog.tsx
  - Mostrar skeletons mientras carga
```

---

## 9. REGLAMENTO ADMIN - AUTOGESTIÓN TOTAL

### 9.1 Panel de Configuración Completo
**TODO configurable desde el admin:**

| Sección | Campos Editables |
|---------|-----------------|
| **Marca** | Nombre tienda, logo, favicon, colores (primario, secundario, acento), mensaje bienvenida |
| **Contacto** | Teléfono soporte, dirección física, horario, coordenadas GPS |
| **Delivery** | Habilitar/deshabilitar, costo por km, delivery gratis, zonas, costo nacional |
| **Pagos** | Pago Móvil (habilitar, datos, descuento), Zelle, Efectivo, Transferencia |
| **Cambio** | Tasa USD/BS (manual o auto de BCV) |
| **Tienda** | Abrir/cerrar tienda, tiene mesas, total mesas |
| **Categorías** | Agregar/renombrar/eliminar categorías |
| **Notificaciones** | Push webhook URL, push webhook secret, VAPID keys |
| **Admin** | Cambiar email/password admin |

### 9.2 Gestión de Productos (100% Auto)
```
El admin puede:
- [x] Crear producto con nombre, descripción, precio, categoría
- [x] Subir imágenes (auto-comprimidas a Supabase Storage)
- [x] Agregar opciones/tamaños con precios extra
- [x] Agregar ingredientes (quitar/poner)
- [x] Marcar como PROMO/NUEVO/TOP/AGOTADO
- [x] Establecer stock y umbral de alerta
- [x] Establecer tiempo de preparación
- [x] Agregar productos relacionados
- [x] Importar/exportar CSV
- [x] Búsqueda por voz
- [x] Eliminar producto (con confirmación)
```

### 9.3 Gestión de Pedidos (100% Auto)
```
El admin puede:
- [x] Ver cola de pedidos en tiempo real
- [x] Cambiar status: Pendiente → Procesando → En preparación → Listo → En camino → Entregado
- [x] Cancelar pedido
- [x] Establecer tiempo estimado de entrega
- [x] Editar items del pedido
- [x] Imprimir ticket
- [x] Enviar WhatsApp al cliente
- [x] Filtrar por status
- [x] Ver historial de cambios de status
```

### 9.4 Gestión de Cupones (100% Auto)
```
El admin puede:
- [x] Crear cupón con código único
- [x] Establecer descuento (% o monto fijo)
- [x] Límite de usos
- [x] Fecha de expiración
- [x] Activar/desactivar
- [x] Ver uso actual vs límite
```

### 9.5 Gestión de Zonas (100% Auto)
```
El admin puede:
- [x] Crear zona con nombre
- [x] Establecer costo por zona
- [x] Definir rango km (min/max)
- [x] Editar/eliminar zona
- [x] Activar envío nacional
- [x] Establecer costo nacional
```

### 9.6 Gestión de Sedes (100% Auto)
```
El admin puede:
- [x] Crear sede con nombre, dirección, teléfono
- [x] Establecer coordenadas GPS
- [x] Establecer horario
- [x] Marcar como principal
- [x] Activar/desactivar sede
- [x] Editar/eliminar sede
```

### 9.7 Reportes (100% Auto)
```
El admin puede ver:
- [x] Ventas hoy/semana/mes
- [x] Pedidos activos
- [x] Ingresos USD/BS
- [x] Productos más vendidos
- [x] Gráfica de ventas diarias
- [x] Uso de cupones
- [x] Comparación mensual
- [x] Exportar datos a CSV
```

### 9.8 Centro de Notificaciones y Promociones (100% Auto)
```
El admin puede:
- [x] Enviar notificación a todos los usuarios
- [x] Enviar notificación personalizada a usuario específico
- [x] Adjuntar imagen promocional
- [x] Adjuntar link de destino
- [x] Vincular a producto específico (al tocar, abre el producto)
- [x] Ver historial completo de notificaciones enviadas
- [x] Enviar push promocional (máx 3/semana por usuario)
```

### 9.9 Gestión de Promociones (100% Auto) ← NUEVO
```
El admin puede crear, editar y eliminar promociones completas:

PROMOCIÓN = Notificación + Cupón + Producto vinculado + Programación

Campos editables de cada promoción:
- [x] Título de la promoción (ej: "2x1 en Hamburguesas")
- [x] Mensaje descriptivo (ej: "Hoy martes, lleva 2 hamburguesas por el precio de 1")
- [x] Imagen promocional (subir a Supabase Storage)
- [x] Producto vinculado (selector del catálogo)
- [x] Tipo de descuento: Porcentaje / Monto fijo / 2x1 / Combo
- [x] Valor del descuento (ej: 20%, $3, etc.)
- [x] Código de cupón asociado (auto-generado o manual)
- [x] Fecha de inicio
- [x] Fecha de fin
- [x] Hora de inicio (opcional, para horarios pico)
- [x] Hora de fin (opcional)
- [x] Segmentación de audiencia:
    - Todos los usuarios
    - Solo usuarios con pedidos previos
    - Solo usuarios nuevos (sin pedidos)
    - Por categoría favorita del usuario
    - Por zona de entrega
- [x] Canal de envío:
    - Push notification (aparece en notificaciones del teléfono)
    - Notificación in-app (aparece en el centro de notificaciones)
    - Ambos
- [x] Programación: Enviar ahora / Programar para fecha/hora
- [x] Límite de usos del cupón asociado
- [x] Estado: Borrador / Programada / Activa / Finalizada / Pausada
- [x] Estadísticas: impresiones, clics, usos, conversiones

Flujo de creación:
1. Admin crea promoción con todos los campos
2. Admin selecciona audiencia y canal
3. Admin elige: "Enviar ahora" o "Programar"
4. Sistema envía push/notificación automáticamente
5. Cliente recibe notificación con imagen + título
6. Al tocar → se abre producto con cupón pre-aplicado
7. Admin ve estadísticas de la promoción en tiempo real

Archivos a crear:
- [ ] src/pages/admin/sections/PromotionsSection.tsx → Gestión completa
- [ ] src/pages/admin/components/PromotionForm.tsx → Formulario crear/editar
- [ ] src/pages/admin/components/PromotionCard.tsx → Card de vista previa
- [ ] src/pages/admin/components/PromotionStats.tsx → Estadísticas en vivo
- [ ] src/components/PromotionBanner.tsx → Banner en Home (promo activa)
- [ ] src/components/PromotionNotification.tsx → Notificación push con imagen

- [ ] schema_definitivo.sql
  - Agregar tabla:
    CREATE TABLE promotions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      image_url TEXT,
      product_id UUID REFERENCES food_items(id),
      discount_type TEXT NOT NULL, -- 'percent', 'fixed', '2x1', 'combo'
      discount_value NUMERIC(10,2),
      coupon_code TEXT,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP NOT NULL,
      start_time TIME,
      end_time TIME,
      audience TEXT DEFAULT 'all', -- 'all', 'returning', 'new', 'by_category', 'by_zone'
      audience_config JSONB,
      channel TEXT DEFAULT 'both', -- 'push', 'in_app', 'both'
      status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'active', 'finished', 'paused'
      scheduled_at TIMESTAMP,
      sent_at TIMESTAMP,
      max_uses INTEGER,
      current_uses INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

Archivos a modificar:
- [ ] src/store/AppContext.tsx
  - Agregar funciones:
    - addPromotion(promotion)
    - updatePromotion(id, updates)
    - deletePromotion(id)
    - getActivePromotions()
    - sendPromotion(promotionId)
    - trackPromotionEvent(promotionId, event) -- 'impression', 'click', 'conversion'

- [ ] src/pages/Home.tsx
  - Agregar sección "Promociones Activas" (banners promocionales)
  - Mostrar solo promociones con status='active' y dentro de rango de fechas

- [ ] src/pages/Admin.tsx (nueva sección)
  - Agregar pestaña "Promociones" en el sidebar
  - CRUD completo de promociones
  - Estadísticas en vivo por promoción
  - Botón "Enviar ahora" / "Programar"
  - Vista previa antes de enviar

- [ ] src/components/PushNotificationModal.tsx
  - Cuando usuario toca push de promo → abrir producto con cupón pre-aplicado
  - Detectar si es promo y aplicar descuento automáticamente
```

### 9.10 Configuración de Tienda (100% Auto) ← EXPANDIDO
```
El admin puede editar CADA DETALLE de la tienda:

IDENTIDAD DE MARCA:
- [x] Nombre de la tienda
- [x] Logo (subir imagen a Supabase Storage)
- [x] Favicon
- [x] Color primario (theme_color)
- [x] Color secundario
- [x] Color de acento
- [x] Mensaje de bienvenida
- [x] Descripción de la tienda

CONTACTO:
- [x] Teléfono de soporte (WhatsApp)
- [x] Dirección física
- [x] Coordenadas GPS (lat/lng)
- [x] Horario de atención (Lun-Sáb, Dom)
- [x] Correo de contacto

ENTREGA:
- [x] Habilitar/deshabilitar delivery
- [x] Tipo de entrega: Por metros / Por zonas / Ambos
- [x] Costo por kilómetro (si es por distancia)
- [x] Delivery gratis (toggle global)
- [x] Costo fijo de envío
- [x] Zonas de delivery (CRUD con nombre, costo, rango km)
- [x] Envío nacional (toggle + costo)
- [x] Recogida en local (toggle)
- [x] Tiempo estimado de preparación (minutos)

MÉTODOS DE PAGO:
- [x] Pago Móvil: habilitar, datos bancarios, descuento %
- [x] Zelle: habilitar, email, descuento %
- [x] Efectivo: habilitar, instrucciones, descuento %
- [x] Transferencia: habilitar, datos bancarios, descuento %

TIENDA:
- [x] Abrir/cerrar tienda (toggle)
- [x] Tiene mesas (toggle)
- [x] Total de mesas
- [x] Tasa de cambio USD/BS (manual o auto BCV)

CATEGORÍAS:
- [x] Agregar categoría
- [x] Renombrar categoría
- [x] Eliminar categoría
- [x] Reordenar categorías (drag & drop)

ADMIN:
- [x] Cambiar email de administrador
- [x] Cambiar contraseña de administrador
- [x] Exportar backup de configuración (JSON)
- [x] Importar configuración desde backup

NOTIFICACIONES/WEBHOOK:
- [x] Push webhook URL
- [x] Push webhook secret
- [x] VAPID public key
- [x] VAPID private key
```

---

## 10. MÉTRICAS DE ÉXITO

### Métricas de Conversión
| Métrica | Actual (est.) | Target | Impacto |
|---------|--------------|--------|---------|
| Checkout completion rate | ~30% | 55%+ | +83% ventas |
| Abandoned cart rate | ~70% | <45% | -36% pérdida |
| Tiempo medio checkout | ~3 min | <1 min | -67% fricción |
| Guest checkout usage | 0% | 40%+ | +acceso |

### Métricas de Engagement
| Métrica | Actual (est.) | Target | Impacto |
|---------|--------------|--------|---------|
| Reorder rate | 0% | 25%+ | +frecuencia |
| Reviews por producto | 0 | 10+ prom | +confianza |
| Push notification CTR | N/A | 8%+ | +retención |
| Tiempo en app | ~2 min | 5+ min | +descubrimiento |

### Métricas de Ticket
| Métrica | Actual (est.) | Target | Impacto |
|---------|--------------|--------|---------|
| Ticket promedio | $X | +15-20% | +upselling |
| Items por pedido | ~2 | 2.5+ | +cross-sell |
| Uso de cupones | ~5% | 15%+ | +conversión |

### Métricas Técnicas
| Métrica | Actual (est.) | Target | Impacto |
|---------|--------------|--------|---------|
| Lighthouse Performance | ~70 | 90+ | +velocidad |
| Lighthouse PWA | ~80 | 95+ | +instalación |
| Bundle Size | ~700KB | <400KB | +performance |
| Test Coverage | 0% | 70%+ | +calidad |
| Admin Components | 1 | 15+ | +mantenibilidad |

---

## NOTAS FINALES

### Prioridad de Implementación
1. **FASE 2 (Conversión)** → Impacto inmediato en ventas
2. **FASE 3 (Engagement)** → Retención a largo plazo
3. **FASE 5 (PWA)** → Experiencia nativa
4. **FASE 6 (UI/UX)** → Pulido visual
5. **FASE 4 (Refactor Admin)** → Mantenibilidad
6. **FASE 1 (Testing)** → Calidad (puede hacerse en paralelo)

### Decisión de Diseño
- **NO dark mode** → Daña identidad de marca
- **NO suscripciones** → Mercado venezolano no paga mensualidades
- **NO i18n** → Solo español, mercado local
- **SÍ WhatsApp** → Canal #1 en Venezuela
- **SÍ Pago Móvil/Zelle** → Métodos de pago locales

### White Label
El sistema está diseñado para que **cualquier restaurante** pueda usarlo:
- El admin configura SU marca (nombre, logo, colores)
- El admin gestiona SU catálogo
- El admin administra SUS pedidos
- El admin controla SUS zonas de delivery
- **NADA requiere intervención del desarrollador**

---

**Última actualización:** 2026-06-29
**Administrador:** sugolo28@gmail.com
**Versión del plan:** 1.0
