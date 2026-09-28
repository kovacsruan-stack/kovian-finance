# KOVIAN Gestão

Aplicação administrativa do ecossistema KOVIAN para alunos, modalidades, aulas, pagamentos e relatórios.

## Stack
- React + TypeScript + Vite
- API e persistência fornecidas pelo ambiente AppDeploy
- Autenticação Google, com acesso administrativo limitado no backend
- Interface responsiva e instalável (PWA)

## Estrutura
- `src/`: frontend
- `backend/`: endpoints e regras de acesso
- `tests/tests.json`: cenários de QA
- `appdeploy.auth-login.json`: configuração do login Google
- `manifest.webmanifest` e `kovian-icon.svg`: PWA e ícone

## Desenvolvimento
Instale as dependências com `npm install` e inicie com `npm run dev`. O build de produção é `npm run build`. O SDK `@appdeploy/client` e os serviços de backend são providos pelo ambiente AppDeploy.

## Privacidade e segurança
- Não versionar dados pessoais de alunos, pagamentos ou aulas.
- Não incluir credenciais, tokens, segredos ou bancos de produção no Git.
- As rotas de dados exigem autenticação e autorização administrativa no backend.
- O backend não deve semear cadastros reais; use a importação/cadastro dentro do aplicativo.

## Publicação
Este repositório mantém o código versionado. Commits no GitHub não significam publicação automática no AppDeploy; publicar é uma etapa separada.

## Integração com KOVIAN Finance

Pagamentos com status **Pago** podem ser enviados pelo botão **Enviar ao Finance** na lista de pagamentos. A chamada é feita pelo backend do Gestão; o token de integração nunca é enviado ao navegador. Em caso de falha, o pagamento permanece salvo no Gestão e o botão permite tentar novamente.

Configure estas variáveis **somente nos segredos do backend AppDeploy**:

- `KOVIAN_FINANCE_API_URL`: origem/base pública da API Finance, sem o sufixo `/api/v1`.
- `KOVIAN_FINANCE_INTEGRATION_TOKEN`: token de serviço com pelo menos 32 caracteres, igual a `GESTAO_INTEGRATION_TOKEN` no backend Finance.
- `KOVIAN_FINANCE_OWNER_ID`: UUID do proprietário configurado em `GESTAO_OWNER_MAP` no Finance.
- `KOVIAN_FINANCE_ACCOUNT_ID`: ID de uma conta BRL ativa pertencente ao usuário mapeado, também configurada em `GESTAO_ACCOUNT_MAP`.

No backend Finance, configure `GESTAO_OWNER_MAP` e `GESTAO_ACCOUNT_MAP` como objetos JSON, mapeando o UUID do proprietário do Gestão ao usuário e à conta Finance autorizados. Não coloque esses valores no frontend, no repositório ou em arquivos públicos.

A sincronização guarda o ID do evento, a referência do aluno e o instante original para que uma nova tentativa reutilize o mesmo evento. O Finance aplica idempotência e cria no máximo um lançamento por pagamento. Pagamentos antigos sem `studentId` só podem ser sincronizados quando o nome corresponder exatamente a um único aluno; prefira pagamentos vinculados ao ID do aluno.

A integração ainda depende da configuração de segredos e mapas nos ambientes de execução e de validação ponta a ponta. Não considere a integração pronta para produção até concluir essa validação.
