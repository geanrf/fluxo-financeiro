import type { MonthlySummary } from './types'

const compactCurrency = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
  style: 'currency',
  currency: 'BRL',
})

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' })

function monthLabel(value: string) {
  const [year, month] = value.split('-').map(Number)
  return monthFormatter.format(new Date(year, month - 1, 10)).replace('.', '')
}

export function FinancialTrendChart({ data }: { data: MonthlySummary[] }) {
  const width = 760
  const height = 280
  const top = 24
  const bottom = 48
  const left = 58
  const right = 18
  const chartHeight = height - top - bottom
  const chartWidth = width - left - right
  const maximum = Math.max(1, ...data.flatMap((item) => [Number(item.income), Number(item.expense)]))
  const groupWidth = chartWidth / Math.max(data.length, 1)
  const barWidth = Math.min(30, groupWidth * 0.27)

  return (
    <div className="trend-chart">
      <div className="chart-legend" aria-hidden="true">
        <span><i className="legend-dot legend-dot--income" /> Receitas</span>
        <span><i className="legend-dot legend-dot--expense" /> Despesas</span>
      </div>
      <svg aria-label="Comparação mensal entre receitas e despesas" role="img" viewBox={`0 0 ${width} ${height}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = top + chartHeight * ratio
          const value = maximum * (1 - ratio)
          return (
            <g key={ratio}>
              <line className="chart-grid-line" x1={left} x2={width - right} y1={y} y2={y} />
              <text className="chart-axis-label" textAnchor="end" x={left - 10} y={y + 4}>{compactCurrency.format(value)}</text>
            </g>
          )
        })}

        {data.map((item, index) => {
          const center = left + groupWidth * index + groupWidth / 2
          const incomeHeight = (Number(item.income) / maximum) * chartHeight
          const expenseHeight = (Number(item.expense) / maximum) * chartHeight
          return (
            <g key={item.month}>
              <rect
                className="chart-bar chart-bar--income"
                height={incomeHeight}
                rx="5"
                width={barWidth}
                x={center - barWidth - 3}
                y={top + chartHeight - incomeHeight}
              >
                <title>{`Receitas em ${monthLabel(item.month)}: ${compactCurrency.format(item.income)}`}</title>
              </rect>
              <rect
                className="chart-bar chart-bar--expense"
                height={expenseHeight}
                rx="5"
                width={barWidth}
                x={center + 3}
                y={top + chartHeight - expenseHeight}
              >
                <title>{`Despesas em ${monthLabel(item.month)}: ${compactCurrency.format(item.expense)}`}</title>
              </rect>
              <text className="chart-month-label" textAnchor="middle" x={center} y={height - 17}>{monthLabel(item.month)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
