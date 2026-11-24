import { createWorker } from 'tesseract.js'

// Pola baris KMS: "Jan 2026 12 8.5 74.0" atau "Jan 2026 12 8,5 74,0"
const ROW_PATTERN = /([A-Za-z]{3,9})\s*'?(\d{2,4})?\s+(\d{1,2})\s+(\d{1,2}[.,]\d{1,2})\s+(\d{2,3}[.,]\d{1,2})/gi

const MONTH_MAP = {
  jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', mei: 'Mei', jun: 'Jun',
  jul: 'Jul', agu: 'Agu', ags: 'Agu', sep: 'Sep', okt: 'Okt', nov: 'Nov', des: 'Des',
  januari: 'Jan', februari: 'Feb', maret: 'Mar', april: 'Apr', juni: 'Jun',
  juli: 'Jul', agustus: 'Agu', september: 'Sep', oktober: 'Okt', november: 'Nov', desember: 'Des',
}

function toNumber(value) {
  return parseFloat(String(value).replace(',', '.'))
}

function normalizeMonth(raw) {
  const key = String(raw).toLowerCase().slice(0, 3)
  return MONTH_MAP[key] || raw
}

function buildDate(monthRaw, yearRaw) {
  const month = normalizeMonth(monthRaw)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const monthIndex = Math.max(0, monthNames.indexOf(month))
  const year = yearRaw && Number(yearRaw) > 2000 ? Number(yearRaw) : new Date().getFullYear()
  const mm = String(monthIndex + 1).padStart(2, '0')
  return `${year}-${mm}-15`
}

// Parsing hasil OCR menjadi baris pengukuran
export function parseKmsText(text) {
  const rows = []
  let match
  while ((match = ROW_PATTERN.exec(text)) !== null) {
    const [, monthRaw, yearRaw, ageRaw, weightRaw, heightRaw] = match
    rows.push({
      bulan: `${normalizeMonth(monthRaw)}${yearRaw ? ` ${yearRaw}` : ''}`,
      tanggal: buildDate(monthRaw, yearRaw),
      usia: parseInt(ageRaw, 10),
      berat: toNumber(weightRaw),
      tinggi: toNumber(heightRaw),
    })
  }
  return rows
}

export async function recognizeKmsImage(imageElement, onProgress) {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })

  try {
    const { data } = await worker.recognize(imageElement)
    return { text: data.text, rows: parseKmsText(data.text) }
  } finally {
    await worker.terminate()
  }
}
