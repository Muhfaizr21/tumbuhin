package database

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

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
		parent_father_name VARCHAR(150) DEFAULT '',
		parent_phone VARCHAR(30) DEFAULT '',
		birth_weight DOUBLE PRECISION DEFAULT 0.0,
		birth_height DOUBLE PRECISION DEFAULT 0.0,
		notes TEXT DEFAULT '',
		magic_token VARCHAR(128) DEFAULT '',
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);

	ALTER TABLE children ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT -6.5950378;
	ALTER TABLE children ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT 106.816635;
	ALTER TABLE children ALTER COLUMN magic_token SET DEFAULT ('magic-' || replace(gen_random_uuid()::text, '-', ''));
	UPDATE children
	SET magic_token = 'magic-' || replace(gen_random_uuid()::text, '-', '')
	WHERE COALESCE(magic_token, '') = '';
	CREATE UNIQUE INDEX IF NOT EXISTS idx_children_magic_token
	ON children(magic_token)
	WHERE COALESCE(magic_token, '') <> '';

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
		age_months INT DEFAULT 12,
		weight_kg DOUBLE PRECISION NOT NULL,
		height_cm DOUBLE PRECISION NOT NULL,
		head_circumference DOUBLE PRECISION DEFAULT 0.0,
		arm_circumference DOUBLE PRECISION DEFAULT 0.0,
		measurement_pos VARCHAR(10) DEFAULT 'berdiri',
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

	-- 12. Server-side audit log + idempotency gate for the offline IndexedDB queue
	CREATE TABLE IF NOT EXISTS offline_sync_items (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		kader_id BIGINT REFERENCES tumbuhin_users(id) ON DELETE SET NULL,
		client_id VARCHAR(160) NOT NULL,
		item_type VARCHAR(30) NOT NULL,
		status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
			CHECK (status IN ('PENDING','SYNCED','CONFLICT','FAILED')),
		server_ref_id VARCHAR(120) DEFAULT '',
		message TEXT DEFAULT '',
		payload JSONB DEFAULT '{}'::jsonb,
		attempts INT NOT NULL DEFAULT 1,
		synced_at TIMESTAMPTZ,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW(),
		UNIQUE(kader_id, client_id)
	);
	CREATE INDEX IF NOT EXISTS idx_offline_sync_items_kader_status ON offline_sync_items(kader_id, status);
	CREATE INDEX IF NOT EXISTS idx_offline_sync_items_updated_at ON offline_sync_items(updated_at DESC);

	-- 13. Super Admin extensions for posyandus & knowledge_chunks
	ALTER TABLE posyandus ADD COLUMN IF NOT EXISTS address VARCHAR(220) DEFAULT 'Balai Warga RW, Desa Sukamaju';
	ALTER TABLE posyandus ADD COLUMN IF NOT EXISTS schedule_day VARCHAR(100) DEFAULT 'Sabtu Minggu Ke-2 (08.30 - 11.30 WIB)';
	ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS category VARCHAR(80) DEFAULT 'Pedoman PMBA';
	ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS target_age VARCHAR(40) DEFAULT '6-24 Bulan';

	-- 14. Local Food Commodities Catalog (Managed by Super Admin & Consumed by AI Nutri-Chef)
	CREATE TABLE IF NOT EXISTS local_foods (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		food_key VARCHAR(40) NOT NULL UNIQUE,
		name VARCHAR(150) NOT NULL,
		category VARCHAR(60) NOT NULL DEFAULT 'Protein Hewani',
		unit_label VARCHAR(60) NOT NULL DEFAULT '1 porsi',
		estimated_price_idr INT NOT NULL DEFAULT 2000,
		calories_kcal INT NOT NULL DEFAULT 80,
		protein_grams DOUBLE PRECISION NOT NULL DEFAULT 6.0,
		is_animal_protein BOOLEAN NOT NULL DEFAULT FALSE,
		allergen_tag VARCHAR(60) DEFAULT '',
		is_available BOOLEAN NOT NULL DEFAULT TRUE,
		village_name VARCHAR(120) DEFAULT 'Desa Sukamaju',
		updated_at TIMESTAMPTZ DEFAULT NOW(),
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	-- 15. Village Governance & System Settings (Super Admin Module 3.7)
	CREATE TABLE IF NOT EXISTS village_settings (
		village_name VARCHAR(120) PRIMARY KEY,
		district_name VARCHAR(120) NOT NULL DEFAULT 'Kecamatan Cibinong',
		regency_name VARCHAR(120) NOT NULL DEFAULT 'Kabupaten Bogor',
		province_name VARCHAR(120) NOT NULL DEFAULT 'Jawa Barat',
		village_head_name VARCHAR(150) NOT NULL DEFAULT 'H. Suryadi Pratama, S.AP',
		puskesmas_name VARCHAR(150) NOT NULL DEFAULT 'UPTD Puskesmas Sukamaju',
		default_posyandu_schedule VARCHAR(120) NOT NULL DEFAULT 'Sabtu Minggu Ke-2 Setiap Bulan (08.30 - 11.30 WIB)',
		wa_template TEXT NOT NULL DEFAULT 'Halo Ibu/Bapak {parent_name}, berikut ringkasan tumbuh kembang Ananda {child_name} bulan ini: BB {weight_kg} kg, TB {height_cm} cm ({nutrition_status}). Pantau kurva KMS & resep MPASI harian di Kartu Gizi Digital: {magic_link}',
		stunting_target_percent DOUBLE PRECISION NOT NULL DEFAULT 14.0,
		auto_sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
		sha256_enforced BOOLEAN NOT NULL DEFAULT TRUE,
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);
	`

	if _, err := db.Exec(ctx, ddlSQL); err != nil {
		log.Printf("[MIGRATION ERROR] Failed executing extended DDL: %v", err)
		return err
	}

	log.Println("[MIGRATION] Extended clinical, GIS & PMT tables created successfully.")

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

	seedWhoSQL := `
	INSERT INTO who_lms_standards (indicator, gender, age_months, l_val, m_val, s_val)
	VALUES
		('HFA', 'L', 0, 1.0, 49.88, 0.038),
		('HFA', 'L', 3, 1.0, 61.43, 0.034),
		('HFA', 'L', 6, 1.0, 67.62, 0.033),
		('HFA', 'L', 9, 1.0, 71.97, 0.033),
		('HFA', 'L', 12, 1.0, 75.75, 0.034),
		('HFA', 'L', 18, 1.0, 82.26, 0.034),
		('HFA', 'L', 24, 1.0, 87.12, 0.033),
		('HFA', 'L', 36, 1.0, 96.08, 0.038),
		('HFA', 'L', 48, 1.0, 103.32, 0.039),
		('HFA', 'L', 60, 1.0, 109.96, 0.041),
		('HFA', 'P', 0, 1.0, 49.14, 0.038),
		('HFA', 'P', 3, 1.0, 59.80, 0.035),
		('HFA', 'P', 6, 1.0, 65.73, 0.034),
		('HFA', 'P', 9, 1.0, 70.14, 0.035),
		('HFA', 'P', 12, 1.0, 74.02, 0.035),
		('HFA', 'P', 18, 1.0, 80.71, 0.036),
		('HFA', 'P', 24, 1.0, 85.70, 0.034),
		('HFA', 'P', 36, 1.0, 95.05, 0.039),
		('HFA', 'P', 48, 1.0, 102.73, 0.041),
		('HFA', 'P', 60, 1.0, 109.42, 0.042),
		('WFA', 'L', 0, 0.3487, 3.346, 0.146),
		('WFA', 'L', 3, 0.1738, 6.376, 0.120),
		('WFA', 'L', 6, 0.0756, 7.934, 0.115),
		('WFA', 'L', 9, 0.0050, 8.901, 0.114),
		('WFA', 'L', 12, -0.0611, 9.648, 0.117),
		('WFA', 'L', 18, -0.1570, 10.938, 0.119),
		('WFA', 'L', 24, -0.2203, 12.152, 0.121),
		('WFA', 'L', 36, -0.3125, 14.342, 0.125),
		('WFA', 'L', 48, -0.3712, 16.336, 0.130),
		('WFA', 'L', 60, -0.4150, 18.337, 0.135),
		('WFA', 'P', 0, 0.3809, 3.232, 0.141),
		('WFA', 'P', 3, 0.1970, 5.845, 0.126),
		('WFA', 'P', 6, 0.0813, 7.297, 0.122),
		('WFA', 'P', 9, 0.0136, 8.225, 0.121),
		('WFA', 'P', 12, -0.0305, 8.948, 0.118),
		('WFA', 'P', 18, -0.1180, 10.231, 0.122),
		('WFA', 'P', 24, -0.1912, 11.477, 0.126),
		('WFA', 'P', 36, -0.2980, 13.850, 0.132),
		('WFA', 'P', 48, -0.3690, 16.070, 0.138),
		('WFA', 'P', 60, -0.4220, 18.219, 0.144)
	ON CONFLICT (indicator, gender, age_months) DO NOTHING;
	`
	if _, err := db.Exec(ctx, seedWhoSQL); err != nil {
		log.Printf("[MIGRATION WARNING] Failed seeding WHO standards: %v", err)
	}

	seedLocalFoodsSQL := `
	INSERT INTO local_foods (
		food_key, name, category, unit_label, estimated_price_idr,
		calories_kcal, protein_grams, is_animal_protein, allergen_tag, is_available, village_name
	) VALUES
		('telur', 'Telur Ayam Kampung / Negeri', 'Protein Hewani', '1 butir (55 g)', 2000, 78, 6.3, TRUE, 'telur', TRUE, 'Desa Sukamaju'),
		('lele', 'Ikan Lele Segar Desa', 'Protein Hewani', '1 ekor kecil (75 g)', 5000, 95, 15.0, TRUE, 'ikan', TRUE, 'Desa Sukamaju'),
		('hati', 'Hati Ayam Segar', 'Protein Hewani', '1 potong (45 g)', 3000, 90, 12.0, TRUE, '', TRUE, 'Desa Sukamaju'),
		('kembung', 'Ikan Kembung Segar', 'Protein Hewani', '1 potong fillet (60 g)', 5500, 102, 16.2, TRUE, 'ikan', TRUE, 'Desa Sukamaju'),
		('puyuh', 'Telur Puyuh Rebus', 'Protein Hewani', '3 butir (35 g)', 3000, 54, 4.5, TRUE, 'telur', TRUE, 'Desa Sukamaju'),
		('tempe', 'Tempe Kedelai Lokal', 'Protein Nabati', '1 potong sedang (50 g)', 1000, 80, 7.5, FALSE, 'kedelai', TRUE, 'Desa Sukamaju'),
		('tahu', 'Tahu Putih Padat', 'Protein Nabati', '1 potong (50 g)', 1000, 42, 4.2, FALSE, 'kedelai', TRUE, 'Desa Sukamaju'),
		('bayam', 'Bayam Hijau Segar', 'Sayur & Buah', '1/2 ikat (50 g)', 2000, 20, 1.5, FALSE, '', TRUE, 'Desa Sukamaju'),
		('kelor', 'Pucuk Daun Kelor', 'Sayur & Buah', '1 genggam (30 g)', 500, 25, 2.5, FALSE, '', TRUE, 'Desa Sukamaju'),
		('labu', 'Labu Kuning Manis', 'Karbohidrat', '1 potong (70 g)', 2000, 45, 1.0, FALSE, '', TRUE, 'Desa Sukamaju'),
		('minyak', 'Minyak Kelapa / Santan', 'Sumber Lemak', '1 sdt (5 ml)', 500, 45, 0.0, FALSE, '', TRUE, 'Desa Sukamaju')
	ON CONFLICT (food_key) DO NOTHING;
	`
	if _, err := db.Exec(ctx, seedLocalFoodsSQL); err != nil {
		log.Printf("[MIGRATION WARNING] Failed seeding local foods: %v", err)
	}

	seedKnowledgeChunksSQL := `
	INSERT INTO knowledge_chunks (source_doc, chunk_index, category, target_age, content)
	SELECT source_doc, chunk_index, category, target_age, content
	FROM (VALUES
		('Buku KIA Kemenkes RI 2024 - PMBA 6-8 Bulan', 0, 'Standar Tekstur & Porsi', '6-8 Bulan', 'Usia 6-8 bulan: beri MPASI 2-3 kali makan utama dan 1-2 kali makanan selingan per hari. Porsi awal 2-3 sendok makan, tingkatkan bertahap. Tekstur lumat atau disaring. ASI tetap diberikan sampai 2 tahun.'),
		('Buku KIA Kemenkes RI 2024 - PMBA 9-11 Bulan', 0, 'Standar Tekstur & Porsi', '9-11 Bulan', 'Usia 9-11 bulan: beri 3-4 kali makan utama dan 1-2 kali selingan. Porsi sekitar setengah mangkuk ukuran 250 ml. Tekstur cincang halus atau makanan yang dapat dipegang bayi. Variasi bahan pangan lokal dianjurkan.'),
		('Buku KIA Kemenkes RI 2024 - PMBA 12-24 Bulan', 0, 'Standar Tekstur & Porsi', '12-24 Bulan', 'Usia 12-24 bulan: beri 3-4 kali makan utama dan 1-2 kali selingan, porsi sekitar tiga perempat mangkuk 250 ml. Tekstur makanan keluarga yang dicincang. ASI dapat diteruskan hingga usia 2 tahun.'),
		('Pedoman Pemenuhan Gizi Seimbang Kemenkes RI - Protein Hewani', 0, 'Protein Hewani & Mikronutrien', '6-24 Bulan', 'Setiap kali makan sebaiknya mengandung sumber protein hewani seperti telur, ikan, ayam, hati, atau daging. Protein hewani mendukung pertumbuhan linear dan pencegahan stunting. Telur dapat diberikan satu butir per hari bila tidak ada alergi.'),
		('Pedoman Pemenuhan Gizi Seimbang Kemenkes RI - Lemak Tambahan', 0, 'Kepadatan Energi & Lemak', '6-24 Bulan', 'Tambahkan sumber lemak pada setiap porsi MPASI, misalnya satu sendok teh minyak kelapa, santan, atau alpukat. Lemak meningkatkan kepadatan energi dan membantu penyerapan vitamin larut lemak A, D, E, dan K.'),
		('Buku Resep Makanan Lokal Balita dan Ibu Hamil Kemenkes RI 2024 - Gula dan Garam', 0, 'Batas Gula & Garam', '6-24 Bulan', 'Hindari penambahan gula dan garam pada makanan bayi di bawah 12 bulan. Untuk usia 12-24 bulan, batasi gula maksimal satu sendok teh per hari dan garam maksimal seperlima sendok teh per hari. Gunakan bumbu alami seperti bawang dan daun aromatik.'),
		('Buku KIA Kemenkes RI 2024 - Pemberian Makan Responsif', 0, 'Pola Asuh & Responsif', '6-24 Bulan', 'Terapkan pemberian makan responsif: beri makan perlahan, kenali tanda lapar dan kenyang, jangan memaksa. Naikkan tekstur sesuai usia; setelah 9 bulan makanan tidak perlu disaring lagi. Sajikan variasi pangan lokal bergizi agar anak terbiasa.'),
		('Petunjuk Teknis Pencegahan dan Penanganan Stunting Kemenkes RI', 0, 'Intervensi Stunting & PMT', '0-60 Bulan', 'Balita dengan panjang atau tinggi badan menurut umur di bawah minus dua standar deviasi dikategorikan stunting. Intervensi mencakup pemberian MPASI padat gizi kaya protein hewani, pemantauan pertumbuhan bulanan, dan rujukan ke fasilitas kesehatan bila tidak membaik.'),
		('Buku KIA Kemenkes RI 2024 - Pencegahan Alergi Makanan', 0, 'Keamanan & Alergi', '6-24 Bulan', 'Kenalkan satu bahan makanan baru setiap kali, beri selama tiga sampai lima hari sebelum menambah bahan lain. Hentikan bahan dan konsultasikan bila muncul ruam, muntah, diare, atau sesak setelah makan.'),
		('Pedoman Pemenuhan Gizi Seimbang Kemenkes RI - Keamanan Pangan', 0, 'Sanitasi & Higienitas', '6-24 Bulan', 'Cuci tangan sebelum menyiapkan makanan, gunakan alat masak dan wadah bersih. Masak bahan hingga matang, sajikan segera, dan simpan sisa makanan paling lama dua jam pada suhu ruang. Hindari makanan mentah untuk balita.')
	) AS vals(source_doc, chunk_index, category, target_age, content)
	WHERE NOT EXISTS (
		SELECT 1 FROM knowledge_chunks kc
		WHERE kc.source_doc = vals.source_doc AND kc.chunk_index = vals.chunk_index
	);
	`
	if _, err := db.Exec(ctx, seedKnowledgeChunksSQL); err != nil {
		log.Printf("[MIGRATION WARNING] Failed seeding knowledge chunks: %v", err)
	}

	seedVillageSettingsSQL := `
	INSERT INTO village_settings (
		village_name, district_name, regency_name, province_name,
		village_head_name, puskesmas_name, default_posyandu_schedule
	) VALUES (
		'Desa Sukamaju', 'Kecamatan Cibinong', 'Kabupaten Bogor', 'Jawa Barat',
		'H. Suryadi Pratama, S.AP', 'UPTD Puskesmas Sukamaju',
		'Sabtu Minggu Ke-2 Setiap Bulan (08.30 - 11.30 WIB)'
	) ON CONFLICT (village_name) DO NOTHING;
	`
	if _, err := db.Exec(ctx, seedVillageSettingsSQL); err != nil {
		log.Printf("[MIGRATION WARNING] Failed seeding village settings: %v", err)
	}

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

func RunBatch2Migrations(db *pgxpool.Pool) error {
	return nil
}
