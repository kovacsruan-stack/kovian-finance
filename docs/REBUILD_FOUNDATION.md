# KOVIAN Finance — Fundação da reconstrução

**Status:** planejamento técnico inicial; não representa implementação nem validação de runtime.  
**Branch:** `rebuild/foundation-2026`  
**Regra de segurança:** `main` permanece intacta; não apagar registros, migrações, módulos, rotas ou histórico nesta fase.

## 1. Papel do produto

Sistema pessoal de organização financeira. O backend é a fonte de verdade para saldos e lançamentos; o navegador não deve ser a fonte canônica de registros financeiros.

## 2. MVP reconstruído

1. Autenticação e isolamento por usuário.
2. Contas e saldos.
3. Transações de receitas, despesas e transferências.
4. Categorias.
5. Orçamento mensal.
6. Dashboard de saldo, receitas, despesas e lançamentos recentes.
7. Filtros, pesquisa e exportação/backup.
8. Histórico de alterações e tratamento seguro de erros.

Cartões avançados, dívidas, ativos, previsões, regras automáticas e insights de IA podem ser mantidos no inventário, mas só entram no primeiro lançamento após os invariantes básicos estarem cobertos.

## 3. Arquitetura proposta

- Frontend: React + TypeScript, formulários validados e estados consistentes.
- Backend: preservar Spring Boot/Java e a estrutura modular existente, salvo evidência técnica em contrário.
- Banco: PostgreSQL e migrações versionadas.
- Valores monetários: BigDecimal/DECIMAL; nunca float/double para cálculo financeiro.
- Consistência: transações de banco, idempotência para eventos externos e regras explícitas para transferências.
- Segurança: autorização no servidor, isolamento por proprietário, logs sem dados sensíveis e auditoria de mutações.
- Integrações: contratos explícitos; KOVI-AÍ não recebe acesso direto ao banco nem executa mutações sem autorização/confirmação.

## 4. Invariantes e critérios de aceite

- Uma transferência movimenta origem e destino de forma atômica e não duplica.
- Saldo derivado e lançamentos permanecem consistentes.
- Valores, moeda, datas e categorias são validados no servidor.
- Usuário não lê nem altera dados de outro usuário.
- Exclusões financeiras são preferencialmente reversíveis/auditáveis.
- Dados persistem após recarregar e exportações são verificáveis.
- Falhas apresentam mensagem recuperável sem expor stack traces ou segredos.

## 5. Plano de validação

Sem GitHub Actions. Quando o ambiente estiver disponível, executar testes do backend, lint/test/build do frontend e testes de integração com banco de teste. Usar apenas dados fictícios. Não declarar consistência financeira, build, QA ou produção validados sem evidência.

## 6. Próxima etapa

Inventariar controllers, serviços, repositórios, entidades, migrações, rotas, contratos e testes. Classificar cada módulo como **reaproveitar**, **reescrever**, **adiar** ou **investigar**. Não remover tabelas ou histórico sem plano de migração e recuperação.