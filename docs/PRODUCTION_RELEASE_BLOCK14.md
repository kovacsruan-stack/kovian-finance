# KOVIAN Finance — Bloco 14: Estabilização, QA e Produção

## Objetivo

Consolidar o KOVIAN Finance após a integração dos 13 blocos, validando build, segurança, deploy, integração Gestão → Finance e preparação do frontend para hospedagem externa.

## Fechamentos realizados

- Build Maven validado no Railway após correção do domínio de faturas e compatibilidade do ObjectMapper com Spring Boot 4.
- Política CORS explícita para o frontend hospedado, com métodos e headers limitados.
- X-Request-ID e headers de rate limit expostos somente quando necessários para observabilidade operacional.
- Teste automatizado da política CORS incluindo a origem do AppDeploy utilizado pelo KOVIAN Gestão.
- Backend Railway publicado em kovian-finance-api-production.up.railway.app.
- Vercel continua limitada por rate limit de builds; não é usada como critério único de validação.
- Frontend AppDeploy deve consumir o backend Railway por URL explícita, sem depender do proxy /api/v1 local.

## QA funcional mínimo

1. Abrir o app público.
2. Criar/retomar sessão anônima.
3. Criar conta financeira.
4. Criar categoria.
5. Criar movimentação.
6. Conferir saldo e dashboard.
7. Criar cartão e compra.
8. Abrir fatura e registrar pagamento.
9. Criar recorrência e processar vencida.
10. Criar orçamento e verificar consumo.
11. Criar meta e contribuição.
12. Abrir calendário e notificações.
13. Abrir Gestão, selecionar aluno e registrar aula com modalidade vinculada.
14. Importar backup do Gestão em prévia, confirmar e executar reconciliação.
15. Abrir painel operacional e verificar integrações/outbox sem expor segredos.

## Critérios de release

- Backend build: PASS.
- Backend deploy: PASS.
- CORS: PASS para a origem AppDeploy homologada.
- Frontend build AppDeploy: obrigatório antes de considerar a versão publicada.
- QA/E2E AppDeploy: obrigatório antes de compartilhar a URL como versão final.
- Smoke pós-deploy: obrigatório nas rotas principais.
- Rollback: disponível via versão anterior do AppDeploy/Railway.

## Pendências externas

- Liberação do limite de builds da Vercel para novo deploy.
- Homologação real da migração dos dados de Gestão.
- Validação com dados de produção e usuários reais.
