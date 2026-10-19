package com.portfolio.finance.income;

import com.portfolio.finance.identity.AppUser;
import com.portfolio.finance.identity.AppUserRepository;
import com.portfolio.finance.shared.exception.ResourceNotFoundException;
import com.portfolio.finance.transaction.FinancialTransaction;
import com.portfolio.finance.transaction.FinancialTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static com.portfolio.finance.income.IncomeDtos.IncomeRequest;
import static com.portfolio.finance.income.IncomeDtos.IncomeResponse;
import static com.portfolio.finance.transaction.TransactionType.INCOME;

@Service
public class IncomeService {

    private final FinancialTransactionRepository transactionRepository;
    private final AppUserRepository userRepository;

    public IncomeService(
            FinancialTransactionRepository transactionRepository,
            AppUserRepository userRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<IncomeResponse> list(UUID userId) {
        return transactionRepository
                .findAllByUser_IdAndTypeOrderByTransactionDateDescCreatedAtDesc(userId, INCOME)
                .stream()
                .map(IncomeResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public IncomeResponse find(UUID userId, UUID incomeId) {
        return IncomeResponse.from(findOwnedIncome(userId, incomeId));
    }

    @Transactional
    public IncomeResponse create(UUID userId, IncomeRequest request) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        FinancialTransaction income = new FinancialTransaction(
                user,
                INCOME,
                request.description().strip(),
                request.amount(),
                request.date(),
                request.category().strip(),
                null
        );

        return IncomeResponse.from(transactionRepository.save(income));
    }

    @Transactional
    public IncomeResponse update(UUID userId, UUID incomeId, IncomeRequest request) {
        FinancialTransaction income = findOwnedIncome(userId, incomeId);
        income.update(
                INCOME,
                request.description().strip(),
                request.amount(),
                request.date(),
                request.category().strip(),
                null
        );
        return IncomeResponse.from(income);
    }

    @Transactional
    public void delete(UUID userId, UUID incomeId) {
        transactionRepository.delete(findOwnedIncome(userId, incomeId));
    }

    private FinancialTransaction findOwnedIncome(UUID userId, UUID incomeId) {
        return transactionRepository.findByIdAndUser_IdAndType(incomeId, userId, INCOME)
                .orElseThrow(() -> new ResourceNotFoundException("Receita não encontrada."));
    }
}
