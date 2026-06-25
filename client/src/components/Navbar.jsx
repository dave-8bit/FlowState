import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { clearToken, getToken, setToken } from '../features/auth/token.js'
import './Navbar.css'

function useAuthState() {
  const authed = useMemo(() => !!getToken(), [])

  const [isAuthed, setIsAuthed] = useState(authed)

  useEffect(() => {
    const onStorage = (e) => {
      if (e?.key === 'token') setIsAuthed(!!getToken())
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])


  return isAuthed
}

export default function Navbar() {
  const authed = useAuthState()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // Avoid setting state directly from an effect (eslint: set-state-in-effect).
    // Keep menu state controlled by click/close handlers.
  }, [location.pathname])



  const onLogout = () => {
    clearToken()
    setToken(null)
    setMenuOpen(false)
  }


  const navLink = (to, label, onClick) => (
    <Link
      to={to}
      className="navbar-link"
      onClick={() => {
        setMenuOpen(false)
        onClick?.()
      }}
    >
      {label}
    </Link>
  )

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" aria-label="FlowState">
          <Link to="/" className="navbar-brand-link" onClick={() => setMenuOpen(false)}>
            FlowState
          </Link>
        </div>

        <button
          type="button"
          className={`navbar-burger ${menuOpen ? 'navbar-burger--open' : ''}`}
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`navbar-nav ${menuOpen ? 'navbar-nav--open' : ''}`}>
          <div className="navbar-links">
            {navLink('/', 'Home')}
            {navLink('/brain-dump', 'Brain Dump')}
            {navLink('/tasks', 'My Tasks')}
          </div>

          <div className="navbar-actions">
            {authed ? (
              <button type="button" className="navbar-button" onClick={onLogout}>
                Logout
              </button>
            ) : (
              <a
                className="navbar-button navbar-button--primary"
                href="http://localhost:3000/auth/github"
                onClick={() => setMenuOpen(false)}
              >
                Login with GitHub
              </a>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

