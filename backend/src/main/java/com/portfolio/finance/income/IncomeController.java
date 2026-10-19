package com.portfolio.finance.income;

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

import static com.portfolio.finance.income.IncomeDtos.IncomeRequest;
import static com.portfolio.finance.income.IncomeDtos.IncomeResponse;

@RestController
@RequestMapping("/api/v1/incomes")
public class IncomeController {

    private final IncomeService incomeService;

    public IncomeController(IncomeService incomeService) {
        this.incomeService = incomeService;
    }

    @GetMapping
    List<IncomeResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return incomeService.list(userId(jwt));
    }

    @GetMapping("/{incomeId}")
    IncomeResponse find(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID incomeId
    ) {
        return incomeService.find(userId(jwt), incomeId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    IncomeResponse create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody IncomeRequest request
    ) {
        return incomeService.create(userId(jwt), request);
    }

    @PutMapping("/{incomeId}")
    IncomeResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID incomeId,
            @Valid @RequestBody IncomeRequest request
    ) {
        return incomeService.update(userId(jwt), incomeId, request);
    }

    @DeleteMapping("/{incomeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID incomeId
    ) {
        incomeService.delete(userId(jwt), incomeId);
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
