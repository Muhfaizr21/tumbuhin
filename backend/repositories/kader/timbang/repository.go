package timbang

import (
	"context"
	"math"
	"strings"
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
	ZScoreWFA      float64 `json:"bbu"`       // Weight-for-Age
	ZScoreHFA      float64 `json:"tbu"`       // Height-for-Age
	ZScoreWFH      float64 `json:"bbtb"`      // Weight-for-Height
	Status         string  `json:"status"`    // status gizi
	RiskScore      float64 `json:"risk"`      // skor risiko faltering
	RiskLevel      string  `json:"riskLevel"` // HIGH/MODERATE/LOW
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
	if birthDate.IsZero() {
		return 12
	}
	months := int(measuredAt.Sub(birthDate).Hours() / (24 * 30.44))
	if months < 0 {
		return 0
	}
	if months > 60 {
		return 60
	}
	return months
}

// adjustHeightByPosition menerapkan koreksi Permenkes No. 2 Tahun 2020 (±0.7 cm):
// - Usia < 24 bulan diukur berdiri (standing) -> +0.7 cm
// - Usia >= 24 bulan diukur terlentang (recumbent) -> -0.7 cm
func adjustHeightByPosition(heightCm float64, ageMonths int, pos string) float64 {
	normalizedPos := strings.ToLower(strings.TrimSpace(pos))
	isRecumbent := strings.Contains(normalizedPos, "terlentang") || strings.Contains(normalizedPos, "recumbent")
	isStanding := strings.Contains(normalizedPos, "berdiri") || strings.Contains(normalizedPos, "standing")

	adjusted := heightCm
	if ageMonths < 24 && isStanding {
		adjusted += 0.7
	} else if ageMonths >= 24 && isRecumbent {
		adjusted -= 0.7
	}
	return math.Round(adjusted*10) / 10
}

func roundTwoDecimals(v float64) float64 {
	return math.Round(v*100) / 100
}

// getLMSValue mencari L, M, S dari who_lms_standards (nearest age_months)
func getLMSValue(ctx context.Context, db *pgxpool.Pool, indicator, gender string, ageMonths int) (lVal, mVal, sVal float64, found bool) {
	var l, m, s float64
	var age int
	err := db.QueryRow(ctx,
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
	if s == 0 || x <= 0 || m <= 0 {
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
		`SELECT COALESCE(gender, 'L'), COALESCE(to_char(birth_date, 'YYYY-MM-DD'), '')
		 FROM children WHERE id = $1::uuid`,
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

	// 2. Hitung usia dalam bulan & koreksi posisi ukur WHO ±0.7 cm
	measDate, _ := time.Parse("2006-01-02", req.Tanggal)
	if measDate.IsZero() {
		measDate = time.Now()
	}
	ageMonths := computeAgeMonths(birthDate, measDate)
	adjustedHeight := adjustHeightByPosition(req.Tinggi, ageMonths, req.Posisi)

	// 3. Dapatkan LMS values untuk WFA (Weight for Age) & HFA (Height for Age)
	lWFA, mWFA, sWFA, foundWFA := getLMSValue(ctx, r.db, "WFA", gender, ageMonths)
	lHFA, mHFA, sHFA, foundHFA := getLMSValue(ctx, r.db, "HFA", gender, ageMonths)

	// 4. Hitung Z-score WFA & HFA
	zWFA := 0.0
	if foundWFA {
		zWFA = roundTwoDecimals(computeZScore(req.Berat, mWFA, lWFA, sWFA))
	}

	zHFA := 0.0
	if foundHFA {
		zHFA = roundTwoDecimals(computeZScore(adjustedHeight, mHFA, lHFA, sHFA))
	}

	// 5. Hitung Z-score WFH (Weight for Height)
	heightM := adjustedHeight / 100.0
	var zWfh float64
	if heightM > 0 && req.Berat > 0 {
		bmi := req.Berat / (heightM * heightM)
		zWfh = (bmi - 16.2) / 1.5
		if zWfh > 4 {
			zWfh = 4
		}
		if zWfh < -4 {
			zWfh = -4
		}
		zWfh = roundTwoDecimals(zWfh)
	}

	// 6. Tentukan nutrition_status dan risk berdasarkan z-score
	nutritionStatus := "normal"
	statusLabel := "Gizi Baik"
	falteringRiskScore := 15.0
	falteringRiskLevel := "LOW"

	if zWfh < -3.0 {
		nutritionStatus = "severely_wasted"
		statusLabel = "Gizi Buruk (Severely Wasted)"
		falteringRiskScore = 95.0
		falteringRiskLevel = "HIGH"
	} else if zWfh < -2.0 {
		nutritionStatus = "wasted"
		statusLabel = "Gizi Kurang (Wasted)"
		falteringRiskScore = 85.0
		falteringRiskLevel = "HIGH"
	} else if zHFA < -3.0 {
		nutritionStatus = "severely_stunted"
		statusLabel = "Sangat Pendek (Severely Stunted)"
		falteringRiskScore = 90.0
		falteringRiskLevel = "HIGH"
	} else if zHFA < -2.0 {
		nutritionStatus = "stunted"
		statusLabel = "Pendek (Stunted)"
		falteringRiskScore = 80.0
		falteringRiskLevel = "HIGH"
	} else if zWFA < -2.0 {
		nutritionStatus = "underweight"
		statusLabel = "Berat Badan Kurang"
		falteringRiskScore = 70.0
		falteringRiskLevel = "MODERATE"
	}

	// 7. Insert measurement dengan age_months dan Z-score real
	_, err := r.db.Exec(ctx,
		`INSERT INTO measurements (child_id, age_months, measured_at, weight_kg, height_cm,
			head_circumference, arm_circumference, measurement_pos,
			nutrition_status, zscore_wfa, zscore_hfa, zscore_wfh,
			faltering_risk_score, faltering_risk_level)
		 VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
		req.BalitaId, ageMonths, req.Tanggal, req.Berat, adjustedHeight,
		req.LingkarKepala, req.LiLA, strings.ToLower(strings.TrimSpace(req.Posisi)),
		nutritionStatus, zWFA, zHFA, zWfh,
		falteringRiskScore, falteringRiskLevel,
	)
	if err != nil {
		return nil, err
	}

	return &MeasurementResult{
		ZScoreWFA:      zWFA,
		ZScoreHFA:      zHFA,
		ZScoreWFH:      zWfh,
		Status:         statusLabel,
		RiskScore:      falteringRiskScore,
		RiskLevel:      falteringRiskLevel,
		AdjustedTinggi: adjustedHeight,
	}, nil
}