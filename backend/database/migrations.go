package database

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RunExtendedMigrations executes DDL for the clinical, GIS, home visit, and PMT evaluation tables.
// All migrations (Batch 1 & Batch 2) are unified in this file and are idempotent (safe to run on every boot).
func RunExtendedMigrations(db *pgxpool.Pool) error {
	if db == nil {
		log.Println("[MIGRATION] Skipped: database pool is nil")
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	ddlSQL := `
	-- 1. Enable extension if available (UUID & optional pgvector)
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
	CREATE EXTENSION IF NOT EXISTS "pgcrypto";
	DO $$
	BEGIN
		CREATE EXTENSION IF NOT EXISTS vector;
	EXCEPTION WHEN OTHERS THEN
		RAISE NOTICE 'pgvector extension not supported or permission denied, skipping';
	END $$;

	-- 2. Posyandu master data
	CREATE TABLE IF NOT EXISTS posyandus (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		name VARCHAR(120) NOT NULL,
		village_name VARCHAR(120) NOT NULL DEFAULT 'Desa Sukamaju',
		rw_code VARCHAR(10) NOT NULL DEFAULT '001',
		rt_code VARCHAR(10) NOT NULL DEFAULT '001',
		latitude DOUBLE PRECISION DEFAULT -6.5950378,
		longitude DOUBLE PRECISION DEFAULT 106.816635,
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	-- 3. Children / Balita
	CREATE TABLE IF NOT EXISTS children (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		nik_hash VARCHAR(64) NOT NULL UNIQUE,
		full_name VARCHAR(150) NOT NULL,
		gender VARCHAR(1) NOT NULL CHECK (gender IN ('L','P')),
		birth_date DATE NOT NULL,
		posyandu_id UUID REFERENCES posyandus(id) ON DELETE SET NULL,
		posyandu_name VARCHAR(120) DEFAULT '',
		village_name VARCHAR(120) DEFAULT 'Desa Sukamaju',
		rw_code VARCHAR(10) DEFAULT '001',
		rt_code VARCHAR(10) DEFAULT '001',
		latitude DOUBLE PRECISION DEFAULT -6.5950378,
		longitude DOUBLE PRECISION DEFAULT 106.816635,
		parent_name VARCHAR(150) DEFAULT '',
		parent_phone VARCHAR(30) DEFAULT '',
		magic_token VARCHAR(128) DEFAULT '',
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);

	ALTER TABLE children ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT -6.5950378;
	ALTER TABLE children ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT 106.816635;

	-- 4. WHO LMS Reference Standards
	CREATE TABLE IF NOT EXISTS who_lms_standards (
		id BIGSERIAL PRIMARY KEY,
		indicator VARCHAR(10) NOT NULL,
		gender VARCHAR(1) NOT NULL CHECK (gender IN ('L','P')),
		age_months INT NOT NULL,
		l_val DOUBLE PRECISION NOT NULL,
		m_val DOUBLE PRECISION NOT NULL,
		s_val DOUBLE PRECISION NOT NULL,
		UNIQUE(indicator, gender, age_months)
	);

	-- 5. Measurements / Hasil Timbang
	CREATE TABLE IF NOT EXISTS measurements (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
		measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
		age_months INT NOT NULL,
		weight_kg DOUBLE PRECISION NOT NULL,
		height_cm DOUBLE PRECISION NOT NULL,
		zscore_wfa DOUBLE PRECISION DEFAULT 0.0,
		zscore_hfa DOUBLE PRECISION DEFAULT 0.0,
		zscore_wfh DOUBLE PRECISION DEFAULT 0.0,
		nutrition_status VARCHAR(30) DEFAULT 'normal',
		faltering_risk_score DOUBLE PRECISION DEFAULT 0.0,
		faltering_risk_level VARCHAR(10) DEFAULT 'LOW',
		kader_id BIGINT REFERENCES tumbuhin_users(id) ON DELETE SET NULL,
		notes TEXT DEFAULT '',
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	-- 6. Interventions / Home Visit
	CREATE TABLE IF NOT EXISTS interventions (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
		bidan_id BIGINT REFERENCES tumbuhin_users(id) ON DELETE SET NULL,
		visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
		visit_status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (visit_status IN ('SCHEDULED','COMPLETED','FOLLOW_UP','REFERRED')),
		soap_subjective TEXT DEFAULT '',
		soap_objective TEXT DEFAULT '',
		soap_assessment TEXT DEFAULT '',
		soap_plan TEXT DEFAULT '',
		pmt_given BOOLEAN DEFAULT FALSE,
		pmt_type VARCHAR(80) DEFAULT '',
		supplement_given TEXT DEFAULT '',
		clinical_notes TEXT DEFAULT '',
		follow_up_date DATE,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);

	-- 7. MPASI Plans
	CREATE TABLE IF NOT EXISTS mpasi_plans (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
		generated_at TIMESTAMPTZ DEFAULT NOW(),
		daily_budget_idr INT DEFAULT 15000,
		available_ingredients TEXT DEFAULT '',
		recipe_payload JSONB DEFAULT '{}',
		kemenkes_citation TEXT DEFAULT ''
	);

	-- 8. Knowledge Chunks for RAG
	CREATE TABLE IF NOT EXISTS knowledge_chunks (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		source_doc VARCHAR(200) NOT NULL,
		chunk_index INT NOT NULL DEFAULT 0,
		content TEXT NOT NULL,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	DO $$
	BEGIN
		ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedding vector(768);
	EXCEPTION WHEN OTHERS THEN
		NULL;
	END $$;

	-- 9. Evaluation record for 90-day PMT cohort (Batch 2)
	CREATE TABLE IF NOT EXISTS pmt_evaluations (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		child_id UUID NOT NULL UNIQUE REFERENCES children(id) ON DELETE CASCADE,
		village_name VARCHAR(120) DEFAULT '',
		consumption_compliance_percent NUMERIC(5,2) DEFAULT 0 CHECK (consumption_compliance_percent BETWEEN 0 AND 100),
		distribution_compliance_percent NUMERIC(5,2) DEFAULT NULL CHECK (distribution_compliance_percent IS NULL OR distribution_compliance_percent BETWEEN 0 AND 100),
		notes TEXT DEFAULT '',
		updated_by BIGINT REFERENCES tumbuhin_users(id) ON DELETE SET NULL,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);

	-- 10. Performance indexes for queries (Batch 2)
	CREATE INDEX IF NOT EXISTS idx_pmt_evaluations_village ON pmt_evaluations (village_name);
	CREATE INDEX IF NOT EXISTS idx_interventions_visit_date ON interventions (visit_date);
	CREATE INDEX IF NOT EXISTS idx_interventions_child_id ON interventions (child_id);
	CREATE INDEX IF NOT EXISTS idx_children_village ON children (village_name);
	CREATE INDEX IF NOT EXISTS idx_measurements_child_measured_at ON measurements (child_id, measured_at);

	-- 11. Supervision audit locks (Batch 3)
	CREATE TABLE IF NOT EXISTS supervision_locks (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		village_name VARCHAR(120) NOT NULL DEFAULT 'Desa Sukamaju',
		posyandu_id UUID REFERENCES posyandus(id) ON DELETE CASCADE,
		period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
		period_year INT NOT NULL CHECK (period_year >= 2020),
		is_locked BOOLEAN NOT NULL DEFAULT TRUE,
		locked_at TIMESTAMPTZ DEFAULT NOW(),
		locked_by BIGINT REFERENCES tumbuhin_users(id) ON DELETE SET NULL,
		locked_by_name VARCHAR(150) DEFAULT '',
		audit_notes TEXT DEFAULT '',
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW(),
		UNIQUE(village_name, posyandu_id, period_month, period_year)
	);
	CREATE INDEX IF NOT EXISTS idx_supervision_locks_village ON supervision_locks(village_name, period_year, period_month);
	`

	if _, err := db.Exec(ctx, ddlSQL); err != nil {
		log.Printf("[MIGRATION ERROR] Failed executing extended DDL: %v", err)
		return err
	}

	log.Println("[MIGRATION] Extended clinical, GIS & PMT tables created successfully.")

	// Seed Posyandu master data if empty
	seedPosyanduSQL := `
	INSERT INTO posyandus (name, village_name, rw_code, rt_code, latitude, longitude)
	SELECT name, village_name, rw_code, rt_code, latitude, longitude
	FROM (VALUES
		('Posyandu Melati 01', 'Desa Sukamaju', '001', '001', -6.591200, 106.799800),
		('Posyandu Melati 02', 'Desa Sukamaju', '002', '001', -6.593500, 106.804200),
		('Posyandu Melati 03', 'Desa Sukamaju', '003', '002', -6.596800, 106.808900),
		('Posyandu Melati 04', 'Desa Sukamaju', '004', '001', -6.601200, 106.812300),
		('Posyandu Mawar 05', 'Desa Sukamaju', '005', '003', -6.604500, 106.816700),
		('Posyandu Mawar 06', 'Desa Sukamaju', '006', '002', -6.608900, 106.821000),
		('Posyandu Kenanga 07', 'Desa Sukamaju', '007', '001', -6.612000, 106.825600),
		('Posyandu Kenanga 08', 'Desa Sukamaju', '008', '004', -6.616500, 106.831000)
	) AS vals(name, village_name, rw_code, rt_code, latitude, longitude)
	WHERE NOT EXISTS (SELECT 1 FROM posyandus LIMIT 1);
	`
	if _, err := db.Exec(ctx, seedPosyanduSQL); err != nil {
		log.Printf("[MIGRATION WARNING] Failed seeding posyandus: %v", err)
	}

	// Seed WHO LMS reference standards sample (idempotent ON CONFLICT DO NOTHING)
	seedWhoSQL := `
	INSERT INTO who_lms_standards (indicator, gender, age_months, l_val, m_val, s_val)
	VALUES
		('HFA', 'L', 0, 1.0, 49.88, 0.038),
		('HFA', 'L', 12, 1.0, 75.75, 0.034),
		('HFA', 'L', 24, 1.0, 87.12, 0.033),
		('HFA', 'P', 0, 1.0, 49.14, 0.038),
		('HFA', 'P', 12, 1.0, 74.02, 0.035),
		('HFA', 'P', 24, 1.0, 85.70, 0.034),
		('WFA', 'L', 0, 0.3487, 3.346, 0.146),
		('WFA', 'L', 12, -0.0611, 9.648, 0.117),
		('WFA', 'P', 0, 0.3809, 3.232, 0.141),
		('WFA', 'P', 12, -0.0305, 8.948, 0.118)
	ON CONFLICT (indicator, gender, age_months) DO NOTHING;
	`
	if _, err := db.Exec(ctx, seedWhoSQL); err != nil {
		log.Printf("[MIGRATION WARNING] Failed seeding WHO standards: %v", err)
	}

	// Pembersihan data dummy/seeder balita agar database murni hanya berisi data riil pengguna
	cleanupDummySQL := `
	DELETE FROM children 
	WHERE nik_hash IN ('nik_hash_001', 'nik_hash_002', 'nik_hash_003', 'nik_hash_004') 
	   OR full_name LIKE 'Balita Sehat No. %';
	`
	if _, err := db.Exec(ctx, cleanupDummySQL); err != nil {
		log.Printf("[MIGRATION WARNING] Cleanup dummy children notice: %v", err)
	} else {
		log.Println("[MIGRATION] Dummy seeder children cleaned up successfully. Database is now pure user data.")
	}

	return nil
}

// RunBatch2Migrations is retained for compatibility, delegating to the unified migration runner.
func RunBatch2Migrations(db *pgxpool.Pool) error {
	return nil
}
