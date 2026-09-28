# KOVIAN Gestão + Finance — plano de integração

## Objetivo

Entregar um único produto chamado **KOVIAN Gestão**, com os módulos Operação e Financeiro na mesma experiência. O Finance continua sendo a fonte de verdade para contas, transações, cartões, orçamento, dívidas, patrimônio e previsões. O Gestão continua sendo a fonte de verdade para alunos, modalidades, aulas e pagamentos de mensalidades.

## Estado atual confirmado

- `products/kovian-gestao` é uma aplicação React/Vite com backend AppDeploy e autenticação Google administrativa.
- `products/kovian-finance` é apenas uma referência documental no monorepo; o código operacional está em `kovacsruan-stack/kovian-finance`.
- O Finance independente usa React Router e uma API própria com bearer token em `localStorage`.
- Portanto, não é seguro apenas copiar telas ou compartilhar o token do Gestão com a API Finance. Os mecanismos de autenticação e os backends são diferentes.

## Estado da integração financeira

O Finance possui uma implementação inicial de ingestão de pagamentos na PR #34 do repositório `kovian-finance`. Ela inclui validação do evento, autenticação Finance e modo de serviço configurável, mapeamento de proprietário no servidor, verificação da conta, conversão de centavos e idempotência no banco.

O produtor de eventos e a ação de sincronização foram implementados na PR #36 do repositório `kovian-finance`: o backend do Gestão envia pagamentos confirmados ao endpoint da PR #34, preservando o ID do evento para retries e sem expor o token ao navegador. A integração ainda não está operacional em produção: o endpoint receptor desta PR está no serviço Python/FastAPI (`backend/app/main.py`), distinto do backend Java/Spring Boot da raiz. É necessário implantar o serviço FastAPI com o Dockerfile de `backend/`, provisionar os segredos e mapas de proprietário/conta nos dois ambientes, executar testes de API e banco, e validar o fluxo ponta a ponta. A PR #36 permanece em draft e nenhuma das duas PRs foi mesclada.

### Configuração obrigatória do serviço de pagamentos

O produtor Gestão e o receptor Finance usam nomes de variáveis diferentes para partes da configuração. No Gestão, configure `KOVIAN_FINANCE_API_URL`, `KOVIAN_FINANCE_INTEGRATION_TOKEN`, `KOVIAN_FINANCE_OWNER_ID` e `KOVIAN_FINANCE_ACCOUNT_ID`. No Finance, configure `GESTAO_INTEGRATION_TOKEN`, `GESTAO_OWNER_MAP` e `GESTAO_ACCOUNT_MAP`. O token deve ter o mesmo valor secreto nos dois serviços; o UUID de proprietário do Gestão deve mapear para o ID de usuário Finance em `GESTAO_OWNER_MAP`, e para a conta Finance aprovada em `GESTAO_ACCOUNT_MAP`. O `account_id` enviado pelo Gestão precisa corresponder a esse mapeamento. Não colocar esses valores no frontend.

## Agenda inspirada no KOVIAN Fitness

A área de aulas do Gestão recebeu campos de agenda inspirados no Fitness: duração, profissional, local/sala, capacidade, dias da semana, intervalo semanal e data final. A ação de recorrência gera sessões sob demanda, limita cada operação a 100 novas aulas e uma janela máxima de 366 dias, e verifica duplicidades e conflitos nos registros retornados pela API. Como o armazenamento atual não oferece reserva transacional, ainda não há garantia contra conflitos ou excedentes de capacidade em operações simultâneas.

O calendário do Finance continua sendo um calendário financeiro. Ele agora permite selecionar um dia e filtrar entradas, saídas, transferências e recorrências financeiras. **As sessões da agenda do Gestão ainda não são exibidas no calendário do Finance**: isso exige um contrato e um fluxo autenticado de eventos de agenda, além de regras de sincronização e cancelamento. Não reutilizar o token de usuário do Finance no Gestão nem expor credenciais de serviço no navegador.

## Arquitetura alvo

1. **Um shell de produto**: marca, navegação, cabeçalho, responsividade e preferências compartilhadas.
2. **Módulos separados por domínio**: Gestão (alunos, modalidades, aulas, mensalidades) e Finance (contas, transações, cartões, orçamento, metas, dívidas, patrimônio, previsões e relatórios).
3. **Identidade unificada**: um provedor de sessão e um identificador estável de usuário/organização. Não reutilizar tokens de um serviço em outro sem validação explícita de audiência, emissor e permissões.
4. **Persistência sem duplicação**: o Finance mantém o livro financeiro; o Gestão mantém os registros operacionais. Eventos de mensalidade geram uma referência financeira idempotente, em vez de duplicar valores em duas tabelas.
5. **Vínculos explícitos**: cada recebimento financeiro originado de mensalidade deve guardar uma referência externa estável para o pagamento/aluno do Gestão, sem expor dados pessoais desnecessários.
6. **Migração gradual**: manter os aplicativos atuais disponíveis até que autenticação, leitura, escrita, reconciliação e recuperação de falhas sejam validadas.

## Contrato inicial: mensalidade → financeiro

O contrato versionado está em [management-payment-paid-v1.schema.json](../../contracts/events/management-payment-paid-v1.schema.json) e segue o envelope comum de eventos KOVIAN.

Evento `MANAGEMENT_PAYMENT_PAID.v1`:

- `id`: UUID único do evento; chave de idempotência no consumidor.
- `type` / `version`: tipo e versão fixos do contrato.
- `ownerId`: UUID do proprietário/tenant, usado para escopo de autorização.
- `occurredAt`: instante em que o evento foi emitido.
- `correlationId`: identificador opcional para rastrear o fluxo ponta a ponta.
- `payload.paymentRef`: identificador estável do pagamento no Gestão.
- `payload.studentRef`: identificador estável do aluno; nunca usar o nome como chave.
- `payload.amountMinor`: valor inteiro em centavos, maior que zero.
- `payload.currency`: inicialmente `BRL`.
- `payload.paidAt`: instante em que o pagamento foi confirmado.
- `payload.description`: descrição opcional, limitada a 160 caracteres.

O consumidor financeiro deve validar o schema e a autorização do `ownerId`, persistir o `id` processado com restrição única e criar no máximo um lançamento por evento. Repetições do mesmo evento devem retornar o resultado já criado, não gerar outra transação. Uma mesma referência de pagamento não deve ser contabilizada duas vezes, mesmo se um produtor emitir eventos com IDs diferentes; essa proteção precisa ser garantida no adaptador por uma chave de origem composta por produto e `paymentRef`.

O evento não deve carregar nome, telefone, e-mail ou observações do aluno. Cancelamentos e estornos exigem eventos próprios, com referências ao lançamento original e trilha de auditoria; não se deve editar silenciosamente um pagamento já contabilizado.

## Critérios de aceite antes de substituir os apps

- Uma sessão inicia e encerra os dois módulos.
- Usuário sem permissão não consegue ler nem escrever dados de outro usuário/organização.
- Criar/editar/excluir aluno e aula continua funcionando.
- Pagamentos de mensalidade geram lançamento financeiro idempotente.
- Estorno/cancelamento mantém trilha de auditoria.
- Contas, transações, cartões e previsões do Finance continuam acessíveis.
- Testes de API, integração e navegação passam; build de produção concluído.
- Nenhum dado de produção é migrado ou apagado sem backup e plano de rollback.

## Direção visual

Usar uma experiência de dashboard de gestão fitness: navegação lateral no desktop, navegação compacta no celular, hierarquia visual clara, cartões de indicadores, listas/tabelas responsivas e ações primárias consistentes. A referência FitHub é inspiração de organização e fluxo, não para copiar código, marca ou assets.

## Fora do escopo desta etapa

- Não remover a autenticação existente.
- Não publicar nem alterar produção.
- Não afirmar que os módulos já compartilham sessão ou banco.
- Não migrar dados reais antes dos critérios de aceite.
