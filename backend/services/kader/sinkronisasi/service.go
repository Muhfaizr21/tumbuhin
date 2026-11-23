package sinkronisasi

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	kaderBalitaRepo "tumbuhin-backend/repositories/kader/balita"
	syncRepo "tumbuhin-backend/repositories/kader/sinkronisasi"
	kaderTimbangRepo "tumbuhin-backend/repositories/kader/timbang"
	kaderBalitaSvc "tumbuhin-backend/services/kader/balita"
	kaderTimbangSvc "tumbuhin-backend/services/kader/timbang"
)

const maxBatchItems = 200

// SyncItem is one queued transaction from the browser IndexedDB.
// Unknown fields are folded back into Payload so both wrapped and flat payloads work.
type SyncItem struct {
	ClientID string          `json:"clientId"`
	Type     string          `json:"type"`
	Payload  json.RawMessage `json:"payload"`
	QueuedAt string          `json:"queuedAt,omitempty"`
}

func (s *SyncItem) UnmarshalJSON(data []byte) error {
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}

	s.ClientID = firstString(raw, "clientId", "client_id", "id", "queueId", "queue_id")
	s.Type = firstString(raw, "type", "itemType", "item_type", "kind", "entity")
	s.QueuedAt = firstString(raw, "queuedAt", "queued_at", "timestamp", "createdAt", "created_at")

	for _, key := range []string{"payload", "data"} {
		if v, ok := raw[key]; ok && len(v) > 0 && string(v) != "null" {
			s.Payload = v
			return nil
		}
	}

	known := map[string]bool{
		"clientId": true, "client_id": true, "id": true, "queueId": true, "queue_id": true,
		"type": true, "itemType": true, "item_type": true, "kind": true, "entity": true,
		"queuedAt": true, "queued_at": true, "timestamp": true, "createdAt": true, "created_at": true,
	}
	rest := make(map[string]json.RawMessage)
	for key, value := range raw {
		if !known[key] {
			rest[key] = value
		}
	}
	if len(rest) > 0 {
		encoded, err := json.Marshal(rest)
		if err != nil {
			return err
		}
		s.Payload = encoded
	}
	return nil
}

// BatchRequest accepts either "items" or "queue" as the item array.
type BatchRequest struct {
	BatchID  string     `json:"batchId"`
	DeviceID string     `json:"deviceId"`
	Items    []SyncItem `json:"items"`
	Queue    []SyncItem `json:"queue"`
}

func (b *BatchRequest) AllItems() []SyncItem {
	if len(b.Items) > 0 {
		return b.Items
	}
	return b.Queue
}

type ItemResult struct {
	ClientID string                              `json:"clientId"`
	Type     string                              `json:"type"`
	Status   string                              `json:"status"`
	ServerID string                              `json:"serverId,omitempty"`
	Message  string                              `json:"message"`
	ZScore   *kaderTimbangRepo.MeasurementResult `json:"zscore,omitempty"`
}

type BatchResponse struct {
	BatchID    string       `json:"batchId"`
	DeviceID   string       `json:"deviceId,omitempty"`
	ReceivedAt string       `json:"receivedAt"`
	Total      int          `json:"total"`
	Synced     int          `json:"synced"`
	Conflict   int          `json:"conflict"`
	Failed     int          `json:"failed"`
	Results    []ItemResult `json:"results"`
}

type Service interface {
	SyncBatch(ctx context.Context, kaderID int64, req BatchRequest) (*BatchResponse, error)
	GetStatus(ctx context.Context, kaderID int64, limit int) (*syncRepo.StatusSummary, error)
}

type service struct {
	repo       syncRepo.Repository
	timbangSvc kaderTimbangSvc.Service
	balitaSvc  kaderBalitaSvc.Service
}

func NewService(repo syncRepo.Repository, timbangSvc kaderTimbangSvc.Service, balitaSvc kaderBalitaSvc.Service) Service {
	return &service{repo: repo, timbangSvc: timbangSvc, balitaSvc: balitaSvc}
}

func (s *service) GetStatus(ctx context.Context, kaderID int64, limit int) (*syncRepo.StatusSummary, error) {
	return s.repo.GetStatus(ctx, kaderID, limit)
}

func (s *service) SyncBatch(ctx context.Context, kaderID int64, req BatchRequest) (*BatchResponse, error) {
	items := req.AllItems()
	if len(items) > maxBatchItems {
		return nil, fmt.Errorf("batch terlalu besar: maksimal %d item per sinkronisasi", maxBatchItems)
	}

	batchID := strings.TrimSpace(req.BatchID)
	if batchID == "" {
		batchID = fmt.Sprintf("batch-%d", time.Now().UnixNano())
	}

	resp := &BatchResponse{
		BatchID:    batchID,
		DeviceID:   strings.TrimSpace(req.DeviceID),
		ReceivedAt: time.Now().Format(time.RFC3339),
		Total:      len(items),
		Results:    make([]ItemResult, 0, len(items)),
	}

	for idx, item := range items {
		result, err := s.processItem(ctx, kaderID, batchID, idx, item)
		if err != nil {
			return nil, err
		}
		switch result.Status {
		case syncRepo.StatusSynced:
			resp.Synced++
		case syncRepo.StatusConflict:
			resp.Conflict++
		default:
			resp.Failed++
		}
		resp.Results = append(resp.Results, result)
	}

	return resp, nil
}

func (s *service) processItem(ctx context.Context, kaderID int64, batchID string, idx int, item SyncItem) (ItemResult, error) {
	itemType := normalizeItemType(item.Type)
	clientID := strings.TrimSpace(item.ClientID)
	if clientID == "" {
		clientID = autoClientID(batchID, idx, item.Payload)
	}

	result := ItemResult{ClientID: clientID, Type: itemType, Status: syncRepo.StatusFailed}

	if len(clientID) > 160 {
		result.Status = syncRepo.StatusConflict
		result.Message = "clientId terlalu panjang (maksimal 160 karakter)."
		return result, nil
	}

	if itemType == "" {
		result.Status = syncRepo.StatusConflict
		result.Message = "Tipe transaksi tidak dikenali. Gunakan 'timbang' atau 'balita'."
		return result, nil
	}

	itemID, existing, err := s.repo.ClaimItem(ctx, kaderID, clientID, itemType, item.Payload)
	if err != nil {
		return result, err
	}

	// Idempotency replay: a synced item or a conflict that needs manual review is never reprocessed.
	if existing != nil && (existing.Status == syncRepo.StatusSynced || existing.Status == syncRepo.StatusConflict) {
		result.Status = existing.Status
		result.ServerID = existing.ServerRef
		result.Message = existing.Message
		if result.Message == "" {
			if existing.Status == syncRepo.StatusSynced {
				result.Message = "Item sudah tersinkron sebelumnya (idempoten)."
			} else {
				result.Message = "Item sudah ditandai konflik sebelumnya."
			}
		}
		return result, nil
	}

	var processed ItemResult
	switch itemType {
	case "measurement":
		processed, err = s.syncMeasurement(ctx, itemID, clientID, item.Payload)
	case "child":
		processed, err = s.syncChild(ctx, itemID, clientID, item.Payload)
	}
	if err != nil {
		return result, err
	}
	return processed, nil
}

func (s *service) syncMeasurement(ctx context.Context, itemID, clientID string, payload []byte) (ItemResult, error) {
	out := ItemResult{ClientID: clientID, Type: "measurement", Status: syncRepo.StatusFailed}

	fields, err := decodePayload(payload)
	if err != nil {
		return s.markConflict(ctx, out, itemID, "Payload timbang bukan JSON object yang valid.")
	}

	childID := firstString(fields, "balitaId", "balita_id", "childId", "child_id")
	if childID == "" {
		return s.markConflict(ctx, out, itemID, "balitaId wajib diisi pada item timbang.")
	}
	if !looksLikeUUID(childID) {
		return s.markConflict(ctx, out, itemID, "balitaId harus berupa UUID server. Sinkronkan registrasi balita terlebih dahulu, lalu ganti id sementara di antrean.")
	}

	tanggal, err := normalizeDate(firstString(fields, "tanggal", "measuredAt", "measured_at", "tanggal_ukur", "date"))
	if err != nil {
		return s.markConflict(ctx, out, itemID, err.Error())
	}

	berat, ok := firstFloat(fields, "berat", "beratKg", "berat_kg", "weightKg", "weight_kg", "weight")
	if !ok || berat <= 0 || berat > 100 {
		return s.markConflict(ctx, out, itemID, "Berat badan wajib diisi dan berada di rentang 0-100 kg.")
	}

	tinggi, ok := firstFloat(fields, "tinggi", "tinggiCm", "tinggi_cm", "heightCm", "height_cm", "height", "panjang")
	if !ok || tinggi <= 0 || tinggi > 200 {
		return s.markConflict(ctx, out, itemID, "Tinggi badan wajib diisi dan berada di rentang 0-200 cm.")
	}

	exists, err := s.repo.ChildExists(ctx, childID)
	if err != nil {
		return out, err
	}
	if !exists {
		return s.markConflict(ctx, out, itemID, "Balita dengan id "+childID+" tidak ditemukan di server. Sinkronkan registrasi balita lebih dulu.")
	}

	existingID, existingWeight, existingHeight, found, err := s.repo.FindMeasurementOnDate(ctx, childID, tanggal)
	if err != nil {
		return out, err
	}
	if found {
		if nearlyEqual(existingWeight, berat, 0.01) && nearlyEqual(existingHeight, tinggi, 0.1) {
			if err := s.repo.MarkSynced(ctx, itemID, existingID, "Duplikat identik: data timbang tanggal "+tanggal+" sudah ada di server."); err != nil {
				return out, err
			}
			out.Status = syncRepo.StatusSynced
			out.ServerID = existingID
			out.Message = "Duplikat identik diabaikan, data server tidak berubah."
			return out, nil
		}
		return s.markConflict(ctx, out, itemID, fmt.Sprintf(
			"Konflik data: balita sudah punya timbang tanggal %s (%.2f kg / %.1f cm). Data antrean %.2f kg / %.1f cm perlu ditinjau kader.",
			tanggal, existingWeight, existingHeight, berat, tinggi))
	}

	lingkarKepala, _ := firstFloat(fields, "lingkarKepala", "lingkar_kepala", "headCircumferenceCm", "head_circumference_cm", "head_circumference")
	lila, _ := firstFloat(fields, "lila", "liLA", "lilaCm", "lila_cm", "armCircumferenceCm", "arm_circumference_cm", "arm_circumference")

	req := kaderTimbangRepo.MeasurementRequest{
		BalitaId:      childID,
		Tanggal:       tanggal,
		Berat:         berat,
		Tinggi:        tinggi,
		Posisi:        normalizePosition(firstString(fields, "posisi", "position", "measurementPos", "measurement_pos")),
		LingkarKepala: lingkarKepala,
		LiLA:          lila,
	}

	result, err := s.timbangSvc.SaveMeasurement(ctx, req)
	if err != nil {
		return out, err
	}
	if result == nil {
		return s.markConflict(ctx, out, itemID, "Balita tidak ditemukan saat penyimpanan timbang.")
	}

	serverID, _, _, _, _ := s.repo.FindMeasurementOnDate(ctx, childID, tanggal)
	if err := s.repo.MarkSynced(ctx, itemID, serverID, "Data penimbangan "+tanggal+" tersimpan."); err != nil {
		return out, err
	}

	out.Status = syncRepo.StatusSynced
	out.ServerID = serverID
	out.Message = "Data penimbangan tersimpan dan Z-Score WHO dihitung."
	out.ZScore = result
	return out, nil
}

func (s *service) syncChild(ctx context.Context, itemID, clientID string, payload []byte) (ItemResult, error) {
	out := ItemResult{ClientID: clientID, Type: "child", Status: syncRepo.StatusFailed}

	fields, err := decodePayload(payload)
	if err != nil {
		return s.markConflict(ctx, out, itemID, "Payload registrasi balita bukan JSON object yang valid.")
	}

	nama := firstString(fields, "nama", "fullName", "full_name", "name")
	if strings.TrimSpace(nama) == "" {
		return s.markConflict(ctx, out, itemID, "Nama balita wajib diisi.")
	}

	nik := strings.TrimSpace(firstString(fields, "nik", "NIK"))
	nikHash := strings.ToLower(strings.TrimSpace(firstString(fields, "nikHash", "nik_hash")))
	if nik != "" {
		sum := sha256.Sum256([]byte(nik))
		nikHash = hex.EncodeToString(sum[:])
	}
	if nikHash == "" {
		return s.markConflict(ctx, out, itemID, "NIK atau nik_hash wajib tersedia untuk registrasi offline.")
	}

	existingID, existingName, found, err := s.repo.FindChildByNikHash(ctx, nikHash)
	if err != nil {
		return out, err
	}
	if found {
		if sameName(existingName, nama) {
			if err := s.repo.MarkSynced(ctx, itemID, existingID, "Duplikat registrasi: balita dengan NIK hash sama sudah ada."); err != nil {
				return out, err
			}
			out.Status = syncRepo.StatusSynced
			out.ServerID = existingID
			out.Message = "Duplikat registrasi diabaikan, data server tidak berubah."
			return out, nil
		}
		return s.markConflict(ctx, out, itemID, fmt.Sprintf(
			"Konflik NIK: hash NIK sudah terdaftar sebagai '%s', antrean berisi '%s'.", existingName, nama))
	}

	if strings.TrimSpace(firstString(fields, "jenisKelamin", "jenis_kelamin", "gender")) == "" {
		return s.markConflict(ctx, out, itemID, "Jenis kelamin wajib diisi (L/P).")
	}
	gender := strings.ToUpper(strings.TrimSpace(firstString(fields, "jenisKelamin", "jenis_kelamin", "gender")))
	if gender != "L" && gender != "P" {
		return s.markConflict(ctx, out, itemID, "Jenis kelamin harus 'L' atau 'P'.")
	}

	birthDateRaw := firstString(fields, "tanggalLahir", "tanggal_lahir", "birthDate", "birth_date")
	if birthDateRaw == "" {
		return s.markConflict(ctx, out, itemID, "Tanggal lahir wajib diisi.")
	}
	birthDate, err := normalizeDate(birthDateRaw)
	if err != nil {
		return s.markConflict(ctx, out, itemID, "Tanggal lahir tidak valid: "+err.Error())
	}

	beratLahir, _ := firstFloat(fields, "beratLahir", "berat_lahir", "birthWeight", "birth_weight")
	panjangLahir, _ := firstFloat(fields, "panjangLahir", "panjang_lahir", "birthHeight", "birth_height")

	input := kaderBalitaRepo.ChildInput{
		Nik:          firstString(fields, "nik", "NIK"),
		NikHash:      nikHash,
		Nama:         nama,
		JenisKelamin: gender,
		TanggalLahir: birthDate,
		BeratLahir:   beratLahir,
		PanjangLahir: panjangLahir,
		NamaIbu:      firstString(fields, "namaIbu", "nama_ibu", "motherName", "parentName", "parent_name"),
		NamaAyah:     firstString(fields, "namaAyah", "nama_ayah", "fatherName", "parentFatherName", "parent_father_name"),
		NoWa:         firstString(fields, "noWa", "no_wa", "phone", "parentPhone", "parent_phone"),
		RTRw:         firstString(fields, "rtRw", "rt_rw", "rt"),
		Alergi:       firstString(fields, "alergi", "allergies", "notes"),
	}

	child, err := s.balitaSvc.CreateChild(ctx, input)
	if err != nil {
		// Unique constraint race: another request inserted the same NIK meanwhile.
		if id, name, ok, findErr := s.repo.FindChildByNikHash(ctx, nikHash); findErr == nil && ok && sameName(name, nama) {
			if markErr := s.repo.MarkSynced(ctx, itemID, id, "Duplikat registrasi setelah race condition."); markErr != nil {
				return out, markErr
			}
			out.Status = syncRepo.StatusSynced
			out.ServerID = id
			out.Message = "Duplikat registrasi diabaikan."
			return out, nil
		}
		return out, err
	}

	if err := s.repo.MarkSynced(ctx, itemID, child.ID, "Registrasi balita tersimpan."); err != nil {
		return out, err
	}
	out.Status = syncRepo.StatusSynced
	out.ServerID = child.ID
	out.Message = "Registrasi balita tersimpan di server."
	return out, nil
}

func (s *service) markConflict(ctx context.Context, out ItemResult, itemID, message string) (ItemResult, error) {
	if err := s.repo.MarkConflict(ctx, itemID, message); err != nil {
		return out, err
	}
	out.Status = syncRepo.StatusConflict
	out.Message = message
	return out, nil
}

func decodePayload(payload []byte) (map[string]json.RawMessage, error) {
	if len(payload) == 0 {
		return nil, fmt.Errorf("payload kosong")
	}
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(payload, &fields); err != nil {
		return nil, err
	}
	if fields == nil {
		return nil, fmt.Errorf("payload bukan object")
	}
	return fields, nil
}

func normalizeItemType(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "timbang", "penimbangan", "measurement", "measurements", "measure", "anthropometry":
		return "measurement"
	case "balita", "child", "children", "registrasi", "registrasi_balita", "register", "registration":
		return "child"
	default:
		return ""
	}
}

func normalizePosition(raw string) string {
	value := strings.ToLower(strings.TrimSpace(raw))
	switch {
	case strings.Contains(value, "terlentang"), strings.Contains(value, "recumbent"):
		return "terlentang"
	default:
		return "berdiri"
	}
}

func normalizeDate(raw string) (string, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return time.Now().Format("2006-01-02"), nil
	}

	layouts := []string{
		"2006-01-02",
		time.RFC3339,
		"2006-01-02T15:04:05",
		"2006-01-02 15:04:05",
		"02/01/2006",
		"2006/01/02",
	}
	for _, layout := range layouts {
		if parsed, err := time.Parse(layout, value); err == nil {
			date := parsed.Format("2006-01-02")
			if parsed.After(time.Now().Add(24 * time.Hour)) {
				return "", fmt.Errorf("tanggal %s berada di masa depan.", date)
			}
			return date, nil
		}
	}
	return "", fmt.Errorf("format tanggal tidak valid: '%s' (gunakan YYYY-MM-DD).", value)
}

func autoClientID(batchID string, idx int, payload []byte) string {
	if strings.TrimSpace(batchID) != "" {
		return fmt.Sprintf("%s-item-%d", batchID, idx)
	}
	sum := sha256.Sum256(payload)
	return "auto-" + hex.EncodeToString(sum[:8])
}

func sameName(a, b string) bool {
	return strings.EqualFold(strings.TrimSpace(a), strings.TrimSpace(b))
}

func looksLikeUUID(value string) bool {
	cleaned := strings.ReplaceAll(strings.TrimSpace(value), "-", "")
	if len(cleaned) != 32 {
		return false
	}
	_, err := hex.DecodeString(cleaned)
	return err == nil
}

func nearlyEqual(a, b, tolerance float64) bool {
	return math.Abs(a-b) <= tolerance
}

func firstString(fields map[string]json.RawMessage, keys ...string) string {
	for _, key := range keys {
		raw, ok := fields[key]
		if !ok {
			continue
		}
		value := toString(raw)
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func firstFloat(fields map[string]json.RawMessage, keys ...string) (float64, bool) {
	for _, key := range keys {
		raw, ok := fields[key]
		if !ok {
			continue
		}
		if value, ok := toFloat(raw); ok {
			return value, true
		}
	}
	return 0, false
}

func toString(raw json.RawMessage) string {
	var value string
	if err := json.Unmarshal(raw, &value); err == nil {
		return value
	}
	var number json.Number
	if err := json.Unmarshal(raw, &number); err == nil {
		return number.String()
	}
	return ""
}

func toFloat(raw json.RawMessage) (float64, bool) {
	var number float64
	if err := json.Unmarshal(raw, &number); err == nil {
		return number, true
	}
	var text string
	if err := json.Unmarshal(raw, &text); err == nil {
		parsed, err := strconv.ParseFloat(strings.TrimSpace(text), 64)
		if err == nil {
			return parsed, true
		}
	}
	return 0, false
}
