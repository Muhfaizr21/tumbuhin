package database

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func RunKaderMigrations(db *pgxpool.Pool) error {
	if db == nil {
		log.Println("Kader migrations skipped: database pool is nil.")
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	schemaSQL := `
	-- 1.2 Data & Profil Balita
	CREATE TABLE IF NOT EXISTS tumbuhin_balita (
		id VARCHAR(50) PRIMARY KEY,
		nama VARCHAR(100) NOT NULL,
		jenis_kelamin CHAR(1) NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
		tanggal_lahir DATE NOT NULL,
		berat_lahir DECIMAL(4,2),
		panjang_lahir DECIMAL(5,2),
		nama_ibu VARCHAR(100),
		nama_ayah VARCHAR(100),
		no_wa VARCHAR(30),
		rt VARCHAR(10),
		rw VARCHAR(10),
		alergi TEXT,
		latitude DECIMAL(10, 8),
		longitude DECIMAL(11, 8),
		nik_hash CHAR(64) NOT NULL UNIQUE,
		magic_token CHAR(64) NOT NULL UNIQUE,
		status_gizi VARCHAR(20) DEFAULT 'Normal' CHECK (status_gizi IN ('Normal', 'Berisiko', 'Stunted', 'Wasted')),
		posyandu_name VARCHAR(120) DEFAULT 'Posyandu Melati 04',
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_balita_posyandu ON tumbuhin_balita(posyandu_name);
	CREATE INDEX IF NOT EXISTS idx_balita_nik_hash ON tumbuhin_balita(nik_hash);
	CREATE INDEX IF NOT EXISTS idx_balita_magic_token ON tumbuhin_balita(magic_token);

	-- 1.3 Input Timbangan & Z-Score
	CREATE TABLE IF NOT EXISTS tumbuhin_timbang (
		id BIGSERIAL PRIMARY KEY,
		balita_id VARCHAR(50) NOT NULL REFERENCES tumbuhin_balita(id) ON DELETE CASCADE,
		tanggal DATE NOT NULL,
		berat_kg DECIMAL(5,2) NOT NULL,
		tinggi_cm DECIMAL(5,1) NOT NULL,
		posisi_ukur VARCHAR(20) NOT NULL CHECK (posisi_ukur IN ('Terlentang', 'Berdiri')),
		tinggi_koreksi_cm DECIMAL(5,1),
		lingkar_kepala_cm DECIMAL(5,1),
		lila_cm DECIMAL(5,1),
		zscore_bb_u DECIMAL(4,2),
		zscore_tb_u DECIMAL(4,2),
		zscore_bb_tb DECIMAL(4,2),
		status_gizi VARCHAR(20),
		skor_risiko_faltering INT,
		asi_eksklusif BOOLEAN DEFAULT FALSE,
		vitamin_a BOOLEAN DEFAULT FALSE,
		obat_cacing BOOLEAN DEFAULT FALSE,
		catatan_bidan TEXT,
		dibuat_oleh BIGINT REFERENCES tumbuhin_users(id),
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_timbang_balita ON tumbuhin_timbang(balita_id);
	CREATE INDEX IF NOT EXISTS idx_timbang_tanggal ON tumbuhin_timbang(tanggal);

	-- 1.4 Smart KMS OCR History
	CREATE TABLE IF NOT EXISTS tumbuhin_ocr_history (
		id BIGSERIAL PRIMARY KEY,
		balita_id VARCHAR(50) NOT NULL REFERENCES tumbuhin_balita(id) ON DELETE CASCADE,
		image_url TEXT NOT NULL,
		extracted_json JSONB NOT NULL,
		status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
		verified_by BIGINT REFERENCES tumbuhin_users(id),
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_ocr_balita ON tumbuhin_ocr_history(balita_id);

	-- 1.5 AI Nutri-Chef Recipes
	CREATE TABLE IF NOT EXISTS tumbuhin_recipes (
		id BIGSERIAL PRIMARY KEY,
		balita_id VARCHAR(50) NOT NULL REFERENCES tumbuhin_balita(id) ON DELETE CASCADE,
		judul VARCHAR(200) NOT NULL,
		target_usia_bulan INT,
		tekstur VARCHAR(50),
		energi_kkal DECIMAL(8,2),
		protein_gram DECIMAL(6,2),
		bahan_json JSONB NOT NULL,
		langkah TEXT NOT NULL,
		sitasi_kemenkes TEXT,
		total_biaya INT,
		dibuat_oleh BIGINT REFERENCES tumbuhin_users(id),
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_recipes_balita ON tumbuhin_recipes(balita_id);

	-- 1.6 Antrean Sinkronisasi Offline (IndexedDB Sync Queue)
	CREATE TABLE IF NOT EXISTS tumbuhin_sync_queue (
		id BIGSERIAL PRIMARY KEY,
		tabel_target VARCHAR(50) NOT NULL,
		operasi VARCHAR(10) NOT NULL CHECK (operasi IN ('INSERT', 'UPDATE', 'DELETE')),
		payload_json JSONB NOT NULL,
		status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'conflict', 'failed')),
		dibuat_oleh BIGINT REFERENCES tumbuhin_users(id),
		created_at TIMESTAMPTZ DEFAULT NOW(),
		synced_at TIMESTAMPTZ
	);

	CREATE INDEX IF NOT EXISTS idx_sync_status ON tumbuhin_sync_queue(status);
	CREATE INDEX IF NOT EXISTS idx_sync_user ON tumbuhin_sync_queue(dibuat_oleh);

	-- 1.7 Distribusi WhatsApp & Magic Link Log
	CREATE TABLE IF NOT EXISTS tumbuhin_distribusi_log (
		id BIGSERIAL PRIMARY KEY,
		balita_id VARCHAR(50) NOT NULL REFERENCES tumbuhin_balita(id) ON DELETE CASCADE,
		jenis VARCHAR(30) NOT NULL CHECK (jenis IN ('whatsapp', 'qr_code', 'magic_link')),
		nomor_tujuan VARCHAR(30),
		pesan TEXT,
		status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered', 'read')),
		dibuat_oleh BIGINT REFERENCES tumbuhin_users(id),
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_distribusi_balita ON tumbuhin_distribusi_log(balita_id);
	`

	_, err := db.Exec(ctx, schemaSQL)
	if err != nil {
		log.Printf("Kader migration error: %v", err)
		return err
	}

	log.Println("Kader migrations completed successfully.")
	return nil
}