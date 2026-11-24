export function buildMagicLink(magicToken) {
  if (!magicToken) return ''
  const base = import.meta.env.VITE_PUBLIC_APP_URL
    ? import.meta.env.VITE_PUBLIC_APP_URL.replace(/\/+$/, '')
    : `${window.location.origin}/#`
  return `${base}/p/${encodeURIComponent(magicToken)}`
}

export function normalizeWhatsAppNumber(raw) {
  const digits = String(raw || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

export function buildWhatsAppMessage(balita, magicLink, customTemplate = '') {
  const parentName = balita?.nama_ibu || balita?.namaOrtu || 'Orang Tua'
  const status = balita?.status_gizi || balita?.statusGizi || 'Normal'
  const weightNum = Number(balita?.berat_terakhir || 0)
  const heightNum = Number(balita?.tinggi_terakhir || 0)
  const weight = weightNum > 0 ? `${weightNum.toFixed(1)} kg` : 'sesuai kurva KMS'
  const height = heightNum > 0 ? `${heightNum.toFixed(1)} cm` : '-'
  const date = balita?.tanggal_timbang ? ` (${balita.tanggal_timbang})` : ''
  const note = balita?.catatan_bidan || balita?.catatanBidan || 'Pertumbuhan terpantau baik.'

  if (customTemplate && customTemplate.trim()) {
    return customTemplate
      .replace(/\{parent_name\}/g, parentName)
      .replace(/\{child_name\}/g, balita?.nama || 'Ananda')
      .replace(/\{weight_kg\}/g, weightNum > 0 ? weightNum.toFixed(1) : '-')
      .replace(/\{height_cm\}/g, heightNum > 0 ? heightNum.toFixed(1) : '-')
      .replace(/\{nutrition_status\}/g, status)
      .replace(/\{magic_link\}/g, magicLink)
  }

  return [
    `Halo Ibu ${parentName}, berikut ringkasan hasil posyandu *${balita?.nama || 'Ananda'}*${date}:`,
    '',
    `• Status Gizi: *${status}*`,
    `• Berat Badan: *${weight}*`,
    `• Tinggi Badan: *${height}*`,
    `• Catatan: *${note}*`,
    '',
    'Buka Kartu Gizi Digital & Resep MPASI pribadi tanpa login melalui tautan berikut:',
    magicLink,
  ].join('\n')
}
