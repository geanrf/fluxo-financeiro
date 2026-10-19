package com.portfolio.finance.expense;

import com.portfolio.finance.identity.AppUser;
import com.portfolio.finance.identity.AppUserRepository;
import com.portfolio.finance.shared.exception.ResourceNotFoundException;
import com.portfolio.finance.transaction.FinancialTransaction;
import com.portfolio.finance.transaction.FinancialTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static com.portfolio.finance.expense.ExpenseDtos.ExpenseRequest;
import static com.portfolio.finance.expense.ExpenseDtos.ExpenseResponse;
import static com.portfolio.finance.transaction.TransactionType.EXPENSE;

@Service
public class ExpenseService {

    private final FinancialTransactionRepository transactionRepository;
    private final AppUserRepository userRepository;

    public ExpenseService(
            FinancialTransactionRepository transactionRepository,
            AppUserRepository userRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> list(UUID userId) {
        return transactionRepository
                .findAllByUser_IdAndTypeOrderByTransactionDateDescCreatedAtDesc(userId, EXPENSE)
                .stream()
                .map(ExpenseResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ExpenseResponse find(UUID userId, UUID expenseId) {
        return ExpenseResponse.from(findOwnedExpense(userId, expenseId));
    }

    @Transactional
    public ExpenseResponse create(UUID userId, ExpenseRequest request) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        FinancialTransaction expense = new FinancialTransaction(
                user,
                EXPENSE,
                request.description().strip(),
                request.amount(),
                request.date(),
                request.category().strip(),
                null
        );

        return ExpenseResponse.from(transactionRepository.save(expense));
    }

    @Transactional
    public ExpenseResponse update(UUID userId, UUID expenseId, ExpenseRequest request) {
        FinancialTransaction expense = findOwnedExpense(userId, expenseId);
        expense.update(
                EXPENSE,
                request.description().strip(),
                request.amount(),
                request.date(),
                request.category().strip(),
                null
        );
        return ExpenseResponse.from(expense);
    }

    @Transactional
    public void delete(UUID userId, UUID expenseId) {
        transactionRepository.delete(findOwnedExpense(userId, expenseId));
    }

    private FinancialTransaction findOwnedExpense(UUID userId, UUID expenseId) {
        return transactionRepository.findByIdAndUser_IdAndType(expenseId, userId, EXPENSE)
                .orElseThrow(() -> new ResourceNotFoundException("Despesa não encontrada."));
    }
}
