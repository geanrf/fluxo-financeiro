import { useEffect, useMemo, useState } from 'react'
import type { User } from '../auth/types'
import { apiRequest, errorMessage } from '../../shared/api/apiClient'
import { Icon } from '../../shared/ui/Icon'
import { TransactionForm } from './TransactionForm'
import type {
  FinancialTransaction,
  TransactionPayload,
  TransactionType,
} from './types'

type Filter = 'ALL' | TransactionType

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
})

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00`)).replace('.', '')
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [filter, setFilter] = useState<Filter>('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<FinancialTransaction | null>(null)

  async function loadTransactions() {
    try {
      const data = await apiRequest<FinancialTransaction[]>('/transactions')
      setTransactions(data)
      setPageError(null)
    } catch (requestError) {
      setPageError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTransactions()
  }, [])

  const summary = useMemo(() => {
    return transactions.reduce(
      (totals, transaction) => {
        if (transaction.type === 'INCOME') totals.income += Number(transaction.amount)
        else totals.expense += Number(transaction.amount)
        totals.balance = totals.income - totals.expense
        return totals
      },
      { income: 0, expense: 0, balance: 0 },
    )
  }, [transactions])

  const visibleTransactions = useMemo(
    () => transactions.filter((transaction) => filter === 'ALL' || transaction.type === filter),
    [filter, transactions],
  )

  function openCreate() {
    setEditing(null)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(transaction: FinancialTransaction) {
    setEditing(transaction)
    setFormError(null)
    setFormOpen(true)
  }

  async function saveTransaction(payload: TransactionPayload) {
    setSaving(true)
    setFormError(null)
    try {
      await apiRequest<FinancialTransaction>(
        editing ? `/transactions/${editing.id}` : '/transactions',
        {
          method: editing ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        },
      )
      setFormOpen(false)
      setEditing(null)
      await loadTransactions()
    } catch (requestError) {
      setFormError(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  async function deleteTransaction(transaction: FinancialTransaction) {
    const confirmed = window.confirm(`Excluir “${transaction.description}”? Esta ação não pode ser desfeita.`)
    if (!confirmed) return

    try {
      await apiRequest<void>(`/transactions/${transaction.id}`, { method: 'DELETE' })
      setTransactions((current) => current.filter((item) => item.id !== transaction.id))
      setPageError(null)
    } catch (requestError) {
      setPageError(errorMessage(requestError))
    }
  }

  const firstName = user.name.split(/\s+/)[0]
  const currentMonth = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark"><Icon name="wallet" size={22} /></span>
          <span>Fluxo</span>
        </div>

        <nav aria-label="Navegação principal">
          <a className="active" href="#inicio"><span>⌁</span> Visão geral</a>
          <a href="#movimentacoes"><span>↕</span> Movimentações</a>
        </nav>

        <div className="sidebar__account">
          <span className="avatar">{initials(user.name)}</span>
          <div><strong>{user.name}</strong><small>{user.email}</small></div>
          <button aria-label="Sair" className="icon-button" onClick={onLogout} title="Sair" type="button">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      <main className="dashboard" id="inicio">
        <header className="dashboard__header">
          <div>
            <span className="eyebrow">{currentMonth}</span>
            <h1>Olá, {firstName} <span aria-hidden="true">👋</span></h1>
            <p>Aqui está o panorama da sua vida financeira.</p>
          </div>
          <button className="button button--primary" onClick={openCreate} type="button">
            <Icon name="plus" size={18} /> Novo lançamento
          </button>
        </header>

        <section className="summary-grid" aria-label="Resumo financeiro">
          <article className="summary-card summary-card--balance">
            <div className="summary-card__label"><span className="summary-icon"><Icon name="wallet" /></span> Saldo atual</div>
            <strong className={summary.balance < 0 ? 'negative' : ''}>{currency.format(summary.balance)}</strong>
            <small>Receitas menos despesas</small>
            <div className="balance-glow" />
          </article>
          <article className="summary-card">
            <div className="summary-card__label"><span className="summary-icon income"><Icon name="arrow-up" /></span> Receitas</div>
            <strong>{currency.format(summary.income)}</strong>
            <small>{transactions.filter((item) => item.type === 'INCOME').length} lançamentos</small>
          </article>
          <article className="summary-card">
            <div className="summary-card__label"><span className="summary-icon expense"><Icon name="arrow-down" /></span> Despesas</div>
            <strong>{currency.format(summary.expense)}</strong>
            <small>{transactions.filter((item) => item.type === 'EXPENSE').length} lançamentos</small>
          </article>
        </section>

        <section className="transactions-panel" id="movimentacoes">
          <header className="panel-header">
            <div>
              <span className="eyebrow">Seu histórico</span>
              <h2>Movimentações</h2>
            </div>
            <div className="filter-tabs" aria-label="Filtrar movimentações">
              {([
                ['ALL', 'Todas'],
                ['INCOME', 'Receitas'],
                ['EXPENSE', 'Despesas'],
              ] as const).map(([value, label]) => (
                <button className={filter === value ? 'active' : ''} key={value} onClick={() => setFilter(value)} type="button">
                  {label}
                </button>
              ))}
            </div>
          </header>

          {pageError && <div className="form-alert panel-alert" role="alert">{pageError}</div>}

          {loading ? (
            <div className="empty-state"><span className="loader" /><p>Carregando suas movimentações…</p></div>
          ) : visibleTransactions.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon"><Icon name="wallet" size={30} /></span>
              <h3>{transactions.length === 0 ? 'Seu controle começa aqui' : 'Nenhum item neste filtro'}</h3>
              <p>{transactions.length === 0 ? 'Adicione sua primeira receita ou despesa para visualizar o resumo.' : 'Experimente selecionar outro tipo de movimentação.'}</p>
              {transactions.length === 0 && <button className="button button--primary" onClick={openCreate} type="button"><Icon name="plus" size={18} /> Adicionar lançamento</button>}
            </div>
          ) : (
            <div className="transaction-list">
              {visibleTransactions.map((transaction) => (
                <article className="transaction-row" key={transaction.id}>
                  <div className={`transaction-row__icon ${transaction.type.toLowerCase()}`}>
                    <Icon name={transaction.type === 'INCOME' ? 'arrow-up' : 'arrow-down'} size={19} />
                  </div>
                  <div className="transaction-row__main">
                    <strong>{transaction.description}</strong>
                    <span>{transaction.category}{transaction.notes ? ` · ${transaction.notes}` : ''}</span>
                  </div>
                  <time dateTime={transaction.date}>{formatDate(transaction.date)}</time>
                  <strong className={`transaction-row__amount ${transaction.type.toLowerCase()}`}>
                    {transaction.type === 'INCOME' ? '+' : '−'} {currency.format(Number(transaction.amount))}
                  </strong>
                  <div className="row-actions">
                    <button aria-label={`Editar ${transaction.description}`} className="icon-button" onClick={() => openEdit(transaction)} type="button"><Icon name="edit" size={17} /></button>
                    <button aria-label={`Excluir ${transaction.description}`} className="icon-button icon-button--danger" onClick={() => void deleteTransaction(transaction)} type="button"><Icon name="trash" size={17} /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {formOpen && (
        <TransactionForm
          onClose={() => setFormOpen(false)}
          onSave={saveTransaction}
          saving={saving}
          serverError={formError}
          transaction={editing}
        />
      )}
    </div>
  )
}
