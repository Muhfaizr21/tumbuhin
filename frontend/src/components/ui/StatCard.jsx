import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

export default function StatCard({
  label,
  value,
  sub,
  badge,
  badgeType = 'default', // 'success' | 'warning' | 'danger' | 'info' | 'default'
  icon: Icon,
  iconBg = 'bg-blue-50 text-blue-600',
  delta,
  deltaType = 'positive', // 'positive' | 'negative' | 'neutral'
  progress, // number 0-100 or null
  progressColor = 'bg-blue-600',
  isLoading = false,
  onClick,
}) {
  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl bg-white border border-black/8 shadow-2xs animate-pulse clinicflow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200" />
          <div className="w-16 h-5 rounded-full bg-gray-200" />
        </div>
        <div className="w-24 h-4 bg-gray-200 rounded mb-2" />
        <div className="w-32 h-7 bg-gray-300 rounded mb-2" />
        <div className="w-40 h-3 bg-gray-100 rounded" />
      </div>
    )
  }

  const badgeStyles = {
    success: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    warning: 'bg-amber-100 text-amber-900 border-amber-300',
    danger: 'bg-rose-100 text-rose-900 border-rose-300',
    info: 'bg-blue-100 text-blue-900 border-blue-300',
    default: 'bg-gray-200 text-gray-900 border-gray-300',
  }

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white border border-black/6 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between clinicflow-card ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div>
        {/* Header row: Icon & Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {Icon && (
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
            >
              <Icon className="w-5 h-5" />
            </div>
          )}

          {badge && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                badgeStyles[badgeType] || badgeStyles.default
              }`}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Label */}
        <p className="text-[12.5px] font-medium text-gray-500 leading-tight">
          {label}
        </p>

        {/* Big Bold KPI Number */}
        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          <span className="text-[26px] sm:text-[28px] font-bold tracking-tight text-gray-900 leading-none">
            {value}
          </span>

          {/* Delta Trend Chip */}
          {delta !== undefined && delta !== null && (
            <div
              className={`inline-flex items-center gap-0.5 text-[11.5px] font-semibold ${
                deltaType === 'positive'
                  ? 'text-emerald-600'
                  : deltaType === 'negative'
                  ? 'text-rose-600'
                  : 'text-gray-500'
              }`}
            >
              {deltaType === 'positive' && <ArrowUpRight className="w-3.5 h-3.5" />}
              {deltaType === 'negative' && <ArrowDownRight className="w-3.5 h-3.5" />}
              {deltaType === 'neutral' && <Minus className="w-3 h-3" />}
              <span>{delta}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar (if provided, like for Penimbangan) */}
      {typeof progress === 'number' && (
        <div className="mt-3">
          <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full ${progressColor} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtext */}
      {sub && (
        <p className="mt-2.5 text-[11.5px] text-gray-400 font-normal leading-normal">
          {sub}
        </p>
      )}
    </div>
  )
}
