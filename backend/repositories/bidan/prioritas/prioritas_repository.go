package prioritas

import (
	"context"
	"crypto/sha256"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PriorityChild represents a prioritized child for medical triage intervention
type PriorityChild struct {
	ChildID             string  `json:"child_id"`
	ChildName           string  `json:"child_name"`
	AgeMonths           int     `json:"age_months"`
	Gender              string  `json:"gender"`
	PosyanduName        string  `json:"posyandu_name"`
	RWCode              string  `json:"rw_code"`
	RTCode              string  `json:"rt_code"`
	ParentName          string  `json:"parent_name"`
	ParentPhone         string  `json:"parent_phone"`
	NutritionStatus     string  `json:"nutrition_status"`
	FalteringRiskScore  float64 `json:"faltering_risk_score"`
	FalteringRiskLevel  string  `json:"faltering_risk_level"`
	TriageCategory      string  `json:"triage_category"` // MERAH, ORANYE, KUNING
	LastMeasuredAt      string  `json:"last_measured_at"`
	ZscoreWFA           float64 `json:"zscore_wfa"`
	ZscoreHFA           float64 `json:"zscore_hfa"`
	ZscoreWFH           float64 `json:"zscore_wfh"`
	PendingIntervention bool    `json:"pending_intervention"`
}

// CreatePriorityRequest represents input for creating a priority child
type CreatePriorityRequest struct {
	ChildName           string   `json:"child_name"`
	AgeMonths           int      `json:"age_months"`
	Gender              string   `json:"gender"`
	PosyanduName        string   `json:"posyandu_name"`
	RWCode              string   `json:"rw_code"`
	RTCode              string   `json:"rt_code"`
	ParentName          string   `json:"parent_name"`
	ParentPhone         string   `json:"parent_phone"`
	NutritionStatus     string   `json:"nutrition_status"`
	FalteringRiskScore  *float64 `json:"faltering_risk_score"`
	ZscoreWFA           *float64 `json:"zscore_wfa"`
	ZscoreHFA           *float64 `json:"zscore_hfa"`
	ZscoreWFH           *float64 `json:"zscore_wfh"`
	PendingIntervention bool     `json:"pending_intervention"`
}

// UpdatePriorityRequest represents input for updating a priority child
type UpdatePriorityRequest struct {
	ChildName           string   `json:"child_name"`
	AgeMonths           int      `json:"age_months"`
	Gender              string   `json:"gender"`
	PosyanduName        string   `json:"posyandu_name"`
	RWCode              string   `json:"rw_code"`
	RTCode              string   `json:"rt_code"`
	ParentName          string   `json:"parent_name"`
	ParentPhone         string   `json:"parent_phone"`
	NutritionStatus     string   `json:"nutrition_status"`
	FalteringRiskScore  *float64 `json:"faltering_risk_score"`
	ZscoreWFA           *float64 `json:"zscore_wfa"`
	ZscoreHFA           *float64 `json:"zscore_hfa"`
	ZscoreWFH           *float64 `json:"zscore_wfh"`
	PendingIntervention *bool    `json:"pending_intervention"`
}

// Repository defines data contract for priority triage list
type Repository interface {
	GetPriorityList(ctx context.Context, villageName string) ([]PriorityChild, error)
	CreatePriorityChild(ctx context.Context, villageName string, req CreatePriorityRequest) (*PriorityChild, error)
	UpdatePriorityChild(ctx context.Context, villageName string, childID string, req UpdatePriorityRequest) (*PriorityChild, error)
	DeletePriorityChild(ctx context.Context, villageName string, childID string) error
}

type repository struct {
	db        *pgxpool.Pool
	mu        sync.RWMutex
	mockStore []PriorityChild
}

// NewRepository instantiates new Priority Repository
func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{
		db:        db,
		mockStore: getInitialMockPriorityList(),
	}
}

func determineTriageCategory(nutritionStatus string, zscoreHFA float64, falteringScore float64) string {
	if nutritionStatus == "severely_stunted" || nutritionStatus == "severely_wasted" || zscoreHFA <= -3.0 {
		return "MERAH"
	}
	if nutritionStatus == "stunted" || nutritionStatus == "wasted" || zscoreHFA <= -2.0 {
		return "ORANYE"
	}
	return "KUNING"
}

func (r *repository) GetPriorityList(ctx context.Context, villageName string) ([]PriorityChild, error) {
	if villageName == "" {
		villageName = "Desa Sukamaju"
	}

	if r.db != nil {
		query := `
		SELECT 
			c.id::text, c.full_name, COALESCE(m.age_months, 12), c.gender,
			COALESCE(c.posyandu_name, 'Posyandu Melati 04'), c.rw_code, c.rt_code,
			c.parent_name, c.parent_phone,
			COALESCE(m.nutrition_status, 'normal'),
			COALESCE(m.faltering_risk_score, 0.0),
			COALESCE(m.faltering_risk_level, 'LOW'),
			COALESCE(to_char(m.measured_at, 'YYYY-MM-DD'), to_char(CURRENT_DATE, 'YYYY-MM-DD')),
			COALESCE(m.zscore_wfa, 0.0),
			COALESCE(m.zscore_hfa, 0.0),
			COALESCE(m.zscore_wfh, 0.0),
			CASE WHEN EXISTS (
				SELECT 1 FROM interventions 
				WHERE child_id = c.id AND visit_status = 'SCHEDULED'
			) THEN TRUE ELSE FALSE END as pending_intervention
		FROM children c
		LEFT JOIN (
			SELECT DISTINCT ON (child_id) child_id, age_months, nutrition_status,
				faltering_risk_score, faltering_risk_level, measured_at,
				zscore_wfa, zscore_hfa, zscore_wfh
			FROM measurements
			ORDER BY child_id, measured_at DESC
		) m ON m.child_id = c.id
		WHERE (c.village_name = $1 OR c.village_name = 'Desa Sukamaju' OR c.village_name IS NULL OR c.village_name = '') AND (
			m.nutrition_status IN ('severely_stunted', 'stunted', 'severely_wasted', 'wasted')
			OR m.faltering_risk_score >= 70.0
			OR c.created_at >= (CURRENT_TIMESTAMP - interval '7 days')
		)
		ORDER BY 
			c.created_at DESC,
			CASE 
				WHEN m.nutrition_status IN ('severely_stunted', 'severely_wasted') THEN 1
				WHEN m.nutrition_status IN ('stunted', 'wasted') THEN 2
				ELSE 3
			END ASC,
			m.faltering_risk_score DESC;
		`

		rows, err := r.db.Query(ctx, query, villageName)
		if err == nil {
			defer rows.Close()
			var list []PriorityChild
			seenIDs := make(map[string]bool)
			for rows.Next() {
				var p PriorityChild
				if err := rows.Scan(
					&p.ChildID, &p.ChildName, &p.AgeMonths, &p.Gender,
					&p.PosyanduName, &p.RWCode, &p.RTCode, &p.ParentName, &p.ParentPhone,
					&p.NutritionStatus, &p.FalteringRiskScore, &p.FalteringRiskLevel,
					&p.LastMeasuredAt, &p.ZscoreWFA, &p.ZscoreHFA, &p.ZscoreWFH,
					&p.PendingIntervention,
				); err == nil {
					if !seenIDs[p.ChildID] {
						seenIDs[p.ChildID] = true
						p.TriageCategory = determineTriageCategory(p.NutritionStatus, p.ZscoreHFA, p.FalteringRiskScore)
						list = append(list, p)
					}
				}
			}

			return list, nil
		}

		log.Printf("[PRIORITAS] DB query error: %v", err)
		return []PriorityChild{}, err
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	res := make([]PriorityChild, len(r.mockStore))
	copy(res, r.mockStore)
	return res, nil
}

func (r *repository) CreatePriorityChild(ctx context.Context, villageName string, req CreatePriorityRequest) (*PriorityChild, error) {
	if villageName == "" {
		villageName = "Desa Sukamaju"
	}

	childName := req.ChildName
	if childName == "" {
		childName = "Balita Prioritas Baru"
	}

	ageMonths := req.AgeMonths
	if ageMonths < 0 {
		ageMonths = 0
	} else if ageMonths == 0 {
		ageMonths = 12
	}

	gender := "L"
	if req.Gender == "P" || req.Gender == "Perempuan" {
		gender = "P"
	}

	posyandu := req.PosyanduName
	if posyandu == "" {
		posyandu = "Posyandu Melati 03"
	}

	rwCode := req.RWCode
	if rwCode == "" {
		rwCode = "RW 03"
	}

	rtCode := req.RTCode
	if rtCode == "" {
		rtCode = "RT 01"
	}

	nutritionStatus := req.NutritionStatus
	if nutritionStatus == "" {
		nutritionStatus = "stunted"
	}

	falteringScore := 75.0
	if req.FalteringRiskScore != nil {
		falteringScore = *req.FalteringRiskScore
	}

	zscoreWfa := -1.5
	if req.ZscoreWFA != nil {
		zscoreWfa = *req.ZscoreWFA
	}

	zscoreHfa := -2.3
	if req.ZscoreHFA != nil {
		zscoreHfa = *req.ZscoreHFA
	}

	zscoreWfh := -1.0
	if req.ZscoreWFH != nil {
		zscoreWfh = *req.ZscoreWFH
	}

	riskLevel := "LOW"
	if falteringScore >= 70.0 {
		riskLevel = "HIGH"
	} else if falteringScore >= 40.0 {
		riskLevel = "MEDIUM"
	}

	triageCat := determineTriageCategory(nutritionStatus, zscoreHfa, falteringScore)
	todayStr := time.Now().Format("2006-01-02")
	newID := fmt.Sprintf("ch-%d", time.Now().UnixNano()%100000)

	newChild := PriorityChild{
		ChildID:             newID,
		ChildName:           childName,
		AgeMonths:           ageMonths,
		Gender:              gender,
		PosyanduName:        posyandu,
		RWCode:              rwCode,
		RTCode:              rtCode,
		ParentName:          req.ParentName,
		ParentPhone:         req.ParentPhone,
		NutritionStatus:     nutritionStatus,
		FalteringRiskScore:  falteringScore,
		FalteringRiskLevel:  riskLevel,
		TriageCategory:      triageCat,
		LastMeasuredAt:      todayStr,
		ZscoreWFA:           zscoreWfa,
		ZscoreHFA:           zscoreHfa,
		ZscoreWFH:           zscoreWfh,
		PendingIntervention: req.PendingIntervention,
	}

	// Try inserting to Postgres if available
	if r.db != nil {
		nikHash := fmt.Sprintf("nik_%x", sha256.Sum256([]byte(fmt.Sprintf("%s-%s-%d", childName, villageName, time.Now().UnixNano()))))
		if len(nikHash) > 32 {
			nikHash = nikHash[:32]
		}
		magicToken := fmt.Sprintf("tok_%x", sha256.Sum256([]byte(fmt.Sprintf("%s-%d", childName, time.Now().UnixNano()))))
		if len(magicToken) > 32 {
			magicToken = magicToken[:32]
		}

		var dbChildID string
		childQuery := `
			INSERT INTO children (
				nik_hash, full_name, gender, birth_date,
				posyandu_id, posyandu_name, village_name,
				rw_code, rt_code, parent_name, parent_phone,
				magic_token, is_active
			)
			VALUES (
				$1, $2, $3, CURRENT_DATE - ($4 * INTERVAL '1 month'),
				(SELECT id FROM posyandus WHERE name = $5 LIMIT 1),
				$5, $6, $7, $8, $9, $10, $11, TRUE
			)
			RETURNING id::text;
		`
		err := r.db.QueryRow(ctx, childQuery,
			nikHash, childName, gender, ageMonths,
			posyandu, villageName, rwCode, rtCode, req.ParentName, req.ParentPhone,
			magicToken,
		).Scan(&dbChildID)

		if err == nil && dbChildID != "" {
			newChild.ChildID = dbChildID

			// Insert measurement
			weightKg := 3.5 + (float64(ageMonths) * 0.4)
			heightCm := 50.0 + (float64(ageMonths) * 1.5)
			measQuery := `
				INSERT INTO measurements (
					child_id, age_months, weight_kg, height_cm,
					zscore_wfa, zscore_hfa, zscore_wfh,
					nutrition_status, faltering_risk_score, faltering_risk_level,
					measured_at
				)
				VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE);
			`
			_, errMeas := r.db.Exec(ctx, measQuery,
				dbChildID, ageMonths, weightKg, heightCm,
				zscoreWfa, zscoreHfa, zscoreWfh,
				nutritionStatus, falteringScore, riskLevel,
			)
			if errMeas != nil {
				log.Printf("[PRIORITAS] Warning insert measurement: %v", errMeas)
			}

			// Insert scheduled intervention if pending
			if req.PendingIntervention {
				visitQuery := `
					INSERT INTO interventions (child_id, visit_status, visit_date, clinical_notes)
					VALUES ($1::uuid, 'SCHEDULED', CURRENT_DATE + interval '3 days', 'Prioritas rujukan bidan desa');
				`
				_, errVisit := r.db.Exec(ctx, visitQuery, dbChildID)
				if errVisit != nil {
					log.Printf("[PRIORITAS] Warning insert intervention: %v", errVisit)
				}
			}
		} else {
			log.Printf("[PRIORITAS] Error insert children to DB: %v", err)
		}
	}

	// Always sync to in-memory store so it reflects immediately
	r.mu.Lock()
	r.mockStore = append([]PriorityChild{newChild}, r.mockStore...)
	r.mu.Unlock()

	return &newChild, nil
}

func (r *repository) UpdatePriorityChild(ctx context.Context, villageName string, childID string, req UpdatePriorityRequest) (*PriorityChild, error) {
	if villageName == "" {
		villageName = "Desa Sukamaju"
	}

	// 1. If DB is available, perform updates directly on PostgreSQL
	if r.db != nil {
		updateChildQuery := `
			UPDATE children
			SET full_name = COALESCE(NULLIF($1, ''), full_name),
			    gender = COALESCE(NULLIF($2, ''), gender),
			    posyandu_name = COALESCE(NULLIF($3, ''), posyandu_name),
			    rw_code = COALESCE(NULLIF($4, ''), rw_code),
			    rt_code = COALESCE(NULLIF($5, ''), rt_code),
			    parent_name = COALESCE(NULLIF($6, ''), parent_name),
			    parent_phone = COALESCE(NULLIF($7, ''), parent_phone),
			    updated_at = CURRENT_TIMESTAMP
			WHERE id::text = $8;
		`
		_, _ = r.db.Exec(ctx, updateChildQuery, req.ChildName, req.Gender, req.PosyanduName, req.RWCode, req.RTCode, req.ParentName, req.ParentPhone, childID)

		if req.PendingIntervention != nil {
			if *req.PendingIntervention {
				_, _ = r.db.Exec(ctx, `
					INSERT INTO interventions (child_id, visit_status, visit_date, clinical_notes)
					VALUES ($1::uuid, 'SCHEDULED', CURRENT_DATE + interval '3 days', 'Prioritas rujukan bidan desa');
				`, childID)
			} else {
				_, _ = r.db.Exec(ctx, `
					UPDATE interventions SET visit_status = 'COMPLETED', updated_at = NOW() WHERE child_id::text = $1;
				`, childID)
			}
		}

		// Check if record exists in PostgreSQL and return it immediately
		querySingle := `
		SELECT 
			c.id::text, c.full_name, COALESCE(m.age_months, 12), c.gender,
			COALESCE(c.posyandu_name, 'Posyandu Melati 04'), c.rw_code, c.rt_code,
			c.parent_name, c.parent_phone,
			COALESCE(m.nutrition_status, 'normal'),
			COALESCE(m.faltering_risk_score, 0.0),
			COALESCE(m.faltering_risk_level, 'LOW'),
			COALESCE(to_char(m.measured_at, 'YYYY-MM-DD'), to_char(CURRENT_DATE, 'YYYY-MM-DD')),
			COALESCE(m.zscore_wfa, 0.0),
			COALESCE(m.zscore_hfa, 0.0),
			COALESCE(m.zscore_wfh, 0.0),
			CASE WHEN i.id IS NULL THEN TRUE ELSE FALSE END as pending_intervention
		FROM children c
		LEFT JOIN (
			SELECT DISTINCT ON (child_id) child_id, age_months, nutrition_status,
				faltering_risk_score, faltering_risk_level, measured_at,
				zscore_wfa, zscore_hfa, zscore_wfh
			FROM measurements
			ORDER BY child_id, measured_at DESC
		) m ON m.child_id = c.id
		LEFT JOIN interventions i ON i.child_id = c.id AND i.visit_status = 'SCHEDULED'
		WHERE c.id::text = $1 LIMIT 1;
		`
		var p PriorityChild
		err := r.db.QueryRow(ctx, querySingle, childID).Scan(
			&p.ChildID, &p.ChildName, &p.AgeMonths, &p.Gender,
			&p.PosyanduName, &p.RWCode, &p.RTCode, &p.ParentName, &p.ParentPhone,
			&p.NutritionStatus, &p.FalteringRiskScore, &p.FalteringRiskLevel,
			&p.LastMeasuredAt, &p.ZscoreWFA, &p.ZscoreHFA, &p.ZscoreWFH,
			&p.PendingIntervention,
		)
		if err == nil {
			p.TriageCategory = determineTriageCategory(p.NutritionStatus, p.ZscoreHFA, p.FalteringRiskScore)
			return &p, nil
		}
	}

	// 2. Fallback to in-memory store for mock records (e.g. ch-001)
	r.mu.Lock()
	defer r.mu.Unlock()

	for i := range r.mockStore {
		if r.mockStore[i].ChildID == childID {
			if req.ChildName != "" {
				r.mockStore[i].ChildName = req.ChildName
			}
			if req.AgeMonths > 0 {
				r.mockStore[i].AgeMonths = req.AgeMonths
			}
			if req.Gender != "" {
				r.mockStore[i].Gender = req.Gender
			}
			if req.PosyanduName != "" {
				r.mockStore[i].PosyanduName = req.PosyanduName
			}
			if req.RWCode != "" {
				r.mockStore[i].RWCode = req.RWCode
			}
			if req.RTCode != "" {
				r.mockStore[i].RTCode = req.RTCode
			}
			if req.ParentName != "" {
				r.mockStore[i].ParentName = req.ParentName
			}
			if req.ParentPhone != "" {
				r.mockStore[i].ParentPhone = req.ParentPhone
			}
			if req.NutritionStatus != "" {
				r.mockStore[i].NutritionStatus = req.NutritionStatus
			}
			if req.FalteringRiskScore != nil {
				r.mockStore[i].FalteringRiskScore = *req.FalteringRiskScore
			}
			if req.ZscoreWFA != nil {
				r.mockStore[i].ZscoreWFA = *req.ZscoreWFA
			}
			if req.ZscoreHFA != nil {
				r.mockStore[i].ZscoreHFA = *req.ZscoreHFA
			}
			if req.ZscoreWFH != nil {
				r.mockStore[i].ZscoreWFH = *req.ZscoreWFH
			}
			if req.PendingIntervention != nil {
				r.mockStore[i].PendingIntervention = *req.PendingIntervention
			}

			// recalculate triage category
			r.mockStore[i].TriageCategory = determineTriageCategory(
				r.mockStore[i].NutritionStatus,
				r.mockStore[i].ZscoreHFA,
				r.mockStore[i].FalteringRiskScore,
			)

			updated := r.mockStore[i]
			return &updated, nil
		}
	}

	return nil, fmt.Errorf("balita prioritas dengan ID %s tidak ditemukan", childID)
}

func (r *repository) DeletePriorityChild(ctx context.Context, villageName string, childID string) error {
	if r.db != nil {
		tag, err := r.db.Exec(ctx, `DELETE FROM children WHERE id::text = $1;`, childID)
		if err == nil && tag.RowsAffected() > 0 {
			_, _ = r.db.Exec(ctx, `DELETE FROM interventions WHERE child_id::text = $1;`, childID)
			_, _ = r.db.Exec(ctx, `DELETE FROM measurements WHERE child_id::text = $1;`, childID)
			return nil
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	found := false
	filtered := make([]PriorityChild, 0, len(r.mockStore))
	for _, item := range r.mockStore {
		if item.ChildID == childID {
			found = true
			continue
		}
		filtered = append(filtered, item)
	}

	if !found {
		return fmt.Errorf("balita dengan ID %s tidak ditemukan", childID)
	}

	r.mockStore = filtered
	return nil
}

func getInitialMockPriorityList() []PriorityChild {
	return []PriorityChild{}
}
