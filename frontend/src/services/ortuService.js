const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

const CACHE_KEY_PREFIX = 'sigapgizi_ortu_cache_'

/**
 * Fetch child growth card by magic token with automatic localStorage caching.
 * If offline or fetch fails, it transparently recovers from local cache.
 */
export async function getChildPortalByToken(magicToken) {
  const token = magicToken?.trim() || 'magic-balita-andi-2026-tumbuhin-sehat'
  const cacheKey = `${CACHE_KEY_PREFIX}${token}`

  try {
    const res = await fetch(`${API_BASE_URL}/public/child/${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      if (res.status === 404) {
        // Check if there is cache before giving up
        const cached = getLocalCachedCard(token)
        if (cached) {
          return { data: cached.data, isOffline: true, cachedAt: cached.cachedAt }
        }
        throw new Error('NOT_FOUND')
      }
      throw new Error(`HTTP_${res.status}`)
    }

    const json = await res.json()
    if (json.success && json.data) {
      // Save to localStorage cache
      saveLocalCachedCard(token, json.data)
      return { data: json.data, isOffline: false }
    }

    throw new Error(json.message || 'Gagal memproses data')
  } catch (err) {
    // Try offline fallback from cache
    const cached = getLocalCachedCard(token)
    if (cached) {
      return { data: cached.data, isOffline: true, cachedAt: cached.cachedAt }
    }

    // If completely offline and no cache, fallback to smart offline mock for demo tokens
    if (token === 'magic-balita-andi-2026-tumbuhin-sehat' || token === 'magic-balita-siti-2026-tumbuhin-pantau') {
      const fallback = generateOfflineFallback(token)
      saveLocalCachedCard(token, fallback)
      return { data: fallback, isOffline: true, cachedAt: new Date().toISOString() }
    }

    throw err
  }
}

export function getLocalCachedCard(token) {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${token}`)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveLocalCachedCard(token, data) {
  if (typeof window === 'undefined') return
  try {
    const payload = {
      data,
      cachedAt: new Date().toISOString(),
    }
    localStorage.setItem(`${CACHE_KEY_PREFIX}${token}`, JSON.stringify(payload))
  } catch (e) {
    console.warn('Gagal menyimpan cache offline:', e)
  }
}

function generateOfflineFallback(token) {
  const isSiti = token.includes('siti')
  if (isSiti) {
    return {
      child_id: 'offline-siti-002',
      child_name: 'Siti Nurhaliza',
      masked_nik: '3201-****-****-2003',
      gender: 'P',
      birth_date: '15 Mei 2025',
      age_months: 18,
      parent_name: 'Aminah Zahra',
      parent_phone: '081377881122',
      posyandu_name: 'Posyandu Melati 04',
      village_name: 'Desa Sukamaju',
      magic_token: token,
      last_measured_date: '18 November 2026',
      last_weight_kg: 8.8,
      last_height_cm: 77.2,
      last_head_circum_cm: 45.2,
      zscore_wfa: -2.35,
      zscore_hfa: -2.4,
      zscore_wfh: -1.85,
      nutrition_status: 'berisiko',
      color_pita: 'kuning',
      delta_weight_grams: 100,
      target_kbm_grams: 200,
      is_kbm_achieved: false,
      next_month_target_kg: 9.0,
      friendly_status_title: 'Waspada: Kenaikan Berat Badan Perlu Didorong',
      friendly_explanation: 'Kenaikan berat badan Ananda Siti bulan ini mengalami perlambatan (+100 gram dari target KBM 200 gram). Diikutsertakan dalam PMT pemulihan lokal desa untuk mendongkrak status gizi kembali ke pita hijau.',
      daily_action_points: [
        'Pastikan porsi PMT pemulihan habis setiap hari bersama sayur dan lauk pauk segar.',
        'Tambahkan 1 butir telur puyuh atau ayam rebus di antara waktu makan utama.',
        'Tetap hadir pada jadwal evaluasi posyandu dan kunjungan rumah Bidan desa.'
      ],
      historical_measurements: [
        { age_months: 13, measured_at: '18 Juni 2026', weight_kg: 8.4, height_cm: 73.0, head_circum_cm: 44.5, zscore_wfa: -1.8, zscore_hfa: -1.9, zscore_wfh: -1.4, nutrition_status: 'berisiko', kbm_status: 'N' },
        { age_months: 14, measured_at: '18 Juli 2026', weight_kg: 8.5, height_cm: 74.0, head_circum_cm: 44.8, zscore_wfa: -1.9, zscore_hfa: -2.0, zscore_wfh: -1.5, nutrition_status: 'berisiko', kbm_status: 'T' },
        { age_months: 15, measured_at: '18 Agustus 2026', weight_kg: 8.6, height_cm: 75.0, head_circum_cm: 45.0, zscore_wfa: -2.0, zscore_hfa: -2.1, zscore_wfh: -1.6, nutrition_status: 'berisiko', kbm_status: 'T' },
        { age_months: 16, measured_at: '18 September 2026', weight_kg: 8.65, height_cm: 75.8, head_circum_cm: 45.0, zscore_wfa: -2.2, zscore_hfa: -2.2, zscore_wfh: -1.7, nutrition_status: 'berisiko', kbm_status: 'T' },
        { age_months: 17, measured_at: '18 Oktober 2026', weight_kg: 8.7, height_cm: 76.5, head_circum_cm: 45.1, zscore_wfa: -2.3, zscore_hfa: -2.3, zscore_wfh: -1.8, nutrition_status: 'berisiko', kbm_status: 'T' },
        { age_months: 18, measured_at: '18 November 2026', weight_kg: 8.8, height_cm: 77.2, head_circum_cm: 45.2, zscore_wfa: -2.35, zscore_hfa: -2.4, zscore_wfh: -1.85, nutrition_status: 'berisiko', kbm_status: 'T' }
      ],
      mpasi_recipe: {
        title: 'Bubur Singkong Ayam Cincang & Telur Puyuh Padat Kalori',
        target_age_range: '12-23 Bulan',
        texture: 'Cincang Lembek Padat Energi',
        daily_budget_idr: 14500,
        calories_kcal: 320,
        animal_protein_grams: 15.5,
        ingredients: [
          { name: 'Daging Ayam Cincang', amount: '50 gram', category: 'Protein Hewani', estimated_price: 5000 },
          { name: 'Telur Puyuh Rebus', amount: '3 butir', category: 'Protein Hewani', estimated_price: 3000 },
          { name: 'Singkong Manis Parut / Nasi', amount: '4 sdm makan', category: 'Karbohidrat Padat', estimated_price: 2000 },
          { name: 'Wortel & Buncis Cincang', amount: '2 sdm makan', category: 'Sayur & Vitamin', estimated_price: 1500 },
          { name: 'Santan Kelapa Kental', amount: '2 sdm makan', category: 'Lemak Tambahan', estimated_price: 1500 }
        ],
        cooking_steps: [
          'Tumis daging ayam cincang dengan sedikit minyak hingga berubah warna matang.',
          'Rebus singkong parut bersama kaldu ayam hingga empuk dan bertekstur kental padat energi.',
          'Masukkan tumisan ayam, cincangan wortel, dan buncis ke dalam bubur singkong.',
          'Tambahkan santan kental, aduk perlahan di atas api kecil hingga matang merata dan harum.',
          'Belah telur puyuh rebus dan tata di atas bubur saat disajikan.'
        ],
        serving_tips: 'Berikan dengan suasana menyenangkan tanpa paksaan 3-4 kali sehari.',
        kemenkes_citation: 'Petunjuk Teknis PMT Berbahan Pangan Lokal Balita Gizi Kurang Kemenkes RI.'
      },
      bidan_note: {
        bidan_name: 'Bidan Rina Kartika, A.Md.Keb',
        visit_date: '18 November 2026',
        visit_status: 'FOLLOW_UP',
        clinical_note: 'Kenaikan berat badan Ananda Siti melambat. Diikutsertakan dalam PMT pemulihan lokal desa dengan kepatuhan konsumsi 88%. Tetap semangat!',
        soap_plan: 'Daftarkan program PMT pemulihan 90 hari desa dan jadwalkan evaluasi rutin.',
        pmt_given: true,
        pmt_type: 'PMT Pemulihan Pangan Lokal 90 Hari',
        pmt_day_progress: 28,
        pmt_total_days: 90,
        compliance_percent: 88.0,
        follow_up_date: '02 Desember 2026'
      },
      next_posyandu: {
        posyandu_name: 'Posyandu Melati 04',
        village_name: 'Desa Sukamaju',
        rw_code: '004',
        rt_code: '003',
        activity_date: '12 Desember 2026',
        time_range: '08.30 - 11.30 WIB',
        location: 'Balai RW 04, Desa Sukamaju',
        days_remaining: 18,
        special_reminder: 'Bawa Buku KIA fisik dan pastikan si kecil sarapan sebelum berangkat posyandu.'
      }
    }
  }

  // Andi Pratama (Normal / Hijau)
  return {
    child_id: 'offline-andi-001',
    child_name: 'Andi Pratama',
    masked_nik: '3201-****-****-1002',
    gender: 'L',
    birth_date: '12 September 2025',
    age_months: 14,
    parent_name: 'Dewi Lestari',
    parent_phone: '081288990044',
    posyandu_name: 'Posyandu Melati 04',
    village_name: 'Desa Sukamaju',
    magic_token: token,
    last_measured_date: '19 November 2026',
    last_weight_kg: 9.8,
    last_height_cm: 76.5,
    last_head_circum_cm: 46.5,
    zscore_wfa: -0.42,
    zscore_hfa: -0.85,
    zscore_wfh: -0.21,
    nutrition_status: 'normal',
    color_pita: 'hijau',
    delta_weight_grams: 450,
    target_kbm_grams: 200,
    is_kbm_achieved: true,
    next_month_target_kg: 10.0,
    friendly_status_title: 'Pertumbuhan Optimal di Pita Hijau KMS',
    friendly_explanation: 'Alhamdulillah, pertumbuhan berat dan tinggi badan Ananda Andi bulan ini sangat baik dan berada di zona aman (Pita Hijau KMS). Pola asuh dan makanan yang diberikan sudah sangat tepat!',
    daily_action_points: [
      'Pertahankan menu MPASI kaya protein hewani telur dan ikan lele lokal.',
      'Jaga kebersihan alat makan dan biasakan cuci tangan pakai sabun.',
      'Tetap rutin hadir pada penimbangan Posyandu bulan depan untuk memantau grafik tumbuh kembangnya.'
    ],
    historical_measurements: [
      { age_months: 9, measured_at: '19 Juni 2026', weight_kg: 8.6, height_cm: 71.0, head_circum_cm: 45.0, zscore_wfa: -0.5, zscore_hfa: -0.9, zscore_wfh: -0.3, nutrition_status: 'normal', kbm_status: 'N' },
      { age_months: 10, measured_at: '19 Juli 2026', weight_kg: 8.9, height_cm: 72.5, head_circum_cm: 45.5, zscore_wfa: -0.4, zscore_hfa: -0.8, zscore_wfh: -0.2, nutrition_status: 'normal', kbm_status: 'N' },
      { age_months: 11, measured_at: '19 Agustus 2026', weight_kg: 9.1, height_cm: 73.8, head_circum_cm: 45.8, zscore_wfa: -0.5, zscore_hfa: -0.9, zscore_wfh: -0.3, nutrition_status: 'normal', kbm_status: 'T' },
      { age_months: 12, measured_at: '19 September 2026', weight_kg: 9.3, height_cm: 74.8, head_circum_cm: 46.0, zscore_wfa: -0.4, zscore_hfa: -0.8, zscore_wfh: -0.2, nutrition_status: 'normal', kbm_status: 'N' },
      { age_months: 13, measured_at: '19 Oktober 2026', weight_kg: 9.35, height_cm: 75.6, head_circum_cm: 46.2, zscore_wfa: -0.5, zscore_hfa: -0.9, zscore_wfh: -0.3, nutrition_status: 'normal', kbm_status: 'T' },
      { age_months: 14, measured_at: '19 November 2026', weight_kg: 9.8, height_cm: 76.5, head_circum_cm: 46.5, zscore_wfa: -0.42, zscore_hfa: -0.85, zscore_wfh: -0.21, nutrition_status: 'normal', kbm_status: 'N' }
    ],
    mpasi_recipe: {
      title: 'Nasi Tim Ikan Lele & Sayur Bening Daun Kelor',
      target_age_range: '12-23 Bulan',
      texture: 'Makanan Keluarga (Cincang Kasar)',
      daily_budget_idr: 13500,
      calories_kcal: 285,
      animal_protein_grams: 14.0,
      ingredients: [
        { name: 'Ikan Lele Segar Desa', amount: '1 ekor sedang (50 gr fillet)', category: 'Protein Hewani', estimated_price: 4500 },
        { name: 'Telur Ayam Negeri', amount: '1 butir', category: 'Protein Hewani', estimated_price: 2500 },
        { name: 'Beras Putih Pulen', amount: '4 sdm makan', category: 'Karbohidrat', estimated_price: 2000 },
        { name: 'Pucuk Daun Kelor Segar', amount: '1 genggam kecil', category: 'Sayur & Zat Besi', estimated_price: 1000 },
        { name: 'Bawang Merah & Putih', amount: '2 siung (iris halus)', category: 'Bumbu Alami', estimated_price: 500 },
        { name: 'Minyak Kelapa Sehat', amount: '1 sdm', category: 'Lemak Sehat', estimated_price: 1000 }
      ],
      cooking_steps: [
        'Kukus ikan lele segar hingga empuk, lalu pisahkan daging lembut dari duri dan kulitnya.',
        'Tumis irisan bawang merah dan bawang putih cincang hingga harum dengan minyak kelapa.',
        'Masukkan telur ayam, buat orak-arik hingga setengah matang, lalu campurkan suwiran ikan lele.',
        'Tambahkan nasi aron dan air kaldu lele secukupnya, masak dalam panci tim hingga air meresap.',
        'Masukkan pucuk daun kelor segar di menit terakhir agar vitamin dan zat besi tetap terjaga.',
        'Angkat dan sajikan hangat dalam mangkuk si kecil.'
      ],
      serving_tips: 'Sajikan selagi hangat 3 kali sehari. Berikan camilan buah pepaya matang di sela jam makan.',
      kemenkes_citation: 'Buku KIA Kemenkes RI 2020: Standar Pemenuhan Gizi Balita Berbasis Pangan Lokal.'
    },
    bidan_note: {
      bidan_name: 'Bidan Rina Kartika, A.Md.Keb',
      visit_date: '19 November 2026',
      visit_status: 'COMPLETED',
      clinical_note: 'Pertumbuhan tinggi dan berat badan Ananda Andi sangat baik bulan ini. Pertahankan pemberian menu MPASI kaya protein hewani.',
      soap_plan: 'Pertahankan variasi protein hewani dan jaga pola asuh positif.',
      pmt_given: false,
      pmt_type: 'Pangan Lokal Sehat',
      pmt_day_progress: 0,
      pmt_total_days: 90,
      compliance_percent: 100.0,
      follow_up_date: '12 Desember 2026'
    },
    next_posyandu: {
      posyandu_name: 'Posyandu Melati 04',
      village_name: 'Desa Sukamaju',
      rw_code: '004',
      rt_code: '002',
      activity_date: '12 Desember 2026',
      time_range: '08.30 - 11.30 WIB',
      location: 'Balai RW 04, Desa Sukamaju',
      days_remaining: 18,
      special_reminder: 'Bawa Buku KIA fisik dan pastikan si kecil sarapan sebelum berangkat posyandu.'
    }
  }
}
