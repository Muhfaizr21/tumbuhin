package standarwho

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// WhoStandardRecord represents a WHO LMS reference entry (Module 3.6)
type WhoStandardRecord struct {
	ID        int64   `json:"id"`
	Indicator string  `json:"indicator"`
	Gender    string  `json:"gender"`
	AgeMonths int     `json:"age_months"`
	LVal      float64 `json:"l_val"`
	MVal      float64 `json:"m_val"`
	SVal      float64 `json:"s_val"`
	SD3Neg    float64 `json:"sd3_neg"`
	SD2Neg    float64 `json:"sd2_neg"`
	SD0Median float64 `json:"sd0_median"`
	SD2Pos    float64 `json:"sd2_pos"`
}

type WhoStandardInput struct {
	Indicator string  `json:"indicator"`
	Gender    string  `json:"gender"`
	AgeMonths int     `json:"age_months"`
	LVal      float64 `json:"l_val"`
	MVal      float64 `json:"m_val"`
	SVal      float64 `json:"s_val"`
}

type WhoSimulationRequest struct {
	Gender         string  `json:"gender"`
	AgeMonths      int     `json:"age_months"`
	WeightKg       float64 `json:"weight_kg"`
	HeightCm       float64 `json:"height_cm"`
	MeasurementPos string  `json:"measurement_pos"` // "terlentang" | "berdiri"
}

type WhoSimulationResult struct {
	Gender             string  `json:"gender"`
	AgeMonths          int     `json:"age_months"`
	RawWeightKg        float64 `json:"raw_weight_kg"`
	RawHeightCm        float64 `json:"raw_height_cm"`
	AdjustedHeightCm   float64 `json:"adjusted_height_cm"`
	PositionCorrection float64 `json:"position_correction"`
	ZScoreWFA          float64 `json:"zscore_wfa"`
	ClassificationWFA  string  `json:"classification_wfa"`
	ZScoreHFA          float64 `json:"zscore_hfa"`
	ClassificationHFA  string  `json:"classification_hfa"`
	ZScoreWFH          float64 `json:"zscore_wfh"`
	ClassificationWFH  string  `json:"classification_wfh"`
	OverallStatus      string  `json:"overall_status"`
	PermenkesReference string  `json:"permenkes_reference"`
	WfaLMS             string  `json:"wfa_lms"`
	HfaLMS             string  `json:"hfa_lms"`
}

// Repository defines inspection and clinical calibration operations for WHO LMS Standards
type Repository interface {
	ListWhoStandards(ctx context.Context, indicator, gender string) ([]WhoStandardRecord, error)
	UpsertWhoStandard(ctx context.Context, in WhoStandardInput) (*WhoStandardRecord, error)
	SimulateWhoZScore(ctx context.Context, req WhoSimulationRequest) (*WhoSimulationResult, error)
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func valueAtZ(z, l, m, s float64) float64 {
	if m <= 0 || s <= 0 {
		return 0
	}
	if l != 0 {
		base := 1.0 + l*s*z
		if base <= 0 {
			return 0
		}
		return math.Round(m*math.Pow(base, 1.0/l)*100) / 100
	}
	return math.Round(m*math.Exp(s*z)*100) / 100
}

func (r *repository) ListWhoStandards(ctx context.Context, indicator, gender string) ([]WhoStandardRecord, error) {
	if r.db == nil {
		return []WhoStandardRecord{}, nil
	}

	// Ensure WFH (Weight-for-Height / BB/TB) reference rows exist in who_lms_standards
	_, _ = r.db.Exec(ctx, `
		INSERT INTO who_lms_standards (indicator, gender, age_months, l_val, m_val, s_val)
		VALUES
			('WFH', 'L', 0, -0.3521, 3.320, 0.0918),
			('WFH', 'L', 3, -0.3521, 6.240, 0.0842),
			('WFH', 'L', 6, -0.3521, 7.900, 0.0825),
			('WFH', 'L', 9, -0.3521, 8.950, 0.0822),
			('WFH', 'L', 12, -0.3521, 9.650, 0.0821),
			('WFH', 'L', 18, -0.3521, 11.020, 0.0830),
			('WFH', 'L', 24, -0.3521, 12.230, 0.0844),
			('WFH', 'L', 36, -0.3521, 14.380, 0.0865),
			('WFH', 'L', 48, -0.3521, 16.350, 0.0889),
			('WFH', 'L', 60, -0.3521, 18.320, 0.0912),
			('WFH', 'P', 0, -0.3833, 3.210, 0.0925),
			('WFH', 'P', 3, -0.3833, 5.790, 0.0868),
			('WFH', 'P', 6, -0.3833, 7.310, 0.0854),
			('WFH', 'P', 9, -0.3833, 8.270, 0.0850),
			('WFH', 'P', 12, -0.3833, 8.980, 0.0852),
			('WFH', 'P', 18, -0.3833, 10.290, 0.0863),
			('WFH', 'P', 24, -0.3833, 11.510, 0.0876),
			('WFH', 'P', 36, -0.3833, 13.860, 0.0901),
			('WFH', 'P', 48, -0.3833, 16.050, 0.0928),
			('WFH', 'P', 60, -0.3833, 18.180, 0.0955)
		ON CONFLICT (indicator, gender, age_months) DO NOTHING;
	`)

	ind := strings.ToUpper(strings.TrimSpace(indicator))
	gen := strings.ToUpper(strings.TrimSpace(gender))

	rows, err := r.db.Query(ctx, `
		SELECT id, indicator, gender, age_months, l_val, m_val, s_val
		FROM who_lms_standards
		WHERE ($1 = '' OR indicator = $1)
		  AND ($2 = '' OR gender = $2)
		ORDER BY indicator ASC, gender ASC, age_months ASC
	`, ind, gen)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []WhoStandardRecord{}
	for rows.Next() {
		var rec WhoStandardRecord
		if err := rows.Scan(&rec.ID, &rec.Indicator, &rec.Gender, &rec.AgeMonths, &rec.LVal, &rec.MVal, &rec.SVal); err != nil {
			return nil, err
		}
		rec.SD3Neg = valueAtZ(-3, rec.LVal, rec.MVal, rec.SVal)
		rec.SD2Neg = valueAtZ(-2, rec.LVal, rec.MVal, rec.SVal)
		rec.SD0Median = math.Round(rec.MVal*100) / 100
		rec.SD2Pos = valueAtZ(2, rec.LVal, rec.MVal, rec.SVal)
		list = append(list, rec)
	}
	return list, rows.Err()
}

func (r *repository) UpsertWhoStandard(ctx context.Context, in WhoStandardInput) (*WhoStandardRecord, error) {
	if r.db == nil {
		return nil, fmt.Errorf("database tidak tersedia")
	}
	ind := strings.ToUpper(strings.TrimSpace(in.Indicator))
	if ind != "WFA" && ind != "HFA" && ind != "WFH" {
		return nil, fmt.Errorf("indikator harus WFA, HFA, atau WFH")
	}
	gen := strings.ToUpper(strings.TrimSpace(in.Gender))
	if gen != "L" && gen != "P" {
		return nil, fmt.Errorf("jenis kelamin harus L atau P")
	}
	if in.AgeMonths < 0 || in.AgeMonths > 60 {
		return nil, fmt.Errorf("usia bulan harus antara 0 s/d 60 bulan")
	}
	if in.MVal <= 0 || in.SVal <= 0 {
		return nil, fmt.Errorf("nilai M (median) dan S (koefisien variasi) harus lebih dari 0")
	}

	var rec WhoStandardRecord
	err := r.db.QueryRow(ctx, `
		INSERT INTO who_lms_standards (indicator, gender, age_months, l_val, m_val, s_val)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (indicator, gender, age_months) DO UPDATE SET
			l_val = EXCLUDED.l_val,
			m_val = EXCLUDED.m_val,
			s_val = EXCLUDED.s_val
		RETURNING id, indicator, gender, age_months, l_val, m_val, s_val
	`, ind, gen, in.AgeMonths, in.LVal, in.MVal, in.SVal).Scan(
		&rec.ID, &rec.Indicator, &rec.Gender, &rec.AgeMonths, &rec.LVal, &rec.MVal, &rec.SVal,
	)
	if err != nil {
		return nil, err
	}
	rec.SD3Neg = valueAtZ(-3, rec.LVal, rec.MVal, rec.SVal)
	rec.SD2Neg = valueAtZ(-2, rec.LVal, rec.MVal, rec.SVal)
	rec.SD0Median = math.Round(rec.MVal*100) / 100
	rec.SD2Pos = valueAtZ(2, rec.LVal, rec.MVal, rec.SVal)
	return &rec, nil
}

func (r *repository) SimulateWhoZScore(ctx context.Context, req WhoSimulationRequest) (*WhoSimulationResult, error) {
	if req.WeightKg <= 0 || req.HeightCm <= 0 {
		return nil, fmt.Errorf("berat badan (kg) dan tinggi badan (cm) harus lebih dari 0")
	}
	gen := strings.ToUpper(strings.TrimSpace(req.Gender))
	if gen != "P" {
		gen = "L"
	}
	age := req.AgeMonths
	if age < 0 {
		age = 0
	}
	if age > 60 {
		age = 60
	}

	pos := strings.ToLower(strings.TrimSpace(req.MeasurementPos))
	adjHeight := req.HeightCm
	posCorrection := 0.0
	if age < 24 && pos == "berdiri" {
		posCorrection = 0.7
		adjHeight += 0.7
	} else if age >= 24 && pos == "terlentang" {
		posCorrection = -0.7
		adjHeight -= 0.7
	}

	lWFA, mWFA, sWFA := 0.0, 9.648, 0.117
	lHFA, mHFA, sHFA := 1.0, 75.75, 0.034
	if r.db != nil {
		_ = r.db.QueryRow(ctx, `
			SELECT l_val, m_val, s_val FROM who_lms_standards
			WHERE indicator = 'WFA' AND gender = $1
			ORDER BY ABS(age_months - $2) ASC LIMIT 1
		`, gen, age).Scan(&lWFA, &mWFA, &sWFA)

		_ = r.db.QueryRow(ctx, `
			SELECT l_val, m_val, s_val FROM who_lms_standards
			WHERE indicator = 'HFA' AND gender = $1
			ORDER BY ABS(age_months - $2) ASC LIMIT 1
		`, gen, age).Scan(&lHFA, &mHFA, &sHFA)
	}

	calcLMS := func(y, l, m, s float64) float64 {
		if m <= 0 || s <= 0 || y <= 0 {
			return 0
		}
		var z float64
		if l != 0 {
			z = (math.Pow(y/m, l) - 1.0) / (l * s)
		} else {
			z = math.Log(y/m) / s
		}
		return math.Round(z*100) / 100
	}

	zWFA := calcLMS(req.WeightKg, lWFA, mWFA, sWFA)
	zHFA := calcLMS(adjHeight, lHFA, mHFA, sHFA)

	expectedWeightForHeight := mWFA * math.Pow(adjHeight/mHFA, 2.0)
	zWFH := calcLMS(req.WeightKg, lWFA, expectedWeightForHeight, sWFA)

	classWFA := "Berat Badan Normal (-2 SD s/d +1 SD)"
	if zWFA < -3.0 {
		classWFA = "Berat Badan Sangat Kurang (Severely Underweight, < -3 SD)"
	} else if zWFA < -2.0 {
		classWFA = "Berat Badan Kurang (Underweight, -3 SD s/d < -2 SD)"
	} else if zWFA > 1.0 {
		classWFA = "Risiko Berat Badan Lebih (> +1 SD)"
	}

	classHFA := "Tinggi Badan Normal (-2 SD s/d +3 SD)"
	if zHFA < -3.0 {
		classHFA = "Sangat Pendek (Severely Stunted, < -3 SD)"
	} else if zHFA < -2.0 {
		classHFA = "Pendek (Stunted, -3 SD s/d < -2 SD)"
	} else if zHFA > 3.0 {
		classHFA = "Tinggi (> +3 SD)"
	}

	classWFH := "Gizi Baik / Normal (-2 SD s/d +1 SD)"
	if zWFH < -3.0 {
		classWFH = "Gizi Buruk (Severely Wasted, < -3 SD)"
	} else if zWFH < -2.0 {
		classWFH = "Gizi Kurang (Wasted, -3 SD s/d < -2 SD)"
	} else if zWFH > 2.0 {
		classWFH = "Gizi Lebih / Obesitas (> +2 SD)"
	} else if zWFH > 1.0 {
		classWFH = "Berisiko Gizi Lebih (+1 SD s/d +2 SD)"
	}

	overall := "Gizi Baik & Pertumbuhan Normal"
	if zWFH < -3.0 || zHFA < -3.0 {
		overall = "Prioritas Merah: Intervensi Medis & PMT Pemulihan Segera"
	} else if zWFH < -2.0 || zHFA < -2.0 || zWFA < -2.0 {
		overall = "Prioritas Kuning/Oranye: Indikasi Stunted/Wasted - Perlu PMT & Home Visit"
	}

	return &WhoSimulationResult{
		Gender:             gen,
		AgeMonths:          age,
		RawWeightKg:        req.WeightKg,
		RawHeightCm:        req.HeightCm,
		AdjustedHeightCm:   math.Round(adjHeight*10) / 10,
		PositionCorrection: posCorrection,
		ZScoreWFA:          zWFA,
		ClassificationWFA:  classWFA,
		ZScoreHFA:          zHFA,
		ClassificationHFA:  classHFA,
		ZScoreWFH:          zWFH,
		ClassificationWFH:  classWFH,
		OverallStatus:      overall,
		PermenkesReference: "Permenkes RI No. 2 Tahun 2020 tentang Standar Antropometri Anak (WHO MGRS LMS)",
		WfaLMS:             fmt.Sprintf("L=%.4f, M=%.3f, S=%.4f", lWFA, mWFA, sWFA),
		HfaLMS:             fmt.Sprintf("L=%.4f, M=%.3f, S=%.4f", lHFA, mHFA, sHFA),
	}, nil
}
