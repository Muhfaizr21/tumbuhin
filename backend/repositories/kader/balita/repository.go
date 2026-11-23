package balita

import (
	"context"
	"fmt"
	"log"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ChildDTO struct {
	ID             string  `json:"id"`
	NikHash        string  `json:"nik_hash"`
	Nama           string  `json:"nama"`
	JenisKelamin   string  `json:"jenis_kelamin"`
	TanggalLahir   string  `json:"tanggal_lahir"`
	BeratLahir     float64 `json:"berat_lahir"`
	PanjangLahir   float64 `json:"panjang_lahir"`
	NamaAyah       string  `json:"nama_ayah"`
	UsiaBulan      int     `json:"usia_bulan"`
	Usia           string  `json:"usia"`
	PosyanduName   string  `json:"posyandu_name"`
	NamaOrtu       string  `json:"nama_ibu"`
	NoWa           string  `json:"no_wa"`
	RTRw           string  `json:"rt_rw"`
	StatusGizi     string  `json:"status_gizi"`
	StatusTimbang  string  `json:"status_timbang"`
	Alergi         string  `json:"alergi"`
	ZscoreWFA      float64 `json:"zscore_wfa"`
	ZscoreHFA      float64 `json:"zscore_hfa"`
	ZscoreWFH      float64 `json:"zscore_wfh"`
}

type ChildInput struct {
	Nik          string  `json:"nik"`
	Nama         string  `json:"nama"`
	JenisKelamin string  `json:"jenis_kelamin"`
	TanggalLahir string  `json:"tanggal_lahir"`
	BeratLahir   float64 `json:"berat_lahir"`
	PanjangLahir float64 `json:"panjang_lahir"`
	NamaIbu      string  `json:"nama_ibu"`
	NamaAyah     string  `json:"nama_ayah"`
	NoWa         string  `json:"no_wa"`
	RTRw         string  `json:"rt_rw"`
	Alergi       string  `json:"alergi"`
}

type Repository interface {
	GetAllChildren(ctx context.Context, villageName string) ([]ChildDTO, error)
	CreateChild(ctx context.Context, input ChildInput) (string, error)
	UpdateChild(ctx context.Context, id string, input ChildInput) error
	DeleteChild(ctx context.Context, id string) error
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func (r *repository) GetAllChildren(ctx context.Context, villageName string) ([]ChildDTO, error) {
	if villageName == "" {
		villageName = "Desa Sukamaju"
	}

	if r.db == nil {
		return []ChildDTO{}, nil
	}

	// Menggunakan query tanpa filter village_name agar data Kader sinkron dengan data Bidan
	query := `
	SELECT 
		c.id::text, 
		c.nik_hash, 
		c.full_name, 
		c.gender, 
		COALESCE(to_char(c.birth_date, 'YYYY-MM-DD'), ''),
		COALESCE(c.birth_weight, 0.0)::float8,
		COALESCE(c.birth_height, 0.0)::float8,
		COALESCE(c.parent_father_name, '-'),
		COALESCE(m.age_months, 12),
		COALESCE(c.posyandu_name, 'Posyandu Melati 04'), 
		COALESCE(c.parent_name, '-'), 
		COALESCE(c.parent_phone, '-'),
		COALESCE(c.rt_code, 'RT 01') || ' / ' || COALESCE(c.rw_code, 'RW 04'),
		COALESCE(m.nutrition_status, 'Normal'),
		COALESCE(m.zscore_wfa, 0.0)::float8,
		COALESCE(m.zscore_hfa, 0.0)::float8,
		COALESCE(m.zscore_wfh, 0.0)::float8,
		CASE WHEN m.child_id IS NOT NULL THEN 'Sudah Ditimbang' ELSE 'Belum Ditimbang' END,
		COALESCE(c.notes, '')
	FROM children c
	LEFT JOIN (
		SELECT DISTINCT ON (child_id) child_id, age_months, nutrition_status,
			zscore_wfa, zscore_hfa, zscore_wfh, measured_at
		FROM measurements
		ORDER BY child_id, measured_at DESC
	) m ON m.child_id = c.id
	ORDER BY c.created_at DESC;
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

    var count int
    _ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM children").Scan(&count)
    log.Printf("[KADER REPO] Total rows in 'children' table: %d", count)

	var result []ChildDTO
	for rows.Next() {
		var dto ChildDTO
		if err := rows.Scan(
			&dto.ID,
			&dto.NikHash,
			&dto.Nama,
			&dto.JenisKelamin,
			&dto.TanggalLahir,
			&dto.BeratLahir,
			&dto.PanjangLahir,
			&dto.NamaAyah,
			&dto.UsiaBulan,
			&dto.PosyanduName,
			&dto.NamaOrtu,
			&dto.NoWa,
			&dto.RTRw,
			&dto.StatusGizi,
			&dto.ZscoreWFA,
			&dto.ZscoreHFA,
			&dto.ZscoreWFH,
			&dto.StatusTimbang,
			&dto.Alergi,
		); err == nil {
			dto.Usia = fmt.Sprintf("%d Bulan", dto.UsiaBulan)
			// Normalisasi status gizi agar sesuai UI
			if dto.StatusGizi == "stunted" || dto.StatusGizi == "Stunted" {
				dto.StatusGizi = "Stunted"
			} else if dto.StatusGizi == "severely_stunted" {
				dto.StatusGizi = "Stunted"
			} else if dto.StatusGizi == "wasted" || dto.StatusGizi == "severely_wasted" {
				dto.StatusGizi = "Wasted"
			} else {
				dto.StatusGizi = "Normal"
			}
			result = append(result, dto)
		}
	}

	return result, nil
}

func (r *repository) CreateChild(ctx context.Context, input ChildInput) (string, error) {
	query := `
	INSERT INTO children (
		full_name, gender, birth_date, birth_weight, birth_height, 
		parent_name, parent_father_name, parent_phone, rt_code, rw_code, notes,
		village_name, posyandu_name, nik_hash
	) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Desa Sukamaju', 'Posyandu Melati 04', $12)
	RETURNING id::text;
	`
	// Simple hash for demo if not provided
	nikHash := input.Nik
	if len(nikHash) > 8 {
		nikHash = nikHash[:8] + "****"
	}

	var id string
	err := r.db.QueryRow(ctx, query, 
		input.Nama, input.JenisKelamin, input.TanggalLahir, input.BeratLahir, input.PanjangLahir,
		input.NamaIbu, input.NamaAyah, input.NoWa, "01", "04", input.Alergi, nikHash,
	).Scan(&id)
	
	return id, err
}

func (r *repository) UpdateChild(ctx context.Context, id string, input ChildInput) error {
	query := `
	UPDATE children SET 
		full_name=$1, gender=$2, birth_date=$3, birth_weight=$4, birth_height=$5, 
		parent_name=$6, parent_father_name=$7, parent_phone=$8, notes=$9
	WHERE id=$10;
	`
	_, err := r.db.Exec(ctx, query, 
		input.Nama, input.JenisKelamin, input.TanggalLahir, input.BeratLahir, input.PanjangLahir,
		input.NamaIbu, input.NamaAyah, input.NoWa, input.Alergi, id,
	)
	return err
}

func (r *repository) DeleteChild(ctx context.Context, id string) error {
	query := `DELETE FROM children WHERE id=$1;`
	_, err := r.db.Exec(ctx, query, id)
	return err
}
