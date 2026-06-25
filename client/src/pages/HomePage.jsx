export default function HomePage() {
  return (
    <div style={{ padding: 24 }}>

      <h1>FlowState</h1>
      <p>Sign in to start saving tasks.</p>
      <a
        href="http://localhost:3000/auth/github"
        style={{
          display: 'inline-block',
          marginTop: 16,
          padding: '10px 16px',
          borderRadius: 12,
          background: 'var(--accent)',
          color: 'white',
          textDecoration: 'none',
          fontWeight: 700,
        }}
      >
        Login with GitHub
      </a>
    </div>
  )
}



