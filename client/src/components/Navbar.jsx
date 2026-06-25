import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'


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




  const onLogout = () => {
    clearToken()
    setToken(null)
    setMenuOpen(false)
  }

  const navLink = (to, label) => (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `navbar-link ${isActive ? 'navbar-link--active' : ''}`
      }
      onClick={() => setMenuOpen(false)}
    >
      {label}
    </NavLink>
  )

  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner">
        <div className="navbar-brand" aria-label="FlowState">
          <NavLink
            to="/"
            end
            className="navbar-brand-link"
            onClick={() => setMenuOpen(false)}
          >
            FlowState
          </NavLink>
        </div>

        <button
          type="button"
          className={`navbar-burger ${menuOpen ? 'navbar-burger--open' : ''}`}
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="primary-navigation"
          className={`navbar-nav ${menuOpen ? 'navbar-nav--open' : ''}`}
          aria-label="Primary"
        >
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


