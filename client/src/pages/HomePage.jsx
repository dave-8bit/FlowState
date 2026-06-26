import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getToken } from '../features/auth/token.js'
import './HomePage.css'


export default function HomePage() {

  const authed = useMemo(() => !!getToken(), [])

  return (
    <main className="home">
      <div className="container">
        <section className="hero" aria-label="Hero">
          <div>
            <h1 className="h-title">Turn ideas into organized work automatically.</h1>

            <p className="h-subtitle">
              Brain Dump to smart tasks in seconds. Capture what’s on your mind, organize it with AI,
              and stay focused through structured sessions.
            </p>

            <div className="hero-ctaRow" aria-label="Primary call to action">
              {authed ? (
                <Link className="cta cta--primary" to="/brain-dump">
                  Start Brain Dump
                </Link>
              ) : (
                <a className="cta cta--primary" href="http://localhost:3000/auth/github">
                  Login with GitHub
                </a>
              )}

            </div>
          </div>


          <aside className="previewCard" aria-label="Product preview">

            <div className="previewTop">
              <div className="previewKicker">Today</div>
              <div className="previewChip" aria-hidden="true">FlowState</div>
            </div>

            <div className="previewTitle">Today's Tasks</div>

            <div className="previewGrid" aria-label="Preview items">
              <div className="previewStat">
                <div className="previewStatLabel">AI Generated Tasks</div>
                <div className="previewStatValue">7</div>
                <div className="previewStatBar" aria-hidden="true" />
              </div>

              <div className="previewStat">
                <div className="previewStatLabel">Ready to Focus</div>
                <div className="previewStatValue">3</div>
                <div className="previewStatBar previewStatBar--alt" aria-hidden="true" />
              </div>

              <div className="previewStat previewStat--wide">
                <div className="previewStatLabel">Productivity Summary</div>
                <div className="previewStatValue previewStatValue--summary">Consistent momentum</div>
              </div>
            </div>

            <div className="previewFooter">
              <span className="previewFooterDot" aria-hidden="true" />
              <span className="previewFooterText">Brain Dump → tasks → focus sessions</span>
            </div>
          </aside>

        </section>

        <div className="socialProof" aria-label="Social proof">
          <div className="socialProofInner">
            Built for Developers • Students • Professionals
          </div>
        </div>


        <section className="section" aria-label="Features">
          <div className="sectionTitleRow">
            <h2 className="sectionTitle">Designed for focus and momentum</h2>
            <p className="sectionHint">Everything you need to get from chaos to clarity.</p>
          </div>

          <div className="featureGrid">
            <article className="card">
              <div className="cardInner">
              <div className="icon" aria-hidden="true">🧠</div>

                <div>
                  <h3 className="cardTitle">Brain Dump AI</h3>
                  <p className="cardDesc">Convert free-form thoughts into structured tasks you can act on.</p>
                </div>
              </div>
            </article>

            <article className="card">
              <div className="cardInner">
                <div className="icon" aria-hidden="true">✓</div>

                <div>
                  <h3 className="cardTitle">Smart Task Organization</h3>
                  <p className="cardDesc">Group work logically and keep priorities clear as you go.</p>
                </div>
              </div>
            </article>

            <article className="card">
              <div className="cardInner">
                <div className="icon" aria-hidden="true">⏱</div>

                <div>
                  <h3 className="cardTitle">Focus Sessions</h3>
                  <p className="cardDesc">Stay in the zone with sessions built for real world productivity.</p>
                </div>
              </div>
            </article>

            <article className="card">
              <div className="cardInner">
                <div className="icon" aria-hidden="true">📈</div>

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
                <Link className="cta cta--primary" to="/brain-dump">
                  Start Brain Dump
                </Link>
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




