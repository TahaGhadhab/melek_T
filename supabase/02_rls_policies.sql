-- ============================================================
-- OPS HUB — POLITIQUES RLS (ROW LEVEL SECURITY)
-- ============================================================
-- Exécute CE FICHIER APRÈS le 01_schema.sql
-- Ces politiques garantissent qu'un utilisateur ne voit/modifie
-- que ce qu'il est autorisé à voir/modifier.
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
-- Chaque utilisateur peut voir tous les profils (annuaire)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated
  USING (true);

-- Un utilisateur peut modifier son propre profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE POLICY "Departments are viewable by authenticated users"
  ON departments FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- STATUSES & PRIORITIES
-- ============================================================
CREATE POLICY "Statuses are viewable by authenticated users"
  ON statuses FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Priorities are viewable by authenticated users"
  ON priorities FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- REQUESTS
-- ============================================================
-- Un utilisateur peut voir les demandes de son département
-- et les demandes qu'il a créées ou qui lui sont assignées
CREATE POLICY "Users can view requests they have access to"
  ON requests FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid()
    OR assignee_id = auth.uid()
    OR department_id IN (
      SELECT department_id FROM profiles WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Un utilisateur peut créer une demande (lui-même comme requester)
CREATE POLICY "Users can create requests"
  ON requests FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
  );

-- Un utilisateur peut modifier une demande s'il y est autorisé
CREATE POLICY "Users can update accessible requests"
  ON requests FOR UPDATE TO authenticated
  USING (
    requester_id = auth.uid()
    OR assignee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'agent')
    )
  );

-- Seul un admin peut supprimer une demande
CREATE POLICY "Only admins can delete requests"
  ON requests FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE POLICY "Users can view messages for accessible requests"
  ON messages FOR SELECT TO authenticated
  USING (
    request_id IN (
      SELECT id FROM requests WHERE
        requester_id = auth.uid()
        OR assignee_id = auth.uid()
        OR department_id IN (
          SELECT department_id FROM profiles WHERE id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    )
  );

CREATE POLICY "Users can send messages to accessible requests"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND request_id IN (
      SELECT id FROM requests WHERE
        requester_id = auth.uid()
        OR assignee_id = auth.uid()
        OR department_id IN (
          SELECT department_id FROM profiles WHERE id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    )
  );

-- ============================================================
-- ATTACHMENTS
-- ============================================================
CREATE POLICY "Users can view attachments for accessible requests"
  ON attachments FOR SELECT TO authenticated
  USING (
    request_id IN (
      SELECT id FROM requests WHERE
        requester_id = auth.uid()
        OR assignee_id = auth.uid()
        OR department_id IN (
          SELECT department_id FROM profiles WHERE id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    )
  );

CREATE POLICY "Users can upload attachments"
  ON attachments FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
-- Un utilisateur ne voit que ses propres notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- MESSAGE READS
-- ============================================================
CREATE POLICY "Users can view message reads"
  ON message_reads FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can mark messages as read"
  ON message_reads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
CREATE POLICY "Users can view activity logs for accessible requests"
  ON activity_logs FOR SELECT TO authenticated
  USING (
    request_id IN (
      SELECT id FROM requests WHERE
        requester_id = auth.uid()
        OR assignee_id = auth.uid()
        OR department_id IN (
          SELECT department_id FROM profiles WHERE id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    )
  );

CREATE POLICY "Users can create activity logs"
  ON activity_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
