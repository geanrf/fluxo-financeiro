# Auditoria de segurança do repositório

Auditoria realizada em **19 de outubro de 2026**, antes da primeira publicação pública.

## Escopo

- árvore de trabalho publicável;
- todos os commits, branches e tags locais;
- nomes de arquivos no histórico;
- padrões de chaves privadas, tokens conhecidos, JWTs e URLs com credenciais;
- atribuições literais em variáveis de senha ou segredo;
- regras do `.gitignore`.

## Resultado

- histórico analisado: todos os commits, branches e tags locais disponíveis no momento da verificação;
- arquivos proibidos encontrados no histórico: 0;
- chaves privadas, tokens ou URLs autenticadas encontradas: 0;
- `.env` rastreado: não;
- bancos H2 rastreados: não;
- `.local`, `.maven`, `.tools`, `node_modules`, `target` ou `dist` rastreados: não;
- metadados textuais ou perfis pessoais nas capturas PNG: não;
- o valor de `POSTGRES_PASSWORD` em `.env.example` é uma instrução de substituição e não coincide com o valor local;
- configurações Spring versionadas usam valor vazio ou referência a variável de ambiente para segredos.

Nenhum valor sensível foi impresso durante a auditoria.

## Proteções adicionadas

- `.gitignore` cobre credenciais, bancos locais, caches, dependências e artefatos;
- `tools/security-audit.ps1` verifica a árvore publicável e todo o histórico sem exibir o conteúdo encontrado;
- o workflow de CI executa a auditoria antes dos testes e builds;
- o checkout da CI usa histórico completo para que commits anteriores também sejam avaliados.

## Antes de publicar

Execute novamente:

```powershell
pwsh -File .\tools\security-audit.ps1
git status --short
git ls-files .env .local .maven .tools
```

Depois da criação do repositório remoto, ative também o secret scanning oferecido pelo GitHub. Caso uma credencial real seja adicionada algum dia, remova-a do histórico e faça a rotação no provedor; apenas apagar o arquivo no commit seguinte não é suficiente.
