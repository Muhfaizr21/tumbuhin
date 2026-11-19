import { ArrowUpRight, UserCheck } from 'lucide-react'

/**
 * Signature Pill Button matching the clinical reference design:
 * Rounded pill with left text and a right nested circular icon badge.
 */
export default function PillButton({
  children,
  href,
  onClick,
  variant = 'primary',
  iconType = 'user',
  className = '',
}) {
  const IconComponent = iconType === 'arrow' ? ArrowUpRight : UserCheck

  const baseClasses =
    'group inline-flex items-center justify-between gap-4 rounded-full p-1.5 pl-6 font-semibold text-sm transition-all duration-300 cursor-pointer select-none'

  const variantClasses =
    variant === 'primary'
      ? 'bg-gradient-to-r from-[#1E6BFF] via-[#2674FF] to-[#4A90FF] text-white shadow-[0_12px_28px_-6px_rgba(30,107,255,0.5)] hover:shadow-[0_16px_34px_-6px_rgba(30,107,255,0.65)] hover:-translate-y-0.5'
      : 'bg-white text-[#0B1426] border border-[#DCE6F7] shadow-sm hover:border-[#1E6BFF] hover:-translate-y-0.5'

  const circleClasses =
    variant === 'primary'
      ? 'w-9 h-9 rounded-full bg-white text-[#0B1426] flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:rotate-6'
      : 'w-9 h-9 rounded-full bg-[#1E6BFF] text-white flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-105'

  const content = (
    <>
      <span className="tracking-tight">{children}</span>
      <span className={circleClasses}>
        <IconComponent className="w-4 h-4 stroke-[2.2]" />
      </span>
    </>
  )

  if (href) {
    return (
      <a href={href} onClick={onClick} className={`${baseClasses} ${variantClasses} ${className}`}>
        {content}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {content}
    </button>
  )
}
