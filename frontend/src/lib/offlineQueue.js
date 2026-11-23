const DB_NAME = 'tumbuhin_offline'
const DB_VERSION = 1
const STORE_NAME = 'sync_queue'
const LAST_SYNC_KEY = 'tumbuhin_last_sync_at'
const QUEUE_EVENT = 'tumbuhin:queue-change'

let dbPromise = null

function notifyQueueChange() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(QUEUE_EVENT))
}

function openDatabase() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB tidak tersedia pada browser ini.'))
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'clientId' })
          store.createIndex('queuedAt', 'queuedAt')
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('Gagal membuka IndexedDB.'))
    })
  }

  return dbPromise
}

async function withStore(mode, handler) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    let result

    try {
      result = handler(store)
    } catch (err) {
      reject(err)
      return
    }

    transaction.oncomplete = () => resolve(result)
    transaction.onerror = () => reject(transaction.error || new Error('Transaksi IndexedDB gagal.'))
    transaction.onabort = () => reject(transaction.error || new Error('Transaksi IndexedDB dibatalkan.'))
  })
}

function createClientId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function enqueueItem({ type, payload, label = '', subtitle = '' }) {
  const item = {
    clientId: createClientId(),
    type,
    payload,
    label,
    subtitle,
    status: 'PENDING',
    queuedAt: new Date().toISOString(),
  }

  await withStore('readwrite', (store) => store.add(item))
  notifyQueueChange()
  return item
}

export async function listQueue() {
  const items = await withStore('readonly', (store) => {
    const request = store.getAll()
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  })

  const resolved = await items
  return resolved.sort((a, b) => String(a.queuedAt).localeCompare(String(b.queuedAt)))
}

export async function removeQueueItems(clientIds) {
  if (!clientIds || clientIds.length === 0) return
  await withStore('readwrite', (store) => {
    clientIds.forEach((clientId) => store.delete(clientId))
  })
  notifyQueueChange()
}

export async function countQueue() {
  const total = await withStore('readonly', (store) => {
    const request = store.count()
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || 0)
      request.onerror = () => reject(request.error)
    })
  })
  return await total
}

export function subscribeQueue(listener) {
  if (typeof window === 'undefined') return () => {}
  const handler = () => listener()
  window.addEventListener(QUEUE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(QUEUE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function getLastSyncAt() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LAST_SYNC_KEY)
}

export function setLastSyncAt(value = new Date().toISOString()) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LAST_SYNC_KEY, value)
}

export function isBrowserOffline() {
  if (typeof navigator === 'undefined') return false
  return navigator.onLine === false
}

export function isOfflineError(error) {
  if (!error) return false
  if (isBrowserOffline()) return true
  const message = String(error.message || error)
  return /failed to fetch|load failed|networkerror|network request failed|fetch failed/i.test(message)
}

export async function toSyncItem(item) {
  return {
    clientId: item.clientId,
    type: item.type,
    payload: item.payload,
    queuedAt: item.queuedAt,
  }
}
