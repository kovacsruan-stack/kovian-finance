# ADR-001 — Stack e fronteiras do ecossistema KOVIAN

- **Status:** Proposta consolidada para orientar a reconstrução
- **Data:** 2026-09-27
- **Escopo:** KOVI-AÍ, KOVIAN Fitness e KOVIAN Finance
- **Regra:** esta decisão não autoriza merge, migração de dados, alteração de serviços ou remoção de código da versão atual.

## Contexto

Os três produtos compartilham padrões de engenharia, mas têm responsabilidades diferentes. Fitness e Finance são sistemas de domínio com regras transacionais; KOVI-AÍ é a camada de orquestração de modelos e ferramentas. Forçar uma única linguagem em todos aumentaria o custo de migração sem garantir uma arquitetura mais simples.

## Decisão proposta

### Padrões comuns

- Frontend: React + TypeScript.
- APIs REST com contratos explícitos, validação de entrada e erros consistentes.
- Separação simples entre HTTP, regras de negócio, persistência e segurança.
- PostgreSQL como persistência durável quando aplicável, com migrações versionadas.
- Autorização no servidor; isolamento de dados por usuário/workspace.
- Segredos somente em configuração segura do ambiente, nunca no frontend, Git ou logs.
- Testes com dados fictícios; sem dependência de GitHub Actions.
- Integrações entre produtos por APIs autenticadas, nunca por acesso direto ao banco de outro produto.

### Runtime por produto

| Produto | Backend | Justificativa |
|---|---|---|
| KOVI-AÍ | TypeScript / Node.js | Mantém o ecossistema de SDKs e bibliotecas de IA e evita uma migração de runtime antes de provar benefício. |
| KOVIAN Fitness | Java 21 / Spring Boot | Adequado ao domínio transacional e à base Java existente; regras e persistência ficam no serviço de Fitness. |
| KOVIAN Finance | Java 21 / Spring Boot | Consistência transacional, tipos monetários seguros e alinhamento com a base Java existente. |

A uniformidade será de **responsabilidades, contratos, nomenclatura, segurança, observabilidade e critérios de qualidade**, não de linguagem forçada.

## Limites de domínio

- Fitness é a fonte de verdade para alunos, treinadores, treinos, avaliações e progresso.
- Finance é a fonte de verdade para contas, lançamentos, saldos e planejamento financeiro.
- KOVI-AÍ coordena modelos e ferramentas autorizadas; não é dono dos dados de Fitness ou Finance.
- Chamadas de IA não podem conceder permissões. A autorização é decidida e aplicada pelos serviços.
- Ações que alteram dados exigem autorização explícita; operações sensíveis exigem confirmação e auditoria.

## Sequência de reconstrução

1. Mapear rotas, controllers, contratos, entidades, migrações e consumidores atuais.
2. Definir o contrato mínimo de autenticação e identidade entre frontend e API.
3. Criar a fundação executável em branch de reconstrução, sem tocar na `main`.
4. Implementar um fluxo vertical de cada produto, incluindo persistência e tratamento de erros.
5. Adicionar testes de regras críticas e isolamento de usuários.
6. Revisar diff, dependências, configuração e riscos antes de qualquer merge.
7. Migrar para ambiente local e executar build/testes/QA somente na etapa de validação.

## Critérios de aceite para esta decisão

- Cada produto tem responsabilidade de domínio inequívoca.
- Integrações não compartilham acesso irrestrito ao banco.
- Nenhum segredo ou dado real de usuário é incluído nos exemplos/testes.
- Nenhuma funcionalidade, tabela, serviço ou histórico é removido sem inventário, backup/rollback e decisão registrada.
- A decisão pode ser revisada se evidências de implementação demonstrarem custo ou risco relevante.

## Próxima decisão

Aprovar o contrato mínimo de identidade/autorização e mapear os fluxos prioritários por produto antes de implementar telas ou endpoints novos.
