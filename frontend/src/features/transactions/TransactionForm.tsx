import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../../shared/ui/Icon'
import type {
  FinancialTransaction,
  TransactionPayload,
  TransactionType,
} from './types'

const categories = [
  'Alimentação',
  'Casa',
  'Educação',
  'Lazer',
  'Outros',
  'Salário',
  'Saúde',
  'Transporte',
]

type TransactionFormProps = {
  transaction: FinancialTransaction | null
  saving: boolean
  serverError: string | null
  onClose: () => void
  onSave: (payload: TransactionPayload) => Promise<void>
}

function today() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

export function TransactionForm({ transaction, saving, serverError, onClose, onSave }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'EXPENSE')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setType(transaction?.type ?? 'EXPENSE')
    setError(null)
  }, [transaction])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const form = new FormData(event.currentTarget)
    const amount = Number(String(form.get('amount') ?? '').replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor maior que zero.')
      return
    }

    await onSave({
      type,
      description: String(form.get('description') ?? '').trim(),
      amount,
      date: String(form.get('date') ?? ''),
      category: String(form.get('category') ?? '').trim(),
      notes: String(form.get('notes') ?? '').trim() || undefined,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-labelledby="transaction-form-title" aria-modal="true" className="modal" role="dialog">
        <header className="modal__header">
          <div>
            <span className="eyebrow">Movimentação financeira</span>
            <h2 id="transaction-form-title">{transaction ? 'Editar lançamento' : 'Novo lançamento'}</h2>
          </div>
          <button aria-label="Fechar" className="icon-button" onClick={onClose} type="button">
            <Icon name="x" />
          </button>
        </header>

        <form className="transaction-form" onSubmit={handleSubmit}>
          <div className="type-selector" aria-label="Tipo de movimentação">
            <button
              className={type === 'INCOME' ? 'active income' : ''}
              onClick={() => setType('INCOME')}
              type="button"
            >
              <Icon name="arrow-up" size={18} /> Receita
            </button>
            <button
              className={type === 'EXPENSE' ? 'active expense' : ''}
              onClick={() => setType('EXPENSE')}
              type="button"
            >
              <Icon name="arrow-down" size={18} /> Despesa
            </button>
          </div>

          <label className="field-wide">
            Descrição
            <input
              defaultValue={transaction?.description}
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
                  defaultValue={transaction?.amount.toFixed(2)}
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
              <input defaultValue={transaction?.date ?? today()} name="date" required type="date" />
            </label>
          </div>

          <label className="field-wide">
            Categoria
            <input
              defaultValue={transaction?.category}
              list="transaction-categories"
              maxLength={60}
              name="category"
              placeholder="Escolha ou digite uma categoria"
              required
            />
            <datalist id="transaction-categories">
              {categories.map((category) => <option key={category} value={category} />)}
            </datalist>
          </label>

          <label className="field-wide">
            Observações <small>(opcional)</small>
            <textarea
              defaultValue={transaction?.notes}
              maxLength={500}
              name="notes"
              placeholder="Adicione um detalhe útil para lembrar depois"
              rows={3}
            />
          </label>

          {(error || serverError) && <div className="form-alert" role="alert">{error ?? serverError}</div>}

          <footer className="modal__footer">
            <button className="button button--ghost" onClick={onClose} type="button">Cancelar</button>
            <button className="button button--primary" disabled={saving} type="submit">
              {saving ? 'Salvando…' : transaction ? 'Salvar alterações' : 'Adicionar lançamento'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
