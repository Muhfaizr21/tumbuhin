const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

const TOKEN_STORAGE_KEY = 'tumbuhin_auth_token'
const USER_STORAGE_KEY = 'tumbuhin_auth_user'

export function getStoredToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveAuthSession(token, user) {
  if (typeof window === 'undefined') return
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
  if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}

export function getRoleDashboardPath(role) {
  const normalized = String(role || 'kader').toLowerCase()
  if (normalized === 'bidan' || normalized === 'puskesmas' || normalized === 'dokter') {
    return '/bidan/dashboard'
  }
  if (normalized === 'admin' || normalized === 'superadmin') {
    return '/admin/dashboard'
  }
  if (normalized === 'ortu' || normalized === 'public' || normalized === 'parent') {
    return '/ortu/dashboard'
  }
  return '/kader/dashboard'
}

export async function loginWithBackend({ identifier, email, phone, password }) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: identifier || email || phone,
        email,
        phone,
        password,
      }),
    })

    const payload = await response.json()
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Gagal melakukan autentikasi ke server backend')
    }

    saveAuthSession(payload.data.token, payload.data.user)
    return payload.data
  } catch (err) {
    if (
      err.message === 'Load failed' ||
      err.message?.includes('Failed to fetch') ||
      err.name === 'TypeError'
    ) {
      throw new Error(
        'Server backend Golang belum menyala di http://localhost:8080. Pastikan terminal backend sudah menjalankan: go run cmd/api/main.go'
      )
    }
    throw err
  }
}

export async function registerWithBackend({
  fullName,
  email,
  phone,
  password,
  role,
  posyanduName,
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName,
        name: fullName,
        email,
        phone,
        password,
        role,
        posyandu_name: posyanduName,
        village_name: 'Desa Sukamaju',
      }),
    })

    const payload = await response.json()
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Gagal mendaftarkan akun baru di server backend')
    }

    saveAuthSession(payload.data.token, payload.data.user)
    return payload.data
  } catch (err) {
    if (
      err.message === 'Load failed' ||
      err.message?.includes('Failed to fetch') ||
      err.name === 'TypeError'
    ) {
      throw new Error(
        'Server backend Golang belum menyala di http://localhost:8080. Pastikan terminal backend sudah menjalankan: go run cmd/api/main.go'
      )
    }
    throw err
  }
}

async function safeParseResponse(response, defaultMsg) {
  const text = await response.text()
  let payload = null
  try {
    payload = JSON.parse(text)
  } catch {
    if (response.status === 404) {
      throw new Error(
        'Endpoint backend Golang mengembalikan 404 (Not Found). Silakan restart terminal server Golang Anda (Ctrl+C lalu go run cmd/api/main.go) agar penambahan rute baru terbaca.'
      )
    }
    throw new Error(text || defaultMsg)
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || defaultMsg)
  }
  return payload.data
}

export async function fetchRoleDashboardData(rolePath) {
  const token = getStoredToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${rolePath}`, {
    method: 'GET',
    headers,
  })
  return safeParseResponse(response, 'Gagal memuat data dasbor')
}

export async function fetchPublicChildCard(magicToken) {
  const response = await fetch(
    `${API_BASE_URL}/public/child/${encodeURIComponent(magicToken)}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
  )
  return safeParseResponse(response, 'Gagal memuat Kartu Gizi Digital')
}

export async function postRoleData(path, data) {
  const token = getStoredToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  return safeParseResponse(response, 'Gagal menyimpan data')
}

export async function putRoleData(path, data) {
  const token = getStoredToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  })
  return safeParseResponse(response, 'Gagal memperbarui data')
}

export async function patchRoleData(path, data) {
  const token = getStoredToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  })
  return safeParseResponse(response, 'Gagal memperbarui data')
}

export async function deleteRoleData(path) {
  const token = getStoredToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers,
  })
  return safeParseResponse(response, 'Gagal menghapus data')
}

export async function downloadRoleFile(path, fallbackFilename = 'dokumen_unduhan') {
  const token = getStoredToken()
  const headers = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    let errMsg = `Gagal mengunduh berkas (HTTP ${response.status})`
    try {
      const errJson = await response.json()
      if (errJson && errJson.message) errMsg = errJson.message
    } catch {
      // ignore
    }
    throw new Error(errMsg)
  }

  const disposition = response.headers.get('Content-Disposition') || ''
  let filename = fallbackFilename
  const match = disposition.match(/filename=["']?([^"';]+)["']?/)
  if (match && match[1]) {
    filename = match[1].trim()
  }

  const blob = await response.blob()
  const blobUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(blobUrl)

  return filename
}
