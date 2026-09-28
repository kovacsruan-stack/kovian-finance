# KOVIAN Gestão + Finance — plano de integração

## Objetivo

Entregar um único produto chamado **KOVIAN Finance**, com os módulos Operação e Financeiro na mesma experiência. O Finance continua sendo a fonte de verdade para contas, transações, cartões, orçamento, dívidas, patrimônio e previsões. O Gestão continua sendo a fonte de verdade para alunos, modalidades, aulas e pagamentos de mensalidades.

## Estado atual confirmado

O código de Gestão agora usa o nome de produto KOVIAN Finance no título do documento e no rodapé. Isso alinha a marca, mas não representa ainda a incorporação do módulo ao mesmo shell nem uma sessão única.

- `products/kovian-gestao` é uma aplicação React/Vite com backend AppDeploy e autenticação Google administrativa.
- `products/kovian-finance` é apenas uma referência documental no monorepo; o código operacional está em `kovacsruan-stack/kovian-finance`.
- O Finance independente usa React Router e uma API própria com bearer token em `localStorage`.
- Portanto, não é seguro apenas copiar telas ou compartilhar o token do Gestão com a API Finance. Os mecanismos de autenticação e os backends são diferentes.

## Estado da integração financeira

O Finance possui uma implementação inicial de ingestão de pagamentos na PR #34 do repositório `kovian-finance`. Ela inclui validação do evento, autenticação Finance e modo de serviço configurável, mapeamento de proprietário no servidor, verificação da conta, conversão de centavos e idempotência no banco.

O produtor de eventos e a ação de sincronização foram implementados na PR #36 do repositório `kovian-finance`: o backend do Gestão envia pagamentos confirmados ao endpoint da PR #34, preservando o ID do evento para retries e sem expor o token ao navegador. A integração ainda não está operacional em produção: o endpoint receptor desta PR está no serviço Python/FastAPI (`backend/app/main.py`), distinto do backend Java/Spring Boot da raiz. É necessário implantar o serviço FastAPI com o Dockerfile de `backend/`, provisionar os segredos e mapas de proprietário/conta nos dois ambientes, executar testes de API e banco, e validar o fluxo ponta a ponta. A PR #36 permanece em draft e nenhuma das duas PRs foi mesclada.

### Configuração obrigatória do serviço de pagamentos

O produtor Gestão e o receptor Finance usam nomes de variáveis diferentes para partes da configuração. No Gestão, configure `KOVIAN_FINANCE_API_URL`, `KOVIAN_FINANCE_INTEGRATION_TOKEN`, `KOVIAN_FINANCE_OWNER_ID` e `KOVIAN_FINANCE_ACCOUNT_ID`. No Finance, configure `GESTAO_INTEGRATION_TOKEN`, `GESTAO_OWNER_MAP` e `GESTAO_ACCOUNT_MAP`. O token deve ter o mesmo valor secreto nos dois serviços; o UUID de proprietário do Gestão deve mapear para o ID de usuário Finance em `GESTAO_OWNER_MAP`, e para a conta Finance aprovada em `GESTAO_ACCOUNT_MAP`. O `account_id` enviado pelo Gestão precisa corresponder a esse mapeamento. Não colocar esses valores no frontend.

## Calendário do KOVIAN Fitness e referência visual FitHub

A área de aulas do Gestão recebeu campos de agenda alinhados ao calendário do KOVIAN Fitness: duração, profissional, local/sala, capacidade, dias da semana, intervalo semanal e data final. A ação de recorrência gera sessões sob demanda, limita cada operação a 100 novas aulas e uma janela máxima de 366 dias, e verifica duplicidades e conflitos nos registros retornados pela API. Como o armazenamento atual não oferece reserva transacional, ainda não há garantia contra conflitos ou excedentes de capacidade em operações simultâneas.

O calendário do Finance continua sendo um calendário financeiro. Ele agora permite selecionar um dia e filtrar entradas, saídas, transferências e recorrências financeiras. **As sessões da agenda do Gestão ainda não são exibidas no calendário do Finance**: isso exige um contrato e um fluxo autenticado de eventos de agenda, além de regras de sincronização e cancelamento. Não reutilizar o token de usuário do Finance no Gestão nem expor credenciais de serviço no navegador.

## Arquitetura alvo

**Nome único do produto: KOVIAN Finance.** O FitHub é somente referência visual para o frontend (hierarquia, navegação, componentes e responsividade); não é a origem do calendário nem deve aparecer como módulo ou marca no produto final. O calendário e os dados de agenda pertencem ao KOVIAN Fitness.

1. **Um shell de produto**: marca KOVIAN Finance, navegação, cabeçalho, responsividade e preferências compartilhadas.
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

Usar uma experiência de dashboard de gestão fitness: navegação lateral no desktop, navegação compacta no celular, hierarquia visual clara, cartões de indicadores, listas/tabelas responsivas e ações primárias consistentes. O FitHub é exclusivamente uma referência visual para layout, navegação e organização do frontend. O calendário funcional de origem é o do KOVIAN Fitness. Não copiar código, marca ou assets do FitHub.


## Decisão técnica para integrar a agenda Fitness

A inspeção do frontend do KOVIAN Fitness confirma que o calendário não é uma página estática: ele usa serviços autenticados da API Fitness. O cliente HTTP usa `VITE_API_BASE_URL` (em produção, por padrão, `https://kovian-fitness-api-production.up.railway.app/api/v1`), envia `Authorization: Bearer` a partir de `sessionStorage.access_token`, renova sessão por `/auth/refresh-token` e pode enviar `X-Business-Unit-Id` a partir de `localStorage.business_unit_id`. O serviço de calendário consulta `/calendar-integrations`, `/sessions/availability` e `/sessions/availability/slots`; a agenda de aulas também usa endpoints de gestão de classes e sessões.

### Consequências

- O Finance não deve chamar esses endpoints com o token de Finance nem colocar um token de serviço no bundle do navegador.
- A política atual do Finance define `X-Frame-Options: DENY`; portanto, incorporar a aplicação Fitness em iframe não é uma alternativa compatível com a configuração atual.
- O calendário financeiro existente (`CalendarPage.tsx`) lê transações, contas e recorrências do Finance. Ele não possui modelo de evento para aulas/sessões do Fitness.
- O frontend Fitness obtém dados de agenda por meio de endpoints autenticados. Antes de exibir esses dados no Finance, é necessário definir autorização por usuário/unidade, escopo temporal, fuso horário, estados de sessão, cancelamentos e paginação.

### Implementação segura em etapas

1. **Contrato de leitura de agenda**: criar no backend uma API de integração versionada, por exemplo `GET /api/v1/integrations/fitness/calendar-events?from=...&to=...`, que retorne somente campos necessários à agenda: referência estável, início/fim com fuso, título, tipo, estado e referências operacionais estritamente necessárias.
2. **Autorização no servidor**: resolver usuário e unidade a partir da sessão validada; verificar que o usuário tem acesso à unidade Fitness. Nunca confiar em `ownerId` ou `business_unit_id` fornecidos sem validação.
3. **Conector servidor-servidor**: usar credencial mantida em segredo no backend e um escopo mínimo de leitura. Se a API Fitness não suportar credencial de serviço/escopo apropriado, implementar esse suporte no backend Fitness antes de ligar o Finance.
4. **UI nativa**: adicionar eventos de aula à agenda do Finance como uma categoria separada, sem alterar os eventos financeiros nem misturar valores financeiros com sessões.
5. **Confiabilidade**: definir timeouts, tratamento de 401/403/429/5xx, cache curto, deduplicação, atualização e comportamento degradado quando o Fitness estiver indisponível.
6. **Testes de aceitação**: cobrir isolamento entre unidades, intervalo de datas, fuso horário, aulas canceladas, falha da API externa, ausência de credenciais, permissões e renderização no calendário.

### Bloqueios que exigem alteração de backend/configuração

A inspeção do cliente confirma autenticação por JWT e endpoints de agenda, mas não comprova a existência de uma credencial servidor-servidor de leitura nem um endpoint consolidado de eventos de calendário. Assim, a ponte de dados não deve ser simulada no frontend. O próximo incremento de código precisa incluir o endpoint autenticado no backend, o adaptador Fitness e os testes de contrato; só depois a UI pode consumir os eventos reais.

### Critérios adicionais de aceite da agenda

- Nenhum segredo de integração aparece em arquivos `VITE_*`, no JavaScript entregue ao navegador ou em logs.
- A agenda continua funcional quando a API Fitness falha, sem impedir o uso do calendário financeiro.
- Eventos Fitness são visualmente distinguíveis de entradas, saídas, transferências e recorrências financeiras.
- A sessão e as permissões são verificadas no servidor em cada consulta; não há compartilhamento implícito de JWT entre produtos.

## Fora do escopo desta etapa

- Não remover a autenticação existente.
- Não publicar nem alterar produção.
- Não afirmar que os módulos já compartilham sessão ou banco.
- Não migrar dados reais antes dos critérios de aceite.

## Atualização de implementação — 28/09/2026

- A rota `/gestao` agora apresenta estados explícitos de carregamento, aviso após demora, ação de nova tentativa e alternativa de abrir o módulo em outra aba. A ação de recarga remonta o `iframe`, sem tentar acessar diretamente o `contentWindow` de outra origem.
- O módulo Gestão e a Agenda Fitness foram incluídos na busca rápida do shell Finance.
- O receptor de pagamentos usa modelos Pydantic separados para o envelope e os detalhes do evento, rejeita campos desconhecidos no nível interno, exige UUIDs no envelope e timestamps com fuso horário. A descrição é opcional no contrato e recebe o padrão “Mensalidade” quando ausente.
- Foram adicionados testes de interface para carregamento/recuperação do módulo e testes de contrato para referências obrigatórias, campos internos inesperados, timestamps sem fuso e descrição opcional.
- Esses commits ainda precisam de execução verificável dos workflows. A incorporação do Gestão permanece baseada em `iframe`; não é correto chamá-la de migração nativa enquanto a autenticação e a API de dados do AppDeploy não tiverem sido substituídas por uma integração suportada.
