import { useState } from 'react'
import { Check, Heart, Shield, Stethoscope, Users } from 'lucide-react'
import { ROLE_ECOSYSTEM } from '../../constants/landingData'
import PillButton from '../ui/PillButton'

const ROLE_ICON_MAP = {
  kader: Users,
  bidan: Stethoscope,
  ortu: Heart,
  admin: Shield,
}

export default function RoleEcosystemSection() {
  const [activeRoleKey, setActiveRoleKey] = useState('kader')

  const activeRole =
    ROLE_ECOSYSTEM.find((item) => item.roleKey === activeRoleKey) || ROLE_ECOSYSTEM[0]

  return (
    <section id="ekosistem" className="max-w-7xl mx-auto px-3 sm:px-6 mt-10 sm:mt-14">
      <div className="a11y-card bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-[0_20px_50px_-15px_rgba(18,45,105,0.06)] border border-white">
        {/* Top Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-100">
          <div>
            <span className="text-xs font-medium text-[#7A88A1]">
              {'{ Role-Based Access Control (RBAC) }'}
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#0B1426] mt-1">
              Satu Ekosistem, Empat Peran Sinergis
            </h2>
          </div>

          {/* Role Switcher Pills */}
          <div className="flex flex-wrap gap-2">
            {ROLE_ECOSYSTEM.map((role) => {
              const IconComp = ROLE_ICON_MAP[role.roleKey] || Users
              const isSelected = role.roleKey === activeRoleKey
              return (
                <button
                  key={role.roleKey}
                  type="button"
                  onClick={() => setActiveRoleKey(role.roleKey)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1E6BFF] text-white shadow-md'
                      : 'bg-[#F2F6FF] text-[#5B677D] hover:text-[#0B1426]'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{role.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Role Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-center">
          <div className="lg:col-span-5">
            <span className="inline-block px-3 py-1 rounded-full bg-[#E8F0FF] text-[#1E6BFF] text-xs font-semibold">
              {activeRole.badge}
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1426] mt-3">
              {activeRole.title}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-[#1E6BFF] mt-1">
              {activeRole.subtitle}
            </p>
            <p className="mt-4 text-xs sm:text-sm text-[#5B677D] leading-relaxed">
              Setiap antarmuka disesuaikan secara ergonomis dengan kondisi pengguna di
              lapangan — dilengkapi pembatasan cakupan data (Row-Level Scoping) demi
              menjaga kerahasiaan medis balita.
            </p>
            <div className="mt-6">
              <PillButton href="#simulasi" iconType="arrow">
                Uji Alur Kerja {activeRole.title}
              </PillButton>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeRole.highlights.map((point, index) => (
              <div
                key={point}
                className="rounded-[24px] bg-[#F5F8FF] border border-[#E2ECFF] p-5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display text-xs font-bold text-[#1E6BFF] px-2.5 py-1 rounded-full bg-white border border-[#DCE8FF]">
                    Fitur 0{index + 1}
                  </span>
                  <span className="w-6 h-6 rounded-full bg-[#1E6BFF] text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] font-medium text-[#0B1426] leading-relaxed">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
