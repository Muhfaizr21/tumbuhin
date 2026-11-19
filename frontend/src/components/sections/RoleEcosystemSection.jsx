import { BarChart3, MapPin, Users } from 'lucide-react'
import { FOR_PRACTICE_CONTENT } from '../../constants/landingData'
import { SurgicalCheckIcon } from '../ui/LettersIcons'

export default function RoleEcosystemSection() {
  return (
    <section
      id="for-practice"
      className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-28"
    >
      {/* Centered Heading Block (Matches letters.app 'For-Practice' section) */}
      <div className="max-w-[640px] mx-auto text-center mb-14 sm:mb-16">
        <div className="letters-pill-tag mb-5">
          <Users aria-hidden="true" className="w-4 h-4 text-[#2597d0]" />
          <span>{FOR_PRACTICE_CONTENT.tag}</span>
        </div>

        <h2 className="font-runde font-semibold text-[32px] sm:text-[44px] leading-[1.10] tracking-[-0.04em] text-[#070709]">
          {FOR_PRACTICE_CONTENT.heading}
        </h2>
        <p className="mt-3 font-runde text-[16px] sm:text-[18px] leading-[1.45] text-[#60606c]">
          {FOR_PRACTICE_CONTENT.subtitle}
        </p>
      </div>

      {/* 3 Practice Cards (Matches letters.app Invite Practice / Onboarding Tooltips / Team Impact) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Kader Onboarding & Smart KMS OCR */}
        <article className="letters-cloud-card p-8 flex flex-col justify-between">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white border border-black/8 font-runde text-[12px] font-medium text-[#070709] mb-4">
              {FOR_PRACTICE_CONTENT.cards[0].badge}
            </span>
            <h3 className="font-runde font-semibold text-[24px] leading-[1.20] tracking-[-0.03em] text-[#070709]">
              {FOR_PRACTICE_CONTENT.cards[0].title}
            </h3>
            <p className="mt-2 font-runde text-[14px] leading-[1.48] text-[#60606c]">
              {FOR_PRACTICE_CONTENT.cards[0].description}
            </p>
          </div>

          {/* Embedded UI Tooltip Widget */}
          <div className="mt-8 rounded-[18px] bg-white p-5 border border-black/6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-[#d7e6f5] text-[#070709] font-runde font-semibold text-[12px] flex items-center justify-center">
                  KD
                </span>
                <div>
                  <p className="font-runde font-semibold text-[13px] text-[#070709]">
                    {FOR_PRACTICE_CONTENT.cards[0].metaTitle}
                  </p>
                  <p className="font-inter text-[11px] text-[#60606c]">
                    {FOR_PRACTICE_CONTENT.cards[0].metaRole}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#f2f9fd] text-[#2597d0] font-runde text-[11px] font-semibold">
                Aktif
              </span>
            </div>

            <div className="rounded-[12px] bg-[#f5f5f5] p-3.5 text-[12px] font-runde text-[#60606c] leading-snug">
              <strong className="font-semibold text-[#070709] block mb-0.5">
                Panduan Meja Timbang
              </strong>
              Pastikan posisi ukur terlentang untuk anak di bawah 24 bulan sebelum sistem
              menghitung koreksi panjang badan.
            </div>
          </div>
        </article>

        {/* Card 2: Bidan GIS Klaster RT/RW */}
        <article className="letters-cloud-card p-8 flex flex-col justify-between">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white border border-black/8 font-runde text-[12px] font-medium text-[#070709] mb-4">
              {FOR_PRACTICE_CONTENT.cards[1].badge}
            </span>
            <h3 className="font-runde font-semibold text-[24px] leading-[1.20] tracking-[-0.03em] text-[#070709]">
              {FOR_PRACTICE_CONTENT.cards[1].title}
            </h3>
            <p className="mt-2 font-runde text-[14px] leading-[1.48] text-[#60606c]">
              {FOR_PRACTICE_CONTENT.cards[1].description}
            </p>
          </div>

          {/* Embedded GIS Cluster Widget */}
          <div className="mt-8 rounded-[18px] bg-white p-5 border border-black/6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-runde font-semibold text-[13px] text-[#070709]">
                <MapPin aria-hidden="true" className="w-4 h-4 text-[#2597d0]" />
                <span>Peta Klaster Desa</span>
              </span>
              <span className="font-inter text-[11px] text-[#60606c]">Leaflet GIS</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-[10px] bg-[#f5f5f5] text-[12px] font-runde">
                <span className="font-medium text-[#070709]">RW 04 • Posyandu Melati</span>
                <span className="font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full text-[11px]">
                  2 Prioritas Kunjungan
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-[10px] bg-[#f5f5f5] text-[12px] font-runde">
                <span className="font-medium text-[#070709]">RW 02 • Posyandu Dahlia</span>
                <span className="font-semibold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                  Terkendali (Gizi Baik)
                </span>
              </div>
            </div>
          </div>
        </article>

        {/* Card 3: Puskesmas Impact & Export */}
        <article className="letters-cloud-card p-8 flex flex-col justify-between">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white border border-black/8 font-runde text-[12px] font-medium text-[#070709] mb-4">
              {FOR_PRACTICE_CONTENT.cards[2].badge}
            </span>
            <h3 className="font-runde font-semibold text-[24px] leading-[1.20] tracking-[-0.03em] text-[#070709]">
              {FOR_PRACTICE_CONTENT.cards[2].title}
            </h3>
            <p className="mt-2 font-runde text-[14px] leading-[1.48] text-[#60606c]">
              {FOR_PRACTICE_CONTENT.cards[2].description}
            </p>
          </div>

          {/* Embedded Team Impact Widget */}
          <div className="mt-8 rounded-[18px] bg-white p-5 border border-black/6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-runde font-semibold text-[13px] text-[#070709]">
                <BarChart3 aria-hidden="true" className="w-4 h-4 text-[#2597d0]" />
                <span>{FOR_PRACTICE_CONTENT.cards[2].metaTitle}</span>
              </span>
              <span className="font-inter text-[11px] text-[#2597d0] font-medium">
                {FOR_PRACTICE_CONTENT.cards[2].metaRole}
              </span>
            </div>

            <ul className="space-y-1.5 text-[12px] font-runde text-[#60606c]">
              <li className="flex items-center gap-2">
                <SurgicalCheckIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Standar indeks BB/U, TB/U, BB/TB Permenkes 2/2020</span>
              </li>
              <li className="flex items-center gap-2">
                <SurgicalCheckIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Riwayat distribusi PMT & catatan klinis bidan</span>
              </li>
            </ul>
          </div>
        </article>
      </div>
    </section>
  )
}
