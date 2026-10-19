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

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class DashboardIntegrationTest {

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
    void shouldCalculateDashboardForSelectedPeriodWithMonetaryPrecision() throws Exception {
        String token = register("Ana Silva", "ana.dashboard@exemplo.com");
        createTransaction(token, "Receita anterior", "INCOME", "200.00", "Outros", "2026-08-20");
        createTransaction(token, "Salário setembro", "INCOME", "5000.00", "Trabalho", "2026-09-05");
        createTransaction(token, "Aluguel", "EXPENSE", "1000.00", "Moradia", "2026-09-10");
        createTransaction(token, "Projeto outubro", "INCOME", "3000.00", "Freelance", "2026-10-05");
        createTransaction(token, "Mercado", "EXPENSE", "800.00", "Alimentação", "2026-10-20");

        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", bearer(token))
                        .param("from", "2026-09-01")
                        .param("to", "2026-10-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBalance").value(6400.00))
                .andExpect(jsonPath("$.periodIncome").value(8000.00))
                .andExpect(jsonPath("$.periodExpense").value(1800.00))
                .andExpect(jsonPath("$.periodResult").value(6200.00))
                .andExpect(jsonPath("$.monthlySummary.length()").value(2))
                .andExpect(jsonPath("$.monthlySummary[0].month").value("2026-09"))
                .andExpect(jsonPath("$.monthlySummary[0].income").value(5000.00))
                .andExpect(jsonPath("$.monthlySummary[0].expense").value(1000.00))
                .andExpect(jsonPath("$.monthlySummary[0].result").value(4000.00))
                .andExpect(jsonPath("$.monthlySummary[1].month").value("2026-10"))
                .andExpect(jsonPath("$.monthlySummary[1].income").value(3000.00))
                .andExpect(jsonPath("$.monthlySummary[1].expense").value(800.00))
                .andExpect(jsonPath("$.expenseCategories[0].category").value("Moradia"))
                .andExpect(jsonPath("$.expenseCategories[0].amount").value(1000.00))
                .andExpect(jsonPath("$.expenseCategories[1].category").value("Alimentação"))
                .andExpect(jsonPath("$.recentTransactions.length()").value(4))
                .andExpect(jsonPath("$.recentTransactions[0].description").value("Mercado"));
    }

    @Test
    void shouldKeepDashboardDataIsolatedByAuthenticatedUser() throws Exception {
        String anaToken = register("Ana Silva", "ana.isolamento.dashboard@exemplo.com");
        String brunoToken = register("Bruno Lima", "bruno.isolamento.dashboard@exemplo.com");
        createTransaction(anaToken, "Receita da Ana", "INCOME", "1000.00", "Trabalho", "2026-10-10");
        createTransaction(brunoToken, "Receita privada do Bruno", "INCOME", "9000.00", "Trabalho", "2026-10-11");

        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", bearer(anaToken))
                        .param("from", "2026-10-01")
                        .param("to", "2026-10-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBalance").value(1000.00))
                .andExpect(jsonPath("$.periodIncome").value(1000.00))
                .andExpect(jsonPath("$.recentTransactions.length()").value(1))
                .andExpect(jsonPath("$.recentTransactions[0].description").value("Receita da Ana"))
                .andExpect(content().string(not(containsString("Receita privada do Bruno"))));

        mockMvc.perform(get("/api/v1/dashboard")
                        .param("from", "2026-10-01")
                        .param("to", "2026-10-31"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectInvalidOrExcessivePeriods() throws Exception {
        String token = register("Ana Silva", "ana.periodo.dashboard@exemplo.com");

        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", bearer(token))
                        .param("from", "2026-10-31")
                        .param("to", "2026-10-01"))
                .andExpect(status().isUnprocessableEntity());

        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", bearer(token))
                        .param("from", "2024-01-01")
                        .param("to", "2026-10-31"))
                .andExpect(status().isUnprocessableEntity());
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

    private void createTransaction(
            String token,
            String description,
            String type,
            String amount,
            String category,
            String date
    ) throws Exception {
        String body = objectMapper.writeValueAsString(
                new TransactionPayload(type, description, new BigDecimal(amount), date, category, null)
        );

        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private record RegistrationPayload(String name, String email, String password) {
    }

    private record TransactionPayload(
            String type,
            String description,
            BigDecimal amount,
            String date,
            String category,
            String notes
    ) {
    }
}
