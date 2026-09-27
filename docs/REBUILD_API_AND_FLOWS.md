# Reconstrução: fluxos prioritários e contratos de API

> Status: mapa inicial baseado na árvore de `main` e em controllers selecionados. Confirmar contratos, constraints e migrations antes de tratar como especificação final. Não altera a API de produção.

## Limites do produto
KOVIAN Finance é fonte de verdade para contas, transações, saldos, categorias, orçamento, dívidas, ativos, metas, recorrências, conciliação, fechamento e snapshots. KOVI-AÍ consome dados por API autorizada, nunca por acesso direto ao banco.

## Superfície de API observada
- `/api/v1/accounts`: criação e listagem de contas.
- `/api/v1/transactions`: criação/listagem de transações e cancelamento.
- `/api/v1/snapshots`: listagem e reconstrução de snapshots.
- Outros controllers identificados: categorias, orçamento, cartões, dívidas, metas, ativos, passivos, transferências, recorrências, importação, conciliação, notificações, auditoria, analytics e contexto/insights de IA.

## Fluxos MVP prioritários
1. **Identidade e isolamento**: resolver proprietário a partir da sessão autenticada; nunca aceitar `ownerId` do cliente como autoridade.
2. **Contas**: criar/listar contas no escopo do usuário; validar moeda, tipo, nome e saldo inicial.
3. **Transações**: registrar receita/despesa com conta/categoria pertencentes ao mesmo proprietário; usar decimal exato; publicar evento/auditoria na mesma unidade transacional lógica.
4. **Transferência**: fluxo dedicado, com débito e crédito atômicos; impedir transferências parciais.
5. **Cancelamento/estorno**: operação idempotente; reverter saldo exatamente uma vez; preservar histórico e auditoria.
6. **Resumo financeiro**: consolidar receitas, despesas, ativos e passivos sem incluir transações canceladas; definir fuso e limites de período.
7. **Importação/conciliação**: detectar duplicatas, manter identificador externo e oferecer reconciliação auditável.
8. **Integração com KOVI-AÍ**: entregar contexto mínimo, agregado e autorizado; não expor credenciais, dados de outros usuários ou payloads desnecessários.

## Contratos e invariantes
- Isolamento: todas as consultas e mutações filtradas por proprietário autenticado; teste obrigatório com dois usuários.
- Valores: `BigDecimal`/decimal no backend; nunca usar ponto flutuante binário para dinheiro; moeda explícita.
- Atomicidade: transação, saldo, auditoria e outbox devem permanecer consistentes; falha parcial deve reverter tudo.
- Idempotência: importações, webhooks, cancelamentos e comandos repetidos não duplicam lançamentos nem efeitos.
- Integridade: conta/categoria precisam pertencer ao usuário; tipo da categoria deve corresponder ao tipo da transação.
- Tempo: intervalo de consulta com limites explícitos; definir timezone para fechamento mensal e snapshots.
- Histórico: cancelamento deve preservar registro; não apagar silenciosamente operações financeiras.
- Privacidade: logs não devem conter dados bancários completos ou segredos.

## Critérios de aceite
- Testes de isolamento entre proprietários em todos os recursos.
- Testes de saldo para receita, despesa, cancelamento e transferência.
- Testes de concorrência/idempotência para operações repetidas.
- Testes de rollback quando persistência, auditoria ou outbox falharem.
- Testes de snapshots incluindo exclusão de canceladas e limites de período.
- Exportação/backup e recuperação documentados antes de migração.

## Próxima verificação
Inventariar todos os mappings HTTP, entidades, constraints e migrations. Depois implementar um fluxo vertical mínimo (conta → transação → saldo → snapshot) na branch de reconstrução, com testes de isolamento e atomicidade. Não alterar dados/serviços existentes.
