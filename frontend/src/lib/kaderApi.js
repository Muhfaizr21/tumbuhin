import {
  deleteRoleData,
  fetchRoleDashboardData,
  getStoredToken,
  getStoredUser,
  loginWithBackend,
  postRoleData,
  putRoleData,
} from './authApi'

let kaderAuthPromise = null

const ALLOWED_KADER_ROLES = ['kader', 'bidan', 'admin']

/**
 * Ensures the active session holds a valid JWT authorized for /api/v1/kader/* endpoints.
 */
export async function ensureKaderSession() {
  const token = getStoredToken()
  const user = getStoredUser()

  if (token && user && ALLOWED_KADER_ROLES.includes(String(user.role).toLowerCase())) {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        if (ALLOWED_KADER_ROLES.includes(String(payload.role).toLowerCase())) {
          return token
        }
      }
    } catch {
      // Proceed to re-authenticate
    }
  }

  if (!kaderAuthPromise) {
    kaderAuthPromise = loginWithBackend({
      identifier: 'kader@tumbuhin.id',
      email: 'kader@tumbuhin.id',
      password: 'kadersehat2026',
    })
      .then((data) => data?.token || getStoredToken())
      .catch(() => null)
      .finally(() => {
        kaderAuthPromise = null
      })
  }

  return kaderAuthPromise
}

async function withKaderAuth(fn) {
  await ensureKaderSession()
  return fn()
}

export const kaderApi = {
  // 1.1 Beranda & Ikhtisar Posyandu
  getOverview: () =>
    withKaderAuth(() => fetchRoleDashboardData('/kader/dashboard')),

  // 1.2 Data & Profil Balita
  getBalitaList: () =>
    withKaderAuth(() => fetchRoleDashboardData('/kader/balita')),
  registerBalita: (payload) =>
    withKaderAuth(() => postRoleData('/kader/balita', payload)),
  updateBalita: (id, payload) =>
    withKaderAuth(() => putRoleData(`/kader/balita/${id}`, payload)),
  deleteBalita: (id) =>
    withKaderAuth(() => deleteRoleData(`/kader/balita/${id}`)),

  // 1.3 Input Timbangan & Z-Score WHO
  postTimbang: (payload) =>
    withKaderAuth(() => postRoleData('/kader/timbang', payload)),

  // 1.5 AI Nutri-Chef & Katalog Pangan Desa
  generateResep: (payload) =>
    withKaderAuth(() => postRoleData('/kader/nutrichef/generate', payload)),
  listLocalFoods: () =>
    withKaderAuth(() => fetchRoleDashboardData('/kader/local-foods')),

  // 1.6 Sinkronisasi Offline PWA
  syncOfflineData: (payload) =>
    withKaderAuth(() => postRoleData('/kader/sinkronisasi/batch', payload)),
  getSyncStatus: (limit = 30) =>
    withKaderAuth(() => fetchRoleDashboardData(`/kader/sinkronisasi/status?limit=${limit}`)),

  // 1.7 Distribusi WhatsApp & Konfigurasi Template Desa
  listPosyandus: () =>
    withKaderAuth(() => fetchRoleDashboardData('/kader/posyandus')),
  getSettings: () =>
    withKaderAuth(() => fetchRoleDashboardData('/kader/settings')),
}
