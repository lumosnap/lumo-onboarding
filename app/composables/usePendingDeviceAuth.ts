const PENDING_DEVICE_AUTH_KEY = 'pendingDeviceAuth'
const PENDING_DEVICE_AUTH_MAX_AGE_MS = 2 * 60 * 60 * 1000

export interface PendingDeviceAuth {
  userCode: string | null
  fromPath: '/device'
  createdAt: number
}

export const normalizeUserCode = (raw: unknown): string => {
  if (typeof raw !== 'string') return ''
  return raw.trim().toUpperCase()
}

export const setPendingDeviceAuth = (userCode: string | null): void => {
  if (typeof window === 'undefined') return

  const payload: PendingDeviceAuth = {
    userCode: userCode ? normalizeUserCode(userCode) : null,
    fromPath: '/device',
    createdAt: Date.now()
  }

  window.sessionStorage.setItem(PENDING_DEVICE_AUTH_KEY, JSON.stringify(payload))
}

export const clearPendingDeviceAuth = (): void => {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(PENDING_DEVICE_AUTH_KEY)
}

export const getPendingDeviceAuth = (): PendingDeviceAuth | null => {
  if (typeof window === 'undefined') return null

  const raw = window.sessionStorage.getItem(PENDING_DEVICE_AUTH_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as PendingDeviceAuth
    if (
      !parsed ||
      parsed.fromPath !== '/device' ||
      typeof parsed.createdAt !== 'number' ||
      Date.now() - parsed.createdAt > PENDING_DEVICE_AUTH_MAX_AGE_MS
    ) {
      clearPendingDeviceAuth()
      return null
    }

    return {
      userCode: parsed.userCode ? normalizeUserCode(parsed.userCode) : null,
      fromPath: '/device',
      createdAt: parsed.createdAt
    }
  } catch {
    clearPendingDeviceAuth()
    return null
  }
}
