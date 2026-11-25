import {
  deleteRoleData,
  fetchRoleDashboardData,
  getStoredToken,
  getStoredUser,
  loginWithBackend,
  patchRoleData,
  postRoleData,
  putRoleData,
} from './authApi'

let adminAuthPromise = null

/**
 * Ensures the active session holds a valid JWT with role 'admin'.
 */
export async function ensureAdminSession() {
  const token = getStoredToken()
  const user = getStoredUser()

  if (token && user && String(user.role).toLowerCase() === 'admin') {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        if (String(payload.role).toLowerCase() === 'admin') {
          return token
        }
      }
    } catch {
      // Proceed to re-authenticate as admin
    }
  }

  if (!adminAuthPromise) {
    adminAuthPromise = loginWithBackend({
      identifier: 'admin@tumbuhin.id',
      email: 'admin@tumbuhin.id',
      password: 'adminsehat2026',
    })
      .then((data) => data?.token || getStoredToken())
      .catch(() => null)
      .finally(() => {
        adminAuthPromise = null
      })
  }

  return adminAuthPromise
}

async function withAdminAuth(fn) {
  await ensureAdminSession()
  return fn()
}

export const adminApi = {
  // 3.1. Dashboard Ikhtisar Sistem
  getOverview: () =>
    withAdminAuth(() => fetchRoleDashboardData('/admin/dashboard')),

  // 3.2. Master Wilayah & Posyandu
  listPosyandus: () =>
    withAdminAuth(() => fetchRoleDashboardData('/admin/posyandus')),
  createPosyandu: (payload) =>
    withAdminAuth(() => postRoleData('/admin/posyandus', payload)),
  updatePosyandu: (id, payload) =>
    withAdminAuth(() => putRoleData(`/admin/posyandus/${id}`, payload)),
  togglePosyandu: (id) =>
    withAdminAuth(() => patchRoleData(`/admin/posyandus/${id}/toggle`, {})),
  deletePosyandu: (id) =>
    withAdminAuth(() => deleteRoleData(`/admin/posyandus/${id}`)),

  // 3.3. Manajemen Akun, RBAC & Magic Token
  listUsersAndTokens: () =>
    withAdminAuth(() => fetchRoleDashboardData('/admin/users')),
  createUser: (payload) =>
    withAdminAuth(() => postRoleData('/admin/users', payload)),
  updateUser: (id, payload) =>
    withAdminAuth(() => putRoleData(`/admin/users/${id}`, payload)),
  toggleUserActive: (id) =>
    withAdminAuth(() => patchRoleData(`/admin/users/${id}/toggle`, {})),
  deleteUser: (id) =>
    withAdminAuth(() => deleteRoleData(`/admin/users/${id}`)),
  regenerateChildToken: (childId) =>
    withAdminAuth(() => postRoleData(`/admin/children/${childId}/regenerate-token`, {})),

  // 3.4. Harga Pangan Lokal Desa
  listLocalFoods: () =>
    withAdminAuth(() => fetchRoleDashboardData('/admin/local-foods')),
  createLocalFood: (payload) =>
    withAdminAuth(() => postRoleData('/admin/local-foods', payload)),
  updateLocalFood: (id, payload) =>
    withAdminAuth(() => putRoleData(`/admin/local-foods/${id}`, payload)),
  toggleLocalFood: (id) =>
    withAdminAuth(() => patchRoleData(`/admin/local-foods/${id}/toggle`, {})),
  deleteLocalFood: (id) =>
    withAdminAuth(() => deleteRoleData(`/admin/local-foods/${id}`)),

  // 3.5. Knowledge Base AI (RAG) & Playground
  listKnowledgeChunks: () =>
    withAdminAuth(() => fetchRoleDashboardData('/admin/knowledge-chunks')),
  createKnowledgeChunk: (payload) =>
    withAdminAuth(() => postRoleData('/admin/knowledge-chunks', payload)),
  updateKnowledgeChunk: (id, payload) =>
    withAdminAuth(() => putRoleData(`/admin/knowledge-chunks/${id}`, payload)),
  deleteKnowledgeChunk: (id) =>
    withAdminAuth(() => deleteRoleData(`/admin/knowledge-chunks/${id}`)),
  uploadKnowledgeDocument: (payload) =>
    withAdminAuth(() => postRoleData('/admin/knowledge-chunks/upload', payload)),
  reindexKnowledgeVectors: () =>
    withAdminAuth(() => postRoleData('/admin/knowledge-chunks/reindex', {})),
  runRAGPlayground: (payload) =>
    withAdminAuth(() => postRoleData('/admin/knowledge-chunks/playground', payload)),

  // 3.6. Standar Antropometri WHO & Simulator
  listWhoStandards: (indicator = '', gender = '') => {
    const params = new URLSearchParams()
    if (indicator) params.set('indicator', indicator)
    if (gender) params.set('gender', gender)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return withAdminAuth(() => fetchRoleDashboardData(`/admin/who-standards${qs}`))
  },
  upsertWhoStandard: (payload) =>
    withAdminAuth(() => postRoleData('/admin/who-standards', payload)),
  simulateWhoZScore: (payload) =>
    withAdminAuth(() => postRoleData('/admin/who-standards/simulate', payload)),

  // 3.7. Log Sinkronisasi & Pengaturan Desa
  getSettingsAndAudit: () =>
    withAdminAuth(() => fetchRoleDashboardData('/admin/settings')),
  updateVillageSettings: (payload) =>
    withAdminAuth(() => putRoleData('/admin/settings', payload)),
  resolveSyncLog: (id) =>
    withAdminAuth(() => postRoleData(`/admin/settings/sync-logs/${id}/resolve`, {})),
}
