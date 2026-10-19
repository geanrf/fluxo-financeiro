import { useEffect, useMemo, useState } from 'react'
import type { User } from '../auth/types'
import { apiRequest, errorMessage } from '../../shared/api/apiClient'
import { Icon } from '../../shared/ui/Icon'
import { FinanceShell, type FinanceSection } from '../finance/FinanceShell'
import { DeleteExpenseDialog } from './DeleteExpenseDialog'
import { ExpenseForm } from './ExpenseForm'
import type { Expense, ExpensePayload } from './types'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00`)).replace('.', '')
}

function isCurrentMonth(date: string) {
  const expenseDate = new Date(`${date}T12:00:00`)
  const now = new Date()
  return expenseDate.getMonth() === now.getMonth()
    && expenseDate.getFullYear() === now.getFullYear()
}

export function ExpensesPage({
  user,
  onLogout,
  onNavigate,
}: {
  user: User
  onLogout: () => void
  onNavigate: (section: FinanceSection) => void
}) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [query, setQuery] = useState('')
  const [pageError, setPageError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)

  async function loadExpenses() {
    try {
      const data = await apiRequest<Expense[]>('/expenses')
      setExpenses(data)
      setPageError(null)
    } catch (requestError) {
      setPageError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadExpenses()
  }, [])

  const summary = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    const monthTotal = expenses
      .filter((expense) => isCurrentMonth(expense.date))
      .reduce((sum, expense) => sum + Number(expense.amount), 0)
    const categoryCount = new Set(expenses.map((expense) => expense.category.toLocaleLowerCase('pt-BR'))).size
    return { total, monthTotal, categoryCount }
  }, [expenses])

  const visibleExpenses = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    if (!normalizedQuery) return expenses
    return expenses.filter((expense) =>
      expense.description.toLocaleLowerCase('pt-BR').includes(normalizedQuery)
      || expense.category.toLocaleLowerCase('pt-BR').includes(normalizedQuery),
    )
  }, [expenses, query])

  function openCreate() {
    setEditing(null)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(expense: Expense) {
    setEditing(expense)
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    if (saving) return
    setFormOpen(false)
    setEditing(null)
    setFormError(null)
  }

  async function saveExpense(payload: ExpensePayload) {
    setSaving(true)
    setFormError(null)
    try {
      await apiRequest<Expense>(editing ? `/expenses/${editing.id}` : '/expenses', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      setFormOpen(false)
      setEditing(null)
      await loadExpenses()
    } catch (requestError) {
      setFormError(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  function askToDelete(expense: Expense) {
    setExpenseToDelete(expense)
    setDeleteError(null)
  }

  async function deleteExpense() {
    if (!expenseToDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await apiRequest<void>(`/expenses/${expenseToDelete.id}`, { method: 'DELETE' })
      setExpenses((current) => current.filter((expense) => expense.id !== expenseToDelete.id))
      setExpenseToDelete(null)
    } catch (requestError) {
      setDeleteError(errorMessage(requestError))
    } finally {
      setDeleting(false)
    }
  }

  const firstName = user.name.split(/\s+/)[0]
  const currentMonth = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())

  return (
    <FinanceShell activeSection="expenses" onLogout={onLogout} onNavigate={onNavigate} user={user}>
      <main className="dashboard" id="despesas">
        <header className="dashboard__header">
          <div>
            <span className="eyebrow">{currentMonth}</span>
            <h1>Despesas de {firstName}</h1>
            <p>Registre seus gastos e mantenha cada valor sob controle.</p>
          </div>
          <button className="button button--primary" onClick={openCreate} type="button">
            <Icon name="plus" size={18} /> Nova despesa
          </button>
        </header>

        <section className="summary-grid" aria-label="Resumo das despesas">
          <article className="summary-card summary-card--balance expense-highlight">
            <div className="summary-card__label"><span className="summary-icon expense"><Icon name="arrow-down" /></span> Total registrado</div>
            <strong>{currency.format(summary.total)}</strong>
            <small>Em todo o seu histórico</small>
            <div className="balance-glow" />
          </article>
          <article className="summary-card">
            <div className="summary-card__label"><span className="summary-icon"><Icon name="wallet" /></span> Neste mês</div>
            <strong>{currency.format(summary.monthTotal)}</strong>
            <small>{expenses.filter((expense) => isCurrentMonth(expense.date)).length} despesas no período</small>
          </article>
          <article className="summary-card">
            <div className="summary-card__label"><span className="summary-icon"><Icon name="wallet" /></span> Categorias</div>
            <strong>{summary.categoryCount}</strong>
            <small>{expenses.length} despesas cadastradas</small>
          </article>
        </section>

        <section className="transactions-panel expense-panel">
          <header className="panel-header expense-panel__header">
            <div>
              <span className="eyebrow">Histórico real</span>
              <h2>Suas despesas</h2>
            </div>
            <label className="expense-search">
              <span>Buscar</span>
              <input
                aria-label="Buscar por descrição ou categoria"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Descrição ou categoria"
                type="search"
                value={query}
              />
            </label>
          </header>

          {pageError && <div className="form-alert panel-alert" role="alert">{pageError}</div>}

          {loading ? (
            <div className="empty-state"><span className="loader" /><p>Carregando suas despesas…</p></div>
          ) : visibleExpenses.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon"><Icon name="wallet" size={30} /></span>
              <h3>{expenses.length === 0 ? 'Cadastre sua primeira despesa' : 'Nenhuma despesa encontrada'}</h3>
              <p>{expenses.length === 0 ? 'Comece registrando um gasto real. Seus dados ficarão vinculados somente à sua conta.' : 'Tente buscar por outra descrição ou categoria.'}</p>
              {expenses.length === 0 && <button className="button button--primary" onClick={openCreate} type="button"><Icon name="plus" size={18} /> Cadastrar despesa</button>}
            </div>
          ) : (
            <div className="expense-table-wrapper">
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Data</th>
                    <th className="align-right">Valor</th>
                    <th><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td data-label="Descrição"><strong>{expense.description}</strong></td>
                      <td data-label="Categoria"><span className="category-badge">{expense.category}</span></td>
                      <td data-label="Data"><time dateTime={expense.date}>{formatDate(expense.date)}</time></td>
                      <td className="expense-amount" data-label="Valor">− {currency.format(Number(expense.amount))}</td>
                      <td className="expense-actions">
                        <button aria-label={`Editar ${expense.description}`} className="icon-button" onClick={() => openEdit(expense)} title="Editar" type="button"><Icon name="edit" size={17} /></button>
                        <button aria-label={`Excluir ${expense.description}`} className="icon-button icon-button--danger" onClick={() => askToDelete(expense)} title="Excluir" type="button"><Icon name="trash" size={17} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {formOpen && (
        <ExpenseForm
          expense={editing}
          onClose={closeForm}
          onSave={saveExpense}
          saving={saving}
          serverError={formError}
        />
      )}

      {expenseToDelete && (
        <DeleteExpenseDialog
          deleting={deleting}
          error={deleteError}
          expense={expenseToDelete}
          onCancel={() => !deleting && setExpenseToDelete(null)}
          onConfirm={deleteExpense}
        />
      )}
    </FinanceShell>
  )
}
