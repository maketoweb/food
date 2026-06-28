import React, { useEffect, useRef } from 'react';
import { Producto } from '../types/store';
import { useApp } from '../store/AppContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  type?: 'home' | 'product' | 'catalog' | 'admin';
  product?: Producto;
  filters?: {
    category?: string;
    brand?: string;
    model?: string;
    year?: string;
    engine?: string;
  };
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  type = 'home',
  product,
  filters
}) => {
  const { config } = useApp();
  const indexedDBTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const defaultTitle = `Restaurante Online Premium | ${config.site_nombre}`;
    const defaultDesc = `Pide tu comida favorita con delivery express. Hamburguesas, pastas, postres artesanales y más. Recibe en minutos.`;
    const defaultKeywords = `restaurante, foodapp, comida, delivery, hamburguesas, pastas, postres, pizza, delivery express`;
    
    let seoTitle = title;
    let seoDesc = description;
    let seoKeywords = defaultKeywords;

    if (type === 'product' && product) {
      seoTitle = `${product.nombre} | ${config.site_nombre || 'BurgerPop'}`;
      seoDesc = `Pide ${product.nombre} ${product.condicion.toLowerCase()} de la mejor calidad. Delivery express en minutos. Código: ${product.codigo}.`;
      seoKeywords = `${product.nombre}, ${product.seccion}, ${product.subseccion}, ${product.categoria}, foodapp, restaurante, delivery, ${product.marca}`;
    }

    if (type === 'catalog') {
      const { category, brand, model, year, engine } = filters || {};
      const parts = [];
      if (category) parts.push(category);
      if (brand) parts.push(brand);
      if (model) parts.push(model);
      if (year) parts.push(year);
      if (engine) parts.push(engine);

      const filterText = parts.length > 0 ? parts.join(' ') : 'Menú Completo';
      
      seoTitle = `Comprar ${filterText} | Catálogo ${config.site_nombre || 'BurgerPop'}`;
      seoDesc = `Menú de ${filterText}. Hamburguesas, pastas, pizzas, postres y más con delivery express. Pide online en ${config.site_nombre || 'nuestro restaurante'}.`;
      
      const kwParts = ['foodapp', 'restaurante', 'delivery', 'comida online'];
      if (category) kwParts.push(category.toLowerCase());
      if (brand) kwParts.push(brand.toLowerCase());
      if (model) kwParts.push(model.toLowerCase());
      seoKeywords = kwParts.join(', ');
    }

    document.title = seoTitle ? `${seoTitle} | ${config.site_nombre}` : defaultTitle;
    
    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setMeta('description', seoDesc || defaultDesc);
    setMeta('keywords', seoKeywords);
    setMeta('og:title', seoTitle || defaultTitle, 'property');
    setMeta('og:description', seoDesc || defaultDesc, 'property');
    if (type === 'product' && product) {
      setMeta('og:type', 'product', 'property');
      setMeta('og:image', product.imagen_urls[0], 'property');
    } else {
      setMeta('og:type', 'website', 'property');
      setMeta('og:image', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200', 'property');
    }

    // PWA: Guardar config en IndexedDB para manifest dinámico
    if (indexedDBTimeoutRef.current) {
      clearTimeout(indexedDBTimeoutRef.current);
    }
    indexedDBTimeoutRef.current = setTimeout(() => {
      const DB_NAME = 'foodapp-pwa';
      const DB_VERSION = 1;
      const STORE_NAME = 'config';
      const openReq = indexedDB.open(DB_NAME, DB_VERSION);
      openReq.onupgradeneeded = (e: any) => {
        e.target.result.createObjectStore(STORE_NAME);
      };
      openReq.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        if (config.logo_url) store.put(config.logo_url, 'logo_url');
        if (config.site_nombre) store.put(config.site_nombre, 'site_name');
        if (config.theme_color) store.put(config.theme_color, 'theme_color');
        
        tx.oncomplete = () => {
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            if (config.logo_url) {
              navigator.serviceWorker.controller.postMessage({
                type: 'UPDATE_LOGO_URL',
                logoUrl: config.logo_url
              });
            }
            if (config.site_nombre) {
              navigator.serviceWorker.controller.postMessage({
                type: 'UPDATE_SITE_NAME',
                siteName: config.site_nombre
              });
            }
            if (config.theme_color) {
              navigator.serviceWorker.controller.postMessage({
                type: 'UPDATE_THEME_COLOR',
                themeColor: config.theme_color
              });
            }
          }
        };
      };
    }, 500);

    // Apple Touch Icon dinámico
    const appleTouchUrl = config.logo_url || config.favicon_url || '/pwa-192x192.png';
    let appleLink = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.setAttribute('rel', 'apple-touch-icon');
      document.head.appendChild(appleLink);
    }
    appleLink.setAttribute('href', appleTouchUrl);

    if (config.favicon_url || config.logo_url) {
      let iconLink = document.querySelector('link[rel="icon"]');
      if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.setAttribute('rel', 'icon');
        document.head.appendChild(iconLink);
      }
      iconLink.setAttribute('href', config.favicon_url || config.logo_url || '/favicon.ico');
    }
    
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute('content', config.theme_color || '#FF6B35');

    let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!appleTitleMeta) {
      appleTitleMeta = document.createElement('meta');
      appleTitleMeta.setAttribute('name', 'apple-mobile-web-app-title');
      document.head.appendChild(appleTitleMeta);
    }
    appleTitleMeta.setAttribute('content', config.site_nombre || 'BurgerPop');

    // JSON-LD Schema
    const existingScript = document.getElementById('foodapp-jsonld-schema');
    if (existingScript) existingScript.remove();

    let schemaObj: any = null;

    if (type === 'home') {
      schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        'name': config.site_nombre || 'BurgerPop',
        'image': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200',
        '@id': 'https://foodapp.com.ve',
        'url': 'https://foodapp.com.ve',
        'telephone': config.telefono_soporte || '',
        'priceRange': '$$',
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': config.direccion_fisica || '',
          'addressCountry': 'VE'
        },
        'servesCuisine': ['Comida Rapida', 'Hamburguesas', 'Pastas', 'Pizzas', 'Postres'],
        'description': 'Delivery de comida premium. Pide tu plato favorito y recibe en minutos.'
      };
    } else if (type === 'product' && product) {
      schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': product.nombre,
        'image': product.imagen_urls[0],
        'description': seoDesc,
        'sku': product.codigo,
        'mpn': product.codigo,
        'brand': { '@type': 'Brand', 'name': product.marca },
        'offers': {
          '@type': 'Offer',
          'url': `https://foodapp.com.ve/catalog?search=${product.codigo}`,
          'priceCurrency': 'USD',
          'price': product.precio_usd.toFixed(2),
          'itemCondition': 'https://schema.org/NewCondition',
          'availability': product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          'seller': { '@type': 'Restaurant', 'name': config.site_nombre || 'BurgerPop' }
        },
        'category': product.categoria
      };
    } else if (type === 'catalog') {
      schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'SearchResultsPage',
        'name': `Menú ${config.site_nombre || 'BurgerPop'}`,
        'description': 'Busca y pide tu plato favorito con delivery express.'
      };
    }

    if (schemaObj) {
      const script = document.createElement('script');
      script.id = 'foodapp-jsonld-schema';
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(schemaObj);
      document.head.appendChild(script);
    }

    return () => {
      if (indexedDBTimeoutRef.current) clearTimeout(indexedDBTimeoutRef.current);
    };
  }, [title, description, type, product, filters, config.site_nombre, config.theme_color, config.logo_url, config.favicon_url]);

  return null;
};
