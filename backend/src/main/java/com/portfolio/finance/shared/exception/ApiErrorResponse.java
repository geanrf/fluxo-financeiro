package com.portfolio.finance.shared.exception;

import java.time.Instant;
import java.util.List;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<FieldViolation> violations
) {
    public static ApiErrorResponse of(
            int status,
            String error,
            String message,
            String path,
            List<FieldViolation> violations
    ) {
        return new ApiErrorResponse(Instant.now(), status, error, message, path, violations);
    }
}

