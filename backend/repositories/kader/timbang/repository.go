package timbang

import (
	"context"
	"math"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type MeasurementRequest struct {
	BalitaId      string  `json:"balitaId"`
	Tanggal       string  `json:"tanggal"`
	Berat         float64 `json:"berat"`
	Tinggi        float64 `json:"tinggi"`
	Posisi        string  `json:"posisi"`
	LingkarKepala float64 `json:"lingkarKepala"`
	LiLA          float64 `json:"lila"`
}

// MeasurementResult adalah hasil Z-score yang dikembalikan ke frontend
type MeasurementResult struct {
	ZScoreWFA      float64 `json:"bbu"`     // Weight-for-Age
	ZScoreHFA      float64 `json:"tbu"`     // Height-for-Age
	ZScoreWFH      float64 `json:"bbtb"`    // Weight-for-Height
	Status         string  `json:"status"`  // status gizi
	RiskScore      float64 `json:"risk"`    // skor risiko faltering
	RiskLevel      string  `json:"riskLevel"` // HIGH/LOW
	AdjustedTinggi float64 `json:"adjustedTinggi"`
}

type Repository interface {
	SaveMeasurement(ctx context.Context, req MeasurementRequest) (*MeasurementResult, error)
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

// computeAgeMonths menghitung usia dalam bulan antara birth_date dan measured_at
func computeAgeMonths(birthDate, measuredAt time.Time) int {
	months := int(measuredAt.Sub(birthDate).Hours() / (24 * 30.44))
	if months < 0 {
		return 0
	}
	if months > 36 {
		return 36
	}
	return months
}

// getLMSValue mencari L, M, S dari who_lms_standards (nearest age_months)
func getLMSValue(db *pgxpool.Pool, indicator, gender string, ageMonths int) (lVal, mVal, sVal float64, found bool) {
	var l, m, s float64
	var age int
	err := db.QueryRow(context.Background(),
		`SELECT l_val, m_val, s_val, age_months FROM who_lms_standards
		 WHERE indicator = $1 AND gender = $2
		 ORDER BY ABS(age_months - $3) LIMIT 1`,
		indicator, gender, ageMonths).Scan(&l, &m, &s, &age)
	if err != nil {
		return 0, 0, 0, false
	}
	return l, m, s, true
}

// computeZScore menghitung Z-score menggunakan rumus LMS
func computeZScore(x, m, l, s float64) float64 {
	if s == 0 || x <= 0 {
		return 0
	}
	if l != 0 {
		return (math.Pow(x/m, l) - 1) / (l * s)
	}
	return math.Log(x/m) / s
}

// getChildGenderAndBirthDate mengambil gender dan birth_date dari children
func getChildGenderAndBirthDate(ctx context.Context, db *pgxpool.Pool, childID string) (gender string, birthDate time.Time, found bool) {
	var genderStr string
	var birthDateStr string
	err := db.QueryRow(ctx,
		`SELECT gender, birth_date FROM children WHERE id = $1`,
		childID).Scan(&genderStr, &birthDateStr)
	if err != nil {
		return "", time.Time{}, false
	}
	birthDate, err = time.Parse("2006-01-02", birthDateStr)
	if err != nil {
		return genderStr, time.Time{}, true
	}
	return genderStr, birthDate, true
}

func (r *repository) SaveMeasurement(ctx context.Context, req MeasurementRequest) (*MeasurementResult, error) {
	if r.db == nil {
		return nil, nil
	}

	// 1. Dapatkan info balita (gender, birth_date)
	gender, birthDate, ok := getChildGenderAndBirthDate(ctx, r.db, req.BalitaId)
	if !ok {
		return nil, nil
	}

	// 2. Hitung usia dalam bulan
	measDate, _ := time.Parse("2006-01-02", req.Tanggal)
	if measDate.IsZero() {
		measDate = time.Now()
	}
	ageMonths := computeAgeMonths(birthDate, measDate)

	// 3. Dapatkan LMS values untuk WFA (Weight for Age)
	lWFA, mWFA, sWFA, foundWFA := getLMSValue(r.db, "WFA", gender, ageMonths)
	// 4. Dapatkan LMS values untuk HFA (Height for Age)
	lHFA, mHFA, sHFA, foundHFA := getLMSValue(r.db, "HFA", gender, ageMonths)

	// 5. Hitung Z-score WFA
	zWFA := computeZScore(req.Berat, mWFA, lWFA, sWFA)
	if !foundWFA {
		zWFA = 0.0
	}

	// 6. Hitung Z-score HFA
	zHFA := computeZScore(req.Tinggi, mHFA, lHFA, sHFA)
	if !foundHFA {
		zHFA = 0.0
	}

	// 7. Hitung Z-score WFH (Weight for Height) - pendekatan sederhana
	// WFH ≈ (weight - expected_weight) / expected_weight based on height
	// Expected weight ~ proportional to height^2 (BMI-based)
	heightM := req.Tinggi / 100.0
	var zWfh float64
	if heightM > 0 && req.Berat > 0 {
		// Simple: z = (weight/height^2 - 20) / 5 (rough approximation)
		bmi := req.Berat / (heightM * heightM)
		zWfh = (bmi - 20.0) / 5.0
		if zWfh > 5 {
			zWfh = 5
		}
		if zWfh < -5 {
			zWfh = -5
		}
	}

	// 8. Tentukan nutrition_status dan risk berdasarkan z-score
	nutritionStatus := "normal"
	falteringRiskScore := 0.0
	falteringRiskLevel := "LOW"

	// Priority: severe wasting (WFH) > wasting > stunting (HFA)
	if zWfh < -3.0 {
		nutritionStatus = "severely_wasted"
		falteringRiskScore = 95.0
		falteringRiskLevel = "HIGH"
	} else if zWfh < -2.0 {
		nutritionStatus = "wasted"
		falteringRiskScore = 85.0
		falteringRiskLevel = "HIGH"
	} else if zHFA < -3.0 {
		nutritionStatus = "severely_stunted"
		falteringRiskScore = 90.0
		falteringRiskLevel = "HIGH"
	} else if zHFA < -2.0 {
		nutritionStatus = "stunted"
		falteringRiskScore = 80.0
		falteringRiskLevel = "HIGH"
	} else if zWFA < -2.0 {
		nutritionStatus = "underweight"
		falteringRiskScore = 70.0
		falteringRiskLevel = "MODERATE"
	}

	// 9. Insert measurement dengan Z-score real
	_, err := r.db.Exec(ctx,
		`INSERT INTO measurements (child_id, measured_at, weight_kg, height_cm,
			head_circumference, arm_circumference, measurement_pos,
			nutrition_status, zscore_wfa, zscore_hfa, zscore_wfh,
			faltering_risk_score, faltering_risk_level)
		 VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
		req.BalitaId, req.Tanggal, req.Berat, req.Tinggi,
		req.LingkarKepala, req.LiLA, req.Posisi,
		nutritionStatus, zWFA, zHFA, zWfh,
		falteringRiskScore, falteringRiskLevel,
	)
	if err != nil {
		return nil, err
	}

	// Return hasil ke controller
	return &MeasurementResult{
		ZScoreWFA:      zWFA,
		ZScoreHFA:      zHFA,
		ZScoreWFH:      zWfh,
		Status:         nutritionStatus,
		RiskScore:      falteringRiskScore,
		RiskLevel:      falteringRiskLevel,
		AdjustedTinggi: req.Tinggi,
	}, nil
}