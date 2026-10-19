package com.portfolio.finance.identity;

import com.portfolio.finance.shared.exception.ConflictException;
import com.portfolio.finance.shared.exception.InvalidCredentialsException;
import com.portfolio.finance.shared.exception.ResourceNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

import static com.portfolio.finance.identity.AuthDtos.AuthResponse;
import static com.portfolio.finance.identity.AuthDtos.LoginRequest;
import static com.portfolio.finance.identity.AuthDtos.RegisterRequest;
import static com.portfolio.finance.identity.AuthDtos.UserResponse;

@Service
public class AuthService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            AppUserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Já existe uma conta com este e-mail.");
        }

        AppUser user = new AppUser(
                request.name().strip(),
                email,
                passwordEncoder.encode(request.password())
        );
        userRepository.save(user);
        return authenticatedResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        AppUser user = userRepository.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(this::invalidCredentials);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }

        return authenticatedResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(UUID userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
        return UserResponse.from(user);
    }

    private AuthResponse authenticatedResponse(AppUser user) {
        JwtService.TokenDetails token = jwtService.issueToken(user);
        return new AuthResponse(token.value(), "Bearer", token.expiresIn(), UserResponse.from(user));
    }

    private String normalizeEmail(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }

    private InvalidCredentialsException invalidCredentials() {
        return new InvalidCredentialsException("E-mail ou senha inválidos.");
    }
}
