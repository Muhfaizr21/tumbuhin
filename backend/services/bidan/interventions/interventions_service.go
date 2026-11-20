package interventions

import (
	"context"
	"fmt"
	"strings"
	"time"

	"tumbuhin-backend/repositories/bidan/interventions"
)

// ValidationError carries a user-facing message produced by input validation.
// The controller maps it to HTTP 400 instead of 500.
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string { return e.Message }

// CreateInput is the transport-level payload accepted by the service.
type CreateInput struct {
	ChildID         string   `json:"child_id"`
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
}

// ListResult wraps a page of home visits with its total count.
type ListResult struct {
	Items        []interventions.Record `json:"items"`
	Total        int                    `json:"total"`
	Limit        int                    `json:"limit"`
	Offset       int                    `json:"offset"`
	TotalPages   int                    `json:"total_pages"`
	StatusCounts map[string]int         `json:"status_counts"`
}

// StatusInput is the body of PATCH /bidan/interventions/:id/status.
type StatusInput struct {
	FollowUpStatus string `json:"follow_up_status"`
}

// Service exposes Batch 2 home visit use cases.
type Service interface {
	ListHomeVisits(ctx context.Context, villageName string, f interventions.ListFilter) (*ListResult, error)
	CreateHomeVisit(ctx context.Context, villageName string, bidanID int64, in CreateInput) (*interventions.Record, error)
	UpdateStatus(ctx context.Context, villageName, id string, in StatusInput) (*interventions.Record, error)
}

type service struct {
	repo interventions.Repository
}

// NewService instantiates the home visit service.
func NewService(repo interventions.Repository) Service {
	return &service{repo: repo}
}

const (
	maxSOAPChars       = 4000
	maxNoteChars       = 2000
	minWeightKg        = 0.5
	maxWeightKg        = 40.0
	minHeightCm        = 30.0
	maxHeightCm        = 140.0
	allowedDateBackYrs = 2
	allowedDateFwdYrs  = 1
)

func (s *service) ListHomeVisits(ctx context.Context, villageName string, f interventions.ListFilter) (*ListResult, error) {
	if raw := strings.TrimSpace(f.Status); raw != "" {
		normalized := normalizeStatus(raw)
		if normalized == "" {
			return nil, &ValidationError{Message: "Filter status tidak dikenali. Gunakan SCHEDULED, COMPLETED, FOLLOW_UP, atau REFERRED."}
		}
		f.Status = normalized
	} else {
		f.Status = ""
	}
	f.Search = strings.TrimSpace(f.Search)
	f.ChildID = strings.TrimSpace(f.ChildID)

	if err := validateDateRange(f.DateFrom, f.DateTo); err != nil {
		return nil, err
	}

	items, total, err := s.repo.ListHomeVisits(ctx, villageName, f)
	if err != nil {
		return nil, err
	}

	counts, err := s.repo.StatusCounts(ctx, villageName)
	if err != nil {
		return nil, err
	}

	limit := f.Limit
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	offset := f.Offset
	if offset < 0 {
		offset = 0
	}
	totalPages := 0
	if total > 0 {
		totalPages = (total + limit - 1) / limit
	}

	return &ListResult{
		Items:        items,
		Total:        total,
		Limit:        limit,
		Offset:       offset,
		TotalPages:   totalPages,
		StatusCounts: counts,
	}, nil
}

func (s *service) CreateHomeVisit(ctx context.Context, villageName string, bidanID int64, in CreateInput) (*interventions.Record, error) {
	in.ChildID = strings.TrimSpace(in.ChildID)
	if in.ChildID == "" {
		return nil, &ValidationError{Message: "ID balita wajib dipilih untuk mencatat kunjungan rumah."}
	}
	if !isUUID(in.ChildID) {
		return nil, &ValidationError{Message: "Format ID balita tidak valid."}
	}

	exists, err := s.repo.ChildExistsInVillage(ctx, villageName, in.ChildID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, &ValidationError{Message: "Balita tidak ditemukan di desa Anda."}
	}

	if strings.TrimSpace(in.VisitDate) == "" {
		return nil, &ValidationError{Message: "Tanggal kunjungan wajib diisi."}
	}
	visitDate, err := time.Parse("2006-01-02", strings.TrimSpace(in.VisitDate))
	if err != nil {
		return nil, &ValidationError{Message: "Format tanggal kunjungan harus YYYY-MM-DD."}
	}
	if err := dateWithinWindow(visitDate); err != nil {
		return nil, err
	}

	if strings.TrimSpace(in.FollowUpStatus) == "" {
		return nil, &ValidationError{Message: "Status tindak lanjut wajib dipilih (SCHEDULED, COMPLETED, FOLLOW_UP, atau REFERRED)."}
	}
	in.FollowUpStatus = normalizeStatus(in.FollowUpStatus)
	if in.FollowUpStatus == "" {
		return nil, &ValidationError{Message: "Status tindak lanjut tidak dikenali. Gunakan SCHEDULED, COMPLETED, FOLLOW_UP, atau REFERRED."}
	}

	soapFields := []struct {
		label string
		value string
	}{
		{"Subjective (S)", in.SOAPSubjective},
		{"Objective (O)", in.SOAPObjective},
		{"Assessment (A)", in.SOAPAssessment},
		{"Plan (P)", in.SOAPPlan},
	}
	for _, f := range soapFields {
		trimmed := strings.TrimSpace(f.value)
		if trimmed == "" {
			return nil, &ValidationError{Message: "Catatan SOAP " + f.label + " wajib diisi."}
		}
		if len(trimmed) > maxSOAPChars {
			return nil, &ValidationError{Message: "Catatan SOAP " + f.label + " maksimal " + fmt.Sprint(maxSOAPChars) + " karakter."}
		}
	}

	in.PMTType = strings.TrimSpace(in.PMTType)
	if in.PMTGiven && in.PMTType == "" {
		return nil, &ValidationError{Message: "Jenis PMT wajib diisi bila pemberian PMT dicentang."}
	}
	if len(in.PMTType) > 80 {
		return nil, &ValidationError{Message: "Jenis PMT maksimal 80 karakter."}
	}
	if len(in.SupplementGiven) > maxNoteChars {
		return nil, &ValidationError{Message: "Catatan suplemen maksimal " + fmt.Sprint(maxNoteChars) + " karakter."}
	}
	if len(in.ClinicalNotes) > maxNoteChars {
		return nil, &ValidationError{Message: "Catatan klinis maksimal " + fmt.Sprint(maxNoteChars) + " karakter."}
	}

	if in.FollowUpDate != "" {
		followUp, err := time.Parse("2006-01-02", strings.TrimSpace(in.FollowUpDate))
		if err != nil {
			return nil, &ValidationError{Message: "Format tanggal evaluasi lanjutan harus YYYY-MM-DD."}
		}
		if followUp.Before(visitDate) {
			return nil, &ValidationError{Message: "Tanggal evaluasi lanjutan tidak boleh sebelum tanggal kunjungan."}
		}
		if err := dateWithinWindow(followUp); err != nil {
			return nil, err
		}
	}

	if err := validateAnthropometry(in.WeightKg, in.HeightCm); err != nil {
		return nil, err
	}

	return s.repo.CreateHomeVisit(ctx, villageName, bidanID, interventions.CreateRequest{
		ChildID:         in.ChildID,
		VisitDate:       visitDate.Format("2006-01-02"),
		FollowUpStatus:  in.FollowUpStatus,
		SOAPSubjective:  strings.TrimSpace(in.SOAPSubjective),
		SOAPObjective:   strings.TrimSpace(in.SOAPObjective),
		SOAPAssessment:  strings.TrimSpace(in.SOAPAssessment),
		SOAPPlan:        strings.TrimSpace(in.SOAPPlan),
		PMTGiven:        in.PMTGiven,
		PMTType:         in.PMTType,
		SupplementGiven: strings.TrimSpace(in.SupplementGiven),
		ClinicalNotes:   strings.TrimSpace(in.ClinicalNotes),
		FollowUpDate:    strings.TrimSpace(in.FollowUpDate),
	})
}

func (s *service) UpdateStatus(ctx context.Context, villageName, id string, in StatusInput) (*interventions.Record, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, &ValidationError{Message: "ID kunjungan harus diisi."}
	}
	if !isUUID(id) {
		return nil, &ValidationError{Message: "Format ID kunjungan tidak valid."}
	}

	if strings.TrimSpace(in.FollowUpStatus) == "" {
		return nil, &ValidationError{Message: "Status tindak lanjut wajib dipilih."}
	}
	status := normalizeStatus(in.FollowUpStatus)
	if status == "" {
		return nil, &ValidationError{Message: "Status tindak lanjut tidak dikenali. Gunakan SCHEDULED, COMPLETED, FOLLOW_UP, atau REFERRED."}
	}

	return s.repo.UpdateStatus(ctx, villageName, id, status)
}

func normalizeStatus(raw string) string {
	upper := strings.ToUpper(strings.ReplaceAll(strings.TrimSpace(raw), "-", "_"))
	for _, allowed := range interventions.FollowUpStatuses {
		if upper == allowed {
			return upper
		}
	}
	if upper == "" {
		return ""
	}
	// Unknown values are rejected by returning the empty marker.
	return ""
}

func validateDateRange(from, to string) error {
	if from == "" || to == "" {
		return nil
	}
	start, err := time.Parse("2006-01-02", from)
	if err != nil {
		return &ValidationError{Message: "Format tanggal mulai harus YYYY-MM-DD."}
	}
	end, err := time.Parse("2006-01-02", to)
	if err != nil {
		return &ValidationError{Message: "Format tanggal akhir harus YYYY-MM-DD."}
	}
	if end.Before(start) {
		return &ValidationError{Message: "Tanggal akhir tidak boleh sebelum tanggal mulai."}
	}
	return nil
}

func dateWithinWindow(d time.Time) error {
	today := time.Now()
	if d.After(today.AddDate(allowedDateFwdYrs, 0, 0)) {
		return &ValidationError{Message: "Tanggal kunjungan tidak boleh lebih dari 1 tahun ke depan."}
	}
	if d.Before(today.AddDate(-allowedDateBackYrs, 0, 0)) {
		return &ValidationError{Message: "Tanggal kunjungan tidak boleh lebih dari 2 tahun ke belakang."}
	}
	return nil
}

func validateAnthropometry(weight, height *float64) error {
	if weight != nil && (*weight < minWeightKg || *weight > maxWeightKg) {
		return &ValidationError{Message: "Berat badan harus di antara 0.5 kg dan 40 kg."}
	}
	if height != nil && (*height < minHeightCm || *height > maxHeightCm) {
		return &ValidationError{Message: "Tinggi badan harus di antara 30 cm dan 140 cm."}
	}
	return nil
}

func isUUID(s string) bool {
	if len(s) != 36 {
		return false
	}
	for i, ch := range s {
		switch i {
		case 8, 13, 18, 23:
			if ch != '-' {
				return false
			}
		default:
			isHex := (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')
			if !isHex {
				return false
			}
		}
	}
	return true
}
