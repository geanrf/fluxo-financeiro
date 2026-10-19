import { useEffect, useMemo, useState } from 'react'
import type { User } from '../auth/types'
import { FinanceShell, type FinanceSection } from '../finance/FinanceShell'
import { apiRequest, errorMessage } from '../../shared/api/apiClient'
import { Icon } from '../../shared/ui/Icon'
import { DeleteIncomeDialog } from './DeleteIncomeDialog'
import { IncomeForm } from './IncomeForm'
import type { Income, IncomePayload } from './types'

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
  const incomeDate = new Date(`${date}T12:00:00`)
  const now = new Date()
  return incomeDate.getMonth() === now.getMonth()
    && incomeDate.getFullYear() === now.getFullYear()
}

export function IncomesPage({
  user,
  onLogout,
  onNavigate,
}: {
  user: User
  onLogout: () => void
  onNavigate: (section: FinanceSection) => void
}) {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [query, setQuery] = useState('')
  const [pageError, setPageError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Income | null>(null)
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null)

  async function loadIncomes() {
    try {
      const data = await apiRequest<Income[]>('/incomes')
      setIncomes(data)
      setPageError(null)
    } catch (requestError) {
      setPageError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadIncomes()
  }, [])

  const summary = useMemo(() => {
    const total = incomes.reduce((sum, income) => sum + Number(income.amount), 0)
    const monthTotal = incomes
      .filter((income) => isCurrentMonth(income.date))
      .reduce((sum, income) => sum + Number(income.amount), 0)
    const categoryCount = new Set(incomes.map((income) => income.category.toLocaleLowerCase('pt-BR'))).size
    return { total, monthTotal, categoryCount }
  }, [incomes])

  const visibleIncomes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    if (!normalizedQuery) return incomes
    return incomes.filter((income) =>
      income.description.toLocaleLowerCase('pt-BR').includes(normalizedQuery)
      || income.category.toLocaleLowerCase('pt-BR').includes(normalizedQuery),
    )
  }, [incomes, query])

  function openCreate() {
    setEditing(null)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(income: Income) {
    setEditing(income)
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    if (saving) return
    setFormOpen(false)
    setEditing(null)
    setFormError(null)
  }

  async function saveIncome(payload: IncomePayload) {
    setSaving(true)
    setFormError(null)
    try {
      await apiRequest<Income>(editing ? `/incomes/${editing.id}` : '/incomes', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      setFormOpen(false)
      setEditing(null)
      await loadIncomes()
    } catch (requestError) {
      setFormError(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  function askToDelete(income: Income) {
    setIncomeToDelete(income)
    setDeleteError(null)
  }

  async function deleteIncome() {
    if (!incomeToDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await apiRequest<void>(`/incomes/${incomeToDelete.id}`, { method: 'DELETE' })
      setIncomes((current) => current.filter((income) => income.id !== incomeToDelete.id))
      setIncomeToDelete(null)
    } catch (requestError) {
      setDeleteError(errorMessage(requestError))
    } finally {
      setDeleting(false)
    }
  }

  const firstName = user.name.split(/\s+/)[0]
  const currentMonth = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())

  return (
    <FinanceShell activeSection="incomes" onLogout={onLogout} onNavigate={onNavigate} user={user}>
      <main className="dashboard" id="receitas">
        <header className="dashboard__header">
          <div>
            <span className="eyebrow">{currentMonth}</span>
            <h1>Receitas de {firstName}</h1>
            <p>Registre suas entradas e acompanhe a evolução da sua renda.</p>
          </div>
          <button className="button button--income" onClick={openCreate} type="button">
            <Icon name="plus" size={18} /> Nova receita
          </button>
        </header>

        <section className="summary-grid" aria-label="Resumo das receitas">
          <article className="summary-card summary-card--balance income-highlight">
            <div className="summary-card__label"><span className="summary-icon income"><Icon name="arrow-up" /></span> Total recebido</div>
            <strong>{currency.format(summary.total)}</strong>
            <small>Em todo o seu histórico</small>
            <div className="balance-glow" />
          </article>
          <article className="summary-card">
            <div className="summary-card__label"><span className="summary-icon income"><Icon name="arrow-up" /></span> Neste mês</div>
            <strong>{currency.format(summary.monthTotal)}</strong>
            <small>{incomes.filter((income) => isCurrentMonth(income.date)).length} receitas no período</small>
          </article>
          <article className="summary-card">
            <div className="summary-card__label"><span className="summary-icon"><Icon name="wallet" /></span> Categorias</div>
            <strong>{summary.categoryCount}</strong>
            <small>{incomes.length} receitas cadastradas</small>
          </article>
        </section>

        <section className="transactions-panel expense-panel income-panel">
          <header className="panel-header expense-panel__header">
            <div>
              <span className="eyebrow">Histórico real</span>
              <h2>Suas receitas</h2>
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
            <div className="empty-state"><span className="loader" /><p>Carregando suas receitas…</p></div>
          ) : visibleIncomes.length === 0 ? (
            <div className="empty-state income-empty-state">
              <span className="empty-state__icon"><Icon name="arrow-up" size={30} /></span>
              <h3>{incomes.length === 0 ? 'Cadastre sua primeira receita' : 'Nenhuma receita encontrada'}</h3>
              <p>{incomes.length === 0 ? 'Comece registrando uma entrada real. Os dados ficarão vinculados somente à sua conta.' : 'Tente buscar por outra descrição ou categoria.'}</p>
              {incomes.length === 0 && <button className="button button--income" onClick={openCreate} type="button"><Icon name="plus" size={18} /> Cadastrar receita</button>}
            </div>
          ) : (
            <div className="expense-table-wrapper">
              <table className="expense-table income-table">
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
                  {visibleIncomes.map((income) => (
                    <tr key={income.id}>
                      <td data-label="Descrição"><strong>{income.description}</strong></td>
                      <td data-label="Categoria"><span className="category-badge income-category-badge">{income.category}</span></td>
                      <td data-label="Data"><time dateTime={income.date}>{formatDate(income.date)}</time></td>
                      <td className="income-amount" data-label="Valor">+ {currency.format(Number(income.amount))}</td>
                      <td className="expense-actions">
                        <button aria-label={`Editar ${income.description}`} className="icon-button" onClick={() => openEdit(income)} title="Editar" type="button"><Icon name="edit" size={17} /></button>
                        <button aria-label={`Excluir ${income.description}`} className="icon-button icon-button--danger" onClick={() => askToDelete(income)} title="Excluir" type="button"><Icon name="trash" size={17} /></button>
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
        <IncomeForm
          income={editing}
          onClose={closeForm}
          onSave={saveIncome}
          saving={saving}
          serverError={formError}
        />
      )}

      {incomeToDelete && (
        <DeleteIncomeDialog
          deleting={deleting}
          error={deleteError}
          income={incomeToDelete}
          onCancel={() => !deleting && setIncomeToDelete(null)}
          onConfirm={deleteIncome}
        />
      )}
    </FinanceShell>
  )
}
