package com.portfolio.finance.expense;

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

import static com.portfolio.finance.expense.ExpenseDtos.ExpenseRequest;
import static com.portfolio.finance.expense.ExpenseDtos.ExpenseResponse;

@RestController
@RequestMapping("/api/v1/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    List<ExpenseResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return expenseService.list(userId(jwt));
    }

    @GetMapping("/{expenseId}")
    ExpenseResponse find(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID expenseId
    ) {
        return expenseService.find(userId(jwt), expenseId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ExpenseResponse create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ExpenseRequest request
    ) {
        return expenseService.create(userId(jwt), request);
    }

    @PutMapping("/{expenseId}")
    ExpenseResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID expenseId,
            @Valid @RequestBody ExpenseRequest request
    ) {
        return expenseService.update(userId(jwt), expenseId, request);
    }

    @DeleteMapping("/{expenseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID expenseId
    ) {
        expenseService.delete(userId(jwt), expenseId);
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
