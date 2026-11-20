package pmtevaluations

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

// Evaluation statuses derived from the 90-day PMT window (fitur.md 2.5).
const (
	StatusOngoing   = "ongoing"
	StatusGraduated = "graduated"
	StatusDefaulter = "defaulter"
	StatusNoData    = "no_data"
)

// WindowDays is the length of one PMT intervention cycle.
const WindowDays = 90

// ErrNotFound reports that the child has no intervention history in this village.
var ErrNotFound = errors.New("data tidak ditemukan")

// MeasurementPoint is one weighing inside the cohort window.
type MeasurementPoint struct {
	MeasuredAt      string   `json:"measured_at"`
	DayOffset       int      `json:"day_offset"`
	WeightKg        float64  `json:"weight_kg"`
	HeightCm        float64  `json:"height_cm"`
	NutritionStatus string   `json:"nutrition_status"`
	ZScoreWFA       *float64 `json:"zscore_wfa"`
	ZScoreHFA       *float64 `json:"zscore_hfa"`
	ZScoreWFH       *float64 `json:"zscore_wfh"`
}

// VisitNote is a home visit belonging to a cohort child.
type VisitNote struct {
	ID             string `json:"id"`
	VisitDate      string `json:"visit_date"`
	FollowUpStatus string `json:"follow_up_status"`
	PMTGiven       bool   `json:"pmt_given"`
	PMTType        string `json:"pmt_type"`
	SOAPPlan       string `json:"soap_plan"`
	ClinicalNotes  string `json:"clinical_notes"`
}

// CohortRow is the raw, unaggregated shape returned by the repository.
type CohortRow struct {
	ChildID                   string
	ChildName                 string
	BirthDate                 string
	Gender                    string
	ParentName                string
	ParentPhone               string
	PosyanduName              string
	FirstVisit                string
	LastVisit                 string
	VisitCount                int
	CompletedVisitCount       int
	PMTVisitCount             int
	EvaluationID              string
	ConsumptionCompliancePct  *float64
	DistributionCompliancePct *float64
	Notes                     string
	Measurements              []MeasurementPoint
}

// ListFilter scopes the cohort query inside one village.
type ListFilter struct {
	Search   string
	DateFrom string
	DateTo   string
	PMTOnly  bool
}

// ComplianceRequest carries the manual override written by the bidan.
type ComplianceRequest struct {
	ConsumptionCompliancePercent  *float64 `json:"consumption_compliance_percent"`
	DistributionCompliancePercent *float64 `json:"distribution_compliance_percent"`
	Notes                         *string  `json:"notes"`
}

// ComplianceRecord is the persisted manual override for one child.
type ComplianceRecord struct {
	EvaluationID              string   `json:"evaluation_id"`
	ChildID                   string   `json:"child_id"`
	ChildName                 string   `json:"child_name"`
	ConsumptionCompliancePct  *float64 `json:"consumption_compliance_percent"`
	DistributionCompliancePct *float64 `json:"distribution_compliance_percent"`
	Notes                     string   `json:"notes"`
	UpdatedAt                 string   `json:"updated_at"`
}

// Repository is the data contract for the 90-day PMT cohort.
type Repository interface {
	ChildExistsInVillage(ctx context.Context, villageName, childID string) (bool, error)
	ListCohort(ctx context.Context, villageName string, f ListFilter) ([]CohortRow, error)
	GetChildVisits(ctx context.Context, villageName, childID string) ([]VisitNote, error)
	SaveCompliance(ctx context.Context, villageName, childID string, req ComplianceRequest, updatedBy int64) (*ComplianceRecord, error)
}

type repository struct {
	db *pgxpool.Pool
}

// NewRepository instantiates the PMT evaluation repository.
func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

// cohortCTE groups a village's home visits into per-child windows. The window
// start is the first visit, which is day 0 of the 90-day PMT cycle.
const cohortCTE = `
WITH cohort AS (
	SELECT
		i.child_id,
		MIN(i.visit_date) AS first_visit,
		MAX(i.visit_date) AS last_visit,
		COUNT(*) AS visit_count,
		COUNT(*) FILTER (WHERE i.visit_status = 'COMPLETED') AS completed_count,
		COUNT(*) FILTER (WHERE i.pmt_given) AS pmt_count
	FROM interventions i
	JOIN children c ON c.id = i.child_id
	WHERE c.village_name = $1
		AND ($2::text = '' OR c.full_name ILIKE '%' || $2::text || '%')
		AND ($3::date IS NULL OR i.visit_date >= $3::date)
		AND ($4::date IS NULL OR i.visit_date <= $4::date)
		AND ($5::boolean = FALSE OR i.pmt_given)
	GROUP BY i.child_id
)
`

const cohortSelect = `
SELECT
	ch.child_id::text,
	c.full_name,
	to_char(c.birth_date, 'YYYY-MM-DD'),
	c.gender,
	COALESCE(c.parent_name, ''),
	COALESCE(c.parent_phone, ''),
	COALESCE(c.posyandu_name, ''),
	to_char(ch.first_visit, 'YYYY-MM-DD'),
	to_char(ch.last_visit, 'YYYY-MM-DD'),
	ch.visit_count::int,
	ch.completed_count::int,
	ch.pmt_count::int,
	COALESCE(pe.id::text, ''),
	pe.consumption_compliance_percent::float8,
	pe.distribution_compliance_percent::float8,
	COALESCE(pe.notes, ''),
	m.measured_at::text,
	m.weight_kg,
	m.height_cm,
	COALESCE(m.nutrition_status, ''),
	m.zscore_wfa::float8,
	m.zscore_hfa::float8,
	m.zscore_wfh::float8
FROM cohort ch
JOIN children c ON c.id = ch.child_id
LEFT JOIN pmt_evaluations pe ON pe.child_id = ch.child_id
LEFT JOIN measurements m ON m.child_id = ch.child_id
`

func buildFilterArgs(f ListFilter) []any {
	var from, to any
	if t, err := time.Parse("2006-01-02", f.DateFrom); err == nil {
		from = t
	}
	if t, err := time.Parse("2006-01-02", f.DateTo); err == nil {
		to = t
	}
	return []any{strings.TrimSpace(f.Search), from, to, f.PMTOnly}
}

func groupRows(rows [][]any) []CohortRow {
	var order []string
	byChild := map[string]*CohortRow{}

	f64 := func(v any) *float64 {
		if v == nil {
			return nil
		}
		f, ok := v.(float64)
		if !ok {
			return nil
		}
		return &f
	}
	str := func(v any) string {
		s, _ := v.(string)
		return s
	}

	for _, r := range rows {
		childID := str(r[0])
		item, seen := byChild[childID]
		if !seen {
			item = &CohortRow{
				ChildID:                   childID,
				ChildName:                 str(r[1]),
				BirthDate:                 str(r[2]),
				Gender:                    str(r[3]),
				ParentName:                str(r[4]),
				ParentPhone:               str(r[5]),
				PosyanduName:              str(r[6]),
				FirstVisit:                str(r[7]),
				LastVisit:                 str(r[8]),
				VisitCount:                int(r[9].(int32)),
				CompletedVisitCount:       int(r[10].(int32)),
				PMTVisitCount:             int(r[11].(int32)),
				EvaluationID:              str(r[12]),
				ConsumptionCompliancePct:  f64(r[13]),
				DistributionCompliancePct: f64(r[14]),
				Notes:                     str(r[15]),
			}
			byChild[childID] = item
			order = append(order, childID)
		}

		measuredAt := r[16]
		if measuredAt == nil {
			continue
		}
		point := MeasurementPoint{
			MeasuredAt:      str(measuredAt),
			WeightKg:        r[17].(float64),
			HeightCm:        r[18].(float64),
			NutritionStatus: str(r[19]),
			ZScoreWFA:       f64(r[20]),
			ZScoreHFA:       f64(r[21]),
			ZScoreWFH:       f64(r[22]),
		}
		item.Measurements = append(item.Measurements, point)
	}

	out := make([]CohortRow, 0, len(order))
	for _, id := range order {
		out = append(out, *byChild[id])
	}
	return out
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

func (r *repository) ListCohort(ctx context.Context, villageName string, f ListFilter) ([]CohortRow, error) {
	args := append([]any{villageName}, buildFilterArgs(f)...)
	query := cohortCTE + cohortSelect + ` ORDER BY ch.child_id, m.measured_at;`

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		log.Printf("[PMT-EVAL] cohort query error (ctx=%v): %v", ctx.Err(), err)
		return nil, fmt.Errorf("memuat kohor PMT: %w", err)
	}
	defer rows.Close()

	var raw [][]any
	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			log.Printf("[PMT-EVAL] cohort row error (ctx=%v): %v", ctx.Err(), err)
			return nil, fmt.Errorf("membaca baris kohor PMT: %w", err)
		}
		raw = append(raw, values)
	}
	if err := rows.Err(); err != nil {
		log.Printf("[PMT-EVAL] cohort rows error (ctx=%v): %v", ctx.Err(), err)
		return nil, err
	}
	if len(raw) > 0 && len(raw[0]) != 23 {
		return nil, fmt.Errorf("memuat kohor PMT: jumlah kolom tidak sesuai (%d)", len(raw[0]))
	}

	return groupRows(raw), nil
}

func (r *repository) GetChildVisits(ctx context.Context, villageName, childID string) ([]VisitNote, error) {
	rows, err := r.db.Query(ctx, `
		SELECT
			i.id::text,
			to_char(i.visit_date, 'YYYY-MM-DD'),
			COALESCE(i.visit_status, 'SCHEDULED'),
			COALESCE(i.pmt_given, FALSE),
			COALESCE(i.pmt_type, ''),
			COALESCE(i.soap_plan, ''),
			COALESCE(i.clinical_notes, '')
		FROM interventions i
		JOIN children c ON c.id = i.child_id
		WHERE c.village_name = $1 AND i.child_id::text = $2
		ORDER BY i.visit_date DESC, i.created_at DESC;
	`, villageName, childID)
	if err != nil {
		return nil, fmt.Errorf("memuat riwayat kunjungan: %w", err)
	}
	defer rows.Close()

	visits := []VisitNote{}
	for rows.Next() {
		var v VisitNote
		if err := rows.Scan(&v.ID, &v.VisitDate, &v.FollowUpStatus, &v.PMTGiven, &v.PMTType, &v.SOAPPlan, &v.ClinicalNotes); err != nil {
			return nil, fmt.Errorf("membaca riwayat kunjungan: %w", err)
		}
		visits = append(visits, v)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return visits, nil
}

func (r *repository) SaveCompliance(ctx context.Context, villageName, childID string, req ComplianceRequest, updatedBy int64) (*ComplianceRecord, error) {
	var updatedByArg any
	if updatedBy > 0 {
		updatedByArg = updatedBy
	}
	notesChanged := req.Notes != nil

	var evaluationID string
	err := r.db.QueryRow(ctx, `
		INSERT INTO pmt_evaluations (
			child_id, village_name, consumption_compliance_percent,
			distribution_compliance_percent, notes, updated_by
		) VALUES ($1::uuid, $2, $3, $4, COALESCE($5, ''), $6)
		ON CONFLICT (child_id) DO UPDATE SET
			village_name                      = EXCLUDED.village_name,
			consumption_compliance_percent    = COALESCE($3, pmt_evaluations.consumption_compliance_percent),
			distribution_compliance_percent   = COALESCE($4, pmt_evaluations.distribution_compliance_percent),
			notes                             = CASE WHEN $7 THEN EXCLUDED.notes ELSE pmt_evaluations.notes END,
			updated_by                        = EXCLUDED.updated_by,
			updated_at                        = NOW()
		RETURNING id::text;
	`, childID, villageName, req.ConsumptionCompliancePercent, req.DistributionCompliancePercent,
		req.Notes, updatedByArg, notesChanged).Scan(&evaluationID)
	if err != nil {
		return nil, fmt.Errorf("menyimpan kepatuhan PMT: %w", err)
	}

	var rec ComplianceRecord
	err = r.db.QueryRow(ctx, `
		SELECT
			pe.id::text,
			pe.child_id::text,
			COALESCE(c.full_name, ''),
			pe.consumption_compliance_percent::float8,
			pe.distribution_compliance_percent::float8,
			COALESCE(pe.notes, ''),
			to_char(pe.updated_at, 'YYYY-MM-DD HH24:MI')
		FROM pmt_evaluations pe
		LEFT JOIN children c ON c.id = pe.child_id
		WHERE pe.id::text = $1 AND pe.village_name = $2
		LIMIT 1;
	`, evaluationID, villageName).Scan(
		&rec.EvaluationID, &rec.ChildID, &rec.ChildName,
		&rec.ConsumptionCompliancePct, &rec.DistributionCompliancePct,
		&rec.Notes, &rec.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("membaca kepatuhan PMT: %w", err)
	}
	return &rec, nil
}
