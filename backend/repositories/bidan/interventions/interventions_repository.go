package interventions

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// FollowUpStatuses mirrors the visit_status CHECK constraint on the
// interventions table (fitur.md 2.4).
var FollowUpStatuses = []string{"SCHEDULED", "COMPLETED", "FOLLOW_UP", "REFERRED"}

// ErrNotFound reports that the row is missing or belongs to another village.
var ErrNotFound = errors.New("data tidak ditemukan")

// Record is one home visit joined with its child and latest anthropometry.
type Record struct {
	ID              string   `json:"id"`
	ChildID         string   `json:"child_id"`
	ChildName       string   `json:"child_name"`
	ParentName      string   `json:"parent_name"`
	ParentPhone     string   `json:"parent_phone"`
	PosyanduName    string   `json:"posyandu_name"`
	VillageName     string   `json:"village_name"`
	VisitDate       string   `json:"visit_date"`
	FollowUpStatus  string   `json:"follow_up_status"`
	SOAPSubjective  string   `json:"soap_subjective"`
	SOAPObjective   string   `json:"soap_objective"`
	SOAPAssessment  string   `json:"soap_assessment"`
	SOAPPlan        string   `json:"soap_plan"`
	PMTGiven        bool     `json:"pmt_given"`
	PMTType         string   `json:"pmt_type"`
	SupplementGiven string   `json:"supplement_given"`
	ClinicalNotes   string   `json:"clinical_notes"`
	FollowUpDate    string   `json:"follow_up_date"`
	WeightKg        *float64 `json:"weight_kg"`
	HeightCm        *float64 `json:"height_cm"`
	NutritionStatus string   `json:"nutrition_status"`
	CreatedAt       string   `json:"created_at"`
	UpdatedAt       string   `json:"updated_at"`
}

// CreateRequest carries the validated payload for a new home visit.
type CreateRequest struct {
	ChildID         string
	VisitDate       string
	FollowUpStatus  string
	SOAPSubjective  string
	SOAPObjective   string
	SOAPAssessment  string
	SOAPPlan        string
	PMTGiven        bool
	PMTType         string
	SupplementGiven string
	ClinicalNotes   string
	FollowUpDate    string
	WeightKg        *float64
	HeightCm        *float64
}

// ListFilter scopes a home visit listing inside one village.
type ListFilter struct {
	Status   string
	ChildID  string
	Search   string
	DateFrom string
	DateTo   string
	Limit    int
	Offset   int
}

// Repository is the data contract for Batch 2 home visits.
type Repository interface {
	ChildExistsInVillage(ctx context.Context, villageName, childID string) (bool, error)
	CreateHomeVisit(ctx context.Context, villageName string, bidanID int64, req CreateRequest) (*Record, error)
	ListHomeVisits(ctx context.Context, villageName string, f ListFilter) ([]Record, int, error)
	StatusCounts(ctx context.Context, villageName string) (map[string]int, error)
	GetHomeVisitByID(ctx context.Context, villageName, id string) (*Record, error)
	UpdateStatus(ctx context.Context, villageName, id, status string) (*Record, error)
	UpdateHomeVisit(ctx context.Context, villageName, id string, req CreateRequest) (*Record, error)
	DeleteHomeVisit(ctx context.Context, villageName, id string) error
}

type repository struct {
	db *pgxpool.Pool
}

// NewRepository instantiates the Batch 2 home visit repository.
func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

const recordColumns = `
	i.id::text,
	i.child_id::text,
	COALESCE(c.full_name, ''),
	COALESCE(c.parent_name, ''),
	COALESCE(c.parent_phone, ''),
	COALESCE(c.posyandu_name, ''),
	COALESCE(c.village_name, ''),
	COALESCE(to_char(i.visit_date, 'YYYY-MM-DD'), ''),
	COALESCE(i.visit_status, 'SCHEDULED'),
	COALESCE(i.soap_subjective, ''),
	COALESCE(i.soap_objective, ''),
	COALESCE(i.soap_assessment, ''),
	COALESCE(i.soap_plan, ''),
	COALESCE(i.pmt_given, FALSE),
	COALESCE(i.pmt_type, ''),
	COALESCE(i.supplement_given, ''),
	COALESCE(i.clinical_notes, ''),
	COALESCE(to_char(i.follow_up_date, 'YYYY-MM-DD'), ''),
	m.weight_kg,
	m.height_cm,
	COALESCE(m.nutrition_status, ''),
	COALESCE(to_char(i.created_at, 'YYYY-MM-DD HH24:MI'), ''),
	COALESCE(to_char(i.updated_at, 'YYYY-MM-DD HH24:MI'), '')
`

// latestMeasurement joins the most recent weighing of each child so the
// scheduling list can show current weight/height without a second query.
const latestMeasurement = `
	LEFT JOIN LATERAL (
		SELECT mm.weight_kg, mm.height_cm, mm.nutrition_status
		FROM measurements mm
		WHERE mm.child_id = i.child_id
		ORDER BY mm.measured_at DESC, mm.created_at DESC
		LIMIT 1
	) m ON TRUE
`

func scanRecord(row pgx.Row) (*Record, error) {
	var r Record
	err := row.Scan(
		&r.ID, &r.ChildID, &r.ChildName, &r.ParentName, &r.ParentPhone,
		&r.PosyanduName, &r.VillageName, &r.VisitDate, &r.FollowUpStatus,
		&r.SOAPSubjective, &r.SOAPObjective, &r.SOAPAssessment, &r.SOAPPlan,
		&r.PMTGiven, &r.PMTType, &r.SupplementGiven, &r.ClinicalNotes, &r.FollowUpDate,
		&r.WeightKg, &r.HeightCm, &r.NutritionStatus, &r.CreatedAt, &r.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &r, nil
}

// buildWhere returns the WHERE clause and its positional arguments. Every
// clause is prefixed by the village scope so a bidan can never read another
// village's rows.
func buildWhere(villageName string, f ListFilter) (string, []any) {
	args := []any{villageName}
	var b strings.Builder
	b.WriteString("WHERE c.village_name = $1")

	if f.Status != "" {
		args = append(args, f.Status)
		fmt.Fprintf(&b, " AND i.visit_status = $%d", len(args))
	}
	if f.ChildID != "" {
		args = append(args, f.ChildID)
		fmt.Fprintf(&b, " AND i.child_id::text = $%d", len(args))
	}
	if f.Search != "" {
		args = append(args, "%"+f.Search+"%")
		fmt.Fprintf(&b, " AND c.full_name ILIKE $%d", len(args))
	}
	if f.DateFrom != "" {
		args = append(args, mustDate(f.DateFrom))
		fmt.Fprintf(&b, " AND i.visit_date >= $%d", len(args))
	}
	if f.DateTo != "" {
		args = append(args, mustDate(f.DateTo))
		fmt.Fprintf(&b, " AND i.visit_date <= $%d", len(args))
	}
	return b.String(), args
}

func mustDate(s string) time.Time {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return time.Time{}
	}
	return t
}

func (r *repository) ChildExistsInVillage(ctx context.Context, villageName, childID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM children WHERE id::text = $1 AND village_name = $2
		);
	`, childID, villageName).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("mengecek keberadaan balita: %w", err)
	}
	return exists, nil
}

func (r *repository) CreateHomeVisit(ctx context.Context, villageName string, bidanID int64, req CreateRequest) (*Record, error) {
	visitDate := req.VisitDate
	if visitDate == "" {
		visitDate = time.Now().Format("2006-01-02")
	}
	status := req.FollowUpStatus
	if status == "" {
		status = "SCHEDULED"
	}

	var bidan any
	if bidanID > 0 {
		bidan = bidanID
	}

	var id string
	err := r.db.QueryRow(ctx, `
		INSERT INTO interventions (
			child_id, bidan_id, visit_date, visit_status,
			soap_subjective, soap_objective, soap_assessment, soap_plan,
			pmt_given, pmt_type, supplement_given, clinical_notes, follow_up_date
		) VALUES (
			$1::uuid, $2, $3::date, $4,
			$5, $6, $7, $8,
			$9, $10, $11, $12, NULLIF($13, '')::date
		)
		RETURNING id::text;
	`,
		req.ChildID, bidan, visitDate, status,
		req.SOAPSubjective, req.SOAPObjective, req.SOAPAssessment, req.SOAPPlan,
		req.PMTGiven, req.PMTType, req.SupplementGiven, req.ClinicalNotes, req.FollowUpDate,
	).Scan(&id)
	if err != nil {
		return nil, fmt.Errorf("menyimpan home visit: %w", err)
	}

	// If weight and height are provided during the home visit, record them in measurements.
	if req.WeightKg != nil && req.HeightCm != nil && *req.WeightKg > 0 && *req.HeightCm > 0 {
		_, _ = r.db.Exec(ctx, `
			INSERT INTO measurements (
				child_id, age_months, measured_at, weight_kg, height_cm,
				measurement_pos, nutrition_status
			)
			SELECT
				c.id,
				GREATEST(0, (EXTRACT(YEAR FROM AGE($2::date, c.birth_date))*12 + EXTRACT(MONTH FROM AGE($2::date, c.birth_date)))::int),
				$2::date,
				$3,
				$4,
				'berdiri',
				COALESCE(
					(SELECT mm.nutrition_status FROM measurements mm WHERE mm.child_id = c.id ORDER BY mm.measured_at DESC LIMIT 1),
					'normal'
				)
			FROM children c
			WHERE c.id = $1::uuid
		`, req.ChildID, visitDate, *req.WeightKg, *req.HeightCm)
	}

	return r.GetHomeVisitByID(ctx, villageName, id)
}

func (r *repository) ListHomeVisits(ctx context.Context, villageName string, f ListFilter) ([]Record, int, error) {
	where, args := buildWhere(villageName, f)

	var total int
	countQuery := `
		SELECT COUNT(*)
		FROM interventions i
		JOIN children c ON c.id = i.child_id
	` + where + `;`
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		log.Printf("[INTERVENTIONS] count query error (status=%q search=%q): %v", f.Status, f.Search, err)
		return nil, 0, fmt.Errorf("menghitung daftar home visit: %w", err)
	}

	limit, offset := f.Limit, f.Offset
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	listArgs := append(append([]any{}, args...), limit, offset)
	listQuery := `
		SELECT ` + recordColumns + `
		FROM interventions i
		JOIN children c ON c.id = i.child_id
		` + latestMeasurement + where + `
		ORDER BY i.visit_date DESC, i.created_at DESC
		LIMIT $` + fmt.Sprint(len(args)+1) + ` OFFSET $` + fmt.Sprint(len(args)+2) + `;`

	rows, err := r.db.Query(ctx, listQuery, listArgs...)
	if err != nil {
		log.Printf("[INTERVENTIONS] list query error (status=%q search=%q limit=%d offset=%d): %v", f.Status, f.Search, limit, offset, err)
		return nil, 0, fmt.Errorf("memuat daftar home visit: %w", err)
	}
	defer rows.Close()

	list := []Record{}
	for rows.Next() {
		rec, err := scanRecord(rows)
		if err != nil {
			return nil, 0, fmt.Errorf("membaca baris home visit: %w", err)
		}
		list = append(list, *rec)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *repository) StatusCounts(ctx context.Context, villageName string) (map[string]int, error) {
	where, args := buildWhere(villageName, ListFilter{})
	query := `
		SELECT COALESCE(i.visit_status, 'SCHEDULED'), COUNT(*)::int
		FROM interventions i
		JOIN children c ON c.id = i.child_id
		` + where + `
		GROUP BY i.visit_status;
	`

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		log.Printf("[INTERVENTIONS] status counts query error (ctx=%v): %v", ctx.Err(), err)
		return nil, fmt.Errorf("menghitung status kunjungan: %w", err)
	}
	defer rows.Close()

	counts := map[string]int{}
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			log.Printf("[INTERVENTIONS] status counts scan error (ctx=%v): %v", ctx.Err(), err)
			return nil, fmt.Errorf("membaca hitung status: %w", err)
		}
		counts[status] = count
	}
	if err := rows.Err(); err != nil {
		log.Printf("[INTERVENTIONS] status counts rows error (ctx=%v): %v", ctx.Err(), err)
		return nil, err
	}
	return counts, nil
}

func (r *repository) GetHomeVisitByID(ctx context.Context, villageName, id string) (*Record, error) {
	query := `
		SELECT ` + recordColumns + `
		FROM interventions i
		JOIN children c ON c.id = i.child_id
		` + latestMeasurement + `
		WHERE i.id::text = $1 AND c.village_name = $2
		LIMIT 1;
	`

	rec, err := scanRecord(r.db.QueryRow(ctx, query, id, villageName))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("memuat home visit: %w", err)
	}
	return rec, nil
}

func (r *repository) UpdateStatus(ctx context.Context, villageName, id, status string) (*Record, error) {
	var updatedID string
	err := r.db.QueryRow(ctx, `
		UPDATE interventions i
		SET visit_status = $3, updated_at = NOW()
		FROM children c
		WHERE c.id = i.child_id AND i.id::text = $1 AND c.village_name = $2
		RETURNING i.id::text;
	`, id, villageName, status).Scan(&updatedID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("memperbarui status kunjungan: %w", err)
	}

	return r.GetHomeVisitByID(ctx, villageName, updatedID)
}

func (r *repository) UpdateHomeVisit(ctx context.Context, villageName, id string, req CreateRequest) (*Record, error) {
	var updatedID string
	err := r.db.QueryRow(ctx, `
		UPDATE interventions i
		SET
			visit_date       = COALESCE(NULLIF($3, '')::date, i.visit_date),
			visit_status     = COALESCE(NULLIF($4, ''), i.visit_status),
			soap_subjective  = $5,
			soap_objective   = $6,
			soap_assessment  = $7,
			soap_plan        = $8,
			pmt_given        = $9,
			pmt_type         = $10,
			supplement_given = $11,
			clinical_notes   = $12,
			follow_up_date   = NULLIF($13, '')::date,
			updated_at       = NOW()
		FROM children c
		WHERE c.id = i.child_id AND i.id::text = $1 AND c.village_name = $2
		RETURNING i.id::text;
	`,
		id, villageName, req.VisitDate, req.FollowUpStatus,
		req.SOAPSubjective, req.SOAPObjective, req.SOAPAssessment, req.SOAPPlan,
		req.PMTGiven, req.PMTType, req.SupplementGiven, req.ClinicalNotes, req.FollowUpDate,
	).Scan(&updatedID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("memperbarui kunjungan rumah: %w", err)
	}

	return r.GetHomeVisitByID(ctx, villageName, updatedID)
}

func (r *repository) DeleteHomeVisit(ctx context.Context, villageName, id string) error {
	tag, err := r.db.Exec(ctx, `
		DELETE FROM interventions i
		USING children c
		WHERE c.id = i.child_id AND i.id::text = $1 AND c.village_name = $2;
	`, id, villageName)
	if err != nil {
		return fmt.Errorf("menghapus kunjungan rumah: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
