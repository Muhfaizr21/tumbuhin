import { Stethoscope, User, Calendar, ClipboardCheck } from 'lucide-react'

export default function KaderRightPanel({ user, activeMenu, onNavigateToMenu }) {
  return (
    <aside className="w-80 bg-white border-l border-slate-100 p-6 hidden xl:flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#1e293b] text-white flex items-center justify-center font-bold">
          {user?.full_name?.slice(0, 2).toUpperCase() || 'K'}
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{user?.full_name || 'Petugas'}</h3>
          <p className="text-[12px] text-slate-500">Kader Posyandu</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <h4 className="text-[12px] font-bold uppercase text-slate-400 mb-3">Aktivitas Terkini</h4>
        <div className="space-y-3 text-[13px] text-slate-600">
          <p>• Selesai timbang 41 balita.</p>
          <p>• 0 antrean sinkronisasi.</p>
        </div>
      </div>
    </aside>
  )
}
