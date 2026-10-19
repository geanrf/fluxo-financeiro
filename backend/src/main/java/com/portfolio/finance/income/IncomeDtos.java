package com.portfolio.finance.income;

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

public final class IncomeDtos {

    private IncomeDtos() {
    }

    public record IncomeRequest(
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

    public record IncomeResponse(
            UUID id,
            String description,
            BigDecimal amount,
            String category,
            LocalDate date,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static IncomeResponse from(FinancialTransaction income) {
            return new IncomeResponse(
                    income.getId(),
                    income.getDescription(),
                    income.getAmount(),
                    income.getCategory(),
                    income.getTransactionDate(),
                    income.getCreatedAt(),
                    income.getUpdatedAt()
            );
        }
    }
}
