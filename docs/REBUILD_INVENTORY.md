# KOVIAN Finance — Inventário inicial para reconstrução

**Base analisada:** árvore Git da branch `main` em 2026-09-27.  
**Status:** inventário estrutural inicial; não é auditoria linha a linha nem validação de runtime.

## Evidências da árvore

- 506 caminhos rastreados.
- Frontend separado em `frontend/`, com páginas e contratos/schemas tipados.
- Backend Java/Spring Boot dividido por domínios financeiros.
- Migrações Flyway e testes backend presentes.
- Há workflows GitHub Actions, arquivos de deploy e configurações que serão avaliados para simplificação.

## Domínios identificados

Contas; transações; categorias; orçamento e metas; transferências/ledger; cartões e faturas; dívidas e parcelas; ativos e passivos; recorrência; previsões; analytics; insights de IA; notificações; importação/exportação; reconciliação; snapshots; auditoria; integração KOVI-AÍ.

## Classificação inicial

| Área | Direção inicial |
|---|---|
| Identidade e isolamento por usuário | Reescrever e testar primeiro |
| Contas e saldos | MVP |
| Receitas, despesas e categorias | MVP |
| Transferências/ledger | MVP, com atomicidade e idempotência |
| Dashboard e filtros | MVP |
| Orçamento mensal | MVP básico |
| Importação/exportação e backup | Incluir com validação e proteção de dados |
| Cartões, dívidas, ativos/passivos, recorrência | Inventariar; priorizar após invariantes centrais |
| Reconciliação, snapshots e auditoria | Simplificar mantendo integridade e recuperação |
| Previsões, analytics e insights de IA | Fase posterior |
| Integração com KOVI-AÍ | Contrato de API autenticado; nunca acesso direto ao banco |

## Arquitetura alvo

- Frontend: React + TypeScript com a mesma organização dos outros projetos.
- Backend: Java + Spring Boot, API REST em camadas simples.
- PostgreSQL e migrações Flyway versionadas.
- Valores monetários com `BigDecimal`/DECIMAL; nunca float/double.
- Transferências em transação de banco, com validação de origem/destino e proteção contra duplicidade.
- Saldos e lançamentos devem ser consistentes; mutações relevantes auditáveis.
- Autorização e filtro por proprietário aplicados no backend.

## Próxima execução

1. Mapear controllers, DTOs, serviços, entidades e migrações.
2. Definir invariantes de contas, transações, transferências e saldo.
3. Construir fluxo vertical: conta → lançamento → saldo → dashboard.
4. Testar atomicidade, idempotência, isolamento por usuário e exportação.
5. Planejar migração apenas após backup restaurável e reconciliação de contagens/saldos.

## Limitações

Não foi possível executar build/testes locais nesta etapa: o host SentinelX está offline. Nenhum teste é considerado aprovado.