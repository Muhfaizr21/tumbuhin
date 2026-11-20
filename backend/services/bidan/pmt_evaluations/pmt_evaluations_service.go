package pmtevaluations

import (
	"context"
	"math"
	"strings"
	"time"

	"tumbuhin-backend/repositories/bidan/pmt_evaluations"
)

// ValidationError carries a user-facing message produced by input validation.
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string { return e.Message }

// Query is the transport-level filter for the cohort listing.
type Query struct {
	Status   string `json:"status"`
	Search   string `json:"search"`
	DateFrom string `json:"date_from"`
	DateTo   string `json:"date_to"`
	PMTOnly  bool   `json:"pmt_only"`
	Limit    int    `json:"limit"`
	Offset   int    `json:"offset"`
}

// CohortItem is one child's 90-day PMT evaluation line.
type CohortItem struct {
	EvaluationID              string   `json:"evaluation_id"`
	ChildID                   string   `json:"child_id"`
	ChildName                 string   `json:"child_name"`
	BirthDate                 string   `json:"birth_date"`
	AgeMonths                 int      `json:"age_months"`
	Gender                    string   `json:"gender"`
	ParentName                string   `json:"parent_name"`
	ParentPhone               string   `json:"parent_phone"`
	PosyanduName              string   `json:"posyandu_name"`
	FirstVisit                string   `json:"first_visit"`
	LastVisit                 string   `json:"last_visit"`
	ElapsedDays               int      `json:"elapsed_days"`
	PeriodDays                int      `json:"period_days"`
	VisitCount                int      `json:"visit_count"`
	CompletedVisitCount       int      `json:"completed_visit_count"`
	PMTVisitCount             int      `json:"pmt_visit_count"`
	Day0WeightKg              *float64 `json:"day0_weight_kg"`
	Day30WeightKg             *float64 `json:"day30_weight_kg"`
	Day60WeightKg             *float64 `json:"day60_weight_kg"`
	Day90WeightKg             *float64 `json:"day90_weight_kg"`
	FirstWeightKg             *float64 `json:"first_weight_kg"`
	LastWeightKg              *float64 `json:"last_weight_kg"`
	WeightGainG               *float64 `json:"weight_gain_g"`
	HeightCm                  *float64 `json:"height_cm"`
	StatusGizi                string   `json:"status_gizi"`
	ZScoreWFA                 *float64 `json:"zscore_wfa"`
	ZScoreHFA                 *float64 `json:"zscore_hfa"`
	ConsumptionCompliancePct  *float64 `json:"consumption_compliance_percent"`
	DistributionCompliancePct *float64 `json:"distribution_compliance_percent"`
	Notes                     string   `json:"notes"`
	EvaluationStatus          string   `json:"evaluation_status"`
	SuccessIndicator          string   `json:"success_indicator"`
}

// Summary holds the cohort KPIs rendered as the page's metric cards.
type Summary struct {
	CohortCount               int      `json:"cohort_count"`
	OngoingCount              int      `json:"ongoing_count"`
	GraduatedCount            int      `json:"graduated_count"`
	DefaulterCount            int      `json:"defaulter_count"`
	NoDataCount               int      `json:"no_data_count"`
	GraduationRate            float64  `json:"graduation_rate"`
	AvgWeightGainG            *float64 `json:"avg_weight_gain_g"`
	ChildrenWithGain          int      `json:"children_with_gain"`
	ChildrenLostWeight        int      `json:"children_lost_weight"`
	TotalVisits               int      `json:"total_visits"`
	PMTCoverageRate           float64  `json:"pmt_coverage_rate"`
	AvgConsumptionCompliance  *float64 `json:"avg_consumption_compliance_percent"`
	AvgDistributionCompliance *float64 `json:"avg_distribution_compliance_percent"`
	WindowDays                int      `json:"window_days"`
	GeneratedAt               string   `json:"generated_at"`
}

// ListResult is the response body of GET /api/v1/bidan/pmt-evaluations.
type ListResult struct {
	Summary       Summary      `json:"summary"`
	Items         []CohortItem `json:"items"`
	TotalFiltered int          `json:"total_filtered"`
	AppliedStatus string       `json:"applied_status"`
}

// Detail is the response body of GET /api/v1/bidan/pmt-evaluations/:id.
type Detail struct {
	CohortItem
	Measurements []pmtevaluations.MeasurementPoint `json:"measurements"`
	Visits       []pmtevaluations.VisitNote        `json:"visits"`
}

// Service exposes the 90-day PMT cohort use cases.
type Service interface {
	ListEvaluations(ctx context.Context, villageName string, q Query) (*ListResult, error)
	GetDetail(ctx context.Context, villageName, childID string) (*Detail, error)
	UpdateCompliance(ctx context.Context, villageName, childID string, req pmtevaluations.ComplianceRequest, updatedBy int64) (*pmtevaluations.ComplianceRecord, error)
}

type service struct {
	repo pmtevaluations.Repository
	now  func() time.Time
}

// NewService instantiates the PMT evaluation service.
func NewService(repo pmtevaluations.Repository) Service {
	return &service{repo: repo, now: time.Now}
}

// validStatuses lists every filterable evaluation status.
var validStatuses = map[string]bool{
	"":          true,
	"ongoing":   true,
	"graduated": true,
	"defaulter": true,
	"no_data":   true,
	"all":       true,
}

const maxNotesChars = 1000

func (s *service) ListEvaluations(ctx context.Context, villageName string, q Query) (*ListResult, error) {
	q.Status = strings.ToLower(strings.TrimSpace(q.Status))
	if !validStatuses[q.Status] {
		return nil, &ValidationError{Message: "Filter status tidak dikenali. Gunakan ongoing, graduated, defaulter, atau no_data."}
	}
	if q.Status == "all" {
		q.Status = ""
	}
	q.Search = strings.TrimSpace(q.Search)
	if err := validateDateRange(q.DateFrom, q.DateTo); err != nil {
		return nil, err
	}

	rows, err := s.repo.ListCohort(ctx, villageName, pmtevaluations.ListFilter{
		Search:   q.Search,
		DateFrom: q.DateFrom,
		DateTo:   q.DateTo,
		PMTOnly:  q.PMTOnly,
	})
	if err != nil {
		return nil, err
	}

	now := s.now()
	all := make([]CohortItem, 0, len(rows))
	for _, row := range rows {
		all = append(all, buildItem(row, now))
	}

	summary := buildSummary(all, now)

	filtered := all
	if q.Status != "" {
		filtered = []CohortItem{}
		for _, item := range all {
			if item.EvaluationStatus == q.Status {
				filtered = append(filtered, item)
			}
		}
	}

	totalFiltered := len(filtered)
	limit := q.Limit
	if limit <= 0 || limit > 200 {
		limit = 100
	}
	offset := q.Offset
	if offset < 0 {
		offset = 0
	}
	if offset > len(filtered) {
		offset = len(filtered)
	}
	end := offset + limit
	if end > len(filtered) {
		end = len(filtered)
	}

	return &ListResult{
		Summary:       summary,
		Items:         filtered[offset:end],
		TotalFiltered: totalFiltered,
		AppliedStatus: q.Status,
	}, nil
}

func (s *service) GetDetail(ctx context.Context, villageName, childID string) (*Detail, error) {
	childID = strings.TrimSpace(childID)
	if childID == "" {
		return nil, &ValidationError{Message: "ID balita harus diisi."}
	}

	rows, err := s.repo.ListCohort(ctx, villageName, pmtevaluations.ListFilter{})
	if err != nil {
		return nil, err
	}

	now := s.now()
	for _, row := range rows {
		if row.ChildID != childID {
			continue
		}
		visits, err := s.repo.GetChildVisits(ctx, villageName, childID)
		if err != nil {
			return nil, err
		}
		return &Detail{
			CohortItem:   buildItem(row, now),
			Measurements: row.Measurements,
			Visits:       visits,
		}, nil
	}
	return nil, pmtevaluations.ErrNotFound
}

func (s *service) UpdateCompliance(ctx context.Context, villageName, childID string, req pmtevaluations.ComplianceRequest, updatedBy int64) (*pmtevaluations.ComplianceRecord, error) {
	childID = strings.TrimSpace(childID)
	if childID == "" {
		return nil, &ValidationError{Message: "ID balita harus diisi."}
	}

	if req.ConsumptionCompliancePercent != nil && !inRange(*req.ConsumptionCompliancePercent, 0, 100) {
		return nil, &ValidationError{Message: "Persentase kepatuhan konsumsi harus antara 0 dan 100."}
	}
	if req.DistributionCompliancePercent != nil && !inRange(*req.DistributionCompliancePercent, 0, 100) {
		return nil, &ValidationError{Message: "Persentase kepatuhan penyaluran harus antara 0 dan 100."}
	}
	if req.ConsumptionCompliancePercent == nil && req.DistributionCompliancePercent == nil && req.Notes == nil {
		return nil, &ValidationError{Message: "Tidak ada perubahan yang dikirim. Isi salah satu kolom kepatuhan atau catatan."}
	}
	if req.Notes != nil && len(strings.TrimSpace(*req.Notes)) > maxNotesChars {
		return nil, &ValidationError{Message: "Catatan evaluasi maksimal 1000 karakter."}
	}

	exists, err := s.repo.ChildExistsInVillage(ctx, villageName, childID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, &ValidationError{Message: "Balita tidak ditemukan di desa Anda."}
	}

	return s.repo.SaveCompliance(ctx, villageName, childID, req, updatedBy)
}

// buildItem turns one raw cohort row into the evaluated 90-day line.
func buildItem(row pmtevaluations.CohortRow, now time.Time) CohortItem {
	item := CohortItem{
		EvaluationID:              row.EvaluationID,
		ChildID:                   row.ChildID,
		ChildName:                 row.ChildName,
		BirthDate:                 row.BirthDate,
		Gender:                    row.Gender,
		ParentName:                row.ParentName,
		ParentPhone:               row.ParentPhone,
		PosyanduName:              row.PosyanduName,
		FirstVisit:                row.FirstVisit,
		LastVisit:                 row.LastVisit,
		PeriodDays:                pmtevaluations.WindowDays,
		VisitCount:                row.VisitCount,
		CompletedVisitCount:       row.CompletedVisitCount,
		PMTVisitCount:             row.PMTVisitCount,
		StatusGizi:                "",
		ConsumptionCompliancePct:  row.ConsumptionCompliancePct,
		DistributionCompliancePct: row.DistributionCompliancePct,
		Notes:                     row.Notes,
	}

	item.AgeMonths = ageInMonths(parseDate(row.BirthDate), now)

	firstVisit := parseDate(row.FirstVisit)
	if !firstVisit.IsZero() {
		item.ElapsedDays = daysBetween(firstVisit, now)
	}

	var day0, day30, day60, day90 *float64
	var first, last *pmtevaluations.MeasurementPoint

	for i := range row.Measurements {
		point := &row.Measurements[i]
		offset := daysBetween(firstVisit, parseDate(point.MeasuredAt))
		point.DayOffset = offset

		if offset <= 15 {
			day0 = &point.WeightKg
		} else if offset <= 45 {
			day30 = &point.WeightKg
		} else if offset <= 75 {
			day60 = &point.WeightKg
		} else {
			day90 = &point.WeightKg
		}

		if first == nil {
			first = point
		}
		last = point
	}

	item.Day0WeightKg = day0
	item.Day30WeightKg = day30
	item.Day60WeightKg = day60
	item.Day90WeightKg = day90
	if first != nil {
		w := first.WeightKg
		item.FirstWeightKg = &w
	}
	if last != nil {
		w := last.WeightKg
		h := last.HeightCm
		item.LastWeightKg = &w
		item.HeightCm = &h
		item.StatusGizi = last.NutritionStatus
		item.ZScoreWFA = last.ZScoreWFA
		item.ZScoreHFA = last.ZScoreHFA
	}

	base, final := day0, day90
	if base == nil {
		base = item.FirstWeightKg
	}
	if final == nil {
		final = item.LastWeightKg
	}
	if base != nil && final != nil {
		gain := round1((*final - *base) * 1000)
		item.WeightGainG = &gain
	}

	item.EvaluationStatus, item.SuccessIndicator = evaluate(item)
	return item
}

// evaluate applies the graduation rule: a child graduates once the 90-day
// window has closed with at least three visits and a green-band (normal)
// nutrition status.
func evaluate(item CohortItem) (status, indicator string) {
	switch {
	case item.ElapsedDays < pmtevaluations.WindowDays:
		return pmtevaluations.StatusOngoing, "Masih berjalan"
	case item.LastWeightKg == nil:
		return pmtevaluations.StatusNoData, "Belum ada data timbangan"
	case item.VisitCount < 3:
		return pmtevaluations.StatusDefaulter, "Kunjungan kurang dari 3 kali"
	case item.StatusGizi == "normal":
		return pmtevaluations.StatusGraduated, "Berhasil graduasi"
	default:
		return pmtevaluations.StatusDefaulter, "Status gizi belum normal"
	}
}

func buildSummary(items []CohortItem, now time.Time) Summary {
	s := Summary{
		CohortCount: len(items),
		WindowDays:  pmtevaluations.WindowDays,
		GeneratedAt: now.Format("2006-01-02 15:04"),
	}

	var gainSum float64
	var consumptionSum, distributionSum float64
	var consumptionN, distributionN, pmtChildren int

	for _, item := range items {
		s.TotalVisits += item.VisitCount
		if item.PMTVisitCount > 0 {
			pmtChildren++
		}

		switch item.EvaluationStatus {
		case pmtevaluations.StatusGraduated:
			s.GraduatedCount++
		case pmtevaluations.StatusOngoing:
			s.OngoingCount++
		case pmtevaluations.StatusNoData:
			s.NoDataCount++
		default:
			s.DefaulterCount++
		}

		if item.WeightGainG != nil {
			gainSum += *item.WeightGainG
			s.ChildrenWithGain++
			if *item.WeightGainG < 0 {
				s.ChildrenLostWeight++
			}
		}
		if item.ConsumptionCompliancePct != nil {
			consumptionSum += *item.ConsumptionCompliancePct
			consumptionN++
		}
		if item.DistributionCompliancePct != nil {
			distributionSum += *item.DistributionCompliancePct
			distributionN++
		}
	}

	if s.CohortCount > 0 {
		s.GraduationRate = round1(float64(s.GraduatedCount) / float64(s.CohortCount) * 100)
		s.PMTCoverageRate = round1(float64(pmtChildren) / float64(s.CohortCount) * 100)
	}
	if s.ChildrenWithGain > 0 {
		avg := round1(gainSum / float64(s.ChildrenWithGain))
		s.AvgWeightGainG = &avg
	}
	if consumptionN > 0 {
		avg := round1(consumptionSum / float64(consumptionN))
		s.AvgConsumptionCompliance = &avg
	}
	if distributionN > 0 {
		avg := round1(distributionSum / float64(distributionN))
		s.AvgDistributionCompliance = &avg
	}

	return s
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

func parseDate(s string) time.Time {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return time.Time{}
	}
	return t
}

// daysBetween returns whole calendar days between two dates, normalised to
// UTC midnight so daylight-saving shifts cannot skew a cohort bucket.
func daysBetween(from, to time.Time) int {
	if from.IsZero() || to.IsZero() {
		return 0
	}
	f := time.Date(from.Year(), from.Month(), from.Day(), 0, 0, 0, 0, time.UTC)
	t := time.Date(to.Year(), to.Month(), to.Day(), 0, 0, 0, 0, time.UTC)
	return int(t.Sub(f) / (24 * time.Hour))
}

func ageInMonths(birthDate, now time.Time) int {
	if birthDate.IsZero() {
		return 0
	}
	months := (now.Year()-birthDate.Year())*12 + int(now.Month()-birthDate.Month())
	if now.Day() < birthDate.Day() {
		months--
	}
	if months < 0 {
		return 0
	}
	return months
}

func round1(v float64) float64 {
	return math.Round(v*10) / 10
}

func inRange(v, min, max float64) bool {
	return v >= min && v <= max
}
