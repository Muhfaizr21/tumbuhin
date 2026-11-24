import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Scale,
  Wifi,
  WifiOff,
} from 'lucide-react'

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWhen(raw) {
  if (!raw) return '-'
  const date = new Date(`${raw}T00:00:00`)
  if (Number.isNaN(date.getTime())) return raw

  const today = startOfDay(new Date())
  const day = startOfDay(date)
  const diffDays = Math.round((today - day) / 86400000)

  if (diffDays === 0) return 'Hari ini'
  if (diffDays === 1) return 'Kemarin'
  if (diffDays > 1 && diffDays < 7) return `${diffDays} hari lalu`
  return `${date.getDate()} ${BULAN[date.getMonth()]}`
}

function isRisk(status) {
  const s = String(status || '').toLowerCase()
  return s.includes('stunted') || s.includes('wasted') || s.includes('severely')
}

function StatusChip({ status }) {
  const risk = isRisk(status)
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${
        risk
          ? 'bg-rose-50 text-rose-600 border-rose-200'
          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
      }`}
    >
      {risk ? <AlertTriangle className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
      {risk ? 'Perlu Atensi' : 'Normal'}
    </span>
  )
}

export default function KaderRightPanel({ user, activeMenu, onNavigateToMenu, stats }) {
  const activities = Array.isArray(stats?.recentActivity) ? stats.recentActivity : []
  const sudahDitimbang = stats?.sudahDitimbang || 0
  const totalBalita = stats?.totalBalita || 0
  const pendingSync = stats?.pendingSync || 0
  const persentase = totalBalita > 0 ? Math.round((sudahDitimbang / totalBalita) * 100) : 0
  const belumHadir = Math.max(totalBalita - sudahDitimbang, 0)
  const allSynced = pendingSync === 0

  return (
    <aside className="w-80 bg-white border-l border-slate-100 p-6 hidden xl:flex flex-col gap-6">
      {/* Profile */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#1e293b] text-white flex items-center justify-center font-bold">
          {user?.full_name?.slice(0, 2).toUpperCase() || 'K'}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 truncate">{user?.full_name || 'Petugas'}</h3>
          <p className="text-[12px] text-slate-500">Kader Posyandu</p>
        </div>
      </div>

      {/* Ringkasan bulan berjalan */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="flex items-center justify-between">
          <h4 className="text-[12px] font-bold uppercase text-slate-400">Ringkasan Bulan Ini</h4>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500">
            RW 04
          </span>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[26px] font-bold leading-none text-slate-800">
              {persentase}
              <span className="text-[13px] font-semibold text-slate-400">%</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {sudahDitimbang} dari {totalBalita} balita ditimbang
            </p>
          </div>
          <div className="w-12 h-12 relative shrink-0">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke={persentase >= 85 ? '#10b981' : persentase >= 60 ? '#f59e0b' : '#f43f5e'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${persentase} 100`}
              />
            </svg>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="p-2 rounded-xl bg-white border border-slate-100">
            <p className="text-[10px] font-medium text-slate-400">Belum hadir</p>
            <p className="text-[14px] font-bold text-amber-600">{belumHadir} <span className="text-[10px] font-medium text-slate-400">balita</span></p>
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-100">
            <p className="text-[10px] font-medium text-slate-400">Antrean sync</p>
            <p className={`text-[14px] font-bold ${allSynced ? 'text-emerald-600' : 'text-blue-600'}`}>
              {pendingSync} <span className="text-[10px] font-medium text-slate-400">item</span>
            </p>
          </div>
        </div>

        <div className={`mt-2 flex items-center gap-1.5 text-[11px] font-medium ${allSynced ? 'text-emerald-600' : 'text-amber-600'}`}>
          {allSynced ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {allSynced ? 'Semua data tersinkron ke cloud' : `${pendingSync} data menunggu dikirim`}
        </div>
      </div>

      {/* Aktivitas terkini */}
      <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[12px] font-bold uppercase text-slate-400">Aktivitas Terkini</h4>
          {activities.length > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-500">
              {activities.length} terbaru
            </span>
          )}
        </div>

        {activities.length === 0 ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
              <Scale className="w-4 h-4" />
            </div>
            <p className="mt-2 text-[12px] text-slate-400">Belum ada penimbangan tercatat.</p>
          </div>
        ) : (
          <ol className="relative space-y-3">
            <span className="absolute left-[13px] top-1.5 bottom-1.5 w-px bg-slate-100" aria-hidden="true" />
            {activities.map((item, idx) => {
              const risk = isRisk(item.status)
              return (
                <li key={`${item.child_id}-${item.measured_at}-${idx}`} className="relative flex gap-2.5">
                  <div
                    className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                      risk
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    }`}
                  >
                    {risk ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12.5px] font-semibold text-slate-800 truncate">{item.child_name}</p>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap">
                        <Clock3 className="w-2.5 h-2.5" />
                        {formatWhen(item.measured_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[11px] text-slate-500">
                        {item.weight_kg > 0 ? `${item.weight_kg} kg` : 'Timbang'}
                      </p>
                      <StatusChip status={item.status} />
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        {onNavigateToMenu && (
          <button
            onClick={() => onNavigateToMenu('timbang')}
            className="mt-3 w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11.5px] font-semibold text-slate-600 border border-slate-100 hover:bg-slate-50 transition-colors"
          >
            Buka Input Timbang
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  )
}
