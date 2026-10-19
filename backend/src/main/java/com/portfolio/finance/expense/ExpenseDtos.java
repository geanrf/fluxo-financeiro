package com.portfolio.finance.expense;

import com.portfolio.finance.transaction.FinancialTransaction;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class ExpenseDtos {

    private ExpenseDtos() {
    }

    public record ExpenseRequest(
            @NotBlank(message = "Informe uma descrição.")
            @Size(max = 120, message = "A descrição deve ter no máximo 120 caracteres.")
            String description,

            @NotNull(message = "Informe o valor.")
            @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero.")
            @Digits(integer = 17, fraction = 2, message = "Use no máximo duas casas decimais.")
            BigDecimal amount,

            @NotBlank(message = "Informe uma categoria.")
            @Size(max = 60, message = "A categoria deve ter no máximo 60 caracteres.")
            String category,

            @NotNull(message = "Informe a data.")
            LocalDate date
    ) {
    }

    public record ExpenseResponse(
            UUID id,
            String description,
            BigDecimal amount,
            String category,
            LocalDate date,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static ExpenseResponse from(FinancialTransaction expense) {
            return new ExpenseResponse(
                    expense.getId(),
                    expense.getDescription(),
                    expense.getAmount(),
                    expense.getCategory(),
                    expense.getTransactionDate(),
                    expense.getCreatedAt(),
                    expense.getUpdatedAt()
            );
        }
    }
}
