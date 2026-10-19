package com.portfolio.finance.identity;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Informe seu nome.")
            @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.")
            String name,

            @NotBlank(message = "Informe seu e-mail.")
            @Email(message = "Informe um e-mail válido.")
            @Size(max = 255, message = "O e-mail deve ter no máximo 255 caracteres.")
            String email,

            @NotBlank(message = "Informe uma senha.")
            @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.")
            @Pattern(
                    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
                    message = "A senha deve conter letra maiúscula, minúscula e número."
            )
            String password
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "Informe seu e-mail.")
            @Email(message = "Informe um e-mail válido.")
            String email,

            @NotBlank(message = "Informe sua senha.")
            String password
    ) {
    }

    public record UserResponse(UUID id, String name, String email) {

        public static UserResponse from(AppUser user) {
            return new UserResponse(user.getId(), user.getName(), user.getEmail());
        }
    }

    public record AuthResponse(
            String accessToken,
            String tokenType,
            long expiresIn,
            UserResponse user
    ) {
    }
}
