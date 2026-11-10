import { createFileRoute } from '@tanstack/react-router'

const loginErrors: Record<string, string> = {
  google_access_denied: 'Google sign-in was cancelled. You can try again.',
  google_login_failed: 'We could not sign you in with Google. Please try again.',
  invalid_state: 'Your sign-in session expired. Please try again.',
  missing_code: 'Google did not return an authorization code. Please try again.',
}

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    error: typeof search.error === 'string' ? search.error : undefined,
  }),
  head: () => ({
    meta: [{ title: 'Daymark — Sign in' }],
  }),
  component: LoginPage,
})

function LoginPage() {
  const { error } = Route.useSearch()

  return (
    <main className="login-page">
      <section className="login-story" aria-label="About Daymark">
        <a className="brand login-brand" href="/" aria-label="Daymark home">
          <span className="brand-mark">d</span>
          <span>daymark</span>
        </a>
        <div className="login-story-copy">
          <p className="eyebrow">A LITTLE MORE CLARITY</p>
          <h1>Make room for what matters.</h1>
          <p>One calm place to organize your day, keep your focus, and see your progress.</p>
        </div>
        <div className="login-story-note">
          <span className="login-note-mark" aria-hidden="true">✦</span>
          <span>Small steps add up to meaningful progress.</span>
        </div>
        <div className="login-decoration login-decoration-one" aria-hidden="true" />
        <div className="login-decoration login-decoration-two" aria-hidden="true" />
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-mark" aria-hidden="true">d</div>
          <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
          <h2>Welcome to Daymark</h2>
          <p className="login-description">Sign in to pick up where you left off.</p>
          {error && (
            <p className="login-error" role="alert">
              {loginErrors[error] ?? 'Sign-in did not complete. Please try again.'}
            </p>
          )}
          <a className="google-login-button" href="/auth/google">
            <svg aria-hidden="true" viewBox="0 0 48 48" className="google-mark">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 5)" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.73 6C44.43 37.98 46.98 31.84 46.98 24.55Z" transform="translate(0 0)" />
              <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.55 2.56 10.78l7.97-6.19Z" transform="translate(0 0)" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 0)" />
            </svg>
            Continue with Google
          </a>
          <p className="login-terms">
            By continuing, you agree to use Daymark responsibly. Your account is only used to personalize your workspace.
          </p>
        </div>
        <footer className="login-footer">Simple plans. Steady progress.</footer>
      </section>
    </main>
  )
}
