package com.portfolio.finance.transaction;

import com.portfolio.finance.identity.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "financial_transactions", schema = "finance")
public class FinancialTransaction {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TransactionType type;

    @Column(nullable = false, length = 120)
    private String description;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(nullable = false, length = 60)
    private String category;

    @Column(length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected FinancialTransaction() {
    }

    public FinancialTransaction(
            AppUser user,
            TransactionType type,
            String description,
            BigDecimal amount,
            LocalDate transactionDate,
            String category,
            String notes
    ) {
        this.id = UUID.randomUUID();
        this.user = user;
        this.createdAt = Instant.now();
        update(type, description, amount, transactionDate, category, notes);
    }

    public void update(
            TransactionType type,
            String description,
            BigDecimal amount,
            LocalDate transactionDate,
            String category,
            String notes
    ) {
        this.type = type;
        this.description = description;
        this.amount = amount;
        this.transactionDate = transactionDate;
        this.category = category;
        this.notes = notes;
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public TransactionType getType() {
        return type;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public String getCategory() {
        return category;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
