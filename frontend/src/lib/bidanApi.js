import {
  deleteRoleData,
  downloadRoleFile,
  fetchRoleDashboardData,
  getStoredToken,
  getStoredUser,
  loginWithBackend,
  patchRoleData,
  postRoleData,
  putRoleData,
} from './authApi'

let bidanAuthPromise = null

const ALLOWED_BIDAN_ROLES = ['bidan', 'admin']

/**
 * Ensures the active session holds a valid JWT authorized for /api/v1/bidan/* endpoints.
 */
export async function ensureBidanSession() {
  const token = getStoredToken()
  const user = getStoredUser()

  if (token && user && ALLOWED_BIDAN_ROLES.includes(String(user.role).toLowerCase())) {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        if (ALLOWED_BIDAN_ROLES.includes(String(payload.role).toLowerCase())) {
          return token
        }
      }
    } catch {
      // Proceed to re-authenticate
    }
  }

  if (!bidanAuthPromise) {
    bidanAuthPromise = loginWithBackend({
      identifier: 'bidan@tumbuhin.id',
      email: 'bidan@tumbuhin.id',
      password: 'bidansiaga2026',
    })
      .then((data) => data?.token || getStoredToken())
      .catch(() => null)
      .finally(() => {
        bidanAuthPromise = null
      })
  }

  return bidanAuthPromise
}

async function withBidanAuth(fn) {
  await ensureBidanSession()
  return fn()
}

export const bidanApi = {
  // 2.1 Dashboard Epidemiologi Desa
  getOverview: () =>
    withBidanAuth(() => fetchRoleDashboardData('/bidan/dashboard')),

  // 2.2 Peta GIS & Klaster Risiko
  getGisClusters: () =>
    withBidanAuth(() => fetchRoleDashboardData('/bidan/gis-clusters')),

  // 2.3 Daftar Prioritas Intervensi (Triase Medis)
  getPriorityList: () =>
    withBidanAuth(() => fetchRoleDashboardData('/bidan/priority-list')),
  createPriorityChild: (payload) =>
    withBidanAuth(() => postRoleData('/bidan/priority-list', payload)),
  updatePriorityChild: (id, payload) =>
    withBidanAuth(() => putRoleData(`/bidan/priority-list/${id}`, payload)),
  deletePriorityChild: (id) =>
    withBidanAuth(() => deleteRoleData(`/bidan/priority-list/${id}`)),

  // 2.4 Kunjungan Rumah (Home Visit SOAP & PMT)
  listHomeVisits: (queryString = '') => {
    const qs = queryString ? `?${queryString.replace(/^\?/, '')}` : ''
    return withBidanAuth(() => fetchRoleDashboardData(`/bidan/interventions${qs}`))
  },
  createHomeVisit: (payload) =>
    withBidanAuth(() => postRoleData('/bidan/interventions', payload)),
  updateHomeVisit: (id, payload) =>
    withBidanAuth(() => putRoleData(`/bidan/interventions/${id}`, payload)),
  updateHomeVisitStatus: (id, payload) =>
    withBidanAuth(() => patchRoleData(`/bidan/interventions/${id}/status`, payload)),
  deleteHomeVisit: (id) =>
    withBidanAuth(() => deleteRoleData(`/bidan/interventions/${id}`)),

  // 2.5 Evaluasi Program PMT 90 Hari
  listPmtEvaluations: (queryString = '') => {
    const qs = queryString ? `?${queryString.replace(/^\?/, '')}` : ''
    return withBidanAuth(() => fetchRoleDashboardData(`/bidan/pmt-evaluations${qs}`))
  },
  getPmtEvaluationDetail: (childId) =>
    withBidanAuth(() => fetchRoleDashboardData(`/bidan/pmt-evaluations/${childId}`)),
  updatePmtCompliance: (childId, payload) =>
    withBidanAuth(() => patchRoleData(`/bidan/pmt-evaluations/${childId}/compliance`, payload)),

  // 2.6 Supervisi Posyandu & Audit Data
  getSupervision: (queryString = '') => {
    const qs = queryString ? `?${queryString.replace(/^\?/, '')}` : ''
    return withBidanAuth(() => fetchRoleDashboardData(`/bidan/supervision${qs}`))
  },
  lockSupervision: (payload) =>
    withBidanAuth(() => postRoleData('/bidan/supervision/lock', payload)),

  // 2.7 Laporan & Ekspor e-PPGBM
  previewExport: (queryString = '') => {
    const qs = queryString ? `?${queryString.replace(/^\?/, '')}` : ''
    return withBidanAuth(() => fetchRoleDashboardData(`/bidan/export${qs}`))
  },
  downloadExport: (queryString, fallbackFilename) => {
    const qs = queryString ? `?${queryString.replace(/^\?/, '')}` : ''
    return withBidanAuth(() => downloadRoleFile(`/bidan/export${qs}`, fallbackFilename))
  },

  // 2.8 Manajemen & Registrasi Akun Orang Tua
  listParents: () =>
    withBidanAuth(() => fetchRoleDashboardData('/bidan/parents')),
  registerParent: (payload) =>
    withBidanAuth(() => postRoleData('/bidan/parents/register', payload)),
  updateParentChildren: (parentId, childIds) =>
    withBidanAuth(() => putRoleData(`/bidan/parents/${parentId}/children`, { child_ids: childIds })),
}
