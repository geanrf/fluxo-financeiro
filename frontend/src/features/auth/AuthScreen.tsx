import { useState, type FormEvent } from 'react'
import { apiRequest, errorMessage } from '../../shared/api/apiClient'
import { Icon } from '../../shared/ui/Icon'
import type { AuthResponse } from './types'

type AuthMode = 'login' | 'register'

type AuthScreenProps = {
  onAuthenticated: (response: AuthResponse) => void
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    if (mode === 'register') {
      const confirmation = String(form.get('passwordConfirmation') ?? '')
      if (password !== confirmation) {
        setError('As senhas não coincidem.')
        return
      }
    }

    const payload =
      mode === 'register'
        ? { name: String(form.get('name') ?? '').trim(), email, password }
        : { email, password }

    setLoading(true)
    try {
      const response = await apiRequest<AuthResponse>(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      onAuthenticated(response)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setError(null)
  }

  return (
    <main className="auth-shell">
      <section className="auth-showcase" aria-label="Apresentação do produto">
        <div className="brand brand--large">
          <span className="brand__mark"><Icon name="wallet" size={25} /></span>
          <span>Fluxo</span>
        </div>

        <div className="auth-copy">
          <span className="eyebrow">Finanças pessoais, sem complicação</span>
          <h1>Clareza para decidir.<br /><span>Controle para crescer.</span></h1>
          <p>
            Organize receitas e despesas em uma experiência segura, rápida e feita
            para transformar números em decisões melhores.
          </p>
        </div>

        <div className="auth-preview" aria-hidden="true">
          <div className="auth-preview__top">
            <span>Saldo disponível</span>
            <small>este mês</small>
          </div>
          <strong>R$ 6.840,00</strong>
          <div className="sparkline">
            <i style={{ height: '38%' }} />
            <i style={{ height: '48%' }} />
            <i style={{ height: '42%' }} />
            <i style={{ height: '64%' }} />
            <i style={{ height: '58%' }} />
            <i style={{ height: '78%' }} />
            <i style={{ height: '92%' }} />
          </div>
          <div className="auth-preview__legend">
            <span><b className="dot dot--cyan" />Receitas em alta</span>
            <span>+18,4%</span>
          </div>
        </div>

        <div className="trust-line">
          <span>✓ Senhas protegidas</span>
          <span>✓ Dados privados por usuário</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand brand">
            <span className="brand__mark"><Icon name="wallet" size={22} /></span>
            <span>Fluxo</span>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Acesso">
            <button
              className={mode === 'login' ? 'active' : ''}
              onClick={() => changeMode('login')}
              role="tab"
              type="button"
            >
              Entrar
            </button>
            <button
              className={mode === 'register' ? 'active' : ''}
              onClick={() => changeMode('register')}
              role="tab"
              type="button"
            >
              Criar conta
            </button>
          </div>

          <header className="auth-card__header">
            <span className="eyebrow">{mode === 'login' ? 'Bem-vindo de volta' : 'Comece agora'}</span>
            <h2>{mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta grátis'}</h2>
            <p>
              {mode === 'login'
                ? 'Entre para acompanhar sua vida financeira.'
                : 'Leva menos de um minuto para começar.'}
            </p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label>
                Nome completo
                <input autoComplete="name" name="name" placeholder="Como podemos chamar você?" required minLength={2} />
              </label>
            )}

            <label>
              E-mail
              <input autoComplete="email" name="email" placeholder="voce@exemplo.com" required type="email" />
            </label>

            <label>
              Senha
              <input
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                name="password"
                placeholder={mode === 'login' ? 'Sua senha' : 'Mínimo 8 caracteres'}
                required
                minLength={mode === 'register' ? 8 : undefined}
                type="password"
              />
              {mode === 'register' && <small>Use letra maiúscula, minúscula e número.</small>}
            </label>

            {mode === 'register' && (
              <label>
                Confirme a senha
                <input autoComplete="new-password" name="passwordConfirmation" placeholder="Repita sua senha" required type="password" />
              </label>
            )}

            {error && <div className="form-alert" role="alert">{error}</div>}

            <button className="button button--primary button--wide" disabled={loading} type="submit">
              {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar na minha conta' : 'Criar minha conta'}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}{' '}
            <button onClick={() => changeMode(mode === 'login' ? 'register' : 'login')} type="button">
              {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}
