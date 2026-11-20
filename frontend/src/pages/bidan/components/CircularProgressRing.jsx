/**
 * CircularProgressRing
 * Renders an SVG circular progress ring matching the reference dashboard storage cards.
 * Purpose: Shows percentage completion (e.g., D/S participation rate, target graduation, visit completion) at a glance.
 */
export default function CircularProgressRing({
  percentage = 0,
  size = 54,
  strokeWidth = 4.5,
  isPrimaryCard = false,
  accentColor = '#2597d0',
}) {
  const safePercent = Math.min(Math.max(Number(percentage) || 0, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (safePercent / 100) * circumference

  const trackColor = isPrimaryCard ? 'rgba(255, 255, 255, 0.25)' : '#edf2f7'
  const progressColor = isPrimaryCard ? '#ffffff' : accentColor
  const textColor = isPrimaryCard ? '#ffffff' : '#1e293b'

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Capaian ${safePercent}%`}
    >
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <span
        className="absolute text-[11.5px] font-semibold tracking-tight"
        style={{ color: textColor }}
      >
        {Math.round(safePercent)}%
      </span>
    </div>
  )
}
