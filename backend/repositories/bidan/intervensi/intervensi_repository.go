package intervensi

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Intervention represents a home visit / intervensi bidan
type Intervention struct {
	ID              string `json:"id"`
	ChildID         string `json:"child_id"`
	ChildName       string `json:"child_name"`
	VisitDate       string `json:"visit_date"`
	VisitStatus     string `json:"visit_status"`
	SOAPSubjective  string `json:"soap_subjective"`
	SOAPObjective   string `json:"soap_objective"`
	SOAPAssessment  string `json:"soap_assessment"`
	SOAPPlan        string `json:"soap_plan"`
	PMTGiven        bool   `json:"pmt_given"`
	PMTType         string `json:"pmt_type"`
	SupplementGiven string `json:"supplement_given"`
	ClinicalNotes   string `json:"clinical_notes"`
	FollowUpDate    string `json:"follow_up_date"`
	CreatedAt       string `json:"created_at"`
}

// CreateInterventionRequest holds data for creating a new intervention
type CreateInterventionRequest struct {
	ChildID         string `json:"child_id"`
	VisitDate       string `json:"visit_date"`
	VisitStatus     string `json:"visit_status"`
	SOAPSubjective  string `json:"soap_subjective"`
	SOAPObjective   string `json:"soap_objective"`
	SOAPAssessment  string `json:"soap_assessment"`
	SOAPPlan        string `json:"soap_plan"`
	PMTGiven        bool   `json:"pmt_given"`
	PMTType         string `json:"pmt_type"`
	SupplementGiven string `json:"supplement_given"`
	ClinicalNotes   string `json:"clinical_notes"`
	FollowUpDate    string `json:"follow_up_date"`
}

// UpdateInterventionRequest holds data for updating an existing intervention
type UpdateInterventionRequest struct {
	VisitStatus     string `json:"visit_status"`
	SOAPSubjective  string `json:"soap_subjective"`
	SOAPObjective   string `json:"soap_objective"`
	SOAPAssessment  string `json:"soap_assessment"`
	SOAPPlan        string `json:"soap_plan"`
	PMTGiven        *bool  `json:"pmt_given"`
	PMTType         string `json:"pmt_type"`
	SupplementGiven string `json:"supplement_given"`
	ClinicalNotes   string `json:"clinical_notes"`
	FollowUpDate    string `json:"follow_up_date"`
}

// Repository defines data contract for home visit interventions
type Repository interface {
	GetInterventionList(ctx context.Context, villageName string) ([]Intervention, error)
	GetInterventionByID(ctx context.Context, id string) (*Intervention, error)
	CreateIntervention(ctx context.Context, req CreateInterventionRequest) (*Intervention, error)
	UpdateIntervention(ctx context.Context, id string, req UpdateInterventionRequest) (*Intervention, error)
	DeleteIntervention(ctx context.Context, id string) error
}

type repository struct {
	db *pgxpool.Pool
}

// NewRepository instantiates Intervention Repository
func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func (r *repository) GetInterventionList(ctx context.Context, villageName string) ([]Intervention, error) {
	if villageName == "" {
		villageName = "Desa Sukamaju"
	}

	query := `
	SELECT
		i.id::text,
		i.child_id::text,
		COALESCE(c.full_name, ''),
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
		COALESCE(to_char(i.created_at, 'YYYY-MM-DD'), '')
	FROM interventions i
	LEFT JOIN children c ON c.id = i.child_id
	WHERE c.village_name = $1 OR c.village_name IS NULL OR c.village_name = ''
	ORDER BY i.visit_date DESC, i.created_at DESC;
	`

	rows, err := r.db.Query(ctx, query, villageName)
	if err != nil {
		log.Printf("[INTERVENSI] GetInterventionList query error: %v", err)
		return []Intervention{}, err
	}
	defer rows.Close()

	var list []Intervention
	for rows.Next() {
		var iv Intervention
		if err := rows.Scan(
			&iv.ID, &iv.ChildID, &iv.ChildName,
			&iv.VisitDate, &iv.VisitStatus,
			&iv.SOAPSubjective, &iv.SOAPObjective, &iv.SOAPAssessment, &iv.SOAPPlan,
			&iv.PMTGiven, &iv.PMTType, &iv.SupplementGiven,
			&iv.ClinicalNotes, &iv.FollowUpDate, &iv.CreatedAt,
		); err != nil {
			log.Printf("[INTERVENSI] Row scan error: %v", err)
			continue
		}
		list = append(list, iv)
	}

	if list == nil {
		list = []Intervention{}
	}
	return list, nil
}

func (r *repository) GetInterventionByID(ctx context.Context, id string) (*Intervention, error) {
	query := `
	SELECT
		i.id::text,
		i.child_id::text,
		COALESCE(c.full_name, ''),
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
		COALESCE(to_char(i.created_at, 'YYYY-MM-DD'), '')
	FROM interventions i
	LEFT JOIN children c ON c.id = i.child_id
	WHERE i.id::text = $1
	LIMIT 1;
	`

	var iv Intervention
	err := r.db.QueryRow(ctx, query, id).Scan(
		&iv.ID, &iv.ChildID, &iv.ChildName,
		&iv.VisitDate, &iv.VisitStatus,
		&iv.SOAPSubjective, &iv.SOAPObjective, &iv.SOAPAssessment, &iv.SOAPPlan,
		&iv.PMTGiven, &iv.PMTType, &iv.SupplementGiven,
		&iv.ClinicalNotes, &iv.FollowUpDate, &iv.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("intervensi dengan ID %s tidak ditemukan: %w", id, err)
	}
	return &iv, nil
}

func (r *repository) CreateIntervention(ctx context.Context, req CreateInterventionRequest) (*Intervention, error) {
	visitStatus := req.VisitStatus
	if visitStatus == "" {
		visitStatus = "SCHEDULED"
	}

	visitDate := req.VisitDate
	if visitDate == "" {
		visitDate = time.Now().Format("2006-01-02")
	}

	var id string
	query := `
	INSERT INTO interventions (
		child_id, visit_date, visit_status,
		soap_subjective, soap_objective, soap_assessment, soap_plan,
		pmt_given, pmt_type, supplement_given,
		clinical_notes, follow_up_date
	) VALUES (
		$1::uuid, $2::date, $3,
		$4, $5, $6, $7,
		$8, $9, $10,
		$11, NULLIF($12, '')::date
	)
	RETURNING id::text;
	`

	err := r.db.QueryRow(ctx, query,
		req.ChildID, visitDate, visitStatus,
		req.SOAPSubjective, req.SOAPObjective, req.SOAPAssessment, req.SOAPPlan,
		req.PMTGiven, req.PMTType, req.SupplementGiven,
		req.ClinicalNotes, req.FollowUpDate,
	).Scan(&id)
	if err != nil {
		log.Printf("[INTERVENSI] CreateIntervention error: %v", err)
		return nil, fmt.Errorf("gagal membuat intervensi: %w", err)
	}

	return r.GetInterventionByID(ctx, id)
}

func (r *repository) UpdateIntervention(ctx context.Context, id string, req UpdateInterventionRequest) (*Intervention, error) {
	query := `
	UPDATE interventions SET
		visit_status     = COALESCE(NULLIF($1, ''), visit_status),
		soap_subjective  = COALESCE(NULLIF($2, ''), soap_subjective),
		soap_objective   = COALESCE(NULLIF($3, ''), soap_objective),
		soap_assessment  = COALESCE(NULLIF($4, ''), soap_assessment),
		soap_plan        = COALESCE(NULLIF($5, ''), soap_plan),
		pmt_given        = COALESCE($6, pmt_given),
		pmt_type         = COALESCE(NULLIF($7, ''), pmt_type),
		supplement_given = COALESCE(NULLIF($8, ''), supplement_given),
		clinical_notes   = COALESCE(NULLIF($9, ''), clinical_notes),
		follow_up_date   = COALESCE(NULLIF($10, '')::date, follow_up_date)
	WHERE id::text = $11;
	`

	_, err := r.db.Exec(ctx, query,
		req.VisitStatus,
		req.SOAPSubjective, req.SOAPObjective, req.SOAPAssessment, req.SOAPPlan,
		req.PMTGiven, req.PMTType, req.SupplementGiven,
		req.ClinicalNotes, req.FollowUpDate,
		id,
	)
	if err != nil {
		log.Printf("[INTERVENSI] UpdateIntervention error: %v", err)
		return nil, fmt.Errorf("gagal memperbarui intervensi: %w", err)
	}

	return r.GetInterventionByID(ctx, id)
}

func (r *repository) DeleteIntervention(ctx context.Context, id string) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM interventions WHERE id::text = $1;`, id)
	if err != nil {
		return fmt.Errorf("gagal menghapus intervensi: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("intervensi dengan ID %s tidak ditemukan", id)
	}
	return nil
}
