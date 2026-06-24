import { useEffect } from 'react'
import { clearToken, setToken } from './token.js'

export function useAuthBootstrap() {
  useEffect(() => {
    // Support OAuth redirect:
    // /?token=<jwt>
    const url = new URL(window.location.href)
    const token = url.searchParams.get('token')

    if (token) {
      setToken(token)
      url.searchParams.delete('token')
      const next = `${url.pathname}${url.search}${url.hash}`
      window.history.replaceState({}, document.title, next)
      return
    }

    // If no token in URL but token exists in storage, keep it.
    // If you ever want to force-clear on specific routes, do it here.
    return () => clearToken()
  }, [])
}

