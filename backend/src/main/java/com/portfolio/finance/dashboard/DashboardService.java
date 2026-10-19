package com.portfolio.finance.dashboard;

import com.portfolio.finance.shared.exception.BusinessRuleException;
import com.portfolio.finance.transaction.FinancialTransaction;
import com.portfolio.finance.transaction.FinancialTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.portfolio.finance.dashboard.DashboardDtos.CategorySummary;
import static com.portfolio.finance.dashboard.DashboardDtos.DashboardResponse;
import static com.portfolio.finance.dashboard.DashboardDtos.MonthlySummary;
import static com.portfolio.finance.dashboard.DashboardDtos.RecentTransaction;
import static com.portfolio.finance.transaction.TransactionType.INCOME;

@Service
public class DashboardService {

    private static final BigDecimal ZERO = new BigDecimal("0.00");
    private static final int MAX_MONTHS = 24;
    private static final int RECENT_LIMIT = 8;

    private final FinancialTransactionRepository transactionRepository;

    public DashboardService(FinancialTransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse summarize(UUID userId, LocalDate from, LocalDate to) {
        validatePeriod(from, to);

        List<FinancialTransaction> allTransactions =
                transactionRepository.findAllByUser_IdOrderByTransactionDateDescCreatedAtDesc(userId);
        List<FinancialTransaction> periodTransactions =
                transactionRepository.findAllByUser_IdAndTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(
                        userId,
                        from,
                        to
                );

        BigDecimal totalBalance = allTransactions.stream()
                .map(this::signedAmount)
                .reduce(ZERO, BigDecimal::add);

        BigDecimal periodIncome = periodTransactions.stream()
                .filter(transaction -> transaction.getType() == INCOME)
                .map(FinancialTransaction::getAmount)
                .reduce(ZERO, BigDecimal::add);
        BigDecimal periodExpense = periodTransactions.stream()
                .filter(transaction -> transaction.getType() != INCOME)
                .map(FinancialTransaction::getAmount)
                .reduce(ZERO, BigDecimal::add);

        return new DashboardResponse(
                from,
                to,
                totalBalance,
                periodIncome,
                periodExpense,
                periodIncome.subtract(periodExpense),
                monthlySummary(from, to, periodTransactions),
                expenseCategories(periodTransactions),
                periodTransactions.stream().limit(RECENT_LIMIT).map(RecentTransaction::from).toList()
        );
    }

    private List<MonthlySummary> monthlySummary(
            LocalDate from,
            LocalDate to,
            List<FinancialTransaction> transactions
    ) {
        Map<YearMonth, BigDecimal> incomes = new LinkedHashMap<>();
        Map<YearMonth, BigDecimal> expenses = new LinkedHashMap<>();

        YearMonth current = YearMonth.from(from);
        YearMonth last = YearMonth.from(to);
        while (!current.isAfter(last)) {
            incomes.put(current, ZERO);
            expenses.put(current, ZERO);
            current = current.plusMonths(1);
        }

        transactions.forEach(transaction -> {
            YearMonth month = YearMonth.from(transaction.getTransactionDate());
            Map<YearMonth, BigDecimal> target = transaction.getType() == INCOME ? incomes : expenses;
            target.computeIfPresent(month, (key, value) -> value.add(transaction.getAmount()));
        });

        return incomes.keySet().stream()
                .map(month -> new MonthlySummary(
                        month.toString(),
                        incomes.get(month),
                        expenses.get(month),
                        incomes.get(month).subtract(expenses.get(month))
                ))
                .toList();
    }

    private List<CategorySummary> expenseCategories(List<FinancialTransaction> transactions) {
        Map<String, BigDecimal> totals = new HashMap<>();
        transactions.stream()
                .filter(transaction -> transaction.getType() != INCOME)
                .forEach(transaction -> totals.merge(
                        transaction.getCategory(),
                        transaction.getAmount(),
                        BigDecimal::add
                ));

        return totals.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed()
                        .thenComparing(Map.Entry::getKey, String.CASE_INSENSITIVE_ORDER))
                .map(entry -> new CategorySummary(entry.getKey(), entry.getValue()))
                .toList();
    }

    private BigDecimal signedAmount(FinancialTransaction transaction) {
        return transaction.getType() == INCOME
                ? transaction.getAmount()
                : transaction.getAmount().negate();
    }

    private void validatePeriod(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new BusinessRuleException("A data inicial deve ser anterior ou igual à data final.");
        }

        long months = ChronoUnit.MONTHS.between(YearMonth.from(from), YearMonth.from(to)) + 1;
        if (months > MAX_MONTHS) {
            throw new BusinessRuleException("Selecione um período de até 24 meses.");
        }
    }
}
