import { useMemo } from 'react'
import { getToken } from '../features/auth/token.js'
import './HomePage.css'

export default function HomePage() {
  const authed = useMemo(() => !!getToken(), [])

  return (
    <main className="home">
      <div className="container">
        <section className="hero" aria-label="Hero">
          <div>
            <div className="badge" aria-label="Product badge">
              <span className="badge-dot" aria-hidden="true" />
              FlowState
            </div>

            <h1 className="h-title">Turn ideas into organized work—automatically.</h1>
            <p className="h-subtitle">
              Brain Dump to smart tasks in seconds. Capture what’s on your mind, organize it with AI,
              and stay focused through structured sessions.
            </p>

            <div className="hero-ctaRow" aria-label="Primary call to action">
              {authed ? (
                <a className="cta cta--primary" href="/brain-dump">
                  Start Brain Dump
                </a>
              ) : (
                <a className="cta cta--primary" href="http://localhost:3000/auth/github">
                  Login with GitHub
                </a>
              )}
            </div>
          </div>

          <div aria-hidden="true" />
        </section>

        <section className="section" aria-label="Features">
          <div className="sectionTitleRow">
            <h2 className="sectionTitle">Designed for focus and momentum</h2>
            <p className="sectionHint">Everything you need to get from chaos to clarity.</p>
          </div>

          <div className="featureGrid">
            <article className="card">
              <div className="cardInner">
                <div className="icon" aria-hidden="true" />
                <div>
                  <h3 className="cardTitle">Brain Dump AI</h3>
                  <p className="cardDesc">Convert free-form thoughts into structured tasks you can act on.</p>
                </div>
              </div>
            </article>

            <article className="card">
              <div className="cardInner">
                <div className="icon" aria-hidden="true" />
                <div>
                  <h3 className="cardTitle">Smart Task Organization</h3>
                  <p className="cardDesc">Group work logically and keep priorities clear as you go.</p>
                </div>
              </div>
            </article>

            <article className="card">
              <div className="cardInner">
                <div className="icon" aria-hidden="true" />
                <div>
                  <h3 className="cardTitle">Focus Sessions</h3>
                  <p className="cardDesc">Stay in the zone with sessions built for real-world productivity.</p>
                </div>
              </div>
            </article>

            <article className="card">
              <div className="cardInner">
                <div className="icon" aria-hidden="true" />
                <div>
                  <h3 className="cardTitle">Productivity Analytics</h3>
                  <p className="cardDesc">See what works and improve your workflow over time.</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="finalCta" aria-label="Final call to action">
          <div className="finalCtaRow">
            <div>
              <h2 className="finalCtaTitle">Start organizing your work today.</h2>
              <p className="finalCtaDesc">
                FlowState helps you capture ideas quickly, turn them into actionable tasks, and keep focus
                when it matters.
              </p>
            </div>

            <div className="finalCtaActions">
              {authed ? (
                <a className="cta cta--primary" href="/brain-dump">
                  Start Brain Dump
                </a>
              ) : (
                <a className="cta cta--primary" href="http://localhost:3000/auth/github">
                  Login with GitHub
                </a>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}




