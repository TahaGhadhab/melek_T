-- ============================================================
-- OPS HUB — SCHÉMA COMPLET DE LA BASE DE DONNÉES
-- ============================================================
-- Exécute ce fichier DANS L'ORDRE dans le SQL Editor de Supabase
-- (ou utilise supabase db push si tu as la CLI)
-- ============================================================

-- 1. Extension pour UUID généré automatiquement
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. PROFILS UTILISATEURS (extension de auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  department_id UUID,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'agent', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. DÉPARTEMENTS
-- ============================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. STATUTS (prédéfinis)
-- ============================================================
CREATE TABLE statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#888780',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. PRIORITÉS
-- ============================================================
CREATE TABLE priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#888780',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. DEMANDES (REQUESTS)
-- ============================================================
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  status_id UUID NOT NULL REFERENCES statuses(id),
  priority_id UUID NOT NULL REFERENCES priorities(id),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_requests_status ON requests(status_id);
CREATE INDEX idx_requests_priority ON requests(priority_id);
CREATE INDEX idx_requests_department ON requests(department_id);
CREATE INDEX idx_requests_requester ON requests(requester_id);
CREATE INDEX idx_requests_assignee ON requests(assignee_id);
CREATE INDEX idx_requests_created ON requests(created_at DESC);
CREATE INDEX idx_requests_due_date ON requests(due_date);

-- Index pour la recherche full-text
CREATE INDEX idx_requests_search ON requests USING GIN (
  to_tsvector('french', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- ============================================================
-- 7. MESSAGES (chat lié à une demande)
-- ============================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_request ON messages(request_id, created_at ASC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- ============================================================
-- 8. FICHIERS ATTACHÉS
-- ============================================================
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  filesize INTEGER NOT NULL,
  filetype TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Un fichier est lié soit à un message, soit directement à une demande
  CONSTRAINT attachment_has_parent CHECK (
    message_id IS NOT NULL OR request_id IS NOT NULL
  )
);

CREATE INDEX idx_attachments_message ON attachments(message_id);
CREATE INDEX idx_attachments_request ON attachments(request_id);

-- ============================================================
-- 9. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'new_request', 'status_change', 'new_message',
    'new_attachment', 'urgent_request', 'assignment',
    'due_date_reminder'
  )),
  title TEXT NOT NULL,
  content TEXT,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- 10. ACCUSÉS DE LECTURE (messages lus)
-- ============================================================
CREATE TABLE message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_reads_message ON message_reads(message_id);
CREATE INDEX idx_message_reads_user ON message_reads(user_id);

-- ============================================================
-- 11. JOURNAL D'ACTIVITÉ (audit trail)
-- ============================================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_request ON activity_logs(request_id, created_at DESC);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- ============================================================
-- 12. FONCTION : mise à jour automatique de updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur les tables qui ont updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 13. FONCTION : créer automatiquement un profil lors de l'inscription
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclencher la création du profil à chaque inscription
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
