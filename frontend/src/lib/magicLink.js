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

export function buildWhatsAppMessage(balita, magicLink) {
  const parentName = balita?.nama_ibu || balita?.namaOrtu || 'Orang Tua'
  const status = balita?.status_gizi || balita?.statusGizi || 'Normal'
  const weight = Number(balita?.berat_terakhir || 0) > 0
    ? `${Number(balita.berat_terakhir).toFixed(1)} kg`
    : 'sesuai kurva KMS'
  const height = Number(balita?.tinggi_terakhir || 0) > 0
    ? `${Number(balita.tinggi_terakhir).toFixed(1)} cm`
    : '-'
  const date = balita?.tanggal_timbang ? ` (${balita.tanggal_timbang})` : ''
  const note = balita?.catatan_bidan || balita?.catatanBidan || 'Pertumbuhan terpantau baik.'

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
