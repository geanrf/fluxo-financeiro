# Arquitetura do Fluxo

## Visão geral

O Fluxo é um monólito modular com frontend e backend separados. Essa escolha mantém o domínio organizado e o deploy simples, adequado ao tamanho atual do produto e fácil de explicar em uma entrevista técnica.

```mermaid
flowchart TB
    subgraph Browser[Browser]
        UI[React + TypeScript]
        Store[Token de acesso]
        UI <--> Store
    end

    subgraph API[Spring Boot API]
        Security[Spring Security + JWT]
        Identity[Identity]
        Income[Income]
        Expense[Expense]
        Dashboard[Dashboard]
        Shared[Erros + OpenAPI]
        Security --> Identity
        Security --> Income
        Security --> Expense
        Security --> Dashboard
        Shared -. suporte .-> Identity
        Shared -. suporte .-> Income
        Shared -. suporte .-> Expense
        Shared -. suporte .-> Dashboard
    end

    subgraph Data[Persistência]
        JPA[Spring Data JPA]
        DB[(H2 local)]
        Flyway[Flyway]
        JPA --> DB
        Flyway --> DB
    end

    UI -->|REST / JSON| Security
    Identity --> JPA
    Income --> JPA
    Expense --> JPA
    Dashboard --> JPA
```

## Fluxo de autenticação

```mermaid
sequenceDiagram
    actor User as Usuário
    participant React
    participant Security as Spring Security
    participant Auth as AuthService
    participant DB as H2

    User->>React: Envia e-mail e senha
    React->>Security: POST /api/v1/auth/login
    Security->>Auth: Credenciais validadas
    Auth->>DB: Busca usuário por e-mail
    DB-->>Auth: Hash BCrypt
    Auth->>Auth: Verifica senha e emite JWT
    Auth-->>React: Token + dados do usuário
    React->>Security: GET /api/v1/dashboard + Bearer JWT
    Security->>Security: Valida assinatura e expiração
    Security-->>React: Dados exclusivos do subject do token
```

## Modelo de dados atual

```mermaid
erDiagram
    APP_USERS ||--o{ FINANCIAL_TRANSACTIONS : owns
    APP_USERS {
        uuid id PK
        string name
        string email UK
        string password_hash
        timestamp created_at
    }
    FINANCIAL_TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        string type
        string description
        decimal amount
        date transaction_date
        string category
        string notes
        timestamp created_at
        timestamp updated_at
    }
```

Receitas e despesas compartilham a tabela `financial_transactions` e são diferenciadas por `type`. Isso evita duplicação no domínio e permite agregações eficientes no dashboard.

## Responsabilidades por camada

| Camada | Responsabilidade |
| --- | --- |
| React | interface, navegação, formulários, estados de carregamento e consumo da API |
| Controllers | contrato HTTP, status codes e obtenção do usuário autenticado |
| Services | regras, normalização, autorização por propriedade e limites transacionais |
| Repositories | consultas JPA sempre filtradas pelo identificador do proprietário |
| Flyway | criação e evolução reproduzível do esquema |
| Global error handler | resposta consistente sem expor detalhes internos |

## Decisões e trade-offs

- **H2 persistente no perfil `dev`:** reduz o tempo de onboarding. O perfil alternativo de PostgreSQL não é necessário para avaliar o MVP.
- **JWT stateless:** simplifica a API e demonstra Spring Security. No desenvolvimento, uma chave aleatória é criada a cada inicialização; reiniciar o backend invalida tokens antigos.
- **Token no `localStorage`:** solução simples para o portfólio. Em um produto exposto à internet, a evolução recomendada é usar cookie `HttpOnly`, `Secure` e `SameSite`, além de uma política CSP.
- **Consultas por proprietário:** o `userId` vem do subject do JWT, nunca do payload enviado pelo cliente.
- **`BigDecimal` no backend:** evita erros de ponto flutuante em valores monetários.
- **SVG/CSS nos gráficos:** evita uma dependência adicional e mantém o bundle pequeno.
- **Limite de 24 meses no dashboard:** impede consultas agregadas excessivas e mantém a visualização legível.

## Evolução possível

Paginação, refresh tokens, cookies seguros, testes de componentes React, observabilidade e deploy são evoluções naturais. Elas foram deixadas fora do MVP para manter o projeto funcional, objetivo e fácil de avaliar.
