import { SmartSidebarShell } from '../../../components/ui/SmartDashboardWidgets'

/**
 * KaderNavigationShell
 * Clean enterprise sidebar shell for Role 1: Kader Posyandu RW.
 */
export default function KaderNavigationShell({
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
      brandSubtitle="OPERASIONAL POSYANDU RW"
      roleKey="kader"
      roleTitle="Kader Posyandu"
      menus={menus}
      activeMenuId={activeMenuId}
      user={user}
      sidebarCollapsed={sidebarCollapsed}
      onToggleCollapse={onToggleCollapse}
      onSelectMenu={onSelectMenu}
      onOpenQuickAdd={onOpenQuickAdd || (() => onSelectMenu({ id: 'balita' }))}
      quickAddLabel="Registrasi Balita Baru"
      onSwitchRole={onSwitchRole}
      onLogout={onLogout}
    />
  )
}
