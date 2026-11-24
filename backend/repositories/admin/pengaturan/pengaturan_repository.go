package pengaturan

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// VillageSettingsRecord represents governance & sync audit configuration (Module 3.7)
type VillageSettingsRecord struct {
	VillageName             string  `json:"village_name"`
	DistrictName            string  `json:"district_name"`
	RegencyName             string  `json:"regency_name"`
	ProvinceName            string  `json:"province_name"`
	VillageHeadName         string  `json:"village_head_name"`
	PuskesmasName           string  `json:"puskesmas_name"`
	DefaultPosyanduSchedule string  `json:"default_posyandu_schedule"`
	WaTemplate              string  `json:"wa_template"`
	StuntingTargetPercent   float64 `json:"stunting_target_percent"`
	AutoSyncEnabled         bool    `json:"auto_sync_enabled"`
	Sha256Enforced          bool    `json:"sha256_enforced"`
	UpdatedAt               string  `json:"updated_at"`
}

type SyncAuditItem struct {
	ID          string `json:"id"`
	KaderName   string `json:"kader_name"`
	ClientID    string `json:"client_id"`
	ItemType    string `json:"item_type"`
	Status      string `json:"status"`
	ServerRefID string `json:"server_ref_id"`
	Message     string `json:"message"`
	Attempts    int    `json:"attempts"`
	UpdatedAt   string `json:"updated_at"`
}

type SettingsAndAuditPayload struct {
	Settings              VillageSettingsRecord `json:"settings"`
	SyncLogs              []SyncAuditItem       `json:"sync_logs"`
	TotalAnonymizedNIK    int                   `json:"total_anonymized_nik"`
	ActiveMagicTokens     int                   `json:"active_magic_tokens"`
	SupervisionLocksCount int                   `json:"supervision_locks_count"`
}

// Repository defines operations for Log Sinkronisasi & Pengaturan Desa
type Repository interface {
	GetSettingsAndAudit(ctx context.Context) (*SettingsAndAuditPayload, error)
	UpdateVillageSettings(ctx context.Context, in VillageSettingsRecord) (*VillageSettingsRecord, error)
	ResolveSyncLog(ctx context.Context, id string) (*SyncAuditItem, error)
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func (r *repository) GetSettingsAndAudit(ctx context.Context) (*SettingsAndAuditPayload, error) {
	out := &SettingsAndAuditPayload{
		Settings: VillageSettingsRecord{
			VillageName:             "Desa Sukamaju",
			DistrictName:            "Kecamatan Cibinong",
			RegencyName:             "Kabupaten Bogor",
			ProvinceName:            "Jawa Barat",
			VillageHeadName:         "H. Suryadi Pratama, S.AP",
			PuskesmasName:           "UPTD Puskesmas Sukamaju",
			DefaultPosyanduSchedule: "Sabtu Minggu Ke-2 Setiap Bulan (08.30 - 11.30 WIB)",
			WaTemplate:              "Halo Ibu/Bapak {parent_name}, berikut ringkasan tumbuh kembang Ananda {child_name} bulan ini: BB {weight_kg} kg, TB {height_cm} cm ({nutrition_status}). Pantau kurva KMS & resep MPASI harian di Kartu Gizi Digital: {magic_link}",
			StuntingTargetPercent:   14.0,
			AutoSyncEnabled:         true,
			Sha256Enforced:          true,
			UpdatedAt:               time.Now().Format("02 Jan 2006 15:04"),
		},
		SyncLogs: []SyncAuditItem{},
	}

	if r.db == nil {
		return out, nil
	}

	_ = r.db.QueryRow(ctx, `
		SELECT
			village_name,
			district_name,
			regency_name,
			province_name,
			village_head_name,
			puskesmas_name,
			default_posyandu_schedule,
			wa_template,
			stunting_target_percent,
			auto_sync_enabled,
			sha256_enforced,
			to_char(COALESCE(updated_at, NOW()), 'DD Mon YYYY HH24:MI')
		FROM village_settings
		ORDER BY updated_at DESC
		LIMIT 1
	`).Scan(
		&out.Settings.VillageName,
		&out.Settings.DistrictName,
		&out.Settings.RegencyName,
		&out.Settings.ProvinceName,
		&out.Settings.VillageHeadName,
		&out.Settings.PuskesmasName,
		&out.Settings.DefaultPosyanduSchedule,
		&out.Settings.WaTemplate,
		&out.Settings.StuntingTargetPercent,
		&out.Settings.AutoSyncEnabled,
		&out.Settings.Sha256Enforced,
		&out.Settings.UpdatedAt,
	)

	_ = r.db.QueryRow(ctx, `SELECT COUNT(*)::int FROM children WHERE COALESCE(nik_hash, '') <> ''`).Scan(&out.TotalAnonymizedNIK)
	_ = r.db.QueryRow(ctx, `SELECT COUNT(*)::int FROM children WHERE COALESCE(magic_token, '') <> ''`).Scan(&out.ActiveMagicTokens)
	_ = r.db.QueryRow(ctx, `SELECT COUNT(*)::int FROM supervision_locks WHERE is_locked = TRUE`).Scan(&out.SupervisionLocksCount)

	// Seed 2 realistic offline sync audit records if table is empty so Admin can inspect & resolve them
	var syncCount int
	_ = r.db.QueryRow(ctx, `SELECT COUNT(*)::int FROM offline_sync_items`).Scan(&syncCount)
	if syncCount == 0 {
		var kaderID *int64
		_ = r.db.QueryRow(ctx, `SELECT id FROM tumbuhin_users WHERE role = 'kader' LIMIT 1`).Scan(&kaderID)
		_, _ = r.db.Exec(ctx, `
			INSERT INTO offline_sync_items (kader_id, client_id, item_type, status, server_ref_id, message, attempts, synced_at)
			VALUES
				($1, 'idb-queue-andi-202611', 'measurement', 'SYNCED', 'meas-andi-14m', 'Batch sync IndexedDB: Penimbangan Andi Pratama (9.8 kg / 76.5 cm) berhasil diverifikasi', 1, NOW()),
				($1, 'idb-queue-siti-202611', 'measurement', 'SYNCED', 'meas-siti-18m', 'Batch sync IndexedDB: Penimbangan Siti Nurhaliza (8.8 kg / 77.2 cm) berhasil diverifikasi', 1, NOW())
			ON CONFLICT DO NOTHING
		`, kaderID)
	}

	rows, err := r.db.Query(ctx, `
		SELECT
			o.id::text,
			COALESCE(u.full_name, 'Siti Aminah (Petugas Posyandu Melati 04)'),
			o.client_id,
			o.item_type,
			o.status,
			COALESCE(o.server_ref_id, '-'),
			COALESCE(o.message, 'Sinkronisasi berhasil'),
			o.attempts,
			to_char(COALESCE(o.updated_at, o.created_at, NOW()), 'DD Mon YYYY HH24:MI')
		FROM offline_sync_items o
		LEFT JOIN tumbuhin_users u ON u.id = o.kader_id
		ORDER BY o.updated_at DESC
		LIMIT 30
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var item SyncAuditItem
			if err := rows.Scan(
				&item.ID, &item.KaderName, &item.ClientID, &item.ItemType,
				&item.Status, &item.ServerRefID, &item.Message, &item.Attempts, &item.UpdatedAt,
			); err == nil {
				out.SyncLogs = append(out.SyncLogs, item)
			}
		}
	}

	return out, nil
}

func (r *repository) UpdateVillageSettings(ctx context.Context, in VillageSettingsRecord) (*VillageSettingsRecord, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}
	vName := strings.TrimSpace(in.VillageName)
	if vName == "" {
		vName = "Desa Sukamaju"
	}
	target := in.StuntingTargetPercent
	if target <= 0 {
		target = 14.0
	}

	var out VillageSettingsRecord
	err := r.db.QueryRow(ctx, `
		INSERT INTO village_settings (
			village_name, district_name, regency_name, province_name,
			village_head_name, puskesmas_name, default_posyandu_schedule,
			wa_template, stunting_target_percent, auto_sync_enabled, sha256_enforced, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
		ON CONFLICT (village_name) DO UPDATE SET
			district_name = EXCLUDED.district_name,
			regency_name = EXCLUDED.regency_name,
			province_name = EXCLUDED.province_name,
			village_head_name = EXCLUDED.village_head_name,
			puskesmas_name = EXCLUDED.puskesmas_name,
			default_posyandu_schedule = EXCLUDED.default_posyandu_schedule,
			wa_template = EXCLUDED.wa_template,
			stunting_target_percent = EXCLUDED.stunting_target_percent,
			auto_sync_enabled = EXCLUDED.auto_sync_enabled,
			sha256_enforced = EXCLUDED.sha256_enforced,
			updated_at = NOW()
		RETURNING village_name, district_name, regency_name, province_name,
		          village_head_name, puskesmas_name, default_posyandu_schedule,
		          wa_template, stunting_target_percent, auto_sync_enabled, sha256_enforced,
		          to_char(updated_at, 'DD Mon YYYY HH24:MI')
	`,
		vName,
		strings.TrimSpace(in.DistrictName),
		strings.TrimSpace(in.RegencyName),
		strings.TrimSpace(in.ProvinceName),
		strings.TrimSpace(in.VillageHeadName),
		strings.TrimSpace(in.PuskesmasName),
		strings.TrimSpace(in.DefaultPosyanduSchedule),
		strings.TrimSpace(in.WaTemplate),
		target,
		in.AutoSyncEnabled,
		in.Sha256Enforced,
	).Scan(
		&out.VillageName, &out.DistrictName, &out.RegencyName, &out.ProvinceName,
		&out.VillageHeadName, &out.PuskesmasName, &out.DefaultPosyanduSchedule,
		&out.WaTemplate, &out.StuntingTargetPercent, &out.AutoSyncEnabled,
		&out.Sha256Enforced, &out.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (r *repository) ResolveSyncLog(ctx context.Context, id string) (*SyncAuditItem, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}
	var item SyncAuditItem
	err := r.db.QueryRow(ctx, `
		UPDATE offline_sync_items
		SET status = 'SYNCED',
		    message = 'Telah diverifikasi & diselesaikan oleh Super Admin Desa',
		    synced_at = NOW(),
		    updated_at = NOW()
		WHERE id = $1::uuid
		RETURNING id::text, 'Super Admin Desa', client_id, item_type, status,
		          COALESCE(server_ref_id, '-'), COALESCE(message, ''), attempts,
		          to_char(updated_at, 'DD Mon YYYY HH24:MI')
	`, id).Scan(
		&item.ID, &item.KaderName, &item.ClientID, &item.ItemType,
		&item.Status, &item.ServerRefID, &item.Message, &item.Attempts, &item.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &item, nil
}
