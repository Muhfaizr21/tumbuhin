import { CheckCircle2, ShieldAlert } from 'lucide-react'
import { WHY_CHOOSE_US } from '../../constants/landingData'

export default function WhyChooseUsSection() {
  return (
    <section id="keunggulan" className="max-w-7xl mx-auto px-3 sm:px-6 mt-10 sm:mt-14">
      <div className="a11y-card bg-white rounded-[32px] sm:rounded-[40px] p-4 sm:p-6 lg:p-8 shadow-[0_20px_50px_-15px_rgba(18,45,105,0.07)] border border-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* LEFT COLUMN: Royal Blue Visual Card with Floating Pointers (Matches Reference "Why Choose Us") */}
          <div className="lg:col-span-5 relative rounded-[28px] bg-gradient-to-br from-[#2573FF] via-[#195DF0] to-[#0B42BE] p-6 sm:p-8 text-white flex flex-col justify-between min-h-[400px] overflow-hidden shadow-lg">
            {/* Ambient Light Rings */}
            <div
              aria-hidden="true"
              className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-cyan-300/15 blur-2xl"
            />

            {/* Top Heading inside Blue Card */}
            <div className="relative z-20">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight leading-[1.08]">
                Mengapa
                <br />
                memilih kami
              </h2>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-blue-200/90">
                DIDUKUNG OLEH:
              </p>
            </div>

            {/* Healthcare Team Portrait & Floating Pointer Badges */}
            <div className="relative z-10 my-4 flex justify-center items-end">
              {/* Floating Tag 1 */}
              <div className="absolute left-0 top-10 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 text-[#0B1426] text-[11px] font-semibold shadow-md">
                <span>Bidan & Kader Terpadu</span>
                <span className="w-2 h-2 rounded-full bg-[#0B1426]" />
              </div>

              {/* Floating Tag 2 */}
              <div className="absolute right-0 top-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 text-[#0B1426] text-[11px] font-semibold shadow-md">
                <span className="w-2 h-2 rounded-full bg-[#1E6BFF]" />
                <span>Standar Klinis Valid</span>
              </div>

              {/* Floating Tag 3 */}
              <div className="absolute left-4 bottom-4 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 text-[#0B1426] text-[11px] font-semibold shadow-md">
                <span>Teknologi Hybrid AI</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>

              <div className="w-64 sm:w-72 h-64 sm:h-72 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-[#164EC9]">
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80"
                  alt="Tim Medis dan Tenaga Gizi Tumbuhin"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Bottom Caption inside Blue Card */}
            <div className="relative z-20 flex items-center justify-between text-[11px] text-blue-100/90 pt-2 border-t border-white/15">
              <span className="font-semibold tracking-wider uppercase">
                TERASA SEPERTI → POSYANDU MASA DEPAN
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
          </div>

          {/* RIGHT COLUMN: 2x2 Big Metrics Grid & Clinical Proof */}
          <div className="lg:col-span-7 flex flex-col justify-between py-2 sm:px-4">
            {/* Top Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
              <span className="text-xs font-medium text-[#7A88A1]">
                {'{ Keunggulan Sistem }'}
              </span>
              <p className="text-xs text-[#5B677D] max-w-md">
                <strong className="font-bold text-[#0B1426] uppercase tracking-wide">
                  PRESISI MEDIS:
                </strong>{' '}
                dirancang khusus untuk menjawab keterbatasan deteksi manual dan kendala
                konektivitas desa.
              </p>
            </div>

            {/* 2x2 Metrics Grid (Matches Reference 10+, 15+, 95%, 98% Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8 my-8">
              {WHY_CHOOSE_US.metrics.map((metric) => (
                <div key={metric.value} className="group">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#0B1426] group-hover:text-[#1E6BFF] transition-colors">
                      {metric.value}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-sm sm:text-base font-bold text-[#0B1426]">
                    {metric.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#5B677D] leading-relaxed">
                    {metric.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom Operational Fact Bar */}
            <div className="pt-5 border-t border-slate-100 flex items-start sm:items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#E8F0FF] text-[#1E6BFF] flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <p className="text-xs text-[#5B677D] leading-relaxed">
                <strong className="font-bold text-[#0B1426]">
                  {WHY_CHOOSE_US.bottomFact.split(':')[0]}:
                </strong>
                {WHY_CHOOSE_US.bottomFact.split(':')[1]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
