import { useState } from 'react'
import {
  MessageSquare,
  ShieldAlert,
} from 'lucide-react'

export default function InstruksiBidanCard({
  instruksiList = [],
  onTandaiDibaca,
}) {
  const [localList, setLocalList] = useState(instruksiList)

  const handleMarkAsRead = (id) => {
    setLocalList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, sudahDibaca: true } : item))
    )
    if (onTandaiDibaca) onTandaiDibaca(id)
  }

  const unreadCount = localList.filter((item) => !item.sudahDibaca).length

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white shadow-sm border border-purple-500/20 mb-6 relative overflow-hidden">
      {/* Decorative background glow */}
      <div
        className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-purple-500/20 blur-xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Midwife Icon & Title */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-purple-200 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[14.5px] text-white">
                Instruksi dari Bidan Desa Sukamaju
              </span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-400 text-gray-900 shadow-xs">
                  {unreadCount} Tindakan Mendesak
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  Semua Instruksi Sudah Terbaca
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-purple-200/80 mt-0.5">
              Bidan Rina Kartika, A.Md.Keb • Pembinaan klinis & intervensi stunting RW 04
            </p>
          </div>
        </div>

        {/* Instruction Message Snippet */}
        {localList.length > 0 && (
          <div className="flex items-center gap-2.5 bg-white/8 border border-white/12 rounded-xl p-2.5 sm:max-w-md">
            <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
            <p className="text-[11.5px] text-white/90 line-clamp-1 flex-1">
              {localList[0]?.pesan}
            </p>
            {!localList[0]?.sudahDibaca && (
              <button
                type="button"
                onClick={() => handleMarkAsRead(localList[0]?.id)}
                className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer"
              >
                Tandai Dibaca
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
