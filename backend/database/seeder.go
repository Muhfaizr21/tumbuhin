package database

import (
	"context"
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

	return nil
}
