import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../../shared/ui/Icon'
import type { Income, IncomePayload } from './types'

const categories = [
  'Benefícios',
  'Freelance',
  'Investimentos',
  'Outros',
  'Reembolsos',
  'Salário',
  'Serviços',
  'Vendas',
]

type IncomeFormProps = {
  income: Income | null
  saving: boolean
  serverError: string | null
  onClose: () => void
  onSave: (payload: IncomePayload) => Promise<void>
}

function today() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

export function IncomeForm({ income, saving, serverError, onClose, onSave }: IncomeFormProps) {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
  }, [income])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, saving])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const form = new FormData(event.currentTarget)
    const description = String(form.get('description') ?? '').trim()
    const category = String(form.get('category') ?? '').trim()
    const amount = Number(String(form.get('amount') ?? '').replace(',', '.'))
    const date = String(form.get('date') ?? '')

    if (!description || !category || !date) {
      setError('Preencha descrição, categoria e data.')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor maior que zero.')
      return
    }

    await onSave({ description, amount, category, date })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-labelledby="income-form-title" aria-modal="true" className="modal" role="dialog">
        <header className="modal__header">
          <div>
            <span className="eyebrow">Entradas financeiras</span>
            <h2 id="income-form-title">{income ? 'Editar receita' : 'Nova receita'}</h2>
          </div>
          <button aria-label="Fechar" className="icon-button" disabled={saving} onClick={onClose} type="button">
            <Icon name="x" />
          </button>
        </header>

        <form className="transaction-form income-form" onSubmit={handleSubmit}>
          <label className="field-wide">
            Descrição
            <input
              autoFocus
              defaultValue={income?.description}
              maxLength={120}
              name="description"
              placeholder="Ex.: Salário mensal"
              required
            />
          </label>

          <div className="form-grid">
            <label>
              Valor
              <div className="money-input">
                <span>R$</span>
                <input
                  defaultValue={income?.amount.toFixed(2)}
                  inputMode="decimal"
                  min="0.01"
                  name="amount"
                  placeholder="0,00"
                  required
                  step="0.01"
                  type="number"
                />
              </div>
            </label>

            <label>
              Data
              <input defaultValue={income?.date ?? today()} name="date" required type="date" />
            </label>
          </div>

          <label className="field-wide">
            Categoria
            <input
              defaultValue={income?.category}
              list="income-categories"
              maxLength={60}
              name="category"
              placeholder="Escolha ou digite uma categoria"
              required
            />
            <datalist id="income-categories">
              {categories.map((category) => <option key={category} value={category} />)}
            </datalist>
          </label>

          {(error || serverError) && <div className="form-alert" role="alert">{error ?? serverError}</div>}

          <footer className="modal__footer">
            <button className="button button--ghost" disabled={saving} onClick={onClose} type="button">Cancelar</button>
            <button className="button button--income" disabled={saving} type="submit">
              {saving ? 'Salvando…' : income ? 'Salvar alterações' : 'Cadastrar receita'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
