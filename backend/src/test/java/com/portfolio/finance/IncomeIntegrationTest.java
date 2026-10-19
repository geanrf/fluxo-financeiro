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
class IncomeIntegrationTest {

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
    void shouldCompleteIncomeCrudAndKeepMonetaryPrecision() throws Exception {
        String token = register("Ana Silva", "ana.receitas@exemplo.com");

        MvcResult creation = mockMvc.perform(post("/api/v1/incomes")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validIncome("Projeto freelance", "1850.75", "Freelance")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value("Projeto freelance"))
                .andExpect(jsonPath("$.amount").value(1850.75))
                .andExpect(jsonPath("$.category").value("Freelance"))
                .andReturn();

        String incomeId = objectMapper.readTree(creation.getResponse().getContentAsString())
                .get("id")
                .asText();

        assertThat(transactionRepository.findById(UUID.fromString(incomeId)).orElseThrow().getAmount())
                .isEqualByComparingTo(new BigDecimal("1850.75"));

        mockMvc.perform(get("/api/v1/incomes")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(incomeId));

        mockMvc.perform(put("/api/v1/incomes/{id}", incomeId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validIncome("Projeto atualizado", "2100.50", "Serviços")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Projeto atualizado"))
                .andExpect(jsonPath("$.amount").value(2100.50));

        mockMvc.perform(get("/api/v1/incomes/{id}", incomeId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("Serviços"));

        mockMvc.perform(delete("/api/v1/incomes/{id}", incomeId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/incomes")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void shouldRejectInvalidIncomeFields() throws Exception {
        String token = register("Ana Silva", "ana.validacao.receitas@exemplo.com");

        mockMvc.perform(post("/api/v1/incomes")
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
    void shouldKeepIncomesIsolatedByAuthenticatedUser() throws Exception {
        String ownerToken = register("Ana Silva", "ana.isolamento.receitas@exemplo.com");
        String otherToken = register("Bruno Lima", "bruno.isolamento.receitas@exemplo.com");
        String incomeId = createIncome(ownerToken, "Salário", "5200.00", "Trabalho");

        mockMvc.perform(get("/api/v1/incomes")
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/v1/incomes/{id}", incomeId)
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound());

        mockMvc.perform(put("/api/v1/incomes/{id}", incomeId)
                        .header("Authorization", bearer(otherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validIncome("Tentativa", "1.00", "Outros")))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/v1/incomes/{id}", incomeId)
                        .header("Authorization", bearer(otherToken)))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/v1/incomes/{id}", incomeId)
                        .header("Authorization", bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Salário"));

        mockMvc.perform(get("/api/v1/incomes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldNeverExposeExpenseThroughIncomeEndpoints() throws Exception {
        String token = register("Ana Silva", "ana.despesas.receitas@exemplo.com");

        MvcResult expenseCreation = mockMvc.perform(post("/api/v1/expenses")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "description":"Aluguel",
                                  "amount":1500.00,
                                  "date":"2026-10-19",
                                  "category":"Casa"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        String expenseId = objectMapper.readTree(expenseCreation.getResponse().getContentAsString())
                .get("id")
                .asText();

        mockMvc.perform(get("/api/v1/incomes")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/v1/incomes/{id}", expenseId)
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

    private String createIncome(String token, String description, String amount, String category)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/incomes")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validIncome(description, amount, category)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String validIncome(String description, String amount, String category) throws Exception {
        return objectMapper.writeValueAsString(
                new IncomePayload(description, new BigDecimal(amount), category, "2026-10-19")
        );
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private record RegistrationPayload(String name, String email, String password) {
    }

    private record IncomePayload(String description, BigDecimal amount, String category, String date) {
    }
}
