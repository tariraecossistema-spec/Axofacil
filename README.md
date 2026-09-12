# 🇲🇿 Portal Comercial Axofácil! Maputo - Guia Completo de Integração e Deploy

Este repositório contém a aplicação web completa do **Portal Comercial Axofácil! Maputo**, integrando directório de lojas, supermercados, bares, alojamentos, entregadores parceiros, mapa de navegação por GPS e gestão de planos de subscrição.

---

## 🛠️ Arquitectura de Serviços Externos Gratuitos

O projecto está preparado para funcionar com uma arquitectura moderna de serviços serverless e de nível gratuito elevado:

1. **Google Maps Platform** — Navegação GPS turn-by-turn, mapas interativos por endereço e pontos de referência.
2. **Supabase** — Autenticação de utilizadores (Clientes, Empresas, Entregadores, Admin) e Base de Dados PostgreSQL com RLS.
3. **Cloudinary** — Alojamento e otimização de imagens de alta resolução e documentos/catálogos em formato PDF.
4. **Vercel / Netlify** — Hospedagem contínua e distribuição global via CDN.

---

## 🔑 Configuração de Variáveis de Ambiente (`.env`)

Crie ou edite o ficheiro `.env` na raiz do projecto com os seguintes valores:

```env
# Google Maps Platform Key
GOOGLE_MAPS_PLATFORM_KEY="AChaveDoGoogleMapsAqui"
VITE_GOOGLE_MAPS_PLATFORM_KEY="AChaveDoGoogleMapsAqui"

# Supabase (Autenticação e Base de Dados)
VITE_SUPABASE_URL="https://seu-projecto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-chave-anonima-supabase"

# Cloudinary (Uploads de PDFs e Fotos)
VITE_CLOUDINARY_CLOUD_NAME="seu_cloud_name"
VITE_CLOUDINARY_API_KEY="sua_api_key_cloudinary"
VITE_CLOUDINARY_UPLOAD_PRESET="seu_upload_preset_unsigned"

# ImgBB (Upload principal de fotos de lojas/produtos)
VITE_IMGBB_API_KEY="sua_chave_imgbb"

# Administrador Geral do Portal (login mestre)
VITE_ADMIN_EMAIL="admin@seudominio.co.mz"
VITE_ADMIN_PASSWORD="defina-uma-password-forte-aqui"
```

---

## 🗄️ 1. Configuração do Supabase (Passo a Passo)

1. Crie uma conta gratuita em [Supabase.com](https://supabase.com).
2. Crie um novo projecto (ex: `axofacil-maputo`).
3. Vá a **Project Settings -> API** e copie o **URL** e a **anon public key**.
4. No menu **SQL Editor**, execute o seguinte script para criar a tabela de perfis protegida:

```sql
-- Criar Tabela de Perfis de Utilizadores
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'cliente',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politicas de Leitura e Edição
CREATE POLICY "Leitura de perfis publica" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Edicao de perfil proprio" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Tabela de Lojas/Estabelecimentos (usada por syncEstablishmentToSupabase)
CREATE TABLE public.establishments (
  id TEXT PRIMARY KEY,
  name TEXT,
  category TEXT,
  zone TEXT,
  province TEXT,
  address TEXT,
  description TEXT,
  contact_phone TEXT,
  sales_type TEXT,
  is_active BOOLEAN,
  updated_at TIMESTAMP WITH TIME ZONE,
  raw_json JSONB
);
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura publica de lojas" ON public.establishments FOR SELECT USING (true);
CREATE POLICY "Escrita publica de lojas" ON public.establishments FOR ALL USING (true) WITH CHECK (true);

-- Tabela de Entregadores/Prestadores de Serviço (usada por syncDeliveryPartnerToSupabase)
-- Inclui latitude/longitude geocodificadas via Nominatim/OpenStreetMap,
-- para permitir a navegação do cliente até à zona de atuação do estafeta.
CREATE TABLE public.delivery_partners (
  id TEXT PRIMARY KEY,
  name TEXT,
  vehicle_type TEXT,
  plate_number TEXT,
  residence_zone TEXT,
  phone TEXT,
  base_rate TEXT,
  is_available BOOLEAN,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  updated_at TIMESTAMP WITH TIME ZONE,
  raw_json JSONB
);
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura publica de entregadores" ON public.delivery_partners FOR SELECT USING (true);
CREATE POLICY "Escrita publica de entregadores" ON public.delivery_partners FOR ALL USING (true) WITH CHECK (true);
```

> **Nota de segurança:** as políticas acima ("Escrita pública") permitem que qualquer pessoa com a chave `anon` escreva nestas tabelas — adequado para o MVP atual, que faz toda a autorização no cliente. Antes de escalar para produção com muitos utilizadores, restrinja `INSERT`/`UPDATE` por `auth.uid()` (dono da loja) ou pelo papel do administrador, tal como já é feito na tabela `profiles`.

---

## ☁️ 2. Configuração do Cloudinary (Passo a Passo)

1. Crie uma conta em [Cloudinary.com](https://cloudinary.com).
2. No dashboard, copie o seu **Cloud Name**.
3. Vá a **Settings -> Upload -> Add upload preset**.
4. Configure o preset como **Unsigned** e nomeie como `axofacil_maputo_preset`.
5. Guarde e adicione estas variáveis no seu ficheiro `.env`.

---

## 🗺️ 3. Configuração do Google Maps Platform

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Ative as APIs: **Maps JavaScript API** e **Places API**.
3. Crie uma **API Key** e adicione em `GOOGLE_MAPS_PLATFORM_KEY` no ficheiro `.env`.
4. Os componentes utilizarão automaticamente o mapa interativo e botão direto de navegação GPS por ruas e avenidas em Maputo.

---

## 🚀 4. Como Fazer Deploy na Vercel / Netlify

### Deploy na Vercel:
1. Importe este repositório no [Vercel.com](https://vercel.com).
2. Nas definições de **Environment Variables**, adicione as chaves configuradas no `.env`.
3. O ficheiro `vercel.json` incluído cuidará de reencaminhar as rotas SPA automaticamente.
4. Clique em **Deploy**.

---

---

## 🔐 5. Administração Geral & ImgBB (Passo a Passo)

1. Crie uma chave gratuita em [api.imgbb.com](https://api.imgbb.com/) e adicione-a como `VITE_IMGBB_API_KEY` no `.env` — é o serviço usado para o upload de fotos de lojas e produtos (com sincronização automática de backup no Supabase Storage, se configurado).
2. Defina `VITE_ADMIN_EMAIL` e `VITE_ADMIN_PASSWORD` no `.env` com as credenciais reais do Administrador Geral do portal. **Sem `VITE_ADMIN_PASSWORD` definida, o login de administrador fica desativado** (por segurança, deixou de haver uma password de fallback fixa no código-fonte).
3. Nota importante: por ser uma aplicação 100% client-side (SPA), qualquer variável `VITE_*` fica embutida no JavaScript final e é, em teoria, inspecionável por alguém com conhecimentos técnicos. Isto é uma limitação de qualquer SPA estática — para segurança de nível bancário/empresarial, o passo seguinte recomendado é migrar a verificação do perfil "admin" para o lado do servidor (ex: checar o campo `role` do utilizador autenticado via Supabase Auth + Row Level Security), em vez de uma password partilhada.

## ✅ 6. Checklist Antes de Publicar em Produção

- [ ] Preencher `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, `VITE_IMGBB_API_KEY`, `VITE_ADMIN_EMAIL` e `VITE_ADMIN_PASSWORD` no `.env` (ou nas variáveis de ambiente da Vercel/Netlify).
- [ ] No Painel Administrativo (separador "Diretório"), usar o botão **"Eliminar Todas as Lojas de Demonstração"** para limpar os dados fictícios antes de publicar — todas as ações de eliminação já usam confirmação e feedback próprios da aplicação (não dependem mais de caixas de diálogo nativas do browser, que ficam bloqueadas em alguns pré-visualizadores).
- [ ] Registar as lojas/contas reais dos clientes através do fluxo normal de criação de conta (separador "Criar Conta" → escolher perfil de Loja/Supermercado/Bar/Hospedagem/Construção).
- [ ] Confirmar que cada conta de loja só consegue editar o seu **próprio** perfil — isto já foi corrigido: o acesso de edição agora depende do vínculo real dono→loja (`establishmentId`), não apenas da categoria/perfil escolhido no registo.

---

## 🚀 Comandos Locais

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento local
npm run dev

# Compilar para produção
npm run build
```
