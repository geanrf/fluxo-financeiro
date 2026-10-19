CREATE INDEX idx_financial_transactions_user_type_date
    ON finance.financial_transactions (user_id, type, transaction_date DESC);
