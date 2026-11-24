import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Reusable PaginationBar component with page size selector and smart page windowing.
 * Keeps DOM node count small and responsive across tables and card grids.
 */
export default function PaginationBar({
  totalItems = 0,
  currentPage = 1,
  pageSize = 6,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [4, 6, 8, 12, 20],
  itemLabel = 'data',
  compact = false,
}) {
  const safePageSize = Math.max(1, Number(pageSize) || 6)
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  if (totalItems <= 0) return null

  const startIdx = (safeCurrentPage - 1) * safePageSize + 1
  const endIdx = Math.min(safeCurrentPage * safePageSize, totalItems)

  // Generate visible page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const pages = [1]
    const left = Math.max(2, safeCurrentPage - 1)
    const right = Math.min(totalPages - 1, safeCurrentPage + 1)

    if (left > 2) pages.push('...')
    for (let p = left; p <= right; p += 1) {
      pages.push(p)
    }
    if (right < totalPages - 1) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        compact
          ? 'pt-3 border-t border-slate-100 text-[11.5px]'
          : 'px-5 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs text-[12px]'
      }`}
    >
      {/* Left: Showing X-Y of Z + Optional Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3 text-slate-500">
        <span>
          Menampilkan <strong className="text-slate-800">{startIdx}</strong>–
          <strong className="text-slate-800">{endIdx}</strong> dari{' '}
          <strong className="text-slate-800">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && !compact && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">•</span>
            <label className="text-slate-400 text-[11.5px]">Per halaman:</label>
            <select
              value={safePageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value))
                if (onPageChange) onPageChange(1)
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-[11.5px] focus:outline-none focus:border-[#1e293b] cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Controls */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          type="button"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange && onPageChange(safeCurrentPage - 1)}
          aria-label="Halaman sebelumnya"
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1 font-semibold cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {!compact && <span>Sebelumnya</span>}
        </button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) =>
            p === '...' ? (
              <span key={`dots-${idx}`} className="px-1.5 text-slate-400 select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange && onPageChange(p)}
                aria-current={p === safeCurrentPage ? 'page' : undefined}
                className={`min-w-[30px] h-[30px] px-2 rounded-xl font-bold text-[11.5px] transition-all cursor-pointer ${
                  p === safeCurrentPage
                    ? 'bg-[#1e293b] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange && onPageChange(safeCurrentPage + 1)}
          aria-label="Halaman berikutnya"
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1 font-semibold cursor-pointer transition-colors"
        >
          {!compact && <span>Berikutnya</span>}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
