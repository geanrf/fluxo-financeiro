package com.portfolio.finance.transaction;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

import static com.portfolio.finance.transaction.TransactionDtos.TransactionRequest;
import static com.portfolio.finance.transaction.TransactionDtos.TransactionResponse;

@RestController
@RequestMapping("/api/v1/transactions")
public class FinancialTransactionController {

    private final FinancialTransactionService transactionService;

    public FinancialTransactionController(FinancialTransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    List<TransactionResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return transactionService.list(userId(jwt));
    }

    @GetMapping("/{transactionId}")
    TransactionResponse find(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID transactionId
    ) {
        return transactionService.find(userId(jwt), transactionId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    TransactionResponse create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody TransactionRequest request
    ) {
        return transactionService.create(userId(jwt), request);
    }

    @PutMapping("/{transactionId}")
    TransactionResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID transactionId,
            @Valid @RequestBody TransactionRequest request
    ) {
        return transactionService.update(userId(jwt), transactionId, request);
    }

    @DeleteMapping("/{transactionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID transactionId
    ) {
        transactionService.delete(userId(jwt), transactionId);
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
