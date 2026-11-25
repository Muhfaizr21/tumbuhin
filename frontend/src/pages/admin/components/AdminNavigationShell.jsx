import { SmartSidebarShell } from '../../../components/ui/SmartDashboardWidgets'

/**
 * AdminNavigationShell
 * Clean enterprise sidebar shell for Role 3: Super Admin Desa.
 */
export default function AdminNavigationShell({
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
      brandSubtitle="TATA KELOLA & AI DESA"
      roleKey="admin"
      roleTitle="Super Admin Desa"
      menus={menus}
      activeMenuId={activeMenuId}
      user={user}
      sidebarCollapsed={sidebarCollapsed}
      onToggleCollapse={onToggleCollapse}
      onSelectMenu={onSelectMenu}
      onOpenQuickAdd={onOpenQuickAdd}
      quickAddLabel="Tambah Akun / Unit"
      onSwitchRole={onSwitchRole}
      onLogout={onLogout}
    />
  )
}
