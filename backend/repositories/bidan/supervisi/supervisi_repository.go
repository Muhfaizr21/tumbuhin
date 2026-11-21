package supervisi

import (
	"context"
	"fmt"
	"log"
	"math"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PosyanduSupervisionItem captures progress and lock state of one Posyandu.
type PosyanduSupervisionItem struct {
	PosyanduID       string  `json:"posyandu_id"`
	PosyanduName     string  `json:"posyandu_name"`
	RWCode           string  `json:"rw_code"`
	RTCode           string  `json:"rt_code"`
	TotalEnrolled    int     `json:"total_enrolled"`
	TotalMeasured    int     `json:"total_measured"`
	MeasurementRate  float64 `json:"measurement_rate_percent"`
	OutlierCount     int     `json:"outlier_count"`
	IsLocked         bool    `json:"is_locked"`
	LockedAt         *string `json:"locked_at"`
	LockedByName     string  `json:"locked_by_name"`
	AuditNotes       string  `json:"audit_notes"`
	PeriodMonth      int     `json:"period_month"`
	PeriodYear       int     `json:"period_year"`
}

// MeasurementOutlierItem is an anomalous measurement flag that needs bidan review.
type MeasurementOutlierItem struct {
	MeasurementID   string  `json:"measurement_id"`
	ChildID         string  `json:"child_id"`
	ChildName       string  `json:"child_name"`
	AgeMonths       int     `json:"age_months"`
	Gender          string  `json:"gender"`
	PosyanduName    string  `json:"posyandu_name"`
	MeasuredAt      string  `json:"measured_at"`
	WeightKg        float64 `json:"weight_kg"`
	HeightCm        float64 `json:"height_cm"`
	PrevHeightCm    *float64 `json:"prev_height_cm,omitempty"`
	PrevWeightKg    *float64 `json:"prev_weight_kg,omitempty"`
	ZScoreHFA       float64 `json:"zscore_hfa"`
	ZScoreWFA       float64 `json:"zscore_wfa"`
	ZScoreWFH       float64 `json:"zscore_wfh"`
	NutritionStatus string  `json:"nutrition_status"`
	OutlierType     string  `json:"outlier_type"` // EXTREME_ZSCORE, HEIGHT_SHRINKAGE, EXTREME_WEIGHT_CHANGE, HEIGHT_SURGE
	Severity        string  `json:"severity"`     // HIGH, MEDIUM
	Title           string  `json:"title"`
	Description     string  `json:"description"`
	SuggestedAction string  `json:"suggested_action"`
}

// LockRequest payload to lock/unlock a posyandu period.
type LockRequest struct {
	VillageName  string  `json:"village_name"`
	PosyanduID   string  `json:"posyandu_id"` // uuid or empty for all
	PeriodMonth  int     `json:"period_month"`
	PeriodYear   int     `json:"period_year"`
	IsLocked     bool    `json:"is_locked"`
	LockedBy     int64   `json:"locked_by"`
	LockedByName string  `json:"locked_by_name"`
	AuditNotes   string  `json:"audit_notes"`
}

// LockRecord is the stored lock record.
type LockRecord struct {
	ID           string `json:"id"`
	PosyanduID   string `json:"posyandu_id"`
	PeriodMonth  int    `json:"period_month"`
	PeriodYear   int    `json:"period_year"`
	IsLocked     bool   `json:"is_locked"`
	LockedAt     string `json:"locked_at"`
	LockedByName string `json:"locked_by_name"`
	AuditNotes   string `json:"audit_notes"`
}

// SupervisionOverview is the full supervision dashboard response.
type SupervisionOverview struct {
	PeriodMonth       int                       `json:"period_month"`
	PeriodYear        int                       `json:"period_year"`
	VillageName       string                    `json:"village_name"`
	TotalPosyandus    int                       `json:"total_posyandus"`
	TotalEnrolled     int                       `json:"total_enrolled"`
	TotalMeasured     int                       `json:"total_measured"`
	OverallRate       float64                   `json:"overall_rate_percent"`
	TotalOutliers     int                       `json:"total_outliers"`
	LockedCount       int                       `json:"locked_count"`
	AllLocked         bool                      `json:"all_locked"`
	Posyandus         []PosyanduSupervisionItem `json:"posyandus"`
	Outliers          []MeasurementOutlierItem  `json:"outliers"`
}

// Repository defines data access for supervision and audits.
type Repository interface {
	GetSupervisionOverview(ctx context.Context, villageName string, month, year int, posyanduID string) (*SupervisionOverview, error)
	SetSupervisionLock(ctx context.Context, req LockRequest) (*LockRecord, error)
}

type postgresRepository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new postgres-backed supervision repository.
func NewRepository(db *pgxpool.Pool) Repository {
	return &postgresRepository{db: db}
}

func (r *postgresRepository) GetSupervisionOverview(ctx context.Context, villageName string, month, year int, posyanduID string) (*SupervisionOverview, error) {
	if month <= 0 || month > 12 {
		month = int(time.Now().Month())
	}
	if year < 2020 {
		year = time.Now().Year()
	}

	overview := &SupervisionOverview{
		PeriodMonth: month,
		PeriodYear:  year,
		VillageName: villageName,
		Posyandus:   make([]PosyanduSupervisionItem, 0),
		Outliers:    make([]MeasurementOutlierItem, 0),
	}

	if r.db == nil {
		return overview, nil
	}

	// 1. Fetch Posyandus and compute measurement statistics + lock status
	posyanduSQL := `
	SELECT 
		p.id::text,
		p.name,
		COALESCE(p.rw_code, '001'),
		COALESCE(p.rt_code, '001'),
		COALESCE((
			SELECT COUNT(*)::int 
			FROM children c 
			WHERE c.posyandu_id = p.id AND (c.village_name ILIKE $1 OR c.village_name = '')
		), 0) AS total_enrolled,
		COALESCE((
			SELECT COUNT(DISTINCT m.child_id)::int 
			FROM measurements m 
			JOIN children c ON c.id = m.child_id 
			WHERE c.posyandu_id = p.id 
			  AND (c.village_name ILIKE $1 OR c.village_name = '')
			  AND EXTRACT(MONTH FROM m.measured_at) = $2 
			  AND EXTRACT(YEAR FROM m.measured_at) = $3
		), 0) AS total_measured,
		COALESCE(sl.is_locked, false) AS is_locked,
		CASE WHEN sl.locked_at IS NOT NULL THEN to_char(sl.locked_at, 'YYYY-MM-DD HH24:MI') ELSE NULL END AS locked_at,
		COALESCE(sl.locked_by_name, '') AS locked_by_name,
		COALESCE(sl.audit_notes, '') AS audit_notes
	FROM posyandus p
	LEFT JOIN supervision_locks sl ON sl.posyandu_id = p.id 
	                               AND sl.period_month = $2 
	                               AND sl.period_year = $3 
	                               AND sl.village_name ILIKE $1
	WHERE (p.village_name ILIKE $1 OR p.village_name = 'Desa Sukamaju' OR p.village_name = '')
	ORDER BY p.rw_code ASC, p.name ASC;
	`

	rows, err := r.db.Query(ctx, posyanduSQL, villageName, month, year)
	if err != nil {
		log.Printf("[SUPERVISION REPO ERROR] Query posyandu summary: %v", err)
		return overview, nil
	}
	defer rows.Close()

	totalEnrolledSum := 0
	totalMeasuredSum := 0
	lockedCount := 0

	for rows.Next() {
		var item PosyanduSupervisionItem
		var lockedAt *string
		if err := rows.Scan(
			&item.PosyanduID,
			&item.PosyanduName,
			&item.RWCode,
			&item.RTCode,
			&item.TotalEnrolled,
			&item.TotalMeasured,
			&item.IsLocked,
			&lockedAt,
			&item.LockedByName,
			&item.AuditNotes,
		); err != nil {
			log.Printf("[SUPERVISION REPO ERROR] Scan posyandu row: %v", err)
			continue
		}
		item.LockedAt = lockedAt
		item.PeriodMonth = month
		item.PeriodYear = year

		if item.TotalEnrolled > 0 {
			item.MeasurementRate = math.Round((float64(item.TotalMeasured)/float64(item.TotalEnrolled))*1000) / 10
			if item.MeasurementRate > 100 {
				item.MeasurementRate = 100.0
			}
		} else if item.TotalMeasured > 0 {
			item.MeasurementRate = 100.0
		}

		if item.IsLocked {
			lockedCount++
		}

		totalEnrolledSum += item.TotalEnrolled
		totalMeasuredSum += item.TotalMeasured
		overview.Posyandus = append(overview.Posyandus, item)
	}

	overview.TotalPosyandus = len(overview.Posyandus)
	overview.TotalEnrolled = totalEnrolledSum
	overview.TotalMeasured = totalMeasuredSum
	overview.LockedCount = lockedCount
	if overview.TotalPosyandus > 0 && lockedCount >= overview.TotalPosyandus {
		overview.AllLocked = true
	}
	if totalEnrolledSum > 0 {
		overview.OverallRate = math.Round((float64(totalMeasuredSum)/float64(totalEnrolledSum))*1000) / 10
	}

	// 2. Query Anthropometric Outliers using Window Function
	outlierSQL := `
	WITH ordered_measurements AS (
		SELECT 
			m.id::text AS measurement_id,
			m.child_id::text,
			c.full_name AS child_name,
			m.age_months,
			c.gender,
			COALESCE(p.name, c.posyandu_name, 'Posyandu') AS posyandu_name,
			c.posyandu_id::text,
			m.measured_at,
			to_char(m.measured_at, 'YYYY-MM-DD') AS measured_at_str,
			m.weight_kg,
			m.height_cm,
			m.zscore_hfa,
			m.zscore_wfa,
			m.zscore_wfh,
			COALESCE(m.nutrition_status, 'normal') AS nutrition_status,
			LAG(m.height_cm) OVER (PARTITION BY m.child_id ORDER BY m.measured_at ASC) AS prev_height_cm,
			LAG(m.weight_kg) OVER (PARTITION BY m.child_id ORDER BY m.measured_at ASC) AS prev_weight_kg,
			LAG(m.measured_at) OVER (PARTITION BY m.child_id ORDER BY m.measured_at ASC) AS prev_measured_at
		FROM measurements m
		JOIN children c ON c.id = m.child_id
		LEFT JOIN posyandus p ON p.id = c.posyandu_id
		WHERE (c.village_name ILIKE $1 OR c.village_name = '')
	)
	SELECT 
		measurement_id,
		child_id,
		child_name,
		age_months,
		gender,
		posyandu_name,
		measured_at_str,
		weight_kg,
		height_cm,
		prev_height_cm,
		prev_weight_kg,
		zscore_hfa,
		zscore_wfa,
		zscore_wfh,
		nutrition_status,
		CASE 
			WHEN prev_height_cm IS NOT NULL AND height_cm < prev_height_cm THEN 'HEIGHT_SHRINKAGE'
			WHEN prev_height_cm IS NOT NULL AND (height_cm - prev_height_cm) >= 6.0 AND (measured_at - prev_measured_at) <= 45 THEN 'HEIGHT_SURGE'
			WHEN prev_weight_kg IS NOT NULL AND (prev_weight_kg - weight_kg) >= 1.5 AND (measured_at - prev_measured_at) <= 45 THEN 'EXTREME_WEIGHT_CHANGE'
			WHEN ABS(zscore_hfa) >= 4.0 OR ABS(zscore_wfa) >= 4.0 OR ABS(zscore_wfh) >= 4.0 THEN 'EXTREME_ZSCORE'
			ELSE 'NORMAL'
		END AS anomaly_code,
		prev_measured_at
	FROM ordered_measurements
	WHERE (
		(prev_height_cm IS NOT NULL AND height_cm < prev_height_cm) OR
		(prev_height_cm IS NOT NULL AND (height_cm - prev_height_cm) >= 6.0 AND (measured_at - prev_measured_at) <= 45) OR
		(prev_weight_kg IS NOT NULL AND (prev_weight_kg - weight_kg) >= 1.5 AND (measured_at - prev_measured_at) <= 45) OR
		(ABS(zscore_hfa) >= 4.0 OR ABS(zscore_wfa) >= 4.0 OR ABS(zscore_wfh) >= 4.0)
	)
	`
	args := []any{villageName}
	if posyanduID != "" {
		outlierSQL += ` AND posyandu_id = $2`
		args = append(args, posyanduID)
	}
	outlierSQL += ` ORDER BY measured_at DESC LIMIT 50;`

	oRows, err := r.db.Query(ctx, outlierSQL, args...)
	if err != nil {
		log.Printf("[SUPERVISION REPO ERROR] Query outliers: %v", err)
	} else {
		defer oRows.Close()
		for oRows.Next() {
			var o MeasurementOutlierItem
			var prevH, prevW *float64
			var anomalyCode string
			var prevDate *time.Time

			if err := oRows.Scan(
				&o.MeasurementID,
				&o.ChildID,
				&o.ChildName,
				&o.AgeMonths,
				&o.Gender,
				&o.PosyanduName,
				&o.MeasuredAt,
				&o.WeightKg,
				&o.HeightCm,
				&prevH,
				&prevW,
				&o.ZScoreHFA,
				&o.ZScoreWFA,
				&o.ZScoreWFH,
				&o.NutritionStatus,
				&anomalyCode,
				&prevDate,
			); err != nil {
				log.Printf("[SUPERVISION REPO ERROR] Scan outlier row: %v", err)
				continue
			}

			o.PrevHeightCm = prevH
			o.PrevWeightKg = prevW
			o.OutlierType = anomalyCode

			switch anomalyCode {
			case "HEIGHT_SHRINKAGE":
				o.Severity = "HIGH"
				o.Title = "Panjang/Tinggi Badan Menyusut"
				diff := 0.0
				if prevH != nil {
					diff = *prevH - o.HeightCm
				}
				o.Description = fmt.Sprintf("TB tercatat %.1f cm, menyusut %.1f cm dibandingkan timbangan sebelumnya (%.1f cm). Kemungkinan kesalahan pembacaan stadiometer/infantometer.", o.HeightCm, diff, *prevH)
				o.SuggestedAction = "Instruksikan Petugas Posyandu untuk mengukur ulang dengan posisi berbaring/berdiri yang tegak dan alat terkalibrasi."

			case "HEIGHT_SURGE":
				o.Severity = "MEDIUM"
				o.Title = "Lonjakan Tinggi Badan Ekstrem (> 6 cm)"
				diff := 0.0
				if prevH != nil {
					diff = o.HeightCm - *prevH
				}
				o.Description = fmt.Sprintf("Kenaikan TB sebesar +%.1f cm dalam kurun waktu kurang dari 45 hari. Kemungkinan salah ketik angka puluhan.", diff)
				o.SuggestedAction = "Verifikasi buku KMS fisik balita dan validasi data ukur kader."

			case "EXTREME_WEIGHT_CHANGE":
				o.Severity = "HIGH"
				o.Title = "Penurunan Berat Badan Ekstrem (> 1.5 kg)"
				diff := 0.0
				if prevW != nil {
					diff = *prevW - o.WeightKg
				}
				o.Description = fmt.Sprintf("Berat badan turun drastis sebesar -%.1f kg (dari %.1f kg menjadi %.1f kg). Perlu investigasi klinis dehidrasi atau infeksi akut.", diff, *prevW, o.WeightKg)
				o.SuggestedAction = "Jadwalkan Home Visit SOAP segera untuk skrining dehidrasi/diare kronis atau salah timbang."

			default: // EXTREME_ZSCORE
				o.Severity = "HIGH"
				o.Title = "Nilai Z-Score Antropometri Ekstrem (|Z| ≥ 4 SD)"
				o.Description = fmt.Sprintf("Hasil perhitungan Z-Score TB/U: %.1f SD, BB/U: %.1f SD. Angka di luar batas biologis standar populasi WHO.", o.ZScoreHFA, o.ZScoreWFA)
				o.SuggestedAction = "Periksa kembali tanggal lahir dan input angka desimal timbangan kader."
			}

			overview.Outliers = append(overview.Outliers, o)
		}
	}

	overview.TotalOutliers = len(overview.Outliers)

	// Map outlier counts per posyandu
	outlierMap := make(map[string]int)
	for _, o := range overview.Outliers {
		outlierMap[o.PosyanduName]++
	}
	for i := range overview.Posyandus {
		overview.Posyandus[i].OutlierCount = outlierMap[overview.Posyandus[i].PosyanduName]
	}

	return overview, nil
}

func (r *postgresRepository) SetSupervisionLock(ctx context.Context, req LockRequest) (*LockRecord, error) {
	if r.db == nil {
		return &LockRecord{
			PosyanduID:   req.PosyanduID,
			PeriodMonth:  req.PeriodMonth,
			PeriodYear:   req.PeriodYear,
			IsLocked:     req.IsLocked,
			LockedAt:     time.Now().Format("2006-01-02 15:04"),
			LockedByName: req.LockedByName,
			AuditNotes:   req.AuditNotes,
		}, nil
	}

	if req.PosyanduID == "" || req.PosyanduID == "all" {
		// Lock/unlock all posyandus in village
		posRows, err := r.db.Query(ctx, "SELECT id::text FROM posyandus WHERE village_name ILIKE $1 OR village_name = 'Desa Sukamaju' OR village_name = ''", req.VillageName)
		if err != nil {
			return nil, fmt.Errorf("failed fetching posyandus: %w", err)
		}
		defer posRows.Close()

		var ids []string
		for posRows.Next() {
			var pid string
			if err := posRows.Scan(&pid); err == nil {
				ids = append(ids, pid)
			}
		}

		for _, pid := range ids {
			subReq := req
			subReq.PosyanduID = pid
			_, _ = r.setSingleLock(ctx, subReq)
		}

		return &LockRecord{
			PosyanduID:   "all",
			PeriodMonth:  req.PeriodMonth,
			PeriodYear:   req.PeriodYear,
			IsLocked:     req.IsLocked,
			LockedAt:     time.Now().Format("2006-01-02 15:04"),
			LockedByName: req.LockedByName,
			AuditNotes:   req.AuditNotes,
		}, nil
	}

	return r.setSingleLock(ctx, req)
}

func (r *postgresRepository) setSingleLock(ctx context.Context, req LockRequest) (*LockRecord, error) {
	sql := `
	INSERT INTO supervision_locks (
		village_name, posyandu_id, period_month, period_year, is_locked, 
		locked_at, locked_by, locked_by_name, audit_notes, updated_at
	) VALUES (
		$1, $2::uuid, $3, $4, $5, 
		NOW(), $6, $7, $8, NOW()
	)
	ON CONFLICT (village_name, posyandu_id, period_month, period_year)
	DO UPDATE SET 
		is_locked = EXCLUDED.is_locked,
		locked_at = NOW(),
		locked_by = EXCLUDED.locked_by,
		locked_by_name = EXCLUDED.locked_by_name,
		audit_notes = EXCLUDED.audit_notes,
		updated_at = NOW()
	RETURNING id::text, posyandu_id::text, period_month, period_year, is_locked, to_char(locked_at, 'YYYY-MM-DD HH24:MI'), COALESCE(locked_by_name, ''), COALESCE(audit_notes, '');
	`

	var rec LockRecord
	err := r.db.QueryRow(ctx, sql,
		req.VillageName,
		req.PosyanduID,
		req.PeriodMonth,
		req.PeriodYear,
		req.IsLocked,
		req.LockedBy,
		req.LockedByName,
		req.AuditNotes,
	).Scan(
		&rec.ID,
		&rec.PosyanduID,
		&rec.PeriodMonth,
		&rec.PeriodYear,
		&rec.IsLocked,
		&rec.LockedAt,
		&rec.LockedByName,
		&rec.AuditNotes,
	)

	if err != nil && err != pgx.ErrNoRows {
		return nil, fmt.Errorf("failed setting supervision lock: %w", err)
	}

	return &rec, nil
}
