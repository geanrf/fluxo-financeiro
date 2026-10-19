# Organização por funcionalidades

Cada funcionalidade mantém seus componentes e tipos próximos do fluxo que implementa:

- `auth`: cadastro, login e sessão;
- `dashboard`: indicadores, gráficos e movimentações recentes;
- `expenses`: listagem, formulário e exclusão de despesas;
- `incomes`: listagem, formulário e exclusão de receitas;
- `finance`: shell autenticado e navegação lateral;
- `transactions`: componentes compartilhados do domínio financeiro.

Integrações HTTP reutilizam `shared/api/apiClient.ts`; elementos visuais genéricos ficam em `shared/ui`.
