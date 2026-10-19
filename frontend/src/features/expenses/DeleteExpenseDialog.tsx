import { Icon } from '../../shared/ui/Icon'
import type { Expense } from './types'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

type DeleteExpenseDialogProps = {
  expense: Expense
  deleting: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export function DeleteExpenseDialog({
  expense,
  deleting,
  error,
  onCancel,
  onConfirm,
}: DeleteExpenseDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-labelledby="delete-expense-title" aria-modal="true" className="modal confirm-dialog" role="alertdialog">
        <span className="confirm-dialog__icon"><Icon name="trash" size={24} /></span>
        <h2 id="delete-expense-title">Excluir esta despesa?</h2>
        <p>
          <strong>{expense.description}</strong>, no valor de{' '}
          <strong>{currency.format(Number(expense.amount))}</strong>, será removida permanentemente.
        </p>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <footer className="modal__footer">
          <button className="button button--ghost" disabled={deleting} onClick={onCancel} type="button">Cancelar</button>
          <button className="button button--danger" disabled={deleting} onClick={() => void onConfirm()} type="button">
            {deleting ? 'Excluindo…' : 'Excluir despesa'}
          </button>
        </footer>
      </section>
    </div>
  )
}
