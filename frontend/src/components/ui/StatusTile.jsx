export default function StatusTile({
  label,
  count = 0,
  sublabel,
  dotColor = 'bg-emerald-500',
  textColor = 'text-emerald-700',
  bgColor = 'bg-emerald-50/60',
  borderColor = 'border-emerald-200/70',
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between ${bgColor} ${borderColor} ${
        onClick ? 'cursor-pointer hover:shadow-sm active:scale-98' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
          <span className="text-[12px] font-semibold text-gray-800 truncate">
            {label}
          </span>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-1">
        <span className={`text-[22px] sm:text-[24px] font-bold tracking-tight ${textColor} leading-none`}>
          {count}
        </span>
        <span className="text-[10.5px] font-medium text-gray-500">
          {sublabel || 'Anak'}
        </span>
      </div>
    </div>
  )
}
