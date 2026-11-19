import { BRAND_INFO, NAV_LINKS } from '../../constants/landingData'
import { SurgicalEnvelopeIcon } from '../ui/LettersIcons'

const CURRENT_YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="w-full pt-10">
      {/* Last-CTA Atmospheric Sky Cloud Section with Multi-Device Preview (Matches letters.app Last-CTA) */}
      <div className="w-full px-2.5 sm:px-3">
        <div className="letters-sky-hero relative w-full rounded-[36px] sm:rounded-[48px] pt-20 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden flex flex-col items-center text-center">
          {/* Cloud Atmospheric Overlay from letters.app */}
          <img
            src="/letters/AWpFQZVt9LgBCWegzj8BjzNbFMI.webp"
            alt=""
            width={3109}
            height={1696}
            loading="lazy"
            className="absolute inset-x-0 bottom-0 w-full h-auto object-cover opacity-55 pointer-events-none select-none"
          />

          <div className="relative z-10 max-w-[680px] mx-auto flex flex-col items-center gap-6">
            <h2 className="font-runde font-semibold text-[40px] sm:text-[56px] lg:text-[64px] leading-[0.94] tracking-[-0.04em] text-white">
              Mulai dari meja Posyandu,
              <br />
              terhubung ke Puskesmas
            </h2>
            <p className="font-runde text-[16px] sm:text-[18px] leading-[1.45] text-white/95 max-w-[500px]">
              Hitung Z-Score dengan ketelitian standar WHO LMS dan susun resep MPASI
              pangan lokal Kemenkes dalam hitungan detik.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#letters"
                className="letters-pill-btn min-h-[48px] inline-flex items-center justify-center px-7 py-3.5 text-[15px]"
              >
                Coba Simulasi Sekarang
              </a>
              <a
                href="http://localhost:8080/api/v1/health"
                target="_blank"
                rel="noreferrer"
                className="min-h-[48px] inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-white/90 hover:bg-white text-[#070709] font-runde font-medium text-[14px] transition-colors"
              >
                Status API Golang
              </a>
            </div>
          </div>

          {/* Multi-Device Product Preview (Scraped from letters.app Last-CTA) */}
          <div className="relative z-10 mt-12 sm:mt-16 max-w-[820px] w-full mx-auto flex items-end justify-center gap-4 sm:gap-6 px-4">
            <div className="w-1/2 sm:w-5/12">
              <img
                src="/letters/kZTcFdYZoCpXkqrX7IpAsdVPQ4.webp"
                alt="Pratinjau antarmuka tablet SigapGizi"
                width={1684}
                height={1337}
                loading="lazy"
                className="w-full h-auto object-contain drop-shadow-xl"
              />
            </div>
            <div className="w-1/2 sm:w-6/12">
              <img
                src="/letters/pBWOqpZ9ZeyR8aI9MXLjgMHDLiY.webp"
                alt="Pratinjau antarmuka desktop dan seluler SigapGizi"
                width={2438}
                height={2308}
                loading="lazy"
                className="w-full h-auto object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Monochrome Clean Footer (Matches letters.app Footer 2) */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-16 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-black/8">
          <div className="md:col-span-5">
            <a href="#top" className="inline-flex items-center gap-2.5 mb-3">
              <span className="w-8 h-8 rounded-[10px] bg-[#f5f5f5] border border-black/10 flex items-center justify-center">
                <SurgicalEnvelopeIcon className="w-4 h-4" />
              </span>
              <span className="font-runde font-semibold text-[18px] tracking-[-0.02em] text-[#070709]">
                {BRAND_INFO.name}
              </span>
            </a>
            <p className="font-runde text-[14px] leading-[1.48] text-[#60606c] max-w-sm">
              Platform Smart Posyandu & Stunting Early-Warning System berbasis React Vite
              PWA, Golang Clean Code MVC, PostgreSQL pgvector, dan Google Gemini Multimodal.
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="font-runde font-semibold text-[14px] text-[#070709] mb-3">
              Navigasi Sistem
            </p>
            <ul className="space-y-2">
              {NAV_LINKS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="font-inter text-[14px] text-[#60606c] hover:text-[#070709] transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="font-runde font-semibold text-[14px] text-[#070709] mb-3">
              Standar Klinis & Regulasi
            </p>
            <ul className="space-y-2 font-inter text-[13.5px] text-[#60606c]">
              <li>Permenkes RI No. 2 Tahun 2020 (Antropometri Anak)</li>
              <li>WHO Multicentre Growth Reference Study (Metode LMS)</li>
              <li>Pedoman Pemberian MPASI Pangan Lokal Kemenkes RI</li>
              <li>Enkripsi Satu Arah NIK Balita (SHA-256 Hash)</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 font-inter text-[13px] text-[#8b8b8b]">
          <p>
            &copy; {CURRENT_YEAR} {BRAND_INFO.name} ({BRAND_INFO.parentBrand}). Seluruh hak
            cipta dilindungi.
          </p>
          <p>Dirancang untuk Posyandu & Tenaga Gizi Indonesia (SDG 3)</p>
        </div>
      </div>
    </footer>
  )
}
