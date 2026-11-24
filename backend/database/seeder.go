package database

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"tumbuhin-backend/models"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// SeedAccount defines the seed credentials for each of the 4 system roles
type SeedAccount struct {
	FullName     string
	Email        string
	Phone        string
	PlainPass    string
	Role         string
	PosyanduName string
	VillageName  string
	MagicToken   string
}

// DefaultSeedAccounts returns the official seeded accounts for the 4 Tumbuhin roles
func DefaultSeedAccounts() []SeedAccount {
	return []SeedAccount{
		{
			FullName:     "Siti Aminah (Petugas Posyandu Melati 04)",
			Email:        "kader@tumbuhin.id",
			Phone:        "081288990011",
			PlainPass:    "kadersehat2026",
			Role:         models.RoleKader,
			PosyanduName: "Posyandu Melati 04",
			VillageName:  "Desa Sukamaju",
			MagicToken:   "",
		},
		{
			FullName:     "Bidan Rina Kartika, A.Md.Keb",
			Email:        "bidan@tumbuhin.id",
			Phone:        "081288990022",
			PlainPass:    "bidansiaga2026",
			Role:         models.RoleBidan,
			PosyanduName: "Puskesmas Sukamaju",
			VillageName:  "Desa Sukamaju",
			MagicToken:   "",
		},
		{
			FullName:     "Hendra Wijaya (Super Admin Desa)",
			Email:        "admin@tumbuhin.id",
			Phone:        "081288990033",
			PlainPass:    "adminsehat2026",
			Role:         models.RoleAdmin,
			PosyanduName: "Pusat Data Desa Sukamaju",
			VillageName:  "Desa Sukamaju",
			MagicToken:   "",
		},
		{
			FullName:     "Ibu Dewi Lestari (Ortu Balita Andi Pratama)",
			Email:        "ortu@tumbuhin.id",
			Phone:        "081288990044",
			PlainPass:    "ortusehat2026",
			Role:         models.RoleOrtu,
			PosyanduName: "Posyandu Melati 04",
			VillageName:  "Desa Sukamaju",
			MagicToken:   "magic-balita-andi-2026-tumbuhin-sehat",
		},
	}
}

// RunMigrationAndSeeder creates the required PostgreSQL schema and seeds the 4 core roles idempotently
func RunMigrationAndSeeder(db *pgxpool.Pool) error {
	if db == nil {
		log.Println("Seeder skipped: database pool is nil (using in-memory fallback).")
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()

	schemaSQL := `
	CREATE TABLE IF NOT EXISTS tumbuhin_users (
		id BIGSERIAL PRIMARY KEY,
		full_name VARCHAR(150) NOT NULL,
		email VARCHAR(150) UNIQUE NOT NULL,
		phone VARCHAR(30) UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		role VARCHAR(30) NOT NULL CHECK (role IN ('kader', 'bidan', 'admin', 'ortu')),
		posyandu_name VARCHAR(120) DEFAULT 'Posyandu Melati 04',
		village_name VARCHAR(120) DEFAULT 'Desa Sukamaju',
		magic_token VARCHAR(128) DEFAULT '',
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);
	`

	if _, err := db.Exec(ctx, schemaSQL); err != nil {
		log.Printf("Warning during schema creation: %v", err)
		return err
	}

	accounts := DefaultSeedAccounts()
	for _, acc := range accounts {
		hashedBytes, err := bcrypt.GenerateFromPassword([]byte(acc.PlainPass), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		upsertSQL := `
		INSERT INTO tumbuhin_users (
			full_name, email, phone, password_hash, role, posyandu_name, village_name, magic_token, is_active, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW())
		ON CONFLICT (email) DO UPDATE SET
			full_name = EXCLUDED.full_name,
			phone = EXCLUDED.phone,
			password_hash = EXCLUDED.password_hash,
			role = EXCLUDED.role,
			posyandu_name = EXCLUDED.posyandu_name,
			village_name = EXCLUDED.village_name,
			magic_token = EXCLUDED.magic_token,
			updated_at = NOW();
		`

		if _, err := db.Exec(
			ctx,
			upsertSQL,
			acc.FullName,
			acc.Email,
			acc.Phone,
			string(hashedBytes),
			acc.Role,
			acc.PosyanduName,
			acc.VillageName,
			acc.MagicToken,
		); err != nil {
			log.Printf("Failed to seed account %s (%s): %v", acc.Email, acc.Role, err)
			return err
		}

		log.Printf("[SEEDER] Role %-6s | Email: %-20s | Phone: %-14s | Pass: %s", acc.Role, acc.Email, acc.Phone, acc.PlainPass)
	}

	log.Println("[SEEDER] All 4 role accounts successfully seeded to PostgreSQL.")

	// Run extended migrations for posyandus, children, measurements, etc.
	if err := RunExtendedMigrations(db); err != nil {
		log.Printf("[SEEDER] Extended migrations encountered issue: %v", err)
	}

	// Seed 2 realistic children for Magic Link testing (Andi Pratama - Hijau & Siti Nurhaliza - Kuning/PMT)
	if err := SeedRealisticBalita(db); err != nil {
		log.Printf("[SEEDER] Seed realistic balita notice: %v", err)
	}

	return nil
}

// SeedRealisticBalita populates two rich children with measurements, mpasi plans, and clinical notes.
func SeedRealisticBalita(db *pgxpool.Pool) error {
	if db == nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()

	// 1. Get Posyandu Melati 04 ID
	var posyanduID string
	err := db.QueryRow(ctx, "SELECT id FROM posyandus WHERE name = 'Posyandu Melati 04' LIMIT 1").Scan(&posyanduID)
	if err != nil {
		posyanduID = "00000000-0000-0000-0000-000000000001"
	}

	// 2. Child 1: Andi Pratama (Normal / Pita Hijau KMS)
	// Token: magic-balita-andi-2026-tumbuhin-sehat
	var andiID string
	upsertAndiSQL := `
		INSERT INTO children (
			nik_hash, full_name, gender, birth_date, posyandu_id, posyandu_name,
			village_name, rw_code, rt_code, latitude, longitude,
			parent_name, parent_phone, magic_token, is_active, updated_at
		) VALUES (
			'nik_hash_andi_pratama_2025', 'Andi Pratama', 'L', '2025-09-12', $1, 'Posyandu Melati 04',
			'Desa Sukamaju', '004', '002', -6.6012, 106.8123,
			'Dewi Lestari', '081288990044', 'magic-balita-andi-2026-tumbuhin-sehat', TRUE, NOW()
		)
		ON CONFLICT (nik_hash) DO UPDATE SET
			magic_token = EXCLUDED.magic_token,
			full_name = EXCLUDED.full_name,
			parent_name = EXCLUDED.parent_name,
			parent_phone = EXCLUDED.parent_phone,
			updated_at = NOW()
		RETURNING id;
	`
	if err := db.QueryRow(ctx, upsertAndiSQL, posyanduID).Scan(&andiID); err != nil {
		log.Printf("[SEEDER] Upsert Andi failed: %v", err)
	} else {
		// Populate measurements for Andi (months 9 to 14)
		_, _ = db.Exec(ctx, "DELETE FROM measurements WHERE child_id = $1", andiID)
		andiMeasurements := []struct {
			measuredAt string
			age        int
			w          float64
			h          float64
			zwfa       float64
			zhfa       float64
			zwfh       float64
			status     string
		}{
			{"2026-06-19", 9, 8.6, 71.0, -0.5, -0.9, -0.3, "normal"},
			{"2026-07-19", 10, 8.9, 72.5, -0.4, -0.8, -0.2, "normal"},
			{"2026-08-19", 11, 9.1, 73.8, -0.5, -0.9, -0.3, "normal"},
			{"2026-09-19", 12, 9.3, 74.8, -0.4, -0.8, -0.2, "normal"},
			{"2026-10-19", 13, 9.35, 75.6, -0.5, -0.9, -0.3, "normal"},
			{"2026-11-19", 14, 9.8, 76.5, -0.42, -0.85, -0.21, "normal"},
		}
		for _, m := range andiMeasurements {
			_, _ = db.Exec(ctx, `
				INSERT INTO measurements (child_id, measured_at, age_months, weight_kg, height_cm, zscore_wfa, zscore_hfa, zscore_wfh, nutrition_status)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			`, andiID, m.measuredAt, m.age, m.w, m.h, m.zwfa, m.zhfa, m.zwfh, m.status)
		}

		// Andi MPASI plan
		recipeAndi := map[string]any{
			"title":                 "Nasi Tim Ikan Lele & Sayur Bening Daun Kelor",
			"target_age_range":      "12-23 Bulan",
			"texture":               "Makanan Keluarga (Cincang Kasar)",
			"daily_budget_idr":      13500,
			"calories_kcal":          285,
			"animal_protein_grams":  14.0,
			"ingredients": []map[string]any{
				{"name": "Ikan Lele Segar Desa", "amount": "1 ekor sedang (50 gr fillet)", "category": "Protein Hewani", "estimated_price": 4500},
				{"name": "Telur Ayam Negeri", "amount": "1 butir", "category": "Protein Hewani", "estimated_price": 2500},
				{"name": "Beras Putih Pulen", "amount": "4 sdm makan", "category": "Karbohidrat", "estimated_price": 2000},
				{"name": "Pucuk Daun Kelor Segar", "amount": "1 genggam kecil", "category": "Sayur & Zat Besi", "estimated_price": 1000},
				{"name": "Bawang Merah & Putih", "amount": "2 siung (iris halus)", "category": "Bumbu Alami", "estimated_price": 500},
				{"name": "Minyak Kelapa Sehat", "amount": "1 sdm", "category": "Lemak Sehat", "estimated_price": 1000},
			},
			"cooking_steps": []string{
				"Kukus ikan lele segar hingga empuk, lalu pisahkan daging lembut dari duri dan kulitnya.",
				"Tumis irisan bawang merah dan bawang putih cincang hingga harum dengan minyak kelapa.",
				"Masukkan telur ayam, buat orak-arik hingga setengah matang, lalu campurkan suwiran ikan lele.",
				"Tambahkan nasi aron dan air kaldu lele secukupnya, masak dalam panci tim hingga air meresap.",
				"Masukkan pucuk daun kelor segar di menit terakhir agar vitamin dan zat besi tetap terjaga.",
				"Angkat dan sajikan hangat dalam mangkuk si kecil.",
			},
			"serving_tips":       "Sajikan selagi hangat 3 kali sehari. Tambahkan potongan buah pepaya matang untuk melancarkan pencernaan.",
			"kemenkes_citation": "Buku KIA Kemenkes RI 2020: Standar Pemenuhan Gizi Balita Berbasis Pangan Lokal.",
		}
		rawAndi, _ := json.Marshal(recipeAndi)
		_, _ = db.Exec(ctx, "DELETE FROM mpasi_plans WHERE child_id = $1", andiID)
		_, _ = db.Exec(ctx, `
			INSERT INTO mpasi_plans (child_id, daily_budget_idr, recipe_payload, kemenkes_citation)
			VALUES ($1, 13500, $2, 'Buku KIA Kemenkes RI 2020: Standar Pemenuhan Gizi Balita Berbasis Pangan Lokal.')
		`, andiID, rawAndi)

		// Andi Intervention
		_, _ = db.Exec(ctx, "DELETE FROM interventions WHERE child_id = $1", andiID)
		_, _ = db.Exec(ctx, `
			INSERT INTO interventions (
				child_id, visit_date, visit_status, soap_subjective, soap_objective, soap_assessment, soap_plan,
				pmt_given, pmt_type, clinical_notes, follow_up_date
			) VALUES (
				$1, '2026-11-19', 'COMPLETED',
				'Ibu melaporkan nafsu makan anak sangat baik dan aktif bergerak.',
				'BB 9.8 kg, TB 76.5 cm, Z-Score HFA -0.85 SD, WFA -0.42 SD.',
				'Gizi Baik, pertumbuhan optimal di pita hijau KMS.',
				'Lanjutkan pemberian MPASI tinggi protein hewani (lele dan telur).',
				FALSE, 'Pangan Lokal Mandiri',
				'Pertumbuhan berat dan tinggi badan Ananda Andi sangat baik bulan ini. Pertahankan menu MPASI kaya protein hewani.',
				'2026-12-12'
			)
		`, andiID)
	}

	// 3. Child 2: Siti Nurhaliza (Risiko Kurang / Faltering / Pita Kuning KMS)
	// Token: magic-balita-siti-2026-tumbuhin-pantau
	var sitiID string
	upsertSitiSQL := `
		INSERT INTO children (
			nik_hash, full_name, gender, birth_date, posyandu_id, posyandu_name,
			village_name, rw_code, rt_code, latitude, longitude,
			parent_name, parent_phone, magic_token, is_active, updated_at
		) VALUES (
			'nik_hash_siti_nurhaliza_2025', 'Siti Nurhaliza', 'P', '2025-05-15', $1, 'Posyandu Melati 04',
			'Desa Sukamaju', '004', '003', -6.6025, 106.8140,
			'Aminah Zahra', '081377881122', 'magic-balita-siti-2026-tumbuhin-pantau', TRUE, NOW()
		)
		ON CONFLICT (nik_hash) DO UPDATE SET
			magic_token = EXCLUDED.magic_token,
			full_name = EXCLUDED.full_name,
			parent_name = EXCLUDED.parent_name,
			parent_phone = EXCLUDED.parent_phone,
			updated_at = NOW()
		RETURNING id;
	`
	if err := db.QueryRow(ctx, upsertSitiSQL, posyanduID).Scan(&sitiID); err != nil {
		log.Printf("[SEEDER] Upsert Siti failed: %v", err)
	} else {
		// Populate measurements for Siti (months 13 to 18)
		_, _ = db.Exec(ctx, "DELETE FROM measurements WHERE child_id = $1", sitiID)
		sitiMeasurements := []struct {
			measuredAt string
			age        int
			w          float64
			h          float64
			zwfa       float64
			zhfa       float64
			zwfh       float64
			status     string
		}{
			{"2026-06-18", 13, 8.4, 73.0, -1.8, -1.9, -1.4, "berisiko"},
			{"2026-07-18", 14, 8.5, 74.0, -1.9, -2.0, -1.5, "berisiko"},
			{"2026-08-18", 15, 8.6, 75.0, -2.0, -2.1, -1.6, "berisiko"},
			{"2026-09-18", 16, 8.65, 75.8, -2.2, -2.2, -1.7, "berisiko"},
			{"2026-10-18", 17, 8.7, 76.5, -2.3, -2.3, -1.8, "berisiko"},
			{"2026-11-18", 18, 8.8, 77.2, -2.35, -2.4, -1.85, "berisiko"},
		}
		for _, m := range sitiMeasurements {
			_, _ = db.Exec(ctx, `
				INSERT INTO measurements (child_id, measured_at, age_months, weight_kg, height_cm, zscore_wfa, zscore_hfa, zscore_wfh, nutrition_status)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			`, sitiID, m.measuredAt, m.age, m.w, m.h, m.zwfa, m.zhfa, m.zwfh, m.status)
		}

		// Siti MPASI plan
		recipeSiti := map[string]any{
			"title":                 "Bubur Singkong Ayam Cincang & Telur Puyuh Padat Kalori",
			"target_age_range":      "12-23 Bulan",
			"texture":               "Cincang Lembek Padat Energi",
			"daily_budget_idr":      14500,
			"calories_kcal":          320,
			"animal_protein_grams":  15.5,
			"ingredients": []map[string]any{
				{"name": "Daging Ayam Cincang", "amount": "50 gram", "category": "Protein Hewani", "estimated_price": 5000},
				{"name": "Telur Puyuh Rebus", "amount": "3 butir", "category": "Protein Hewani", "estimated_price": 3000},
				{"name": "Singkong Manis Parut / Nasi", "amount": "4 sdm makan", "category": "Karbohidrat Padat", "estimated_price": 2000},
				{"name": "Wortel & Buncis Cincang", "amount": "2 sdm makan", "category": "Sayur & Vitamin", "estimated_price": 1500},
				{"name": "Santan Kelapa Kental", "amount": "2 sdm makan", "category": "Lemak Tambahan", "estimated_price": 1500},
			},
			"cooking_steps": []string{
				"Tumis daging ayam cincang dengan sedikit minyak hingga berubah warna matang.",
				"Rebus singkong parut bersama kaldu ayam hingga empuk dan bertekstur kental padat energi.",
				"Masukkan tumisan ayam, cincangan wortel, dan buncis ke dalam bubur singkong.",
				"Tambahkan santan kental, aduk perlahan di atas api kecil hingga matang merata dan harum.",
				"Belah telur puyuh rebus dan tata di atas bubur saat disajikan.",
			},
			"serving_tips":       "Berikan makanan dengan porsi kecil tetapi sering (4 kali sehari) dan dampingi makan dengan suasana gembira tanpa paksaan.",
			"kemenkes_citation": "Petunjuk Teknis Pemberian Makanan Tambahan (PMT) Berbahan Pangan Lokal Balita Gizi Kurang Kemenkes RI.",
		}
		rawSiti, _ := json.Marshal(recipeSiti)
		_, _ = db.Exec(ctx, "DELETE FROM mpasi_plans WHERE child_id = $1", sitiID)
		_, _ = db.Exec(ctx, `
			INSERT INTO mpasi_plans (child_id, daily_budget_idr, recipe_payload, kemenkes_citation)
			VALUES ($1, 14500, $2, 'Petunjuk Teknis PMT Berbahan Pangan Lokal Balita Gizi Kurang Kemenkes RI.')
		`, sitiID, rawSiti)

		// Siti Intervention
		_, _ = db.Exec(ctx, "DELETE FROM interventions WHERE child_id = $1", sitiID)
		_, _ = db.Exec(ctx, `
			INSERT INTO interventions (
				child_id, visit_date, visit_status, soap_subjective, soap_objective, soap_assessment, soap_plan,
				pmt_given, pmt_type, clinical_notes, follow_up_date
			) VALUES (
				$1, '2026-11-18', 'FOLLOW_UP',
				'Anak sulit makan makanan berkuah dan berat badan hanya naik 100 gram bulan ini.',
				'BB 8.8 kg, TB 77.2 cm, Z-Score TB/U -2.4 SD (Stunted/Kuning), BB/U -2.35 SD.',
				'Growth faltering terindikasi, butuh percepatan PMT pemulihan lokal.',
				'Daftarkan program PMT pemulihan 90 hari desa dan jadwalkan home visit mingguan.',
				TRUE, 'PMT Pemulihan Pangan Lokal 90 Hari',
				'Kenaikan berat badan Ananda Siti melambat (+100 gram dari target KBM 200 gram). Diikutsertakan dalam program PMT pemulihan hari ke-28 dengan kepatuhan konsumsi 88%. Tetap semangat!',
				'2026-12-02'
			)
		`, sitiID)

		// Siti PMT Evaluation
		_, _ = db.Exec(ctx, "DELETE FROM pmt_evaluations WHERE child_id = $1", sitiID)
		_, _ = db.Exec(ctx, `
			INSERT INTO pmt_evaluations (
				child_id, village_name, consumption_compliance_percent, distribution_compliance_percent, notes
			) VALUES (
				$1, 'Desa Sukamaju', 88.0, 100.0, 'Kepatuhan konsumsi PMT sangat baik, nafsu makan mulai membaik pada minggu ke-4.'
			)
		`, sitiID)
	}

	log.Println("[SEEDER] Realistic balita (Andi Pratama & Siti Nurhaliza) seeded successfully with measurements & MPASI.")
	return nil
}
