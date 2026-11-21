package balita

import (
	"context"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Child struct {
	ID           string  `json:"id"`
	NikHash      string  `json:"nik_hash"`
	FullName     string  `json:"nama"`
	Gender       string  `json:"jenis_kelamin"`
	BirthDate    string  `json:"tanggal_lahir"`
	PosyanduName string  `json:"posyandu_name"`
	ParentName   string  `json:"nama_ibu"`
	RT           string  `json:"rt"`
	RW           string  `json:"rw"`
}

type Repository interface {
	GetAllChildren(ctx context.Context, posyanduID string) ([]Child, error)
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func (r *repository) GetAllChildren(ctx context.Context, posyanduID string) ([]Child, error) {
	query := `SELECT id, nik_hash, full_name, gender, birth_date, posyandu_name, parent_name, rt_code, rw_code 
	          FROM children WHERE posyandu_id = $1`
	rows, err := r.db.Query(ctx, query, posyanduID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var children []Child
	for rows.Next() {
		var c Child
		if err := rows.Scan(&c.ID, &c.NikHash, &c.FullName, &c.Gender, &c.BirthDate, &c.PosyanduName, &c.ParentName, &c.RT, &c.RW); err != nil {
			return nil, err
		}
		children = append(children, c)
	}
	return children, nil
}
