package com.portfolio.finance.transaction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, UUID> {

    List<FinancialTransaction> findAllByUser_IdOrderByTransactionDateDescCreatedAtDesc(UUID userId);

    Optional<FinancialTransaction> findByIdAndUser_Id(UUID id, UUID userId);

    List<FinancialTransaction> findAllByUser_IdAndTypeOrderByTransactionDateDescCreatedAtDesc(
            UUID userId,
            TransactionType type
    );

    Optional<FinancialTransaction> findByIdAndUser_IdAndType(
            UUID id,
            UUID userId,
            TransactionType type
    );
}
