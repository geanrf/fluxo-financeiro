package com.portfolio.finance;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.finance.identity.AppUserRepository;
import com.portfolio.finance.transaction.FinancialTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItems;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class ExpenseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AppUserRepository userRepository;

    @Autowired
    private FinancialTransactionRepository transactionRepository;

    @BeforeEach
    void cleanDatabase() {
        transactionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void shouldCompleteExpenseCrudAndKeepMonetaryPrecision() throws Exception {
        String token = register("Ana Silva", "ana.despesas@exemplo.com");

        MvcResult creation = mockMvc.perform(post("/api/v1/expenses")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validExpense("Supermercado", "249.90", "Alimentação")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value("Supermercado"))
                .andExpect(jsonPath("$.amount").value(249.90))
                .andExpect(jsonPath("$.category").value("Alimentação"))
                .andReturn();

        String expenseId = objectMapper.readTree(creation.getResponse().getContentAsString())
                .get("id")
                .asText();

        assertThat(transactionRepository.findById(UUID.fromString(expenseId)).orElseThrow().getAmount())
                .isEqualByComparingTo(new BigDecimal("249.90"));

        mockMvc.perform(get("/api/v1/expenses")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(expenseId));

        mockMvc.perform(put("/api/v1/expenses/{id}", expenseId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validExpense("Supermercado atualizado", "315.27", "Casa")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Supermercado atualizado"))
                .andExpect(jsonPath("$.amount").value(315.27));

        mockMvc.perform(get("/api/v1/expenses/{id}", expenseId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("Casa"));

        mockMvc.perform(delete("/api/v1/expenses/{id}", expenseId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/expenses")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void shouldRejectInvalidExpenseFields() throws Exception {
        String token = register("Ana Silva", "ana.validacao@exemplo.com");

        mockMvc.perform(post("/api/v1/expenses")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "description":" ",
                                  "amount":0,
                                  "category":" ",
                                  "date":null
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.violations[*].field",
                        hasItems("description", "amount", "category", "date")));
    }

    @Test
    void shouldKeepExpensesIsolatedByAuthenticatedUser() throws Exception {
        String ownerToken = register("Ana Silva", "ana.isolamento@exemplo.com");
        String otherToken = register("Bruno Lima", "bruno.isolamento@exemplo.com");
        String expenseId = createExpense(ownerToken, "Internet", "119.90", "Casa");

        mockMvc.perform(get("/api/v1/expenses")
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/v1/expenses/{id}", expenseId)
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound());

        mockMvc.perform(put("/api/v1/expenses/{id}", expenseId)
                        .header("Authorization", bearer(otherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validExpense("Tentativa", "1.00", "Outros")))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/v1/expenses/{id}", expenseId)
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/v1/expenses/{id}", expenseId)
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Internet"));

        mockMvc.perform(get("/api/v1/expenses"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldNeverExposeIncomeThroughExpenseEndpoints() throws Exception {
        String token = register("Ana Silva", "ana.receitas@exemplo.com");

        MvcResult incomeCreation = mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "type":"INCOME",
                                  "description":"Salário",
                                  "amount":5000.00,
                                  "date":"2026-10-19",
                                  "category":"Trabalho"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        String incomeId = objectMapper.readTree(incomeCreation.getResponse().getContentAsString())
                .get("id")
                .asText();

        mockMvc.perform(get("/api/v1/expenses")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/v1/expenses/{id}", incomeId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isNotFound());
    }

    private String register(String name, String email) throws Exception {
        String body = objectMapper.writeValueAsString(new RegistrationPayload(name, email, "Senha123"));
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        return response.get("accessToken").asText();
    }

    private String createExpense(String token, String description, String amount, String category)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/expenses")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validExpense(description, amount, category)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String validExpense(String description, String amount, String category) throws Exception {
        return objectMapper.writeValueAsString(
                new ExpensePayload(description, new BigDecimal(amount), category, "2026-10-19")
        );
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private record RegistrationPayload(String name, String email, String password) {
    }

    private record ExpensePayload(String description, BigDecimal amount, String category, String date) {
    }
}
