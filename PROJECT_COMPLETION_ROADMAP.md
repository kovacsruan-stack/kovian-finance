# KOVIAN Finance — Project Completion Roadmap

Updated: 2026-09-24

Current implementation scope: 98%

## Implemented
- financial domain core;
- owner isolation/RLS;
- transactions/accounts and financial intelligence;
- forecasting/context;
- financial close and reconciliation control plane;
- reconciliation exceptions;
- operation idempotency;
- evidence-backed exports;
- production hardening;
- KOVI federation;
- mobile/PWA control-plane experience;
- KOVI commercial-builder integration contract.

## Remaining implementation
1. bind all control-plane frontend surfaces to live services;
2. complete accounting invariants and edge-case workflows;
3. strengthen external connector adapters;
4. complete production observability/DR;
5. final security/performance/E2E validation.

## Builder boundary
KOVI AI may inspect, extend and maintain Finance through governed project workflows. Finance remains the source of truth for financial data and controls. KOVI must not bypass Finance services or write directly to financial tables.

Percentages measure implementation scope, not test/runtime completion.


## 2026-09-21 KOVI runtime compatibility checkpoint

Implementation scope: **97%**

Finance now has an explicit KOVIAN OS application manifest and remains domain-authoritative for all financial mutations. KOVI runtime workloads may host the application but cannot bypass Finance services.

Testing/runtime validation remains separate.


## 2026-09-21 implementation checkpoint

Implementation scope: **98%**

KOVIAN OS compatibility is now persisted as a governed application boundary. Finance remains authoritative for financial data and mutations. Remaining work is concentrated in live frontend binding, connector completeness, production observability/DR and final validation.


## 2026-09-23 production-hardening checkpoint

- Added bounded Hikari datasource pool defaults and explicit connection/validation timeouts.
- Added a datasource configuration contract test.
- Railway runtime validation identified an invalid DATABASE_URL value containing unresolved PGHOST/PGPORT/PGDATABASE placeholders; the application correctly fails during Flyway initialization instead of silently falling back to an unsafe database.
- Free-tier deployment remains the target; a real PostgreSQL connection is still required before production runtime validation can pass.


## 2026-09-24 continuation checkpoint
- Flyway migration integrity hardening is now documented and guarded by automated version checks.
- Production datasource configuration remains fail-closed when required connection variables are invalid or unresolved.
- Calendar user-facing flow is wired to live transaction, recurring and account services with loading, empty and error states.
- KOVIAN Finance remains authoritative for financial mutations; KOVI integration cannot bypass Finance services.
- Implementation scope estimate: **98%**. This remains an implementation estimate, not a runtime/test percentage.


## 2026-09-24 — Calendar resilience continuation
- Calendar now surfaces failures from transactions, recurring items and account-currency resolution instead of silently rendering a partial financial view.
- Loading and empty states remain explicit, while Finance remains authoritative for financial records and currency/account ownership.

**Current implementation scope estimate: 98%**

Remaining work is primarily runtime/production validation, real PostgreSQL/Redis evidence, full browser/E2E/security/performance validation, operational recovery and deployment readiness.


## 2026-09-24 — coordinated UX hardening checkpoint
- Calendar authentication/error notices now expose semantic status to assistive technologies.
- Calendar event rendering uses a more stable composite key.
- Implementation scope remains **98%**; remaining gaps are production PostgreSQL/Redis evidence, full browser/E2E/security/performance validation, DR and deployment readiness.

## 2026-09-28 — integração Gestão + Fitness no Finance

A estimativa histórica de 98% acima descreve o escopo financeiro anterior e **não representa a conclusão do produto integrado**.

### Decisão definitiva
- Nome final: **KOVIAN Finance**.
- Incorporar Gestão (alunos, modalidades, aulas, pagamentos e relatórios) ao Finance.
- Adaptar calendário e funções relevantes do Fitness ao Finance.
- Usar FitHub como referência visual, sem remover recursos existentes.

### Proteção de dados implementada
- Aulas e pagamentos novos passam a registrar `studentId` quando a correspondência com um único aluno é inequívoca.
- Exclusão de aluno substituída por inativação para preservar cadastro e histórico.
- Especificação da integração e dos critérios de reconciliação em `docs/INTEGRACAO_GESTAO_FINANCE.md`.

### Ainda pendente para concluir a integração
- O Gestão continua sendo uma aplicação separada em `kovian-gestao/` e usa a persistência AppDeploy; os dados ainda não foram migrados para o banco principal do Finance.
- Criar o modelo de alunos/modalidades/aulas e as migrações no backend principal.
- Criar migração idempotente e completa, com paginação, preservação de IDs e reconciliação de contagens e vínculos.
- Integrar as telas e navegação de Gestão no frontend principal do Finance.
- Adaptar o calendário do Fitness ao domínio unificado e à identidade visual de referência.
- Executar validação local, testes e QA de ponta a ponta.

**Status:** integração em andamento. Não declarar os dados migrados nem o produto unificado concluído até cumprir os critérios de `docs/INTEGRACAO_GESTAO_FINANCE.md`.


## 2026-09-28 — Gestão incorporada ao backend e frontend Finance

- Added the authoritative Spring Boot management-record API, owner-scoped by authenticated identity.
- Added Flyway V22 for JSONB-backed students, modalities, lessons and payments records.
- Added reversible archival and source-ID-based idempotent import endpoint.
- Added a Finance navigation entry and first integrated management workspace.
- Finance calendar now includes management lesson dates and payment due/paid dates.
- Added entity lifecycle tests and API route registration coverage.
- Real AppDeploy data migration, reconciliation, full Gestão feature parity, Fitness calendar parity, FitHub visual alignment, and local build/test/browser QA remain outstanding.
- **Integration implementation estimate: 55%** (the integrated-product scope only; not the historical Finance financial-domain estimate).

## 2026-09-29 — Integração Gestão: painel de reconciliação (entrega técnica)

- Exposto o endpoint de reconciliação de dados do Gestão no cliente TypeScript.
- Adicionado painel na tela Gestão para informar contagens esperadas por recurso e consultar a reconciliação.
- A interface apresenta contagem esperada, contagem encontrada, diferença e vínculos de aluno pendentes.
- A operação é somente de leitura; a interface alerta que os totais do Finance incluem registros arquivados e dados preexistentes.
- Adicionado teste de controller para divergência de vínculo e conferência de contagens.
- Build, testes automatizados e validação no navegador ainda pendentes.


## 2026-09-29 — Correções do ciclo Cartões e Faturas

- A fatura passou a aceitar pagamentos parciais, acumulando o valor pago e calculando o saldo restante; o estado muda para pago somente quando o total é liquidado.
- O endpoint de pagamento aceita valor e chave de idempotência para pagamentos parciais, rejeita valores acima do saldo e preserva compatibilidade com chamadas antigas de quitação integral.
- O cadastro/listagem de cartões passa a expor limite utilizado e limite disponível, calculados sobre os saldos em aberto das faturas.
- Faturas vencidas são apresentadas com estado `OVERDUE` sem alterar destrutivamente o estado persistido.
- O cancelamento genérico de transações não pode mais cancelar pagamentos de fatura, evitando desalinhar o saldo da conta do estado da fatura.
- Foram adicionados testes unitários de domínio para pagamentos parciais e saldo remanescente.
- **Status dos blocos 1–6: ainda não declarar concluídos.** As alterações acima cobrem requisitos específicos dos blocos 3 e 5; a validação de build, testes, UI e fluxos completos ainda precisa ser executada.


## 2026-09-29 — Blocos 7 e 8: Dashboard e Metas

### Bloco 7 — Dashboard financeiro
- Expandida a visão inicial com fluxo líquido de 90 dias, comparativo visual de receitas/despesas por mês, progresso agregado das metas e movimentações recentes.
- Mantido o carregamento por consultas existentes e dados limitados a uma janela de 90 dias para movimentações.
- Mantidos estados de carregamento, erro, vazio e navegação para módulos completos.
- Dashboard e novo gráfico receberam rótulos em PT-BR e EN e layout responsivo.

### Bloco 8 — Metas e objetivos
- Criada tela dedicada de metas, substituindo o placeholder genérico da rota `/metas`.
- Incluídos criação, edição, registro de contribuições de progresso, arquivamento, listagem de metas ativas e consulta de metas concluídas/arquivadas.
- Backend passou a expor operações owner-scoped para atualizar, contribuir e arquivar; consultas agora incluem metas inativas para preservar histórico na interface.
- Regras de domínio rejeitam contribuições inválidas, contribuições acima do saldo restante e redução da meta abaixo do valor já acumulado.
- Adicionados testes unitários de domínio para progresso, conclusão, validações, edição e arquivamento.
- A contribuição é explicitamente um registro de progresso: não movimenta saldo de contas nem cria transação financeira.

**Status:** implementação dos fluxos principais dos blocos 7 e 8 registrada no código. Build, testes automatizados e QA de navegador ainda não foram executados; portanto, não marcar como tecnicamente validados até essa etapa.


## 2026-09-29 — Blocos 9 e 10: Orçamentos e recorrências

### Bloco 9 — Orçamentos
- Criada tela dedicada em `/orcamentos`, ligada ao endpoint real de orçamentos e às categorias de despesa.
- Implementados criação de orçamento por categoria, periodicidade semanal/mensal/anual e data inicial do período.
- Implementados filtros por intervalo de datas e periodicidade, totais de limite/gasto/saldo, progresso de consumo e indicação de estouro do limite.
- Incluídos estados de carregamento, erro, vazio, atualização e validação de formulário.
- Navegação já existente conectada à nova tela; traduções PT-BR/EN adicionadas.
- Limitação explícita: a API atual não oferece edição nem exclusão de orçamentos; a interface informa isso e não simula operações inexistentes.

### Bloco 10 — Lançamentos recorrentes
- Criada tela dedicada em `/recorrentes`, ligada aos endpoints reais de recorrências.
- Implementados cadastro de receitas/despesas recorrentes, conta, categoria compatível com o tipo, valor, periodicidade semanal/mensal/anual, próxima ocorrência e data final opcional.
- Implementados pausar e retomar recorrências, visão de próximas ocorrências e equivalentes mensais estimados para receitas/despesas ativas.
- Adicionada ação explícita e confirmada para processar ocorrências vencidas até a data atual; o resultado informa quantas transações foram criadas.
- Processamento continua sob ação do usuário; cadastrar uma recorrência não lança transações automaticamente.
- Navegação já existente conectada à nova tela; traduções PT-BR/EN adicionadas.

**Status dos blocos 9 e 10:** fluxos principais de interface conectados às APIs existentes e registrados no código. Build TypeScript/Vite, testes automatizados e QA no navegador ainda não foram executados. Não declarar validação técnica concluída até essa etapa.


## 2026-09-29 — Blocos 10 e 11: Recorrências, Calendário e Notificações

### Bloco 10 — Lançamentos recorrentes
- Completo o ciclo de recorrências no backend: criação, consulta, edição, pausa, retomada, desativação e processamento idempotente de ocorrências vencidas.
- Regras de domínio impedem edição de recorrência pausada, retomada após a data final, tipos de transferência e datas finais inválidas.
- A tela dedicada permite criar e editar recorrências, visualizar próximas ocorrências, pausar/retomar e processar vencimentos até a data atual com confirmação.
- Resumos mensais permanecem separados por moeda para evitar somar valores de moedas diferentes.
- Adicionados testes de domínio para avanço de datas, edição, pausa e encerramento por data final.

### Bloco 11 — Calendário e notificações
- Calendário Finance integra transações, recorrências projetadas, contas/moeda, aulas, pagamentos, despesas e eventos do Fitness/agenda importada.
- Mantidos navegação mensal, seleção de dia, pesquisa, filtro por tipo de evento e exportação ICS.
- Adicionado resumo mensal de fluxo por moeda, sem misturar moedas em um único total.
- Importação ICS permanece com prévia, limite de arquivo, deduplicação por UID, confirmação explícita, importação em lotes e reconciliação de resultado.
- Calendário recebeu estados de carregamento/erro/vazio e navegação localizada em PT-BR/EN.
- Notificações agora possuem filtros por lidas/não lidas e severidade, atualização manual, abertura do módulo relacionado, marcação individual e marcação em massa como lidas.
- Backend de notificações recebeu operação owner-scoped de marcar até 100 notificações não lidas como lidas e testes de isolamento do proprietário.
- Regras existentes continuam gerando alertas de orçamento, recorrências vencidas, dívidas, risco de fluxo e picos de gastos com deduplicação.

**Status dos blocos 10 e 11:** implementação funcional ampla registrada no backend e frontend. A validação final de build/testes/QA no navegador permanece pendente.


## 2026-09-29 — Blocos 12 e 13: integração, reconciliação, segurança e operação

### Bloco 12 — Importação, reconciliação e integrações externas
- Importação do Gestão agora usa o endpoint paginado para a listagem do workspace, evitando dependência de uma resposta única para grandes volumes.
- A reconciliação do Gestão passou a comparar, além das contagens, conjuntos de `sourceId` fornecidos pelo backup, com amostras de IDs faltantes e extras.
- A importação de backup completo dispara reconciliação automática após os lotes, verificando contagens, IDs de origem e vínculos de alunos.
- O remapeamento de aluno aceita tanto o identificador de origem quanto um UUID de registro Finance quando aplicável, preservando o ID legado no histórico.
- O painel operacional passou a expor o estado dos adaptadores Lago/Kill Bill e as filas do outbox por proprietário, sem revelar segredos.

### Bloco 13 — Segurança, qualidade e operação
- Filtros de correlação, isolamento de proprietário e rate limit passaram a ser registrados na cadeia de segurança.
- Rate limit agora cobre sessões anônimas de autenticação por endereço de origem com limite separado, além do limite por proprietário autenticado; falha do Redis permanece fail-closed.
- Cabeçalhos de segurança foram endurecidos com frame denial, Referrer-Policy e HSTS quando suportado pelo canal seguro.
- Respostas de erro preservam o `X-Correlation-Id` para rastreabilidade ponta a ponta.
- O endpoint de health deixou de inventar `UP` e voltou a delegar ao health real do Actuator, adicionando apenas headers operacionais seguros.
- Foram adicionados testes unitários para o health filter e para a fronteira do rate limit anônimo.

**Status:** implementação dos blocos 12 e 13 registrada no código. Migração real de dados do AppDeploy, build/testes completos e homologação de produção continuam dependendo de execução no ambiente autorizado. O deploy frontend na Vercel será verificado após a integração na `main`.
