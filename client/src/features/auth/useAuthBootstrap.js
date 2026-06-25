import { useEffect } from 'react'
import { setToken } from './token.js'

export function useAuthBootstrap() {
  useEffect(() => {
    // Support OAuth redirect:
    // /?token=<jwt>
    const url = new URL(window.location.href)
    const token = url.searchParams.get('token')

    if (!token) return

    setToken(token)
    url.searchParams.delete('token')
    const next = `${url.pathname}${url.search}${url.hash}`
    window.history.replaceState({}, document.title, next)
  }, [])
}



