import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../../shared/ui/Icon'
import type { Expense, ExpensePayload } from './types'

const categories = [
  'Alimentação',
  'Assinaturas',
  'Casa',
  'Educação',
  'Lazer',
  'Outros',
  'Saúde',
  'Transporte',
]

type ExpenseFormProps = {
  expense: Expense | null
  saving: boolean
  serverError: string | null
  onClose: () => void
  onSave: (payload: ExpensePayload) => Promise<void>
}

function today() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

export function ExpenseForm({ expense, saving, serverError, onClose, onSave }: ExpenseFormProps) {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
  }, [expense])

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
      <section aria-labelledby="expense-form-title" aria-modal="true" className="modal" role="dialog">
        <header className="modal__header">
          <div>
            <span className="eyebrow">Controle de gastos</span>
            <h2 id="expense-form-title">{expense ? 'Editar despesa' : 'Nova despesa'}</h2>
          </div>
          <button aria-label="Fechar" className="icon-button" disabled={saving} onClick={onClose} type="button">
            <Icon name="x" />
          </button>
        </header>

        <form className="transaction-form expense-form" onSubmit={handleSubmit}>
          <label className="field-wide">
            Descrição
            <input
              autoFocus
              defaultValue={expense?.description}
              maxLength={120}
              name="description"
              placeholder="Ex.: Supermercado do mês"
              required
            />
          </label>

          <div className="form-grid">
            <label>
              Valor
              <div className="money-input">
                <span>R$</span>
                <input
                  defaultValue={expense?.amount.toFixed(2)}
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
              <input defaultValue={expense?.date ?? today()} name="date" required type="date" />
            </label>
          </div>

          <label className="field-wide">
            Categoria
            <input
              defaultValue={expense?.category}
              list="expense-categories"
              maxLength={60}
              name="category"
              placeholder="Escolha ou digite uma categoria"
              required
            />
            <datalist id="expense-categories">
              {categories.map((category) => <option key={category} value={category} />)}
            </datalist>
          </label>

          {(error || serverError) && <div className="form-alert" role="alert">{error ?? serverError}</div>}

          <footer className="modal__footer">
            <button className="button button--ghost" disabled={saving} onClick={onClose} type="button">Cancelar</button>
            <button className="button button--primary" disabled={saving} type="submit">
              {saving ? 'Salvando…' : expense ? 'Salvar alterações' : 'Cadastrar despesa'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
