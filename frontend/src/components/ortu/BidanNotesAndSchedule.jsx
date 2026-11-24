import React from 'react'
import {
  Stethoscope,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  BookOpen,
  Activity
} from 'lucide-react'

export default function BidanNotesAndSchedule({ bidanNote, nextPosyandu, isHighContrast, childName }) {
  const pmtActive = bidanNote?.pmt_given || (bidanNote?.pmt_day_progress && bidanNote?.pmt_day_progress > 0)
  const pmtPercent = bidanNote?.pmt_total_days
    ? Math.min(100, Math.round(((bidanNote.pmt_day_progress || 0) / bidanNote.pmt_total_days) * 100))
    : 0

  return (
    <div className="space-y-6">
      {/* 1. Catatan & Pesan Personal Bidan Desa */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border transition-all ${
          isHighContrast
            ? 'bg-black text-white border-white'
            : 'bg-white text-[#070709] border-black/8 shadow-2xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#2597d0]/10 text-[#2597d0] border border-[#2597d0]/20 flex items-center justify-center font-bold shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#2597d0] uppercase tracking-wider block font-runde">
                Catatan Bidan Desa
              </span>
              <h3 className="font-semibold text-base text-[#070709] font-runde">
                {bidanNote?.bidan_name || 'Bidan Rina Kartika, A.Md.Keb'}
              </h3>
            </div>
          </div>

          <div className="text-xs text-[#8b8b8b] font-medium">
            Evaluasi: {bidanNote?.visit_date || '19 November 2026'}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="p-4 rounded-2xl bg-[#f8fafc] border border-black/5 text-xs sm:text-sm text-[#60606c] leading-relaxed space-y-2 font-inter">
            <p className="italic">
              "{bidanNote?.clinical_note || `Pertumbuhan berat dan tinggi badan Ananda ${childName || 'Andi'} terpantau baik bulan ini. Pertahankan variasi lauk pauk lokal dan dampingi selalu dengan pola asuh gembira.`}"
            </p>
          </div>

          {bidanNote?.soap_plan && (
            <div className="flex items-start gap-2.5 text-xs text-[#60606c] bg-white p-3.5 rounded-2xl border border-black/8 font-inter">
              <Sparkles className="w-4 h-4 text-[#2597d0] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#070709]">Arahan Perawatan:</strong> {bidanNote.soap_plan}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Program PMT Pemulihan 90 Hari (Jika Aktif) */}
      {pmtActive && (
        <div
          className={`p-6 sm:p-7 rounded-3xl border transition-all ${
            isHighContrast
              ? 'bg-black text-white border-yellow-400'
              : 'bg-white border-black/8 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-black/5">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-sm sm:text-base text-[#070709] font-runde">
                Program PMT Pemulihan Pangan Lokal 90 Hari
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 font-bold text-[11px] font-runde">
              Hari ke-{bidanNote?.pmt_day_progress || 28} / 90
            </span>
          </div>

          <div className="mt-4 space-y-3 font-inter">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-medium text-[#60606c] mb-1.5">
                <span>Kemajuan Program PMT</span>
                <span className="font-bold text-[#070709] font-runde">{pmtPercent}% Selesai</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#f5f5f5] overflow-hidden border border-black/5">
                <div
                  className="h-full rounded-full bg-[#2597d0] transition-all duration-500"
                  style={{ width: `${pmtPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-black/5">
                <span className="text-[#8b8b8b] block text-[11px]">Kepatuhan Konsumsi</span>
                <span className="font-bold text-[#070709] text-sm font-runde">
                  {bidanNote?.compliance_percent || 88}% Teratur Dihabiskan
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-black/5">
                <span className="text-[#8b8b8b] block text-[11px]">Jadwal Kunjungan Evaluasi</span>
                <span className="font-bold text-[#070709] text-sm font-runde">
                  {bidanNote?.follow_up_date || '02 Desember 2026'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#60606c] leading-relaxed italic">
              Pemberian Makanan Tambahan (PMT) bertujuan mengejar ketertinggalan berat badan balita. Pastikan anak menghabiskan menu PMT setiap hari bersama makanan keluarga.
            </p>
          </div>
        </div>
      )}

      {/* 3. Kartu Jadwal Posyandu Bulan Depan */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border transition-all ${
          isHighContrast
            ? 'bg-black text-white border-white'
            : 'bg-white text-[#070709] border-black/8 shadow-2xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#2597d0]/10 text-[#2597d0] border border-[#2597d0]/20 flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#2597d0] uppercase tracking-wider block font-runde">
                Pengingat Jadwal Posyandu
              </span>
              <h3 className="font-semibold text-base text-[#070709] font-runde">
                {nextPosyandu?.posyandu_name || 'Posyandu Melati 04'}
              </h3>
            </div>
          </div>

          <span className="px-3.5 py-1 rounded-full bg-[#f5f5f5] text-[#070709] font-semibold text-xs self-start sm:self-auto border border-black/8 font-runde">
            {nextPosyandu?.days_remaining || 18} Hari Lagi
          </span>
        </div>

        <div className="mt-5 space-y-4 font-inter">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-black/5 flex items-start gap-3">
              <Clock className="w-4 h-4 text-[#8b8b8b] mt-0.5" />
              <div className="text-xs">
                <span className="text-[#8b8b8b] block">Waktu Pelaksanaan:</span>
                <span className="font-bold text-[#070709] text-sm font-runde">
                  {nextPosyandu?.activity_date || '12 Desember 2026'}
                </span>
                <span className="text-[#60606c] block mt-0.5">
                  Pukul {nextPosyandu?.time_range || '08.30 - 11.30 WIB'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-black/5 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#8b8b8b] mt-0.5" />
              <div className="text-xs">
                <span className="text-[#8b8b8b] block">Lokasi Posyandu:</span>
                <span className="font-bold text-[#070709] text-sm font-runde">
                  {nextPosyandu?.location || 'Balai RW 04, Desa Sukamaju'}
                </span>
                <span className="text-[#60606c] block mt-0.5">
                  Wilayah RW {nextPosyandu?.rw_code || '004'} / RT {nextPosyandu?.rt_code || '002'}
                </span>
              </div>
            </div>
          </div>

          {/* Pengingat Buku KIA */}
          <div className="p-4 rounded-2xl bg-[#f8fafc] border border-black/5 flex items-start gap-3 text-xs text-[#60606c]">
            <BookOpen className="w-5 h-5 text-[#2597d0] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#070709] font-runde">Pengingat Penting:</p>
              <p className="mt-0.5 leading-relaxed">
                {nextPosyandu?.special_reminder || 'Harap membawa Buku KIA fisik saat penimbangan. Pastikan si kecil sarapan dan dalam kondisi ceria saat berangkat posyandu.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
