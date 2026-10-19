import { useEffect, useState } from 'react'
import { AuthScreen } from '../features/auth/AuthScreen'
import type { AuthResponse, User } from '../features/auth/types'
import { ExpensesPage } from '../features/expenses/ExpensesPage'
import type { FinanceSection } from '../features/finance/FinanceShell'
import { IncomesPage } from '../features/incomes/IncomesPage'
import {
  apiRequest,
  clearAccessToken,
  getAccessToken,
  storeAccessToken,
} from '../shared/api/apiClient'
import { Icon } from '../shared/ui/Icon'

type SessionState = 'checking' | 'anonymous' | 'authenticated'

export function App() {
  const [sessionState, setSessionState] = useState<SessionState>(
    getAccessToken() ? 'checking' : 'anonymous',
  )
  const [user, setUser] = useState<User | null>(null)
  const [financeSection, setFinanceSection] = useState<FinanceSection>('expenses')

  useEffect(() => {
    if (sessionState !== 'checking') return

    apiRequest<User>('/auth/me')
      .then((currentUser) => {
        setUser(currentUser)
        setSessionState('authenticated')
      })
      .catch(() => {
        clearAccessToken()
        setSessionState('anonymous')
      })
  }, [sessionState])

  function handleAuthenticated(response: AuthResponse) {
    storeAccessToken(response.accessToken)
    setUser(response.user)
    setFinanceSection('expenses')
    setSessionState('authenticated')
  }

  function handleLogout() {
    clearAccessToken()
    setUser(null)
    setFinanceSection('expenses')
    setSessionState('anonymous')
  }

  if (sessionState === 'checking') {
    return (
      <main className="loading-screen">
        <div className="brand brand--large">
          <span className="brand__mark"><Icon name="wallet" size={25} /></span>
          <span>Fluxo</span>
        </div>
        <span className="loader" />
      </main>
    )
  }

  if (sessionState === 'anonymous' || !user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />
  }

  if (financeSection === 'incomes') {
    return <IncomesPage onLogout={handleLogout} onNavigate={setFinanceSection} user={user} />
  }

  return <ExpensesPage onLogout={handleLogout} onNavigate={setFinanceSection} user={user} />
}
