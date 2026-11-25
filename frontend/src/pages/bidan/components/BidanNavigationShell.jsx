import { SmartSidebarShell } from '../../../components/ui/SmartDashboardWidgets'

/**
 * BidanNavigationShell
 * Clean enterprise sidebar shell for Role 2: Bidan Desa / Tenaga Kesehatan.
 * Shared across BidanDashboard, HomeVisitPage, PMTEvaluationPage, SupervisiPage, and LaporanExportPage.
 */
export default function BidanNavigationShell({
  menus = [],
  activeMenuId = 'dashboard',
  user,
  sidebarCollapsed = false,
  onToggleCollapse,
  onSelectMenu,
  onOpenQuickAdd,
  onSwitchRole,
  onLogout,
}) {
  return (
    <SmartSidebarShell
      brandSubtitle="SURVEILANS KLINIS BIDAN"
      roleKey="bidan"
      roleTitle="Bidan Desa"
      menus={menus}
      activeMenuId={activeMenuId}
      user={user}
      sidebarCollapsed={sidebarCollapsed}
      onToggleCollapse={onToggleCollapse}
      onSelectMenu={onSelectMenu}
      onOpenQuickAdd={onOpenQuickAdd}
      quickAddLabel="Tambah Data Triase"
      onSwitchRole={onSwitchRole}
      onLogout={onLogout}
    />
  )
}
