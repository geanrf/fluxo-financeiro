CREATE TABLE finance.financial_transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(10) NOT NULL,
    description VARCHAR(120) NOT NULL,
    amount NUMERIC(19, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    category VARCHAR(60) NOT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_financial_transactions_user
        FOREIGN KEY (user_id) REFERENCES finance.app_users (id),
    CONSTRAINT ck_financial_transactions_type
        CHECK (type IN ('INCOME', 'EXPENSE')),
    CONSTRAINT ck_financial_transactions_amount
        CHECK (amount > 0)
);

CREATE INDEX idx_financial_transactions_user_date
    ON finance.financial_transactions (user_id, transaction_date DESC);
