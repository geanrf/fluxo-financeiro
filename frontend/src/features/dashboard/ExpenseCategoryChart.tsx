import type { CSSProperties } from 'react'
import type { CategorySummary } from './types'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const colors = ['#22d3ee', '#fb7185', '#f59e0b', '#a78bfa', '#34d399', '#60a5fa', '#f472b6']

export function ExpenseCategoryChart({ data }: { data: CategorySummary[] }) {
  const total = data.reduce((sum, item) => sum + Number(item.amount), 0)
  let cursor = 0
  const stops = data.map((item, index) => {
    const start = cursor
    const share = total > 0 ? (Number(item.amount) / total) * 100 : 0
    cursor += share
    return `${colors[index % colors.length]} ${start}% ${cursor}%`
  })
  const donutStyle = { '--category-gradient': `conic-gradient(${stops.join(', ')})` } as CSSProperties

  return (
    <div className="category-chart">
      <div className="category-donut" style={donutStyle}>
        <div><strong>{currency.format(total)}</strong><span>Total</span></div>
      </div>
      <ul className="category-legend">
        {data.map((item, index) => {
          const percentage = total > 0 ? (Number(item.amount) / total) * 100 : 0
          return (
            <li key={item.category}>
              <i style={{ background: colors[index % colors.length] }} />
              <span><strong>{item.category}</strong><small>{percentage.toFixed(1)}%</small></span>
              <b>{currency.format(item.amount)}</b>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
