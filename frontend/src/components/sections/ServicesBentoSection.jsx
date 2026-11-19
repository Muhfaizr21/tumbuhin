import {
  Activity,
  ArrowUpRight,
  MapPin,
  ScanLine,
  Sparkles,
  TrendingUp,
  Utensils,
  WifiOff,
} from 'lucide-react'
import { BENTO_SERVICES } from '../../constants/landingData'

const ICON_MAP = {
  Activity,
  TrendingUp,
  Utensils,
  ScanLine,
  MapPin,
}

function ServiceCard({ item }) {
  const IconComponent = ICON_MAP[item.iconName] || Activity

  return (
    <div className="a11y-card group relative bg-white rounded-[28px] p-6 flex flex-col justify-between min-h-[265px] shadow-[0_14px_35px_-12px_rgba(18,45,105,0.06)] border border-white hover:border-[#1E6BFF]/40 transition-all duration-300 hover:-translate-y-1">
      <div>
        {/* Giant Outlined Number (01, 02, 03...) */}
        <div className="outline-number text-5xl sm:text-[54px] font-bold mb-4">
          {item.number}
        </div>

        {/* Icon + Service Title */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <span className="w-7 h-7 rounded-lg bg-[#EBF2FF] text-[#1E6BFF] flex items-center justify-center shrink-0 group-hover:bg-[#1E6BFF] group-hover:text-white transition-colors">
            <IconComponent className="w-4 h-4" />
          </span>
          <h3 className="font-display font-bold text-base text-[#0B1426] leading-snug">
            {item.title}
          </h3>
        </div>

        {/* Service Description */}
        <p className="text-xs text-[#5B677D] leading-relaxed pl-9">
          {item.description}
        </p>
      </div>

      {/* Bottom Action Bar (Make an appointment | Price equivalent) */}
      <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <a
          href={item.actionHref}
          className="font-semibold text-[#1E6BFF] hover:text-[#0A47CC] underline underline-offset-4 decoration-[#1E6BFF]/40 hover:decoration-[#1E6BFF] transition-colors"
        >
          {item.actionLabel}
        </a>
        <span className="font-medium text-[#7A88A1] text-[11px]">{item.badge}</span>
      </div>
    </div>
  )
}

export default function ServicesBentoSection() {
  const [card01, card02, card03, card04, card05] = BENTO_SERVICES

  return (
    <section id="layanan" className="max-w-7xl mx-auto px-3 sm:px-6 mt-10 sm:mt-14">
      {/* Section Header Row (Matches Reference Layout) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2 mb-7">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1426] leading-[1.08]">
            Layanan & modul
            <br />
            <span>kecerdasan gizi </span>
            <span className="text-sm sm:text-base font-normal text-[#8A97AD] tracking-normal">
              {'{ Apa yang Anda dapatkan }'}
            </span>
          </h2>
        </div>

        <div className="max-w-md flex flex-col sm:items-end text-left sm:text-right">
          <p className="text-xs sm:text-[13px] text-[#5B677D] leading-relaxed">
            Kami menyediakan rangkaian solusi terintegrasi — mulai dari kalkulasi
            antropometri klinis, prediksi risiko ML, hingga resep RAG Kemenkes.
          </p>
          <a
            href="#simulasi"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1E6BFF] hover:text-[#0A47CC] underline underline-offset-4"
          >
            <span>Lihat simulasi interaktif</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 4-Column Asymmetric Bento Grid (Exact Reference Proportions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Row 1, Col 1: Service 01 */}
        <ServiceCard item={card01} />

        {/* Row 1, Col 2: Signature Blue Brand Accent Card with 3D Molecular Spheres */}
        <div className="relative rounded-[28px] bg-gradient-to-br from-[#2774FF] via-[#185EF2] to-[#0A3FB3] p-6 text-white flex flex-col justify-between min-h-[265px] overflow-hidden shadow-[0_18px_40px_-10px_rgba(24,94,242,0.45)]">
          {/* Decorative 3D Glossy Spheres (Matching Reference Blue Card) */}
          <div
            aria-hidden="true"
            className="orb-3d absolute -bottom-8 -right-6 w-28 h-28 rounded-full opacity-90"
          />
          <div
            aria-hidden="true"
            className="orb-3d absolute bottom-16 right-16 w-12 h-12 rounded-full opacity-80"
          />
          <div
            aria-hidden="true"
            className="orb-3d absolute bottom-6 right-28 w-7 h-7 rounded-full opacity-75"
          />
          <div
            aria-hidden="true"
            className="orb-3d absolute top-10 right-6 w-5 h-5 rounded-full opacity-60"
          />

          <div className="relative z-10">
            <p className="font-display text-2xl font-bold tracking-tight text-white/85">
              SigapGizi
            </p>
            <p className="mt-3 text-xs text-blue-100/90 leading-relaxed max-w-[220px]">
              Setiap angka penimbangan diolah melalui 4 lapisan validasi medis agar
              intervensi gizi desa tepat sasaran, transparan, dan bebas kompromi.
            </p>
          </div>

          <div className="relative z-10 mt-6 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-semibold text-white border border-white/20">
              <Sparkles className="w-3 h-3" />
              SDG 3 • Good Health
            </span>
          </div>
        </div>

        {/* Row 1, Col 3: Service 02 */}
        <ServiceCard item={card02} />

        {/* Row 1, Col 4: Service 03 */}
        <ServiceCard item={card03} />

        {/* Row 2, Col 1: Service 04 */}
        <ServiceCard item={card04} />

        {/* Row 2, Col 2: Service 05 */}
        <ServiceCard item={card05} />

        {/* Row 2, Col 3-4 (Span 2 Columns): Visual Consultation & Offline-First PWA Showcase */}
        <div className="lg:col-span-2 relative rounded-[28px] bg-[#0B1426] overflow-hidden min-h-[265px] shadow-[0_14px_35px_-12px_rgba(18,45,105,0.12)] group">
          <img
            src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80"
            alt="Pelayanan Posyandu Digital bersama Ibu dan Balita"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-75 group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1426]/90 via-[#0B1426]/55 to-transparent" />

          <div className="relative z-10 h-full p-6 sm:p-7 flex flex-col justify-between text-white max-w-md">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-emerald-300 mb-3">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Modul F • Offline-First PWA & Magic Link</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold leading-snug">
                Tetap Beroperasi di Pelosok Desa Tanpa Sinyal Internet
              </h3>
              <p className="mt-2 text-xs text-slate-200/90 leading-relaxed">
                Antrean penimbangan tersimpan otomatis di <code className="text-emerald-300">IndexedDB</code> dan
                tersinkronisasi ke server Golang saat koneksi kembali stabil, lengkap dengan
                kartu gizi WhatsApp Magic Link untuk orang tua.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <a
                href="#simulasi"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E6BFF] hover:bg-[#2674FF] text-white text-xs font-semibold transition-all shadow-md"
              >
                <span>Coba Demo Posyandu</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <span className="text-[11px] text-slate-300 font-medium">
                • Text-to-Speech Bahasa Indonesia
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
