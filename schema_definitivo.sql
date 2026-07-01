-- ==========================================================================
-- SCRIPT DE ESQUEMA DEFINITIVO PARA FOODPOP PWA
-- PLATAFORMA DE RESTAURANTE: Hamburguesas, Pizzas, Pollo, Bebidas, Postres
-- ESTADO: OPTIMIZADO PARA PRODUCCIÓN (VAPID + PUSH WEBHOOK)
-- ==========================================================================

-- Habilitar extensión uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Habilitar extensión para peticiones HTTP (Motor Push)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ----------------------------------------------------------------------------
-- 1. store_config
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_config (
    id SERIAL PRIMARY KEY,
    site_nombre TEXT NOT NULL DEFAULT 'FoodPop',
    telefono_soporte TEXT NOT NULL DEFAULT '+584124058904',
    direccion_fisica TEXT NOT NULL DEFAULT 'Av. Principal, Local #12, Ciudad',
    tienda_lat NUMERIC(10, 6) NOT NULL DEFAULT 10.198300,
    tienda_lng NUMERIC(10, 6) NOT NULL DEFAULT -68.004400,
    banner_url_1 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1200',
    banner_url_2 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1200',
    banner_url_3 TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200',
    zelle_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    zelle_data TEXT NOT NULL DEFAULT 'pagos@foodpop.com.ve',
    zelle_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    pagomovil_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    pagomovil_data TEXT NOT NULL DEFAULT 'Banesco (0134) - RIF J-50123456-7 - Tel: 0412-4976451',
    pagomovil_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    efectivo_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    efectivo_data TEXT NOT NULL DEFAULT 'Paga al motorizado en efectivo (USD/Bs) al recibir tu delivery',
    efectivo_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    transferencia_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    transferencia_data TEXT NOT NULL DEFAULT 'Banesco Cuenta Corriente - 0134-1122-33-4455667788 - FoodPop C.A. - RIF J-50123456-7',
    transferencia_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    tasa_cambio NUMERIC(10,2) NOT NULL DEFAULT 612.43,
    logo_url TEXT DEFAULT '',
    theme_color VARCHAR(10) NOT NULL DEFAULT '#FF2D95',
    secondary_color VARCHAR(10) DEFAULT '#FF6B35',
    accent_color VARCHAR(10) DEFAULT '#FFBE0B',
    favicon_url TEXT DEFAULT '',
    secondary_logo_url TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    categories TEXT[] DEFAULT ARRAY['Hamburguesas', 'Pizzas', 'Pollo', 'Papas & Sides', 'Bebidas', 'Postres', 'Combos', 'Entradas', 'Nuggets & Tenders']::TEXT[],
    esta_abierta BOOLEAN NOT NULL DEFAULT TRUE,
    mensaje_cierre TEXT DEFAULT 'Cerrado por ahora. Volveremos pronto.',
    mensaje_bienvenida TEXT DEFAULT 'La mejor hamburguesería con delivery express. Hamburguesas smash, pizzas artesanales, pollo, papas, postres y más.',
    tiene_mesas BOOLEAN NOT NULL DEFAULT FALSE,
    total_mesas INTEGER DEFAULT 0,
    push_webhook_url TEXT DEFAULT '',
    push_webhook_secret TEXT DEFAULT '',
    banner_texts TEXT[] DEFAULT ARRAY[]::TEXT[]
);

INSERT INTO store_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. usuarios_clientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios_clientes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE,
    telefono VARCHAR(20) UNIQUE,
    contrasena TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. food_items (antes products)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    categoria TEXT NOT NULL DEFAULT 'Hamburguesas',
    precio_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stock INTEGER NOT NULL DEFAULT 0,
    imagen_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    es_promo BOOLEAN NOT NULL DEFAULT FALSE,
    es_nuevo BOOLEAN NOT NULL DEFAULT TRUE,
    es_mas_vendido BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_gratis BOOLEAN NOT NULL DEFAULT FALSE,
    ingredientes TEXT[] DEFAULT ARRAY[]::TEXT[],
    option_groups JSONB DEFAULT '[]'::JSONB,
    related_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migrar datos desde tabla legacy food_items si existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'food_items') THEN
        INSERT INTO products (id, nombre, descripcion, categoria, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, activo)
        SELECT id, nombre, descripcion, categoria, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, activo
        FROM food_items
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3.1 food_item_options (extras / opciones por producto)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS food_item_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_item_id UUID REFERENCES products(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    min_select INTEGER NOT NULL DEFAULT 0,
    max_select INTEGER NOT NULL DEFAULT 1,
    options JSONB NOT NULL DEFAULT '[]'::JSONB
);

-- ----------------------------------------------------------------------------
-- 4. orders
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    cliente_nombre TEXT NOT NULL,
    cliente_telefono TEXT NOT NULL,
    cliente_email TEXT,
    cliente_uid TEXT,
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
    tipo_entrega VARCHAR(20) NOT NULL DEFAULT 'delivery',
    numero_mesa INTEGER,
    direccion_envio TEXT DEFAULT '',
    lat NUMERIC(10, 6),
    lng NUMERIC(10, 6),
    distancia_km NUMERIC(8, 2) DEFAULT 0,
    items JSONB DEFAULT '[]',
    subtotal_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    costo_envio_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    descuento_cupon_usd NUMERIC(10,2) DEFAULT 0.00,
    cupon_codigo TEXT,
    total_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_bs NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
    tiempo_estimado_entrega TEXT DEFAULT '',
    notas_admin TEXT DEFAULT '',
    guest_email TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices para busquedas rapidas por email y telefono
CREATE INDEX IF NOT EXISTS idx_orders_cliente_email ON orders (cliente_email) WHERE cliente_email IS NOT NULL AND cliente_email != '';
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders (guest_email) WHERE guest_email IS NOT NULL AND guest_email != '';
CREATE INDEX IF NOT EXISTS idx_orders_cliente_telefono ON orders (cliente_telefono);

-- ----------------------------------------------------------------------------
-- 4.6 push_subscriptions (SISTEMA DE NOTIFICACIONES PUSH)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth_secret TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(endpoint)
);

-- Agregar columna telefono para filtrar por destinatario (si no existe)
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS destinatario_telefono TEXT DEFAULT '';

-- Agregar columna anonymous_id para identificar dispositivos sin login
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS anonymous_id TEXT DEFAULT '';

-- Función RPC para que el admin pueda leer TODAS las suscripciones push
-- (necesario porque RLS filtra por auth.uid = user_id, aislando cada usuario)
CREATE OR REPLACE FUNCTION public.get_all_push_subscriptions()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    endpoint TEXT,
    p256dh TEXT,
    auth_secret TEXT,
    destinatario_telefono TEXT,
    anonymous_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- SECURITY DEFINER ejecuta con privilegios del creador (superusuario/service_role)
    -- que puede ver todas las filas sin filtro RLS.
    RETURN QUERY
    SELECT ps.id, ps.user_id, ps.endpoint, ps.p256dh, ps.auth_secret, ps.destinatario_telefono, ps.anonymous_id, ps.created_at
    FROM public.push_subscriptions ps;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4.5 coupons (SISTEMA DE FIDELIZACIÓN)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'todos',
    destinatario_telefono VARCHAR(20) DEFAULT '',
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    imagen_url TEXT DEFAULT '',
    link_url TEXT DEFAULT '',
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Función para incrementar el contador de clics de una notificación de forma segura
CREATE OR REPLACE FUNCTION public.increment_notification_click(notif_id TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.notifications
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = notif_id;
END;
$$;


-- ----------------------------------------------------------------------------
-- 5.5 FUNCIONES Y TRIGGERS (AUTOMATIZACIÓN)
-- ----------------------------------------------------------------------------

-- Función para sincronizar perfiles automáticamente desde Auth
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios_clientes (id, nombre, email, telefono, contrasena)
    VALUES (
        NEW.id::text,
        COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario Nuevo'),
        NEW.email,
        NULLIF(COALESCE(NEW.raw_user_meta_data->>'telefono', ''), ''),
        'auth_managed'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger de Sincronización (Ejecuta como superuser)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- Política de inserción para usuarios_clientes (Respaldo para inserción manual si se requiere)
DROP POLICY IF EXISTS "Permitir inserción anonima" ON usuarios_clientes;
CREATE POLICY "Permitir inserción anonima" ON usuarios_clientes 
FOR INSERT WITH CHECK (true);


-- Función robusta para acciones post-pedido (Stock, Cupones y Notificaciones Automáticas)
CREATE OR REPLACE FUNCTION public.handle_new_order_actions()
RETURNS TRIGGER AS $$
DECLARE
    item_json jsonb;
    v_part_id uuid;
    v_cantidad int;
    v_notif_id text;
    v_admin_phone text;
BEGIN
    FOR item_json IN SELECT jsonb_array_elements(NEW.items)
    LOOP
        BEGIN
            v_part_id := (COALESCE(item_json->>'part_id', item_json->>'id', item_json->>'producto_id'))::uuid;
            v_cantidad := (COALESCE(item_json->>'cantidad', item_json->>'quantity', item_json->>'qty'))::int;

            IF v_part_id IS NOT NULL THEN
                UPDATE public.products
                SET stock = GREATEST(0, stock - v_cantidad)
                WHERE id = v_part_id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error actualizando stock para item %: %', v_part_id, SQLERRM;
        END;
    END LOOP;

    IF NEW.cupon_codigo IS NOT NULL THEN
        UPDATE public.coupons
        SET usage_count = usage_count + 1
        WHERE code = NEW.cupon_codigo;
    END IF;

    v_notif_id := 'notif-' || encode(gen_random_bytes(6), 'hex');
    
    SELECT telefono_soporte INTO v_admin_phone FROM public.store_config WHERE id = 1;

    INSERT INTO public.notifications (
        id, 
        titulo, 
        mensaje, 
        fecha, 
        tipo, 
        destinatario_telefono, 
        leida
    ) VALUES (
        v_notif_id,
        'Nuevo Pedido: ' || NEW.id,
        'El cliente ' || NEW.cliente_nombre || ' ha realizado una compra por $' || NEW.total_usd,
        to_char(NOW(), 'DD/MM/YYYY HH24:MI'),
        'admin',
        COALESCE(v_admin_phone, ''), 
        FALSE
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Fallo crítico en trigger handle_new_order_actions: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reiniciar el trigger
DROP TRIGGER IF EXISTS trigger_order_completion ON public.orders;
CREATE TRIGGER trigger_order_completion
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_order_actions();

-- Función para notificar automáticamente cambios de estado de pedidos
CREATE OR REPLACE FUNCTION public.handle_order_status_push_update()
RETURNS TRIGGER AS $$
DECLARE
    v_notif_id text;
    v_mensaje text;
    v_admin_phone text;
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status = 'En camino' THEN
        
        v_notif_id := 'notif-status-' || encode(gen_random_bytes(6), 'hex');
        v_mensaje := '¡Buenas noticias, ' || NEW.cliente_nombre || '! Tu pedido ' || NEW.id || ' ya ha sido despachado y se dirige a tu ubicación.';

        INSERT INTO public.notifications (
            id, 
            titulo, 
            mensaje, 
            fecha, 
            tipo, 
            destinatario_telefono, 
            link_url,
            leida
        ) VALUES (
            v_notif_id,
            '¡Pedido en camino!',
            v_mensaje,
            to_char(NOW(), 'DD/MM/YYYY HH24:MI'),
            'personal',
            NEW.cliente_telefono,
            '/?tab=profile',
            FALSE
        );
    
    ELSIF (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status = 'Cancelado' THEN
        
        SELECT telefono_soporte INTO v_admin_phone FROM public.store_config WHERE id = 1;
        v_notif_id := 'notif-cancel-' || encode(gen_random_bytes(6), 'hex');
        v_mensaje := 'El pedido ' || NEW.id || ' de ' || NEW.cliente_nombre || ' ha sido cancelado.';

        INSERT INTO public.notifications (
            id, 
            titulo, 
            mensaje, 
            fecha, 
            tipo, 
            destinatario_telefono, 
            link_url,
            leida
        ) VALUES (
            v_notif_id,
            'Pedido Cancelado',
            v_mensaje,
            to_char(NOW(), 'DD/MM/YYYY HH24:MI'),
            'admin',
            COALESCE(v_admin_phone, ''),
            '/admin',
            FALSE
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador para cambios de estado en pedidos
DROP TRIGGER IF EXISTS trigger_order_status_update_push ON public.orders;
CREATE TRIGGER trigger_order_status_update_push
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_status_push_update();

-- ----------------------------------------------------------------------------
-- 5.6 FUNCIONES Y TRIGGERS DE NOTIFICACIONES PUSH (WEBHOOK A CLOUDFLARE)
-- ----------------------------------------------------------------------------

-- Asegurar que el bucket de configuración exista para evitar el error 400
INSERT INTO storage.buckets (id, name, public) 
VALUES ('settings', 'settings', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir subidas públicas al bucket settings (necesario para el logo/favicon)
DROP POLICY IF EXISTS "Permitir subida de logos al admin" ON storage.objects;
CREATE POLICY "Permitir subida de logos al admin" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'settings');

DROP POLICY IF EXISTS "Permitir lectura publica de logos" ON storage.objects;
CREATE POLICY "Permitir lectura publica de logos" ON storage.objects
FOR SELECT USING (bucket_id = 'settings');

-- Función para invocar el webhook de Cloudflare Functions con la notificación
CREATE OR REPLACE FUNCTION public.handle_new_notification_push()
RETURNS TRIGGER AS $$
DECLARE
  v_webhook_url TEXT;
  v_webhook_secret TEXT;
BEGIN
  SELECT push_webhook_url, push_webhook_secret 
  INTO v_webhook_url, v_webhook_secret 
  FROM public.store_config 
  WHERE id = 1;

  IF v_webhook_url IS NOT NULL AND v_webhook_url <> '' AND NEW.tipo IN ('todos', 'personal', 'admin', 'request') THEN
    PERFORM net.http_post(
      url := v_webhook_url,
      body := jsonb_build_object(
        'title', NEW.titulo,
        'body', NEW.mensaje,
        'icon', COALESCE(NEW.imagen_url, '/icon.png'),
        'badge', '/icon.png',
        'sound', 'default',
        'vibrate', ARRAY[200, 100, 200],
        'tag', 'marketo-' || NEW.id,
        'url', COALESCE(NEW.link_url, '/'),
        'record', jsonb_build_object(
          'id', NEW.id,
          'title', NEW.titulo,
          'body', NEW.mensaje,
          'icon', COALESCE(NEW.imagen_url, '/icon.png'),
          'tag', 'marketo-' || NEW.id,
          'renotify', true,
          'vibrate', ARRAY[200, 100, 200],
          'sound', 'default',
          'badge', '/icon.png',
          'titulo', NEW.titulo,
          'mensaje', NEW.mensaje,
          'imagen_url', COALESCE(NEW.imagen_url, ''),
          'link_url', COALESCE(NEW.link_url, '/'),
          'tipo', NEW.tipo,
          'destinatario_telefono', COALESCE(NEW.destinatario_telefono, '')
        )
      )::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-push-webhook-secret', COALESCE(v_webhook_secret, '')
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'No se pudo invocar webhook de push: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para invocar webhook al insertar notificación (después del insert)
DROP TRIGGER IF EXISTS trigger_notify_push ON public.notifications;
CREATE TRIGGER trigger_notify_push
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_notification_push();

-- ----------------------------------------------------------------------------
-- 6. POLÍTICAS RLS Y SEGURIDAD
-- ----------------------------------------------------------------------------
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Permisos base
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON store_config, products, notifications, coupons, usuarios_clientes TO anon;
GRANT SELECT, INSERT, UPDATE ON orders TO anon;
GRANT SELECT, INSERT, UPDATE ON push_subscriptions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

DO $$
DECLARE
  p_record RECORD;
BEGIN

  -- store_config
  DROP POLICY IF EXISTS "Lectura config publica" ON store_config;
  CREATE POLICY "Lectura config publica" ON store_config FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Escritura config admin" ON store_config;
  DROP POLICY IF EXISTS "Allow all updates only to admin" ON store_config;
  CREATE POLICY "Allow all updates only to admin" ON store_config 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

  -- products
  DROP POLICY IF EXISTS "Lectura productos activos" ON products;
  CREATE POLICY "Lectura productos activos" ON products
    FOR SELECT
    USING (
      activo = true
      OR (auth.jwt() ->> 'email' = 'kecho8a@gmail.com')
      OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    );

  DROP POLICY IF EXISTS "Gestion productos admin" ON products;
  DROP POLICY IF EXISTS "Allow admin changes to catalog" ON products;
  CREATE POLICY "Allow admin changes to catalog" ON products 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

  -- orders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='orders_insert_allow_anon') THEN
    DROP POLICY IF EXISTS "orders_insert_allow_anon" ON orders;
    CREATE POLICY "orders_insert_allow_anon" ON orders FOR INSERT WITH CHECK (true);
  END IF;

  DROP POLICY IF EXISTS "orders_select_own_or_admin" ON orders;
  CREATE POLICY "orders_select_own_or_admin" ON orders 
    FOR SELECT 
    USING (
      auth.uid()::text = cliente_uid 
      OR 
      (auth.jwt() ->> 'email' = 'kecho8a@gmail.com')
      OR
      (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    );

  DROP POLICY IF EXISTS "orders_update_admin" ON orders;
  CREATE POLICY "orders_update_admin" ON orders 
    FOR ALL TO authenticated 
    USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

  -- usuarios_clientes
  DROP POLICY IF EXISTS "Lectura propia" ON usuarios_clientes;
  DROP POLICY IF EXISTS "Admin lee todos los clientes" ON usuarios_clientes;
  CREATE POLICY "Admin lee todos los clientes" ON usuarios_clientes 
    FOR SELECT TO authenticated 
    USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

  DROP POLICY IF EXISTS "Cliente lee su propio perfil" ON usuarios_clientes;
  CREATE POLICY "Cliente lee su propio perfil" ON usuarios_clientes 
    FOR SELECT TO authenticated 
    USING (auth.uid()::text = id);

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='usuarios_clientes' AND policyname='Update propio') THEN
    CREATE POLICY "Update propio" ON usuarios_clientes FOR UPDATE TO authenticated USING (auth.uid()::text = id);
  END IF;

  DROP POLICY IF EXISTS "Admin gestiona todos los clientes" ON usuarios_clientes;
  CREATE POLICY "Admin gestiona todos los clientes" ON usuarios_clientes
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

  -- notifications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='notifications_insert_allow_anon') THEN
    CREATE POLICY "notifications_insert_allow_anon" ON notifications
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  DROP POLICY IF EXISTS "notifications_select_allow_all" ON notifications;
  DROP POLICY IF EXISTS "Lectura de notificaciones" ON notifications;
  CREATE POLICY "Lectura de notificaciones" ON notifications
    FOR SELECT TO anon, authenticated USING (
      tipo = 'todos'
      OR tipo = 'admin'
      OR (tipo = 'personal' AND destinatario_telefono IS NOT NULL AND destinatario_telefono != '')
      OR (tipo = 'request' AND destinatario_telefono IS NOT NULL AND destinatario_telefono != '')
    );

  DROP POLICY IF EXISTS "notifications_update_allow_all" ON notifications;
  CREATE POLICY "notifications_update_allow_all" ON notifications
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

  -- coupons
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='coupons' AND policyname='Lectura cupones publica') THEN
    CREATE POLICY "Lectura cupones publica" ON coupons FOR SELECT TO anon, authenticated USING (active = true);
  END IF;

  DROP POLICY IF EXISTS "Gestion cupones admin" ON coupons;
  CREATE POLICY "Gestion cupones admin" ON coupons 
    FOR ALL TO authenticated 
    USING (
      (auth.jwt() ->> 'email' = 'kecho8a@gmail.com')
      OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    )
    WITH CHECK (
      (auth.jwt() ->> 'email' = 'kecho8a@gmail.com')
      OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    );

  -- push_subscriptions
  ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "manage_own_push_subscriptions" ON public.push_subscriptions;
  CREATE POLICY "manage_own_push_subscriptions" ON public.push_subscriptions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

  DROP POLICY IF EXISTS "allow_anonymous_push_subscriptions" ON public.push_subscriptions;
  CREATE POLICY "allow_anonymous_push_subscriptions" ON public.push_subscriptions
    FOR INSERT TO anon WITH CHECK (user_id IS NULL);

  DROP POLICY IF EXISTS "allow_anonymous_push_update" ON public.push_subscriptions;
  CREATE POLICY "allow_anonymous_push_update" ON public.push_subscriptions
    FOR UPDATE TO anon USING (user_id IS NULL);

END $$;

-- ----------------------------------------------------------------------------
-- 7. PRODUCTOS (50 productos de hamburguesería)
-- Categorías: Hamburguesas, Pizzas, Pollo, Papas & Sides, Entradas, Combos, Bebidas, Postres
-- ----------------------------------------------------------------------------

-- HAMBURGUESAS (10 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, activo) VALUES
('Smash Clásica', 'Doble smash de carne 100% res, queso cheddar derretido, cebolla caramelizada, pickle y salsa especial de la casa.', 'Hamburguesas', 7.50, 60, ARRAY['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500'], false, false, true, false, true),
('Bacon Explosion', 'Doble carne smash, bacon crujiente, queso pepper jack, cebolla crispy y salsa BBQ ahumada.', 'Hamburguesas', 9.50, 50, ARRAY['https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=500'], true, false, true, false, true),
('Mushroom Swiss', 'Carne smash jugosa, champiñones salteados, queso suizo derretido y mayonesa de trufa.', 'Hamburguesas', 10.00, 40, ARRAY['https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&q=80&w=500'], false, true, false, false, true),
('BBQ Bacon Cheddar', 'Carne smash, bacon, cheddar derretido, aros de cebolla y salsa BBQ de la casa.', 'Hamburguesas', 8.90, 55, ARRAY['https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=500'], false, false, true, false, true),
('Veggie Burger', 'Burger de lentejas y champiñones, lechuga, tomate, aguacate y salsa de yogurt.', 'Hamburguesas', 8.50, 30, ARRAY['https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&q=80&w=500'], false, true, false, false, true),
('Smash Doble Queso', 'Doble carne smash, doble queso americano derretido, pepinillos y mostaza.', 'Hamburguesas', 8.50, 45, ARRAY['https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=500'], false, false, true, false, true),
('Crispy Chicken Burger', 'Pechuga de pollo empanizada crujiente, lechuga, tomate, mayonesa y pan tostado.', 'Hamburguesas', 8.00, 40, ARRAY['https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Hawaiian Burger', 'Carne smash, piña asada, jamón, queso suizo derretido y salsa teriyaki.', 'Hamburguesas', 9.00, 35, ARRAY['https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&q=80&w=500'], false, true, false, false, true),
('Texas BBQ Burger', 'Triple carne smash, bacon, cheddar, onion rings, jalapeños y salsa BBQ ahumada.', 'Hamburguesas', 11.00, 25, ARRAY['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500'], true, false, false, false, true),
('Burger Infantil', 'Carne smash pequeña, queso americano, papas fritas incluidas y salsa de tomate.', 'Hamburguesas', 5.50, 50, ARRAY['https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true);

-- PIZZAS (6 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, activo) VALUES
('Pizza Pepperoni', 'Pizza clásica con pepperoni, queso mozzarella y salsa de tomate casera.', 'Pizzas', 9.00, 30, ARRAY['https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=500'], false, false, true, false, true),
('Pizza Margherita', 'Pizza tradicional con mozzarella fresca, albahaca, salsa de tomate y aceite de oliva.', 'Pizzas', 8.50, 30, ARRAY['https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=500'], false, false, true, false, true),
('Pizza BBQ Chicken', 'Pizza con pollo BBQ, cebolla morada, queso mozzarella y salsa BBQ ahumada.', 'Pizzas', 10.50, 25, ARRAY['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=500'], false, true, false, false, true),
('Pizza Mexicana', 'Pizza con carne molida, jalapeños, pimientos, cebolla, nachos y queso picante.', 'Pizzas', 11.00, 20, ARRAY['https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&q=80&w=500'], false, true, false, false, true),
('Pizza Hawaiana', 'Pizza con jamón, piña, mozzarella y salsa de tomate. Dulce y salada.', 'Pizzas', 9.50, 30, ARRAY['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Pizza Vegetariana', 'Pizza con champiñones, pimientos, aceitunas, cebolla, maíz y mozzarella.', 'Pizzas', 10.00, 25, ARRAY['https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true);

-- POLLO (5 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, activo) VALUES
('Alitas BBQ x6', '6 alitas de pollo bañadas en salsa BBQ ahumada, acompañadas de papas fritas.', 'Pollo', 6.50, 40, ARRAY['https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&q=80&w=500'], false, false, true, false, true),
('Alitas Buffalo x6', '6 alitas de pollo con salsa buffalo picante, aderezo blue cheese y papas.', 'Pollo', 6.50, 40, ARRAY['https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Alitas Miel Mostaza x6', '6 alitas de pollo glaseadas con salsa miel mostaza y ajonjolí.', 'Pollo', 6.50, 40, ARRAY['https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&q=80&w=500'], false, true, false, false, true),
('Chicken Tenders x4', '4 tiras de pechuga empanizadas, crujientes por fuera y jugosas por dentro, con salsa de la casa.', 'Pollo', 7.00, 35, ARRAY['https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=500'], false, false, true, false, true),
('Pollo BBQ Asado', 'Mitad de pollo asado con salsa BBQ, acompañado de papas y ensalada fresca.', 'Pollo', 8.50, 20, ARRAY['https://images.unsplash.com/photo-1598103442097-8b7c2fbaa3b1?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true);

-- PAPAS & SIDES (6 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, activo) VALUES
('Papas Fritas Clásicas', 'Papas fritas crocantes con sal marina, servidas con salsa ketchup de la casa.', 'Papas & Sides', 3.50, 100, ARRAY['https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&q=80&w=500'], false, false, true, false, true),
('Papas Cheddar & Bacon', 'Papas fritas cubiertas con queso cheddar derretido y bacon bits crujientes.', 'Papas & Sides', 5.00, 60, ARRAY['https://images.unsplash.com/photo-1617127365659-c47c8646ef44?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Onion Rings', 'Aros de cebolla empanizados y fritos hasta quedar dorados y crujientes.', 'Papas & Sides', 4.00, 50, ARRAY['https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Papas Cajún', 'Papas fritas sazonadas con especias cajún, servidas con crema agria.', 'Papas & Sides', 4.50, 50, ARRAY['https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&q=80&w=500'], false, true, false, false, true),
('Aros de Cebolla Extra', 'Aros de cebolla empanizados con panko, fritos, servidos con salsa BBQ.', 'Papas & Sides', 4.00, 50, ARRAY['https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Papas Locas', 'Papas fritas con queso cheddar, bacon, jalapeños, crema agria y pico de gallo.', 'Papas & Sides', 6.00, 40, ARRAY['https://images.unsplash.com/photo-1617127365659-c47c8646ef44?auto=format&fit=crop&q=80&w=500'], false, true, false, false, true);

-- ENTRADAS (4 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, activo) VALUES
('Nachos Supreme', 'Totopos de maíz con queso cheddar derretido, guacamole, crema agria, jalapeños y pico de gallo.', 'Entradas', 6.50, 35, ARRAY['https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=500'], false, false, true, false, true),
('Tequeños x6', '6 palitos de queso envueltos en masa hojaldrada, fritos hasta dorar, servidos con salsa de ajo.', 'Entradas', 4.50, 50, ARRAY['https://images.unsplash.com/photo-1625220194771-7ebdea0b70b7?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Empanadas de Queso x3', '3 empanadas fritas rellenas de queso, doradas y crujientes.', 'Entradas', 4.00, 40, ARRAY['https://images.unsplash.com/photo-1625220194771-7ebdea0b70b7?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Mozzarella Sticks x6', '6 palitos de mozzarella empanizados con salsa marinara y crema de ajo.', 'Entradas', 5.50, 35, ARRAY['https://images.unsplash.com/photo-1625220194771-7ebdea0b70b7?auto=format&fit=crop&q=80&w=500'], false, true, false, false, true);

-- COMBOS (6 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, activo) VALUES
('Combo Smash + Papas', 'Hamburguesa Smash Clásica + Papas Fritas + Bebida 500ml. Ahorra en combo.', 'Combos', 11.90, 50, ARRAY['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500'], true, false, true, false, true),
('Combo Doble + Papas Grandes', 'Doble BBQ Bacon Cheddar + Papas Grandes + Bebida 500ml. El favorito.', 'Combos', 15.90, 40, ARRAY['https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Combo Familiar 4 pers', '4 Smash Clásicas + Papas Familiares + 4 Bebidas 500ml + Onion Rings.', 'Combos', 34.90, 20, ARRAY['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500'], true, false, false, true, true),
('Combo Pizza + Papas', 'Pizza Pepperoni Personal + Papas Fritas + Bebida 500ml. El combo perfecto.', 'Combos', 14.90, 25, ARRAY['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=500'], false, true, false, false, true),
('Combo Alitas + Papas', '6 Alitas BBQ + Papas Fritas + Bebida 500ml + Aderezo.', 'Combos', 12.50, 30, ARRAY['https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Combo Infantil', 'Burger Infantil + Papas pequeñas + Jugo + Juguete sorpresa.', 'Combos', 8.50, 40, ARRAY['https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true);

-- BEBIDAS (7 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, activo) VALUES
('Coca-Cola 500ml', 'Refresco de cola 500ml bien frío, el clásico de siempre.', 'Bebidas', 1.50, 150, ARRAY['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=500'], false, false, true, false, true),
('Sprite 500ml', 'Refresco de limón 500ml, refrescante y burbujeante.', 'Bebidas', 1.50, 150, ARRAY['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Fanta 500ml', 'Refresco de naranja 500ml, sabor frutal y refrescante.', 'Bebidas', 1.50, 150, ARRAY['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Agua Mineral 500ml', 'Agua mineral natural sin gas, pura y refrescante.', 'Bebidas', 1.00, 200, ARRAY['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Milkshake de Vainilla', 'Malteada cremosa de vainilla con crema batida y chips de chocolate.', 'Bebidas', 4.50, 40, ARRAY['https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500'], false, true, false, false, true),
('Milkshake de Chocolate', 'Malteada cremosa de chocolate con crema batida y salsa de chocolate.', 'Bebidas', 4.50, 40, ARRAY['https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Limonada Natural', 'Limonada fresca preparada al momento con limón natural y hielo.', 'Bebidas', 2.00, 60, ARRAY['https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true);

-- POSTRES (6 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_usd, stock, imagen_urls, es_promo, es_nuevo, es_mas_vendido, delivery_gratis, activo) VALUES
('Brownie con Helado', 'Brownie de chocolate caliente con una bola de helado de vainilla y salsa de chocolate.', 'Postres', 5.50, 30, ARRAY['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=500'], false, false, true, false, true),
('Cheesecake de Fresa', 'Tajada de cheesecake cremoso con coulis de fresa fresca.', 'Postres', 4.50, 25, ARRAY['https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=500'], false, true, false, false, true),
('Crepas con Nutella', '2 crepas suaves rellenas de Nutella, fresas y plátano, espolvoreadas con azúcar glass.', 'Postres', 5.00, 25, ARRAY['https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Sundae de Chocolate', 'Helado de chocolate con crema batida, salsa de chocolate, nueces y cereza.', 'Postres', 4.00, 35, ARRAY['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Flan Casero', 'Flan de caramelo casero, suave y cremoso. Receta tradicional de la abuela.', 'Postres', 3.50, 30, ARRAY['https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true),
('Helado Artesanal 2 bolas', '2 bolas de helado artesanal a tu elección: vainilla, chocolate, fresa o mantecado.', 'Postres', 3.50, 40, ARRAY['https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&q=80&w=500'], false, false, false, false, true);

-- ----------------------------------------------------------------------------
-- 8. product_reviews (SISTEMA DE CALIFICACIONES)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for product_reviews
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_reviews' AND policyname='reviews_select_public') THEN
        CREATE POLICY "reviews_select_public" ON product_reviews FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_reviews' AND policyname='reviews_insert_auth') THEN
        CREATE POLICY "reviews_insert_auth" ON product_reviews FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_reviews' AND policyname='reviews_insert_anon') THEN
        CREATE POLICY "reviews_insert_anon" ON product_reviews FOR INSERT TO anon WITH CHECK (true);
    END IF;
END $$;

GRANT SELECT, INSERT ON product_reviews TO anon, authenticated;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);

-- ----------------------------------------------------------------------------
-- 9. flash_sales (SISTEMA DE OFERTAS FLASH)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flash_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_quantity INTEGER,
    sold_quantity INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;

-- Policies for flash_sales
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='flash_sales' AND policyname='flash_sales_select_public') THEN
        CREATE POLICY "flash_sales_select_public" ON flash_sales FOR SELECT USING (active = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='flash_sales' AND policyname='flash_sales_admin_all') THEN
        CREATE POLICY "flash_sales_admin_all" ON flash_sales FOR ALL TO authenticated
        USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
        WITH CHECK (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
    END IF;
END $$;

GRANT SELECT ON flash_sales TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON flash_sales TO authenticated;

-- Index for active flash sales
CREATE INDEX IF NOT EXISTS idx_flash_sales_active ON flash_sales(active, end_date);
CREATE INDEX IF NOT EXISTS idx_flash_sales_product ON flash_sales(product_id);

-- Agregar columnas faltantes a products si no existen
ALTER TABLE products ADD COLUMN IF NOT EXISTS estimated_prep_time INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS promo_end_date TIMESTAMP WITH TIME ZONE;

-- ----------------------------------------------------------------------------
-- 10. user_carts (CARRITO PERSISTENTE POR USUARIO)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_carts (
    user_id TEXT PRIMARY KEY,
    cart_data JSONB NOT NULL DEFAULT '[]'::JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_carts' AND policyname='user_carts_select_own') THEN
        CREATE POLICY "user_carts_select_own" ON user_carts FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_carts' AND policyname='user_carts_upsert_own') THEN
        CREATE POLICY "user_carts_upsert_own" ON user_carts FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_carts' AND policyname='user_carts_update_own') THEN
        CREATE POLICY "user_carts_update_own" ON user_carts FOR UPDATE TO authenticated USING (auth.uid()::text = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_carts' AND policyname='user_carts_delete_own') THEN
        CREATE POLICY "user_carts_delete_own" ON user_carts FOR DELETE TO authenticated USING (auth.uid()::text = user_id);
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON user_carts TO authenticated;

-- ----------------------------------------------------------------------------
-- 11. promotions (SISTEMA DE PROMOCIONES COMPLETO)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    discount_type TEXT NOT NULL DEFAULT 'percent',
    discount_value NUMERIC(10,2) DEFAULT 0,
    coupon_code TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    start_time TIME,
    end_time TIME,
    audience TEXT DEFAULT 'all',
    audience_config JSONB DEFAULT '{}'::JSONB,
    channel TEXT DEFAULT 'both',
    status TEXT DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promotions' AND policyname='promotions_select_public') THEN
        CREATE POLICY "promotions_select_public" ON promotions FOR SELECT USING (status = 'active');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='promotions' AND policyname='promotions_admin_all') THEN
        CREATE POLICY "promotions_admin_all" ON promotions FOR ALL TO authenticated
        USING (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
        WITH CHECK (auth.jwt() ->> 'email' = 'kecho8a@gmail.com' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
    END IF;
END $$;

GRANT SELECT ON promotions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON promotions TO authenticated;

CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_product ON promotions(product_id);

-- ==========================================================================
-- CONFIGURACIÓN DE REALTIME (COMPATIBLE CON PLAN GRATUITO)
-- ==========================================================================

-- 1. Asegurar que la publicación exista
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 2. Agregar tablas a la publicación para escuchar cambios (CDC)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ==========================================================================
-- MANTENIMIENTO AUTOMÁTICO (LIMPIEZA DE NOTIFICACIONES ANTIGUAS)
-- ==========================================================================

-- 1. Crear la función de limpieza
CREATE OR REPLACE FUNCTION public.delete_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < NOW() - INTERVAL '15 days';

  DELETE FROM public.orders
  WHERE status = 'Cancelado'
  AND created_at < NOW() - INTERVAL '3 months';
END;
$$;

-- 2. Programación de la tarea (Requiere extensión pg_cron)
-- Para que esto funcione, debes habilitar 'pg_cron' en el dashboard de Supabase:
-- Database -> Extensions -> Buscar 'pg_cron' y activarlo.
-- Una vez activado, ejecuta manualmente esta línea en el SQL Editor:
-- SELECT cron.schedule('limpiar-notificaciones-diario', '0 0 * * *', 'SELECT public.delete_old_notifications()');

-- ==========================================================================
-- CONFIGURACIÓN DE VARIABLES PARA WEBHOOK PUSH (PRODUCCIÓN)
-- ==========================================================================

-- 1. Habilitar extensión para peticiones HTTP asíncronas
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Actualizar configuración en la tabla
UPDATE public.store_config 
SET 
  push_webhook_url = '',
  push_webhook_secret = ''
WHERE id = 1;
