# KOVIAN Finance — Integração entre módulos

Data da auditoria: 2026-09-29  
Base auditada: `main`

## Objetivo

Fazer com que os módulos compartilhem uma única fonte de verdade e que as alterações financeiras sejam refletidas de forma consistente em saldos, calendário, orçamento, cartões, recorrências, projeções e relatórios.

## Constatações verificadas no código

- O backend de transações atualiza o saldo da conta ao criar uma receita/despesa e reverte esse efeito ao cancelar. A criação rejeita transferências, que usam o fluxo dedicado.
- A criação de transação exige conta e categoria existentes do mesmo proprietário; o tipo da categoria deve corresponder ao tipo da transação.
- A API de orçamento valida categoria de despesa e duplicidade por categoria/período, mas o contrato de resposta consultado contém limite e período, não o total consumido. A integração do consumo precisa ser confirmada/implementada no serviço de analytics ou em uma consulta agregada.
- A projeção de fluxo de caixa consultada estima receitas/despesas diárias com base nos 90 dias anteriores e parte do saldo agregado das contas. Nesse caminho, não foi observada a inclusão explícita de recorrências futuras, parcelas de cartão ou compromissos agendados.
- O frontend já possui contratos para contas, transações, metas, cartões, faturas, compras, categorias, orçamentos, recorrências, analytics, transferências e conciliação. Portanto, a integração deve aproveitar esses contratos e evitar criar modelos paralelos.
- O frontend tem utilitário próprio para eventos de calendário. É necessário validar a origem de cada tipo de evento e evitar que uma mesma obrigação seja contabilizada mais de uma vez.

## Regras de domínio que devem permanecer invariáveis

1. **Uma compra no cartão é a despesa.** O pagamento da fatura liquida a obrigação e movimenta a conta de pagamento; não deve lançar novamente cada compra como nova despesa.
2. **Transferência não é receita nem despesa.** Deve gerar débito e crédito vinculados, sem alterar o resultado operacional.
3. **Cancelamento/estorno é idempotente.** Repetir a ação não pode reverter saldo duas vezes.
4. **Uma obrigação tem uma identidade estável.** Calendário, notificações e relatórios devem referenciar a mesma obrigação, não criar cópias independentes.
5. **Recorrências precisam de chave de ocorrência.** Gerar novamente o período não pode duplicar lançamentos.
6. **Dados financeiros são sempre escopados pelo proprietário autenticado.** Um ownerId enviado pelo cliente nunca substitui a identidade autenticada.
7. **Valores monetários usam precisão decimal no backend.** Evitar aritmética monetária com ponto flutuante em regras de domínio.
8. **Relatórios e projeções distinguem realizado, pendente e previsto.** Não somar previsões como se fossem movimentações liquidadas.

## Matriz de integração

| Origem | Destinos | Comportamento esperado |
|---|---|---|
| Transação | Conta, orçamento, analytics, calendário | Atualizar saldo/indicadores; refletir status e data; excluir canceladas dos totais |
| Transferência | Contas de origem/destino, calendário, analytics | Atualizar as duas contas de forma atômica; não classificar como receita/despesa |
| Compra no cartão | Cartão, fatura, parcelas, calendário, analytics | Vincular compra à fatura/parcelas; preservar uma única contabilização da despesa |
| Pagamento de fatura | Conta, fatura, calendário, analytics | Debitar conta e liquidar fatura sem duplicar despesas das compras |
| Recorrência | Lançamentos, calendário, notificações, previsão | Criar ocorrência idempotente e avançar próxima data |
| Orçamento | Categorias, transações, dashboard | Calcular consumo a partir de despesas elegíveis do período |
| Meta | Aportes/movimentações, dashboard, planejamento | Exibir progresso com origem rastreável; definir se aporte é transferência interna ou anotação, sem duplicar despesa |
| Importação | Transações, contas, categorias, analytics | Validar antes de gravar; deduplicar; informar erros por linha |
| Dashboard | Todos os módulos | Cada indicador abre os registros que o compõem e informa período/status usados |

## Plano de execução

### Fase 1 — Consistência e fonte de verdade
- [ ] Documentar e testar regras de saldo, cancelamento, transferência, compra e pagamento de fatura.
- [ ] Confirmar que consultas de analytics ignoram transações canceladas e não contam transferências como despesas/receitas.
- [ ] Auditar contratos frontend/backend para contas, transações, cartões e recorrências.
- [ ] Criar testes de regressão para duplicidade, idempotência e isolamento por proprietário.

### Fase 2 — Calendário como visão unificada
- [ ] Definir adaptadores de evento por origem, com tipo, status, entidade de origem e rota de destino.
- [ ] Incluir vencimentos de obrigações, faturas, recorrências e compromissos previstos que já existam no backend.
- [ ] Fazer ações no calendário chamarem o fluxo de domínio correspondente, nunca alterarem apenas o evento visual.
- [ ] Evitar eventos duplicados quando uma obrigação também aparece como transação.

### Fase 3 — Orçamentos e relatórios
- [ ] Implementar/confirmar agregação de despesas por categoria e período, com regras de status explícitas.
- [ ] Exibir utilizado, disponível e percentual, sem misturar previsto com realizado.
- [ ] Garantir que editar/cancelar/importar uma transação reflita nos indicadores.
- [ ] Permitir navegar do indicador para a lista filtrada de lançamentos de origem.

### Fase 4 — Projeção financeira
- [ ] Estender a projeção para considerar compromissos futuros confirmados, recorrências ativas, parcelas e faturas abertas, quando os dados estiverem disponíveis.
- [ ] Exibir separadamente saldo atual, saldo projetado e premissas.
- [ ] Evitar contar compromissos já liquidados/cancelados ou faturas e compras duas vezes.
- [ ] Testar cenários com datas, fusos horários e períodos sem histórico.

### Fase 5 — Ações rápidas e rastreabilidade
- [ ] Adicionar ponto de entrada global para novo lançamento, transferência, compra no cartão e agendamento.
- [ ] Pré-preencher contexto de conta/categoria/data quando seguro.
- [ ] Fazer indicadores e eventos abrirem o registro de origem.
- [ ] Padronizar estados de carregamento, erro, sucesso e invalidação de cache após mutações.

## Critérios de aceite de ponta a ponta

- Criar uma despesa atualiza saldo, orçamento, analytics e calendário conforme as regras de status.
- Cancelar a despesa restaura o saldo uma única vez e atualiza todas as visões.
- Transferir entre contas altera os dois saldos, sem afetar receitas/despesas.
- Comprar no cartão gera a despesa e a obrigação da fatura; pagar a fatura não duplica a despesa.
- Recorrências não geram ocorrências duplicadas ao executar novamente o processamento.
- Importar o mesmo arquivo duas vezes não duplica registros reconhecidos como iguais.
- Nenhum usuário consegue consultar ou alterar registros de outro proprietário.
- O dashboard permite rastrear cada total até os registros que o compõem.

## Limites desta entrega

Este documento registra a auditoria inicial e o contrato-alvo. Não afirma que as integrações listadas já foram implementadas, que testes foram executados ou que houve deploy. As alterações de comportamento devem ser entregues em incrementos pequenos, com testes e revisão antes de integrar à `main`.
