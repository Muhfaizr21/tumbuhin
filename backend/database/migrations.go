package database

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RunExtendedMigrations executes DDL for the clinical and GIS data tables
func RunExtendedMigrations(db *pgxpool.Pool) error {
	if db == nil {
		log.Println("[MIGRATION] Skipped: database pool is nil")
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	ddlSQL := `
	-- 1. Enable extension if available (optional pgvector)
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
		parent_name VARCHAR(150) DEFAULT '',
		parent_phone VARCHAR(30) DEFAULT '',
		magic_token VARCHAR(128) DEFAULT '',
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);

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
	`

	if _, err := db.Exec(ctx, ddlSQL); err != nil {
		log.Printf("[MIGRATION ERROR] Failed executing extended DDL: %v", err)
		return err
	}

	log.Println("[MIGRATION] Extended clinical & GIS tables created successfully.")

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

	// Seed Children & Measurements if empty
	seedClinicalSQL := `
	DO $$
	DECLARE
		pos1_id UUID; pos2_id UUID; pos3_id UUID; pos4_id UUID;
		pos5_id UUID; pos6_id UUID; pos7_id UUID; pos8_id UUID;
		ch_id UUID;
	BEGIN
		IF NOT EXISTS (SELECT 1 FROM children LIMIT 1) THEN
			SELECT id INTO pos1_id FROM posyandus WHERE name = 'Posyandu Melati 01' LIMIT 1;
			SELECT id INTO pos2_id FROM posyandus WHERE name = 'Posyandu Melati 02' LIMIT 1;
			SELECT id INTO pos3_id FROM posyandus WHERE name = 'Posyandu Melati 03' LIMIT 1;
			SELECT id INTO pos4_id FROM posyandus WHERE name = 'Posyandu Melati 04' LIMIT 1;
			SELECT id INTO pos5_id FROM posyandus WHERE name = 'Posyandu Mawar 05' LIMIT 1;
			SELECT id INTO pos6_id FROM posyandus WHERE name = 'Posyandu Mawar 06' LIMIT 1;
			SELECT id INTO pos7_id FROM posyandus WHERE name = 'Posyandu Kenanga 07' LIMIT 1;
			SELECT id INTO pos8_id FROM posyandus WHERE name = 'Posyandu Kenanga 08' LIMIT 1;

			-- 1. Bayu Aditya (Severely Stunted)
			INSERT INTO children (nik_hash, full_name, gender, birth_date, posyandu_id, posyandu_name, village_name, rw_code, rt_code, parent_name, parent_phone)
			VALUES ('nik_hash_001', 'Bayu Aditya', 'L', '2025-09-10', pos3_id, 'Posyandu Melati 03', 'Desa Sukamaju', 'RW 03', 'RT 02', 'Ibu Ratna', '081299112201')
			RETURNING id INTO ch_id;
			INSERT INTO measurements (child_id, age_months, weight_kg, height_cm, zscore_wfa, zscore_hfa, zscore_wfh, nutrition_status, faltering_risk_score, faltering_risk_level)
			VALUES (ch_id, 14, 8.1, 71.0, -2.8, -3.4, -1.9, 'severely_stunted', 94.5, 'HIGH');
			INSERT INTO interventions (child_id, visit_status, clinical_notes)
			VALUES (ch_id, 'SCHEDULED', 'Kunjungan evaluasi sanitasi & rujukan Puskesmas');

			-- 2. Kiran Cahyani (Severely Wasted)
			INSERT INTO children (nik_hash, full_name, gender, birth_date, posyandu_id, posyandu_name, village_name, rw_code, rt_code, parent_name, parent_phone)
			VALUES ('nik_hash_002', 'Kiran Cahyani', 'P', '2026-02-14', pos5_id, 'Posyandu Mawar 05', 'Desa Sukamaju', 'RW 05', 'RT 01', 'Ibu Siti Maryam', '081299112202')
			RETURNING id INTO ch_id;
			INSERT INTO measurements (child_id, age_months, weight_kg, height_cm, zscore_wfa, zscore_hfa, zscore_wfh, nutrition_status, faltering_risk_score, faltering_risk_level)
			VALUES (ch_id, 9, 6.0, 68.5, -3.1, -2.3, -3.2, 'severely_wasted', 91.2, 'HIGH');
			INSERT INTO interventions (child_id, visit_status, clinical_notes)
			VALUES (ch_id, 'SCHEDULED', 'Pemberian F-75 & PMT Pemulihan Darurat');

			-- 3. Rian Ardiansyah (Severely Stunted)
			INSERT INTO children (nik_hash, full_name, gender, birth_date, posyandu_id, posyandu_name, village_name, rw_code, rt_code, parent_name, parent_phone)
			VALUES ('nik_hash_003', 'Rian Ardiansyah', 'L', '2025-01-20', pos8_id, 'Posyandu Kenanga 08', 'Desa Sukamaju', 'RW 08', 'RT 03', 'Ibu Fitri', '081299112203')
			RETURNING id INTO ch_id;
			INSERT INTO measurements (child_id, age_months, weight_kg, height_cm, zscore_wfa, zscore_hfa, zscore_wfh, nutrition_status, faltering_risk_score, faltering_risk_level)
			VALUES (ch_id, 22, 9.2, 77.2, -2.9, -3.2, -1.8, 'severely_stunted', 88.7, 'HIGH');

			-- 4. Farhan Ramadhan (Normal tapi Faltering Risk 84%)
			INSERT INTO children (nik_hash, full_name, gender, birth_date, posyandu_id, posyandu_name, village_name, rw_code, rt_code, parent_name, parent_phone)
			VALUES ('nik_hash_004', 'Farhan Ramadhan', 'L', '2025-08-15', pos1_id, 'Posyandu Melati 01', 'Desa Sukamaju', 'RW 01', 'RT 02', 'Ibu Wulandari', '081299112211')
			RETURNING id INTO ch_id;
			INSERT INTO measurements (child_id, age_months, weight_kg, height_cm, zscore_wfa, zscore_hfa, zscore_wfh, nutrition_status, faltering_risk_score, faltering_risk_level)
			VALUES (ch_id, 15, 8.9, 73.0, -1.2, -1.7, -0.5, 'normal', 84.3, 'HIGH');
			INSERT INTO interventions (child_id, visit_status, clinical_notes)
			VALUES (ch_id, 'SCHEDULED', 'Intervensi pre-stunting deteksi penurunan berat badan');
		END IF;

		-- Bersihkan data dummy seeder lama jika ada agar tabel bersih & fokus
		DELETE FROM children WHERE full_name LIKE 'Balita Sehat No. %';
	END $$;
	`

	if _, err := db.Exec(ctx, seedClinicalSQL); err != nil {
		log.Printf("[MIGRATION WARNING] Failed seeding clinical children data: %v", err)
	} else {
		log.Println("[MIGRATION] Successfully seeded children, measurements & interventions.")
	}

	return nil
}
