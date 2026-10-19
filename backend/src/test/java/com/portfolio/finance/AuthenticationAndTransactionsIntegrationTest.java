package com.portfolio.finance;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.finance.identity.AppUser;
import com.portfolio.finance.identity.AppUserRepository;
import com.portfolio.finance.transaction.FinancialTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class AuthenticationAndTransactionsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AppUserRepository userRepository;

    @Autowired
    private FinancialTransactionRepository transactionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void cleanDatabase() {
        transactionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void shouldRegisterLoginAndStoreOnlyThePasswordHash() throws Exception {
        String token = register("Ana Silva", "ANA@EXEMPLO.COM", "Senha123");

        assertThat(token).isNotBlank();
        AppUser user = userRepository.findByEmail("ana@exemplo.com").orElseThrow();
        assertThat(user.getPasswordHash()).doesNotContain("Senha123");
        assertThat(passwordEncoder.matches("Senha123", user.getPasswordHash())).isTrue();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"ana@exemplo.com","password":"Senha123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.name").value("Ana Silva"));
    }

    @Test
    void shouldCompleteTransactionCrud() throws Exception {
        String token = register("Ana Silva", "ana@exemplo.com", "Senha123");

        String transactionId = createTransaction(token, "Salário", "INCOME", "5500.00");

        mockMvc.perform(put("/api/v1/transactions/{id}", transactionId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "type":"INCOME",
                                  "description":"Salário atualizado",
                                  "amount":5600.00,
                                  "date":"2026-10-19",
                                  "category":"Salário",
                                  "notes":"Valor líquido"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Salário atualizado"))
                .andExpect(jsonPath("$.amount").value(5600.00));

        mockMvc.perform(get("/api/v1/transactions/{id}", transactionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes").value("Valor líquido"));

        mockMvc.perform(delete("/api/v1/transactions/{id}", transactionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/transactions")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void shouldKeepTransactionsIsolatedByUser() throws Exception {
        String anaToken = register("Ana Silva", "ana@exemplo.com", "Senha123");
        String brunoToken = register("Bruno Lima", "bruno@exemplo.com", "Senha456");
        String transactionId = createTransaction(anaToken, "Freelance", "INCOME", "1200.00");

        mockMvc.perform(get("/api/v1/transactions")
                        .header("Authorization", "Bearer " + brunoToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/v1/transactions/{id}", transactionId)
                        .header("Authorization", "Bearer " + brunoToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/v1/transactions"))
                .andExpect(status().isUnauthorized());
    }

    private String register(String name, String email, String password) throws Exception {
        String body = objectMapper.writeValueAsString(new RegistrationPayload(name, email, password));
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        return response.get("accessToken").asText();
    }

    private String createTransaction(
            String token,
            String description,
            String type,
            String amount
    ) throws Exception {
        String body = """
                {
                  "type":"%s",
                  "description":"%s",
                  "amount":%s,
                  "date":"2026-10-19",
                  "category":"Trabalho",
                  "notes":"Teste de integração"
                }
                """.formatted(type, description, amount);

        MvcResult result = mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private record RegistrationPayload(String name, String email, String password) {
    }
}
