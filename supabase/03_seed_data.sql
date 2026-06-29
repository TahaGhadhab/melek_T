-- ============================================================
-- OPS HUB — DONNÉES DE DÉPART (SEED)
-- ============================================================
-- Exécute CE FICHIER APRÈS le 01_schema.sql et 02_rls_policies.sql
-- Ces données sont nécessaires au fonctionnement de l'appli.
-- ============================================================

-- ============================================================
-- DÉPARTEMENTS
-- ============================================================
INSERT INTO departments (name, slug, description) VALUES
  ('Informatique (IT)', 'it', 'Services informatiques, accès, matériel, logiciels'),
  ('Ressources Humaines', 'rh', 'Paie, recrutement, administratif'),
  ('Finance & Comptabilité', 'finance', 'Factures, budgets, notes de frais'),
  ('Marketing & Communication', 'marketing', 'Campagnes, branding, communication interne'),
  ('Direction Générale', 'direction', 'Validations stratégiques, décisions'),
  ('Logistique', 'logistique', 'Livraisons, stocks, fournisseurs'),
  ('Juridique', 'juridique', 'Contrats, conformité, contentieux')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- STATUTS (en anglais pour cohérence avec le design system)
-- ============================================================
INSERT INTO statuses (name, slug, color, position) VALUES
  ('New', 'new', '#378ADD', 1),
  ('In Progress', 'in_progress', '#EF9F27', 2),
  ('Waiting', 'waiting', '#BA7517', 3),
  ('Blocked', 'blocked', '#E24B4A', 4),
  ('Resolved', 'resolved', '#639922', 5),
  ('Closed', 'closed', '#888780', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PRIORITÉS (en anglais pour cohérence avec le design system)
-- ============================================================
INSERT INTO priorities (name, slug, color, position) VALUES
  ('Low', 'low', '#888780', 1),
  ('Medium', 'medium', '#378ADD', 2),
  ('High', 'high', '#EF9F27', 3),
  ('Urgent', 'urgent', '#E24B4A', 4)
ON CONFLICT (slug) DO NOTHING;
