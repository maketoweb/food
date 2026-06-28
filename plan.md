# 🍔 FoodPop — Plan de Transformación Frontend

> **Objetivo**: Cambiar frontend completo de auto-partes a restaurante de comida (hamburguesas, pizzas, pollo, bebidas, postres) con estilo pop vibrante juvenil. Inspirado en Domino's, KFC, Odoo.

---

## Fase 1: Base y Estilo Visual

| # | Tarea | Archivos |
|---|-------|----------|
| 1.1 | Rebranding: `Producto` → `FoodItem`, eliminar `marca/modelo/año/motor/pasillo/estante/codigo` | `types/store.ts` |
| 1.2 | Nuevo CSS theme pop vibrante (neón, bounce, sombras brillantes) | `index.css` |
| 1.3 | Instalar `swiper`, `react-router-dom`, `canvas-confetti` | `package.json` |
| 1.4 | Migrar a React Router v7 (rutas: `/`, `/menu`, `/cart`, `/admin/*`, `/profile`) | `App.tsx` |
| 1.5 | Agregar Google Fonts: Space Grotesk + Fredoka One + Inter | `index.html` |

## Fase 2: Home — Estilo Domino's/KFC

| # | Tarea | Archivos |
|---|-------|----------|
| 2.1 | Hero banner carrusel full-width + CTA neón | `Home.tsx` |
| 2.2 | Categorías en carrusel horizontal con emojis | `Home.tsx` |
| 2.3 | Secciones por categoría: carrusel grid (mobile) / grid 4 cols (desktop) | `Home.tsx`, `CategoryCarousel.tsx` |
| 2.4 | Search bar flotante | `Home.tsx` |
| 2.5 | Footer restaurante | `Home.tsx` |

## Fase 3: Catálogo / Menú

| # | Tarea | Archivos |
|---|-------|----------|
| 3.1 | Catalog sin filtros auto-partes, solo categoría + búsqueda | `Catalog.tsx` |
| 3.2 | ProductCard estilo Uber Eats / Rappi | `ProductCard.tsx` |
| 3.3 | Sticky category tabs sticky | `Catalog.tsx` |

## Fase 4: Modal de Producto con Ingredientes

| # | Tarea | Archivos |
|---|-------|----------|
| 4.1 | Modal full-screen mobile con imagen | `App.tsx` |
| 4.2 | Toggle ingredientes (quitar/agregar) | `App.tsx` |
| 4.3 | Extras (radio/checkbox groups) | `ProductOptionsEditor.tsx` |
| 4.4 | Cantidad + botón Agregar | `App.tsx` |

## Fase 5: Checkout Modal

| # | Tarea | Archivos |
|---|-------|----------|
| 5.1 | Modal checkout desde carrito | Nuevo `CheckoutModal.tsx` |
| 5.2 | Resumen del pedido con ingredientes | `CheckoutModal.tsx` |
| 5.3 | Elección Delivery / Mesa | `CheckoutModal.tsx` |
| 5.4 | Formulario delivery con mapa | `CheckoutModal.tsx` |
| 5.5 | Selector de mesas (grid 1-20) | Nuevo `TableSelector.tsx` |
| 5.6 | Métodos de pago | `CheckoutModal.tsx` |
| 5.7 | Confirmación y envío (comanda a admin si mesa) | `CheckoutModal.tsx` |

## Fase 6: Admin — CRM estilo Odoo

| # | Tarea | Archivos |
|---|-------|----------|
| 6.1 | Sidebar admin con iconos | `Admin.tsx` |
| 6.2 | Dashboard con KPIs y gráficos | `Admin.tsx` |
| 6.3 | Panel de pedidos en tiempo real | `Admin.tsx` |
| 6.4 | Grid de mesas + pedidos activos | Nuevo `TableManager.tsx` |
| 6.5 | Editor de menú CRUD | `EditProductForm.tsx` |
| 6.6 | Clientes: historial de pedidos | `Admin.tsx` |
| 6.7 | Cupones CRUD | `Admin.tsx` |

## Fase 7: Navegación Mobile-First

| # | Tarea | Archivos |
|---|-------|----------|
| 7.1 | Bottom nav con 5 tabs | `Navigation.tsx` |
| 7.2 | Drawer lateral con categorías + admin | `Navigation.tsx` |

## Fase 8: Datos Semilla

Reemplazar productos con datos de restaurante:
- Hamburguesas, Pizzas, Pollo, Bebidas, Postres, Papas & Sides
- Cada producto con `ingredientes: string[]`
