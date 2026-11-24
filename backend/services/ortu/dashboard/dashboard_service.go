package dashboard

import (
	"context"
	"fmt"
	ortuDashRepo "tumbuhin-backend/repositories/ortu/dashboard"
)

// Service defines the business operations for the Orang Tua portal.
type Service interface {
	GetChildCard(ctx context.Context, magicToken string) (*ortuDashRepo.ChildGrowthCard, error)
}

type service struct {
	repo ortuDashRepo.Repository
}

// NewService instantiates a new Ortu dashboard service.
func NewService(repo ortuDashRepo.Repository) Service {
	return &service{repo: repo}
}

// GetChildCard retrieves the child growth card and enriches it with KBM analysis, projections, and empathetic parent explanations.
func (s *service) GetChildCard(ctx context.Context, magicToken string) (*ortuDashRepo.ChildGrowthCard, error) {
	card, err := s.repo.GetChildByMagicToken(ctx, magicToken)
	if err != nil {
		return nil, err
	}

	// 1. Determine KBM Target according to Buku KIA Kemenkes RI
	targetKBM := getKBMTarget(card.AgeMonths)
	card.TargetKBMGrams = targetKBM

	// 2. Evaluate KBM Achievement
	if card.DeltaWeightGrams >= targetKBM {
		card.IsKBMAchieved = true
	} else {
		card.IsKBMAchieved = false
	}

	// 3. Calculate Projected Next Month Target Weight
	projectedGrams := float64(targetKBM) / 1000.0
	card.NextMonthTargetKg = float64(int((card.LastWeightKg+projectedGrams)*100)) / 100.0

	// 4. Determine KMS Color Pita & Empathetic Explanation
	// Using WHO LMS indicators:
	// ZScoreHFA (TB/U), ZScoreWFA (BB/U), ZScoreWFH (BB/TB)
	if card.ZScoreHFA < -3.0 || card.ZScoreWFH < -3.0 || card.ZScoreWFA < -3.0 {
		card.ColorPita = "merah"
		card.FriendlyStatusTitle = "Perhatian Khusus: Perlu Pendampingan Gizi Intensif"
		card.FriendlyExplanation = fmt.Sprintf(
			"Kenaikan berat badan dan tinggi Ananda %s saat ini berada di bawah batas pita kuning KMS. Jangan panik atau cemas, Bidan Desa dan Kader Posyandu siap mendampingi Ayah/Ibu melalui program pemulihan gizi PMT desa.",
			card.ChildName,
		)
		card.DailyActionPoints = []string{
			"Tambahkan 1-2 butir telur ayam atau ikan segar pada setiap porsi makan harian.",
			"Pastikan anak menghabiskan makanan tambahan (PMT) pemulihan yang diberikan oleh Posyandu.",
			"Konsultasikan ke Puskesmas jika anak sedang demam, batuk, atau mengalami gangguan nafsu makan.",
		}
	} else if card.ZScoreHFA < -2.0 || card.ZScoreWFH < -2.0 || card.ZScoreWFA < -2.0 || !card.IsKBMAchieved {
		card.ColorPita = "kuning"
		card.FriendlyStatusTitle = "Waspada: Pertumbuhan Sedikit Melambat"
		card.FriendlyExplanation = fmt.Sprintf(
			"Berat badan Ananda %s bulan ini mengalami pelambatan kenaikan (selisih +%d gram, target KBM %d gram). Dengan sedikit penyesuaian porsi protein hewani dan jadwal makan teratur, Ananda dapat kembali ke pita hijau bulan depan.",
			card.ChildName, card.DeltaWeightGrams, card.TargetKBMGrams,
		)
		card.DailyActionPoints = []string{
			"Tingkatkan porsi protein hewani (ikan lele, hati ayam, atau telur) serta tambahkan 1 sdt minyak kelapa/santan hangat.",
			"Berikan camilan padat gizi di antara jam makan utama seperti buah pisang, alpukat, atau puding telur.",
			"Pantau kehadiran di Posyandu bulan depan untuk memastikan berat badan naik kembali mencapai pita hijau.",
		}
	} else {
		card.ColorPita = "hijau"
		card.FriendlyStatusTitle = "Pertumbuhan Optimal di Pita Hijau KMS"
		card.FriendlyExplanation = fmt.Sprintf(
			"Alhamdulillah, pertumbuhan berat dan tinggi badan Ananda %s bulan ini sangat baik dan berada di zona aman (Pita Hijau KMS). Pola makan dan perawatan yang Ayah/Ibu berikan sudah sangat tepat!",
			card.ChildName,
		)
		card.DailyActionPoints = []string{
			"Pertahankan menu MPASI bergizi seimbang dengan variasi lauk pauk lokal dan sayuran segar.",
			"Jaga kebersihan alat makan, biasakan mencuci tangan dengan sabun sebelum menyiapkan makanan si kecil.",
			"Tetap rutin hadir pada penimbangan Posyandu bulan depan untuk menjaga grafik pertumbuhan tetap optimal.",
		}
	}

	return card, nil
}

func getKBMTarget(ageMonths int) int {
	switch {
	case ageMonths == 1:
		return 800
	case ageMonths == 2:
		return 900
	case ageMonths == 3:
		return 800
	case ageMonths == 4:
		return 600
	case ageMonths == 5:
		return 500
	case ageMonths >= 6 && ageMonths <= 8:
		return 400
	case ageMonths >= 9 && ageMonths <= 11:
		return 300
	default:
		return 200
	}
}
