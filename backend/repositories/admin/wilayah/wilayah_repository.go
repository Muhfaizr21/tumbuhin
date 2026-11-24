package wilayah

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PosyanduUnit represents a Posyandu master record (Module 3.2)
type PosyanduUnit struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	VillageName   string  `json:"village_name"`
	RWCode        string  `json:"rw_code"`
	RTCode        string  `json:"rt_code"`
	Address       string  `json:"address"`
	ScheduleDay   string  `json:"schedule_day"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	IsActive      bool    `json:"is_active"`
	ChildrenCount int     `json:"children_count"`
	KaderCount    int     `json:"kader_count"`
	CreatedAt     string  `json:"created_at"`
}

type PosyanduInput struct {
	Name        string  `json:"name"`
	VillageName string  `json:"village_name"`
	RWCode      string  `json:"rw_code"`
	RTCode      string  `json:"rt_code"`
	Address     string  `json:"address"`
	ScheduleDay string  `json:"schedule_day"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	IsActive    *bool   `json:"is_active"`
}

// Repository defines CRUD operations for Master Wilayah & Posyandu
type Repository interface {
	ListPosyandus(ctx context.Context) ([]PosyanduUnit, error)
	CreatePosyandu(ctx context.Context, in PosyanduInput) (*PosyanduUnit, error)
	UpdatePosyandu(ctx context.Context, id string, in PosyanduInput) (*PosyanduUnit, error)
	TogglePosyandu(ctx context.Context, id string) (*PosyanduUnit, error)
	DeletePosyandu(ctx context.Context, id string) error
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func (r *repository) ListPosyandus(ctx context.Context) ([]PosyanduUnit, error) {
	if r.db == nil {
		return []PosyanduUnit{}, nil
	}
	rows, err := r.db.Query(ctx, `
		SELECT
			p.id::text,
			p.name,
			COALESCE(p.village_name, 'Desa Sukamaju'),
			COALESCE(p.rw_code, '001'),
			COALESCE(p.rt_code, '001'),
			COALESCE(p.address, 'Balai RW Desa Sukamaju'),
			COALESCE(p.schedule_day, 'Sabtu Minggu Ke-2 (08.30 - 11.30 WIB)'),
			COALESCE(p.latitude, -6.5950378),
			COALESCE(p.longitude, 106.816635),
			COALESCE(p.is_active, TRUE),
			(SELECT COUNT(*)::int FROM children c WHERE (c.posyandu_id = p.id OR c.posyandu_name = p.name) AND COALESCE(c.is_active, TRUE) = TRUE),
			(SELECT COUNT(*)::int FROM tumbuhin_users u WHERE u.posyandu_name = p.name AND u.role = 'kader' AND u.is_active = TRUE),
			to_char(COALESCE(p.created_at, NOW()), 'YYYY-MM-DD')
		FROM posyandus p
		ORDER BY p.rw_code ASC, p.name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []PosyanduUnit{}
	for rows.Next() {
		var item PosyanduUnit
		if err := rows.Scan(
			&item.ID, &item.Name, &item.VillageName, &item.RWCode, &item.RTCode,
			&item.Address, &item.ScheduleDay, &item.Latitude, &item.Longitude,
			&item.IsActive, &item.ChildrenCount, &item.KaderCount, &item.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, item)
	}
	return list, rows.Err()
}

func (r *repository) CreatePosyandu(ctx context.Context, in PosyanduInput) (*PosyanduUnit, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, fmt.Errorf("nama Posyandu wajib diisi")
	}
	village := strings.TrimSpace(in.VillageName)
	if village == "" {
		village = "Desa Sukamaju"
	}
	rw := strings.TrimSpace(in.RWCode)
	if rw == "" {
		rw = "001"
	}
	rt := strings.TrimSpace(in.RTCode)
	if rt == "" {
		rt = "001"
	}
	addr := strings.TrimSpace(in.Address)
	if addr == "" {
		addr = fmt.Sprintf("Balai Warga RW %s, %s", rw, village)
	}
	sched := strings.TrimSpace(in.ScheduleDay)
	if sched == "" {
		sched = "Sabtu Minggu Ke-2 (08.30 - 11.30 WIB)"
	}
	lat := in.Latitude
	if lat == 0 {
		lat = -6.5950378
	}
	lng := in.Longitude
	if lng == 0 {
		lng = 106.816635
	}
	active := true
	if in.IsActive != nil {
		active = *in.IsActive
	}

	var out PosyanduUnit
	err := r.db.QueryRow(ctx, `
		INSERT INTO posyandus (name, village_name, rw_code, rt_code, address, schedule_day, latitude, longitude, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id::text, name, village_name, rw_code, rt_code, address, schedule_day, latitude, longitude, is_active, to_char(created_at, 'YYYY-MM-DD')
	`, name, village, rw, rt, addr, sched, lat, lng, active).Scan(
		&out.ID, &out.Name, &out.VillageName, &out.RWCode, &out.RTCode,
		&out.Address, &out.ScheduleDay, &out.Latitude, &out.Longitude, &out.IsActive, &out.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (r *repository) UpdatePosyandu(ctx context.Context, id string, in PosyanduInput) (*PosyanduUnit, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, fmt.Errorf("nama Posyandu wajib diisi")
	}
	village := strings.TrimSpace(in.VillageName)
	if village == "" {
		village = "Desa Sukamaju"
	}
	rw := strings.TrimSpace(in.RWCode)
	if rw == "" {
		rw = "001"
	}
	rt := strings.TrimSpace(in.RTCode)
	if rt == "" {
		rt = "001"
	}
	addr := strings.TrimSpace(in.Address)
	sched := strings.TrimSpace(in.ScheduleDay)
	active := true
	if in.IsActive != nil {
		active = *in.IsActive
	}

	var out PosyanduUnit
	err := r.db.QueryRow(ctx, `
		UPDATE posyandus
		SET name = $2,
		    village_name = $3,
		    rw_code = $4,
		    rt_code = $5,
		    address = $6,
		    schedule_day = $7,
		    latitude = $8,
		    longitude = $9,
		    is_active = $10
		WHERE id = $1::uuid
		RETURNING id::text, name, village_name, rw_code, rt_code, COALESCE(address,''), COALESCE(schedule_day,''), latitude, longitude, is_active, to_char(COALESCE(created_at, NOW()), 'YYYY-MM-DD')
	`, id, name, village, rw, rt, addr, sched, in.Latitude, in.Longitude, active).Scan(
		&out.ID, &out.Name, &out.VillageName, &out.RWCode, &out.RTCode,
		&out.Address, &out.ScheduleDay, &out.Latitude, &out.Longitude, &out.IsActive, &out.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (r *repository) TogglePosyandu(ctx context.Context, id string) (*PosyanduUnit, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}
	var out PosyanduUnit
	err := r.db.QueryRow(ctx, `
		UPDATE posyandus
		SET is_active = NOT COALESCE(is_active, TRUE)
		WHERE id = $1::uuid
		RETURNING id::text, name, village_name, rw_code, rt_code, COALESCE(address,''), COALESCE(schedule_day,''), latitude, longitude, is_active, to_char(COALESCE(created_at, NOW()), 'YYYY-MM-DD')
	`, id).Scan(
		&out.ID, &out.Name, &out.VillageName, &out.RWCode, &out.RTCode,
		&out.Address, &out.ScheduleDay, &out.Latitude, &out.Longitude, &out.IsActive, &out.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (r *repository) DeletePosyandu(ctx context.Context, id string) error {
	if r.db == nil {
		return fmt.Errorf("database tidak tersedia")
	}
	_, err := r.db.Exec(ctx, `DELETE FROM posyandus WHERE id = $1::uuid`, id)
	return err
}
