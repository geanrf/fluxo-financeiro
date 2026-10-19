import { useEffect, useMemo, useState } from 'react'
import type { User } from '../auth/types'
import { FinanceShell, type FinanceSection } from '../finance/FinanceShell'
import { apiRequest, errorMessage } from '../../shared/api/apiClient'
import { Icon } from '../../shared/ui/Icon'
import { ExpenseCategoryChart } from './ExpenseCategoryChart'
import { FinancialTrendChart } from './FinancialTrendChart'
import type { DashboardSummary } from './types'

type PeriodPreset = 'month' | 'three-months' | 'six-months' | 'year'

const presets: Array<{ id: PeriodPreset; label: string }> = [
  { id: 'month', label: 'Mês atual' },
  { id: 'three-months', label: '3 meses' },
  { id: 'six-months', label: '6 meses' },
  { id: 'year', label: 'Este ano' },
]

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
})

const periodDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function isoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function periodDates(preset: PeriodPreset) {
  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), 1)

  if (preset === 'three-months') from.setMonth(from.getMonth() - 2)
  if (preset === 'six-months') from.setMonth(from.getMonth() - 5)
  if (preset === 'year') from.setMonth(0)

  return { from: isoDate(from), to: isoDate(today) }
}

function formatTransactionDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00`)).replace('.', '')
}

function formatPeriodDate(value: string) {
  return periodDateFormatter.format(new Date(`${value}T12:00:00`)).replace('.', '')
}

function SummarySkeleton() {
  return (
    <div aria-label="Carregando indicadores" className="dashboard-loading" role="status">
      <div className="summary-grid dashboard-summary-grid">
        {[0, 1, 2, 3].map((item) => <span className="skeleton skeleton--card" key={item} />)}
      </div>
      <div className="dashboard-charts-grid">
        <span className="skeleton skeleton--chart" />
        <span className="skeleton skeleton--chart" />
      </div>
    </div>
  )
}

export function DashboardPage({
  user,
  onLogout,
  onNavigate,
}: {
  user: User
  onLogout: () => void
  onNavigate: (section: FinanceSection) => void
}) {
  const [preset, setPreset] = useState<PeriodPreset>('month')
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const period = useMemo(() => periodDates(preset), [preset])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    apiRequest<DashboardSummary>(`/dashboard?from=${period.from}&to=${period.to}`, {
      signal: controller.signal,
    })
      .then(setSummary)
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(errorMessage(requestError))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [period, reloadKey])

  const firstName = user.name.split(/\s+/)[0]
  const hasPeriodData = summary
    ? Number(summary.periodIncome) > 0 || Number(summary.periodExpense) > 0
    : false
  const periodLabel = `${formatPeriodDate(period.from)} — ${formatPeriodDate(period.to)}`
  const isSingleMonth = preset === 'month'

  return (
    <FinanceShell activeSection="dashboard" onLogout={onLogout} onNavigate={onNavigate} user={user}>
      <main className="dashboard dashboard-page" id="visao-geral">
        <header className="dashboard__header dashboard-hero">
          <div>
            <span className="eyebrow">Visão geral</span>
            <h1>Olá, {firstName}</h1>
            <p>Seu dinheiro, traduzido em decisões mais claras.</p>
          </div>
          <div className="dashboard-period-caption">
            <span>Período analisado</span>
            <strong>{periodLabel}</strong>
          </div>
        </header>

        <section aria-label="Filtrar dashboard por período" className="period-filter">
          <div>
            <span className="period-filter__label">Período</span>
            <div className="period-filter__options">
              {presets.map((option) => (
                <button
                  aria-pressed={preset === option.id}
                  className={preset === option.id ? 'active' : ''}
                  key={option.id}
                  onClick={() => setPreset(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <span className="period-filter__hint">Indicadores calculados com seus lançamentos reais</span>
        </section>

        {error && !summary ? (
          <section className="dashboard-error" role="alert">
            <span className="empty-state__icon"><Icon name="x" size={26} /></span>
            <div><h2>Não foi possível carregar o dashboard</h2><p>{error}</p></div>
            <button className="button button--ghost" onClick={() => setReloadKey((value) => value + 1)} type="button">Tentar novamente</button>
          </section>
        ) : loading && !summary ? (
          <SummarySkeleton />
        ) : summary ? (
          <>
            {error && <div className="form-alert dashboard-inline-alert" role="alert">{error}</div>}

            <section aria-label="Indicadores financeiros" className="summary-grid dashboard-summary-grid">
              <article className="summary-card summary-card--balance dashboard-balance-card">
                <div className="summary-card__label"><span className="summary-icon"><Icon name="wallet" /></span> Saldo total</div>
                <strong className={Number(summary.totalBalance) < 0 ? 'negative' : ''}>{currency.format(summary.totalBalance)}</strong>
                <small>Todo o seu histórico financeiro</small>
                <div className="balance-glow" />
              </article>
              <article className="summary-card">
                <div className="summary-card__label"><span className="summary-icon income"><Icon name="arrow-up" /></span> {isSingleMonth ? 'Receitas do mês' : 'Receitas no período'}</div>
                <strong className="positive">{currency.format(summary.periodIncome)}</strong>
                <small>Entradas confirmadas</small>
              </article>
              <article className="summary-card">
                <div className="summary-card__label"><span className="summary-icon expense"><Icon name="arrow-down" /></span> {isSingleMonth ? 'Despesas do mês' : 'Despesas no período'}</div>
                <strong className="negative">{currency.format(summary.periodExpense)}</strong>
                <small>Saídas registradas</small>
              </article>
              <article className="summary-card result-card">
                <div className="summary-card__label"><span className="summary-icon"><Icon name="chart" /></span> {isSingleMonth ? 'Resultado mensal' : 'Resultado do período'}</div>
                <strong className={Number(summary.periodResult) < 0 ? 'negative' : 'positive'}>{currency.format(summary.periodResult)}</strong>
                <small>{Number(summary.periodResult) >= 0 ? 'Período com saldo positivo' : 'Despesas acima das receitas'}</small>
              </article>
            </section>

            <section className="dashboard-charts-grid">
              <article className="chart-panel chart-panel--wide">
                <header className="chart-panel__header">
                  <div><span className="eyebrow">Evolução</span><h2>Receitas e despesas</h2></div>
                  <span>{periodLabel}</span>
                </header>
                {hasPeriodData ? <FinancialTrendChart data={summary.monthlySummary} /> : <DashboardEmpty title="Sem movimentações no período" description="Cadastre uma receita ou despesa para visualizar a evolução mensal." />}
              </article>

              <article className="chart-panel">
                <header className="chart-panel__header">
                  <div><span className="eyebrow">Distribuição</span><h2>Despesas por categoria</h2></div>
                </header>
                {summary.expenseCategories.length > 0 ? <ExpenseCategoryChart data={summary.expenseCategories} /> : <DashboardEmpty title="Nenhuma despesa" description="As categorias aparecerão aqui quando houver despesas no período." />}
              </article>
            </section>

            <section className="transactions-panel dashboard-recent-panel">
              <header className="panel-header dashboard-recent-header">
                <div><span className="eyebrow">Atividade recente</span><h2>Últimas movimentações</h2></div>
                <div className="quick-actions">
                  <button onClick={() => onNavigate('incomes')} type="button"><Icon name="arrow-up" size={16} /> Nova receita</button>
                  <button onClick={() => onNavigate('expenses')} type="button"><Icon name="arrow-down" size={16} /> Nova despesa</button>
                </div>
              </header>
              {summary.recentTransactions.length === 0 ? (
                <DashboardEmpty title="Seu histórico começa aqui" description="Use os atalhos acima para registrar sua primeira movimentação neste período." />
              ) : (
                <div className="transaction-list">
                  {summary.recentTransactions.map((transaction) => (
                    <article className="transaction-row dashboard-transaction" key={transaction.id}>
                      <span className={`transaction-row__icon ${transaction.type.toLowerCase()}`}><Icon name={transaction.type === 'INCOME' ? 'arrow-up' : 'arrow-down'} size={19} /></span>
                      <div className="transaction-row__main"><strong>{transaction.description}</strong><span>{transaction.category}</span></div>
                      <time dateTime={transaction.date}>{formatTransactionDate(transaction.date)}</time>
                      <strong className={`transaction-row__amount ${transaction.type.toLowerCase()}`}>
                        {transaction.type === 'INCOME' ? '+' : '−'} {currency.format(transaction.amount)}
                      </strong>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </FinanceShell>
  )
}

function DashboardEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="dashboard-empty">
      <span className="empty-state__icon"><Icon name="chart" size={26} /></span>
      <div><h3>{title}</h3><p>{description}</p></div>
    </div>
  )
}
