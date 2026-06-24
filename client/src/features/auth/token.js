const TOKEN_KEY = 'token'

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (!token) {
      window.localStorage.removeItem(TOKEN_KEY)
      return
    }
    window.localStorage.setItem(TOKEN_KEY, String(token))
  } catch {
    // ignore
  }
}

export function clearToken() {
  setToken(null)
}

