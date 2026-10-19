package com.portfolio.finance.dashboard;

import com.portfolio.finance.transaction.FinancialTransaction;
import com.portfolio.finance.transaction.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class DashboardDtos {

    private DashboardDtos() {
    }

    public record DashboardResponse(
            LocalDate from,
            LocalDate to,
            BigDecimal totalBalance,
            BigDecimal periodIncome,
            BigDecimal periodExpense,
            BigDecimal periodResult,
            List<MonthlySummary> monthlySummary,
            List<CategorySummary> expenseCategories,
            List<RecentTransaction> recentTransactions
    ) {
    }

    public record MonthlySummary(
            String month,
            BigDecimal income,
            BigDecimal expense,
            BigDecimal result
    ) {
    }

    public record CategorySummary(
            String category,
            BigDecimal amount
    ) {
    }

    public record RecentTransaction(
            UUID id,
            TransactionType type,
            String description,
            BigDecimal amount,
            String category,
            LocalDate date
    ) {
        static RecentTransaction from(FinancialTransaction transaction) {
            return new RecentTransaction(
                    transaction.getId(),
                    transaction.getType(),
                    transaction.getDescription(),
                    transaction.getAmount(),
                    transaction.getCategory(),
                    transaction.getTransactionDate()
            );
        }
    }
}
