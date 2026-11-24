package laporan

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// EPPGBMRow represents one row formatted for the official e-PPGBM surveillance record.
type EPPGBMRow struct {
	No              int     `json:"no"`
	ChildID         string  `json:"child_id"`
	NIKHash         string  `json:"nik_hash"`
	ChildName       string  `json:"child_name"`
	Gender          string  `json:"gender"`
	BirthDate       string  `json:"birth_date"`
	AgeMonths       int     `json:"age_months"`
	ParentName      string  `json:"parent_name"`
	ParentPhone     string  `json:"parent_phone"`
	PosyanduName    string  `json:"posyandu_name"`
	RWCode          string  `json:"rw_code"`
	RTCode          string  `json:"rt_code"`
	MeasuredAt      string  `json:"measured_at"`
	WeightKg        float64 `json:"weight_kg"`
	HeightCm        float64 `json:"height_cm"`
	ZScoreWFA       float64 `json:"zscore_wfa"`
	ZScoreHFA       float64 `json:"zscore_hfa"`
	ZScoreWFH       float64 `json:"zscore_wfh"`
	NutritionStatus string  `json:"nutrition_status"`
	FalteringScore  float64 `json:"faltering_risk_score"`
	FalteringLevel  string  `json:"faltering_risk_level"`
	PMTReceived     bool    `json:"pmt_received"`
	PMTType         string  `json:"pmt_type"`
}

// ReportSummary encapsulates village-level epidemiological totals for the period.
type ReportSummary struct {
	VillageName      string  `json:"village_name"`
	DistrictName     string  `json:"district_name"`
	RegencyName      string  `json:"regency_name"`
	ProvinceName     string  `json:"province_name"`
	VillageHeadName  string  `json:"village_head_name"`
	PuskesmasName    string  `json:"puskesmas_name"`
	PeriodMonth      int     `json:"period_month"`
	PeriodYear       int     `json:"period_year"`
	TotalChildren    int     `json:"total_children"`
	TotalMeasured    int     `json:"total_measured"`
	CoverageRate     float64 `json:"coverage_rate_percent"`
	StuntedCount     int     `json:"stunted_count"`
	WastedCount      int     `json:"wasted_count"`
	UnderweightCount int     `json:"underweight_count"`
	NormalCount      int     `json:"normal_count"`
	PMTCount         int     `json:"pmt_count"`
	GeneratedAt      string  `json:"generated_at"`
}

// Repository defines data access for e-PPGBM reports and exports.
type Repository interface {
	GetReportData(ctx context.Context, villageName string, month, year int, posyanduID string) ([]EPPGBMRow, *ReportSummary, error)
}

type postgresRepository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new postgres-backed e-PPGBM report repository.
func NewRepository(db *pgxpool.Pool) Repository {
	return &postgresRepository{db: db}
}

func (r *postgresRepository) GetReportData(ctx context.Context, villageName string, month, year int, posyanduID string) ([]EPPGBMRow, *ReportSummary, error) {
	if month <= 0 || month > 12 {
		month = int(time.Now().Month())
	}
	if year < 2020 {
		year = time.Now().Year()
	}

	summary := &ReportSummary{
		VillageName:     villageName,
		DistrictName:    "Kecamatan Cibinong",
		RegencyName:     "Kabupaten Bogor",
		ProvinceName:    "Jawa Barat",
		VillageHeadName: "H. Suryadi Pratama, S.AP",
		PuskesmasName:   "UPTD Puskesmas Sukamaju",
		PeriodMonth:     month,
		PeriodYear:      year,
		GeneratedAt:     time.Now().Format("2006-01-02 15:04:05"),
	}

	rowsResult := make([]EPPGBMRow, 0)
	if r.db == nil {
		return rowsResult, summary, nil
	}

	// Load village governance metadata configured by Super Admin in village_settings
	_ = r.db.QueryRow(ctx, `
		SELECT village_name, district_name, regency_name, province_name, village_head_name, puskesmas_name
		FROM village_settings
		ORDER BY updated_at DESC
		LIMIT 1
	`).Scan(
		&summary.VillageName,
		&summary.DistrictName,
		&summary.RegencyName,
		&summary.ProvinceName,
		&summary.VillageHeadName,
		&summary.PuskesmasName,
	)

	// Query each child in village with their latest measurement within or up to this period
	sql := `
	WITH latest_measurements AS (
		SELECT DISTINCT ON (m.child_id)
			m.child_id,
			to_char(m.measured_at, 'YYYY-MM-DD') AS measured_at_str,
			m.age_months,
			m.weight_kg,
			m.height_cm,
			m.zscore_wfa,
			m.zscore_hfa,
			m.zscore_wfh,
			COALESCE(m.nutrition_status, 'normal') AS nutrition_status,
			COALESCE(m.faltering_risk_score, 0.0) AS faltering_risk_score,
			COALESCE(m.faltering_risk_level, 'LOW') AS faltering_risk_level
		FROM measurements m
		WHERE EXTRACT(YEAR FROM m.measured_at) <= $2
		ORDER BY m.child_id, m.measured_at DESC
	),
	pmt_interventions AS (
		SELECT DISTINCT ON (i.child_id)
			i.child_id,
			COALESCE(i.pmt_given, false) AS pmt_given,
			COALESCE(i.pmt_type, '') AS pmt_type
		FROM interventions i
		WHERE i.pmt_given = TRUE
		ORDER BY i.child_id, i.visit_date DESC
	)
	SELECT 
		c.id::text,
		c.nik_hash,
		c.full_name,
		c.gender,
		to_char(c.birth_date, 'YYYY-MM-DD') AS birth_date_str,
		COALESCE(p.name, c.posyandu_name, 'Posyandu') AS posyandu_name,
		COALESCE(c.rw_code, '001') AS rw_code,
		COALESCE(c.rt_code, '001') AS rt_code,
		COALESCE(c.parent_name, '-') AS parent_name,
		COALESCE(c.parent_phone, '-') AS parent_phone,
		COALESCE(lm.measured_at_str, '-') AS measured_at,
		COALESCE(lm.age_months, EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.birth_date))*12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.birth_date)))::int AS age_months,
		COALESCE(lm.weight_kg, 0.0) AS weight_kg,
		COALESCE(lm.height_cm, 0.0) AS height_cm,
		COALESCE(lm.zscore_wfa, 0.0) AS zscore_wfa,
		COALESCE(lm.zscore_hfa, 0.0) AS zscore_hfa,
		COALESCE(lm.zscore_wfh, 0.0) AS zscore_wfh,
		COALESCE(lm.nutrition_status, 'normal') AS nutrition_status,
		COALESCE(lm.faltering_risk_score, 0.0) AS faltering_risk_score,
		COALESCE(lm.faltering_risk_level, 'LOW') AS faltering_risk_level,
		COALESCE(pi.pmt_given, false) AS pmt_received,
		COALESCE(pi.pmt_type, '') AS pmt_type
	FROM children c
	LEFT JOIN posyandus p ON p.id = c.posyandu_id
	LEFT JOIN latest_measurements lm ON lm.child_id = c.id
	LEFT JOIN pmt_interventions pi ON pi.child_id = c.id
	WHERE (c.village_name ILIKE $1 OR c.village_name = '')
	`

	args := []any{villageName, year}
	if posyanduID != "" {
		sql += ` AND c.posyandu_id = $3`
		args = append(args, posyanduID)
	}
	sql += ` ORDER BY p.name ASC, c.full_name ASC;`

	rows, err := r.db.Query(ctx, sql, args...)
	if err != nil {
		log.Printf("[LAPORAN REPO ERROR] Query report data: %v", err)
		return rowsResult, summary, nil
	}
	defer rows.Close()

	idx := 1
	for rows.Next() {
		var rItem EPPGBMRow
		if err := rows.Scan(
			&rItem.ChildID,
			&rItem.NIKHash,
			&rItem.ChildName,
			&rItem.Gender,
			&rItem.BirthDate,
			&rItem.PosyanduName,
			&rItem.RWCode,
			&rItem.RTCode,
			&rItem.ParentName,
			&rItem.ParentPhone,
			&rItem.MeasuredAt,
			&rItem.AgeMonths,
			&rItem.WeightKg,
			&rItem.HeightCm,
			&rItem.ZScoreWFA,
			&rItem.ZScoreHFA,
			&rItem.ZScoreWFH,
			&rItem.NutritionStatus,
			&rItem.FalteringScore,
			&rItem.FalteringLevel,
			&rItem.PMTReceived,
			&rItem.PMTType,
		); err != nil {
			log.Printf("[LAPORAN REPO ERROR] Scan report row: %v", err)
			continue
		}
		rItem.No = idx
		idx++

		// Summarize
		summary.TotalChildren++
		if rItem.MeasuredAt != "-" && rItem.WeightKg > 0 {
			summary.TotalMeasured++
		}
		switch rItem.NutritionStatus {
		case "stunted", "severely_stunted":
			summary.StuntedCount++
		case "wasted", "severely_wasted":
			summary.WastedCount++
		case "underweight", "severely_underweight":
			summary.UnderweightCount++
		default:
			summary.NormalCount++
		}
		if rItem.PMTReceived {
			summary.PMTCount++
		}

		rowsResult = append(rowsResult, rItem)
	}

	if summary.TotalChildren > 0 {
		summary.CoverageRate = float64(summary.TotalMeasured) / float64(summary.TotalChildren) * 100.0
	}

	return rowsResult, summary, nil
}
