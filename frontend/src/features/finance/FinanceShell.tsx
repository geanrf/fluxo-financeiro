import type { ReactNode } from 'react'
import type { User } from '../auth/types'
import { Icon } from '../../shared/ui/Icon'

export type FinanceSection = 'dashboard' | 'expenses' | 'incomes'

type FinanceShellProps = {
  activeSection: FinanceSection
  children: ReactNode
  user: User
  onLogout: () => void
  onNavigate: (section: FinanceSection) => void
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function FinanceShell({
  activeSection,
  children,
  user,
  onLogout,
  onNavigate,
}: FinanceShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark"><Icon name="wallet" size={22} /></span>
          <span>Fluxo</span>
        </div>

        <nav aria-label="Navegação principal">
          <button
            className={activeSection === 'dashboard' ? 'active' : ''}
            onClick={() => onNavigate('dashboard')}
            type="button"
          >
            <span><Icon name="chart" size={17} /></span> Visão geral
          </button>
          <button
            className={activeSection === 'expenses' ? 'active' : ''}
            onClick={() => onNavigate('expenses')}
            type="button"
          >
            <span><Icon name="arrow-down" size={17} /></span> Despesas
          </button>
          <button
            className={activeSection === 'incomes' ? 'active' : ''}
            onClick={() => onNavigate('incomes')}
            type="button"
          >
            <span><Icon name="arrow-up" size={17} /></span> Receitas
          </button>
        </nav>

        <div className="sidebar__account">
          <span className="avatar">{initials(user.name)}</span>
          <div><strong>{user.name}</strong><small>{user.email}</small></div>
          <button aria-label="Sair" className="icon-button" onClick={onLogout} title="Sair" type="button">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      {children}
    </div>
  )
}
