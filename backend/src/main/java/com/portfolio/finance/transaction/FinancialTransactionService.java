package com.portfolio.finance.transaction;

import com.portfolio.finance.identity.AppUser;
import com.portfolio.finance.identity.AppUserRepository;
import com.portfolio.finance.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static com.portfolio.finance.transaction.TransactionDtos.TransactionRequest;
import static com.portfolio.finance.transaction.TransactionDtos.TransactionResponse;

@Service
public class FinancialTransactionService {

    private final FinancialTransactionRepository transactionRepository;
    private final AppUserRepository userRepository;

    public FinancialTransactionService(
            FinancialTransactionRepository transactionRepository,
            AppUserRepository userRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> list(UUID userId) {
        return transactionRepository.findAllByUser_IdOrderByTransactionDateDescCreatedAtDesc(userId)
                .stream()
                .map(TransactionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TransactionResponse find(UUID userId, UUID transactionId) {
        return TransactionResponse.from(findOwnedTransaction(userId, transactionId));
    }

    @Transactional
    public TransactionResponse create(UUID userId, TransactionRequest request) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        FinancialTransaction transaction = new FinancialTransaction(
                user,
                request.type(),
                request.description().strip(),
                request.amount(),
                request.date(),
                request.category().strip(),
                normalizeNotes(request.notes())
        );
        return TransactionResponse.from(transactionRepository.save(transaction));
    }

    @Transactional
    public TransactionResponse update(UUID userId, UUID transactionId, TransactionRequest request) {
        FinancialTransaction transaction = findOwnedTransaction(userId, transactionId);
        transaction.update(
                request.type(),
                request.description().strip(),
                request.amount(),
                request.date(),
                request.category().strip(),
                normalizeNotes(request.notes())
        );
        return TransactionResponse.from(transaction);
    }

    @Transactional
    public void delete(UUID userId, UUID transactionId) {
        transactionRepository.delete(findOwnedTransaction(userId, transactionId));
    }

    private FinancialTransaction findOwnedTransaction(UUID userId, UUID transactionId) {
        return transactionRepository.findByIdAndUser_Id(transactionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Movimentação não encontrada."));
    }

    private String normalizeNotes(String notes) {
        return notes == null || notes.isBlank() ? null : notes.strip();
    }
}
