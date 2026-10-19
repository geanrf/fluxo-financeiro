import { Icon } from '../../shared/ui/Icon'
import type { Income } from './types'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

type DeleteIncomeDialogProps = {
  income: Income
  deleting: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export function DeleteIncomeDialog({
  income,
  deleting,
  error,
  onCancel,
  onConfirm,
}: DeleteIncomeDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-labelledby="delete-income-title" aria-modal="true" className="modal confirm-dialog" role="alertdialog">
        <span className="confirm-dialog__icon"><Icon name="trash" size={24} /></span>
        <h2 id="delete-income-title">Excluir esta receita?</h2>
        <p>
          <strong>{income.description}</strong>, no valor de{' '}
          <strong>{currency.format(Number(income.amount))}</strong>, será removida permanentemente.
        </p>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <footer className="modal__footer">
          <button className="button button--ghost" disabled={deleting} onClick={onCancel} type="button">Cancelar</button>
          <button className="button button--danger" disabled={deleting} onClick={() => void onConfirm()} type="button">
            {deleting ? 'Excluindo…' : 'Excluir receita'}
          </button>
        </footer>
      </section>
    </div>
  )
}
