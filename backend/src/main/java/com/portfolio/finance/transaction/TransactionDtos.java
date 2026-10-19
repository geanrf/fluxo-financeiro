package com.portfolio.finance.transaction;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class TransactionDtos {

    private TransactionDtos() {
    }

    public record TransactionRequest(
            @NotNull(message = "Selecione o tipo da movimentação.")
            TransactionType type,

            @NotBlank(message = "Informe uma descrição.")
            @Size(max = 120, message = "A descrição deve ter no máximo 120 caracteres.")
            String description,

            @NotNull(message = "Informe o valor.")
            @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero.")
            @Digits(integer = 17, fraction = 2, message = "Use no máximo duas casas decimais.")
            BigDecimal amount,

            @NotNull(message = "Informe a data.")
            LocalDate date,

            @NotBlank(message = "Informe uma categoria.")
            @Size(max = 60, message = "A categoria deve ter no máximo 60 caracteres.")
            String category,

            @Size(max = 500, message = "As observações devem ter no máximo 500 caracteres.")
            String notes
    ) {
    }

    public record TransactionResponse(
            UUID id,
            TransactionType type,
            String description,
            BigDecimal amount,
            LocalDate date,
            String category,
            String notes,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static TransactionResponse from(FinancialTransaction transaction) {
            return new TransactionResponse(
                    transaction.getId(),
                    transaction.getType(),
                    transaction.getDescription(),
                    transaction.getAmount(),
                    transaction.getTransactionDate(),
                    transaction.getCategory(),
                    transaction.getNotes(),
                    transaction.getCreatedAt(),
                    transaction.getUpdatedAt()
            );
        }
    }
}
