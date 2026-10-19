# Gestão Financeira — Fluxo

Aplicação full stack de gestão financeira pessoal, construída para portfólio com Java 21, Spring Boot 3, React e TypeScript. O projeto permite criar uma conta, autenticar-se e controlar receitas e despesas com isolamento de dados por usuário.

## Funcionalidades

- cadastro e login com senha protegida por BCrypt;
- autenticação stateless com JWT;
- criação, consulta, edição e exclusão de receitas e despesas;
- resumo de saldo, receitas e despesas;
- filtros por tipo e busca por descrição ou categoria;
- validação no frontend e no backend;
- respostas de erro padronizadas;
- layout responsivo em azul-escuro e ciano;
- documentação interativa com Swagger UI.

## Tecnologias

- Java 21, Spring Boot 3.5, Maven Wrapper;
- Spring Security, Spring Data JPA, Bean Validation;
- Flyway e H2 persistente no desenvolvimento local;
- PostgreSQL disponível como perfil alternativo para evolução futura;
- React 19, TypeScript e Vite;
- JUnit, Spring Boot Test e MockMvc.

## Execução local rápida

O perfil padrão usa H2 persistente em `.local/h2`, uma pasta ignorada pelo Git. Não é necessário Docker nem configurar senha de banco para executar o projeto agora.

Backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Frontend, em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

Acesse:

- aplicação: `http://localhost:5173`;
- health check: `http://localhost:8080/actuator/health`;
- Swagger UI: `http://localhost:8080/swagger-ui.html`;
- OpenAPI JSON: `http://localhost:8080/api-docs`.

No primeiro acesso, use a tela **Criar conta**. A senha precisa ter entre 8 e 72 caracteres e conter letra maiúscula, letra minúscula e número.

## Testes e builds

Backend:

```powershell
cd backend
.\mvnw.cmd verify
```

Frontend:

```powershell
cd frontend
npm run typecheck
npm run build
```

## Estrutura

```text
gestao-financeira/
|-- backend/
|   |-- src/main/java/com/portfolio/finance/
|   |   |-- identity/       # cadastro, login e usuário
|   |   |-- transaction/    # receitas e despesas
|   |   `-- shared/         # segurança, OpenAPI e erros
|   `-- src/main/resources/db/migration/
|-- frontend/
|   `-- src/
|       |-- app/
|       |-- features/auth/
|       |-- features/transactions/
|       `-- shared/
|-- compose.yml
`-- .env.example
```

## Banco de dados e migrações

No perfil `dev`, os dados ficam no arquivo local `.local/h2/finance`. O Flyway cria e versiona o esquema; o Hibernate usa `validate`, evitando alterações automáticas e silenciosas.

Migrações atuais:

- `V1`: esquema `finance`;
- `V2`: tabela de usuários;
- `V3`: tabela de transações e relacionamento com o proprietário.

O PostgreSQL permanece configurável pelo perfil `postgres`, mas não é necessário para o fluxo local atual. Quando ele for retomado, copie `.env.example` para `.env`, defina as credenciais somente no arquivo local e execute:

```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=postgres"
```

O `.env`, `.local`, artefatos de build e dependências locais estão protegidos pelo `.gitignore`.

## Decisões técnicas

- **Monólito modular:** entrega rápida com separação clara por funcionalidade, sem o custo operacional de microsserviços.
- **JWT e BCrypt:** a API não mantém sessão no servidor e nunca armazena senhas em texto puro.
- **Consultas por proprietário:** toda operação financeira inclui o identificador do usuário autenticado, impedindo acesso a dados de outra conta.
- **Flyway como fonte do esquema:** mudanças de banco são explícitas, versionadas e reproduzíveis.
- **H2 persistente no desenvolvimento:** reduz dependências de infraestrutura agora, mantendo PostgreSQL como evolução compatível.
- **API versionada:** os endpoints de negócio ficam sob `/api/v1` para permitir evolução controlada.

Nenhuma credencial real deve ser adicionada ao repositório.
