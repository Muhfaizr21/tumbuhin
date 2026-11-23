import { parseKmsText } from './src/lib/kmsOcr.js'

const sample = `KMS BALITA
Bulan/Tahun Usia BB(kg) TB(cm)
Jan 2026 12 8.5 74.0
Feb 2026 13 8,7 75,2
Mar 2026 14 8.8 76.5
Apr 2026 15 9.0 77.1`

console.log(JSON.stringify(parseKmsText(sample), null, 2))
