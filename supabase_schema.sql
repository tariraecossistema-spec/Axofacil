-- ==============================================================================
-- ACHEI! MAPUTO & MOÇAMBIQUE - COMPLETE SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Copie e cole este script no Editor SQL do seu projeto Supabase (SQL Editor).
-- Este script cria todas as tabelas, tipos ENUM, funções, triggers de novo utilizador,
-- índices de desempenho, configuração do Supabase Storage e Políticas de Segurança (RLS).
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELA DE PERFIS DE UTILIZADOR (PROFILES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN (
        'cliente', 
        'loja', 
        'supermercado', 
        'bar', 
        'hospedagem', 
        'hotel', 
        'construcao', 
        'pecas_auto', 
        'entregador', 
        'admin'
    )),
    phone TEXT,
    city TEXT DEFAULT 'Maputo',
    address TEXT,
    avatar_url TEXT,
    company_name TEXT,
    nif_number TEXT,
    subscription_plan TEXT DEFAULT 'Gratuito',
    is_premium BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABELA DE ESTABELECIMENTOS COMERCIAIS & SERVIÇOS (ESTABLISHMENTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.establishments (
    id TEXT PRIMARY KEY DEFAULT ('est_' || substr(md5(random()::text), 1, 10)),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    zone TEXT,
    subcategories TEXT[] DEFAULT '{}',
    description TEXT DEFAULT '',
    address TEXT NOT NULL DEFAULT 'Maputo',
    endereco_texto TEXT,
    city TEXT NOT NULL DEFAULT 'Maputo',
    province TEXT NOT NULL DEFAULT 'Maputo Cidade',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_landmarks TEXT,
    phone TEXT NOT NULL DEFAULT '',
    contact_phone TEXT,
    whatsapp TEXT,
    email TEXT,
    website TEXT,
    opening_hours TEXT DEFAULT 'Seg - Sáb: 08:00 - 18:00',
    sales_type TEXT,
    images TEXT[] DEFAULT '{}',
    logo_url TEXT,
    banner_url TEXT,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_open BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    allow_guest_cart BOOLEAN DEFAULT TRUE,
    is_plan_billing_active BOOLEAN DEFAULT TRUE,
    delivery_available BOOLEAN DEFAULT FALSE,
    delivery_fee NUMERIC(10, 2) DEFAULT 0.00,
    min_order_amount NUMERIC(10, 2) DEFAULT 0.00,
    subscription_tier TEXT DEFAULT 'Gratuito',
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    raw_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 4. TABELA DE ESTAFETAS / ENTREGADORES (DELIVERY_PARTNERS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.delivery_partners (
    id TEXT PRIMARY KEY DEFAULT ('dlv_' || substr(md5(random()::text), 1, 10)),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    vehicle_type TEXT NOT NULL DEFAULT 'moto',
    license_plate TEXT,
    plate_number TEXT,
    city TEXT NOT NULL DEFAULT 'Maputo',
    current_zone TEXT DEFAULT 'Maputo Centro',
    residence_zone TEXT,
    base_rate NUMERIC(10, 2) DEFAULT 150.00,
    current_latitude DOUBLE PRECISION,
    current_longitude DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_online BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'ativo',
    rating NUMERIC(3, 2) DEFAULT 5.00,
    trips_completed INTEGER DEFAULT 0,
    wallet_balance NUMERIC(10, 2) DEFAULT 0.00,
    raw_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 5. TABELA DE PRODUTOS & ITENS DE INVENTÁRIO (INVENTORY_ITEMS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id TEXT PRIMARY KEY DEFAULT ('prod_' || substr(md5(random()::text), 1, 10)),
    establishment_id TEXT REFERENCES public.establishments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'geral',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_price NUMERIC(10, 2),
    stock_quantity INTEGER NOT NULL DEFAULT 10,
    unit TEXT DEFAULT 'unidade',
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 6. TABELA DE PEDIDOS & ENCOMENDAS (ORDERS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT ('ord_' || substr(md5(random()::text), 1, 10)),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    establishment_id TEXT REFERENCES public.establishments(id) ON DELETE SET NULL,
    delivery_partner_id TEXT REFERENCES public.delivery_partners(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'm-pesa',
    payment_status TEXT NOT NULL DEFAULT 'pendente',
    order_status TEXT NOT NULL DEFAULT 'novo',
    delivery_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 7. TABELA DE TRANSAÇÕES FINANCEIRAS (FINANCIAL_TRANSACTIONS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id TEXT PRIMARY KEY DEFAULT ('tx_' || substr(md5(random()::text), 1, 10)),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    establishment_id TEXT REFERENCES public.establishments(id) ON DELETE SET NULL,
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT NOT NULL,
    payment_gateway TEXT DEFAULT 'm-pesa',
    reference_code TEXT,
    status TEXT NOT NULL DEFAULT 'concluido',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 8. TABELA DE PROMOÇÕES & OFERTAS (PROMO_DEALS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.promo_deals (
    id TEXT PRIMARY KEY DEFAULT ('prm_' || substr(md5(random()::text), 1, 10)),
    establishment_id TEXT REFERENCES public.establishments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    discount_percentage INTEGER,
    old_price NUMERIC(10, 2),
    new_price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 9. TABELA DE SUBMISSÕES ADMINISTRATIVAS (ADMIN_SUBMISSIONS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_submissions (
    id TEXT PRIMARY KEY DEFAULT ('sub_' || substr(md5(random()::text), 1, 10)),
    type TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    applicant_contact TEXT NOT NULL,
    applicant_email TEXT,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pendente',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 10. TABELA DE MEDIA E UPLOADS (MEDIA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    mime_type TEXT DEFAULT 'image/jpeg',
    public_url TEXT NOT NULL,
    cloudinary_url TEXT,
    supabase_url TEXT,
    folder TEXT DEFAULT 'achei_uploads',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 10b. TABELA DE DEFINIÇÕES DA PLATAFORMA (CONTAS DE RECEBIMENTO & PLANOS)
-- ==============================================================================
-- Guarda, num único registo ("default"), os dados editáveis no painel
-- administrativo: números/titulares de M-Pesa, e-Mola e conta bancária, e os
-- preços/nomes dos planos de subscrição (Empresas e Clientes). Substitui a
-- versão anterior guardada apenas em localStorage, permitindo que as
-- alterações feitas por um admin fiquem visíveis em qualquer dispositivo.
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    payment_accounts JSONB NOT NULL DEFAULT '{}'::jsonb,
    business_plans JSONB NOT NULL DEFAULT '{}'::jsonb,
    client_plans JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Semente inicial com os mesmos valores por defeito usados no código
-- (platformConfig.ts). Só insere se ainda não existir o registo "default".
INSERT INTO public.platform_settings (id, payment_accounts, business_plans, client_plans)
VALUES (
    'default',
    '{
        "mpesa": { "titular": "Shay Tec & Serviços Lda / Vicente Germano", "numero": "841234567" },
        "emola": { "titular": "vicente joao germano dias", "numero": "871425316" },
        "banco": { "titular": "vicente joao Germano Dias", "numero": "000100000017601998457", "banco": "Millennium Bim" }
    }'::jsonb,
    '{
        "bronze": { "name": "Plano Base — Loja no Directório", "priceMT": 600 },
        "prata": { "name": "Plano Pro Destaque — Loja Prioritária", "priceMT": 1000 },
        "ouro": { "name": "Plano VIP Premium + Entrega Integrada", "priceMT": 1500 }
    }'::jsonb,
    '{
        "mensal": { "name": "Acesso Cliente — Mensal Universal", "priceMT": 150 },
        "semestral": { "name": "Acesso Cliente — Plano Economia (6 Meses)", "priceMT": 500 },
        "anual": { "name": "Acesso Cliente — Plano Anual Total (12 Meses)", "priceMT": 1200 }
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 11. TRIGGER DE AUTOMATIZAÇÃO DE REGISTO (AUTH.USERS -> PROFILES)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_name TEXT;
    user_phone TEXT;
    user_city TEXT;
BEGIN
    IF LOWER(NEW.email) = 'acheilojaspro@gmail.com' THEN
        user_role := 'admin';
    ELSE
        user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'cliente');
    END IF;

    user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    user_phone := NEW.raw_user_meta_data->>'phone';
    user_city := COALESCE(NEW.raw_user_meta_data->>'city', 'Maputo');

    INSERT INTO public.profiles (id, email, full_name, role, phone, city, subscription_plan, is_premium)
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        user_role,
        user_phone,
        user_city,
        'Empresarial',
        TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 12. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_profiles" ON public.profiles;
DROP POLICY IF EXISTS "manage_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "public_read_establishments" ON public.establishments;
DROP POLICY IF EXISTS "manage_establishments" ON public.establishments;
DROP POLICY IF EXISTS "public_read_couriers" ON public.delivery_partners;
DROP POLICY IF EXISTS "manage_couriers" ON public.delivery_partners;
DROP POLICY IF EXISTS "public_read_inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "manage_inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "public_read_orders" ON public.orders;
DROP POLICY IF EXISTS "manage_orders" ON public.orders;
DROP POLICY IF EXISTS "public_read_deals" ON public.promo_deals;
DROP POLICY IF EXISTS "manage_deals" ON public.promo_deals;
DROP POLICY IF EXISTS "public_read_submissions" ON public.admin_submissions;
DROP POLICY IF EXISTS "manage_submissions" ON public.admin_submissions;
DROP POLICY IF EXISTS "public_read_media" ON public.media;
DROP POLICY IF EXISTS "manage_media" ON public.media;

CREATE POLICY "public_read_profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "manage_own_profile" ON public.profiles FOR ALL USING (true);

CREATE POLICY "public_read_establishments" ON public.establishments FOR SELECT USING (true);
CREATE POLICY "manage_establishments" ON public.establishments FOR ALL USING (true);

CREATE POLICY "public_read_couriers" ON public.delivery_partners FOR SELECT USING (true);
CREATE POLICY "manage_couriers" ON public.delivery_partners FOR ALL USING (true);

CREATE POLICY "public_read_inventory" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "manage_inventory" ON public.inventory_items FOR ALL USING (true);

CREATE POLICY "public_read_orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "manage_orders" ON public.orders FOR ALL USING (true);

CREATE POLICY "public_read_deals" ON public.promo_deals FOR SELECT USING (true);
CREATE POLICY "manage_deals" ON public.promo_deals FOR ALL USING (true);

CREATE POLICY "public_read_submissions" ON public.admin_submissions FOR SELECT USING (true);
CREATE POLICY "manage_submissions" ON public.admin_submissions FOR ALL USING (true);

CREATE POLICY "public_read_media" ON public.media FOR SELECT USING (true);
CREATE POLICY "manage_media" ON public.media FOR ALL USING (true);

DROP POLICY IF EXISTS "public_read_platform_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "manage_platform_settings" ON public.platform_settings;
CREATE POLICY "public_read_platform_settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "manage_platform_settings" ON public.platform_settings FOR ALL USING (true);


-- ==============================================================================
-- 13. CONFIGURAÇÃO DE BUCKETS DO STORAGE
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
    ('images', 'images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
    ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('documents', 'documents', true, 52428800, NULL),
    ('uploads', 'uploads', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public Storage Access" ON storage.objects;
CREATE POLICY "Public Storage Access" ON storage.objects 
FOR SELECT USING (bucket_id IN ('images', 'avatars', 'documents', 'uploads'));

DROP POLICY IF EXISTS "Public Storage Insert" ON storage.objects;
CREATE POLICY "Public Storage Insert" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id IN ('images', 'avatars', 'documents', 'uploads'));

DROP POLICY IF EXISTS "Public Storage Update" ON storage.objects;
CREATE POLICY "Public Storage Update" ON storage.objects 
FOR UPDATE USING (bucket_id IN ('images', 'avatars', 'documents', 'uploads'));

DROP POLICY IF EXISTS "Public Storage Delete" ON storage.objects;
CREATE POLICY "Public Storage Delete" ON storage.objects 
FOR DELETE USING (bucket_id IN ('images', 'avatars', 'documents', 'uploads'));

-- ==============================================================================
-- 14. MIGRAÇÃO: TRIAL DE 15 DIAS GRÁTIS + REGISTO DE PEDIDOS DE PAGAMENTO
-- ==============================================================================
-- Adicionado para garantir que (a) o período experimental de 15 dias grátis
-- de cada conta fica registado e consultável no painel administrativo, e
-- (b) os comprovativos de pagamento manual (M-Pesa/e-Mola/Transferência),
-- incluindo os das subscrições dos planos, deixam de existir apenas em
-- localStorage e passam a ficar gravados de forma centralizada no Supabase,
-- com CRUD completo disponível no painel administrativo.

-- 14.1 Campos de controlo do trial na tabela de perfis
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS trial_status TEXT DEFAULT 'ativo' CHECK (trial_status IN ('ativo', 'expirado', 'convertido'));

-- 14.3 Colunas em falta noutras tabelas (usadas pelo código em supabase.ts
-- mas que não existiam no schema original — pedidos, transações e inventário
-- falhavam silenciosamente ao sincronizar por faltar estas colunas)
ALTER TABLE public.financial_transactions
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS raw_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS raw_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.inventory_items
    ADD COLUMN IF NOT EXISTS raw_json JSONB DEFAULT '{}'::jsonb;
-- 14.2 Tabela de pedidos de pagamento (subscrições de planos e compras em lojas)
CREATE TABLE IF NOT EXISTS public.payment_orders (
    id TEXT PRIMARY KEY DEFAULT ('pag_' || substr(md5(random()::text), 1, 10)),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    target_type TEXT NOT NULL CHECK (target_type IN ('shay', 'loja')),
    establishment_id TEXT REFERENCES public.establishments(id) ON DELETE SET NULL,
    establishment_name TEXT NOT NULL,
    order_items_summary TEXT NOT NULL,
    subtotal_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('mpesa', 'emola', 'transferencia_bancaria')),
    reference_number TEXT NOT NULL,
    proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'rejeitado')),
    rejection_reason TEXT,
    admin_notes TEXT,
    delivery_option TEXT,
    delivery_address TEXT,
    raw_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON public.payment_orders(user_id);

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_payment_orders" ON public.payment_orders;
DROP POLICY IF EXISTS "manage_payment_orders" ON public.payment_orders;
CREATE POLICY "public_read_payment_orders" ON public.payment_orders FOR SELECT USING (true);
CREATE POLICY "manage_payment_orders" ON public.payment_orders FOR ALL USING (true);

-- ==============================================================================
-- 14. MIGRAÇÕES AUTOMÁTICAS E EXTENSÕES DE COLUNAS
-- ==============================================================================
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS allow_guest_cart BOOLEAN DEFAULT TRUE;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS is_plan_billing_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS global_client_billing_flow_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS profile_policies JSONB DEFAULT '{}'::jsonb;

-- ==============================================================================
-- 15. ACTIVAR SUPABASE REALTIME NO DIRECTÓRIO DE ESTABELECIMENTOS
-- ==============================================================================
-- CRÍTICO: sem isto, o painel de administrador (App.tsx / AdminPanel.tsx)
-- consegue eliminar/criar/editar estabelecimentos no Supabase, mas nenhum
-- OUTRO dispositivo é avisado dessa mudança em tempo real — cada telemóvel/
-- browser só vê a lista com que abriu a app. Ao adicionar a tabela à
-- publicação "supabase_realtime", os eventos INSERT/UPDATE/DELETE passam a
-- ser transmitidos a todos os clientes subscritos (ver
-- subscribeToEstablishmentsRealtime em supabase.ts).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'establishments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.establishments;
  END IF;
END $$;

