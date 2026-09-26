# KOVIAN Finance — Auditoria e escopo MVP

> Estado: auditoria estática das rotas e navegação. Nenhuma rota, dado, módulo ou integração foi apagado nesta etapa. Não usar GitHub Actions; validar localmente.

## Objetivo do MVP
Permitir registrar e consultar movimentações, entender saldo/resultado e organizar contas e orçamento sem depender de integrações pagas.

## Navegação principal observada
- Visão geral (`/`)
- Transações (`/transacoes`)
- Contas (`/contas`)

A navegação “Mais” contém transferências, cartões, orçamentos, metas, relatórios, previsão, patrimônio, inteligência/insights, dívidas, notificações, calendário, recorrentes, categorias, configurações e importação/exportação. Há ainda rotas configuradas por `pageConfig`.

## Decisão MVP
### Manter como fluxos principais
- Dashboard com saldo/receitas/despesas e lançamentos recentes
- Criar, editar e consultar transações
- Contas e saldos
- Categorias necessárias para classificar lançamentos
- Orçamentos básicos
- Exportação/backup dos dados quando suportado
- Configurações essenciais de moeda, idioma e preferências

### Manter secundário ou adiar
- Previsões e cenários avançados
- Insights/anomalias baseados em IA
- Patrimônio, metas e relatórios avançados
- Calendário, notificações e painéis auxiliares
- Importações complexas e integrações externas que exijam infraestrutura paga

“Adiar” significa não priorizar a experiência e o suporte no MVP; não significa apagar código ou dados. A decisão de ocultar uma rota deve preservar acesso a registros existentes e links diretos importantes.

## Segurança e dados — não remover
- Autenticação/autorização quando aplicável e isolamento por usuário
- Persistência de transações, contas, cartões, dívidas e demais registros
- Validação de valores, moeda, datas e transferências
- Consistência entre lançamentos e saldos
- Proteção de dados financeiros, logs sem segredos e tratamento de erros
- Exportação e mecanismos de recuperação disponíveis

## Auditoria de botões e ações
Conferir criar/editar/excluir lançamento, transferir entre contas, filtros, importação/exportação e ações de cartões/dívidas. Verificar confirmações, idempotência e atualização de saldo. Não retirar ações antes de confirmar dependências e efeitos sobre os dados.

## Módulos e dependências
O backend possui domínios separados para contas, transações/categorias, orçamento, cartões, dívidas, metas, ativos, previsões, analytics, auditoria e insights. Não excluir domínios ou tabelas na fase visual: podem ter relações, histórico ou dados persistidos. Primeiro mapear controllers, serviços, repositórios, migrações, contratos e consumidores.

## Validação local exigida
- `npm ci` (diretório `frontend`)
- `npm run lint`
- `npm test -- --run`
- `npm run build`
- Testar CRUD de transação, contas, transferência, orçamento e exportação
- Validar backend e banco com dados de teste; não usar dados financeiros reais em testes
- QA mobile e persistência após recarregar

## Limitações desta auditoria
A auditoria de rotas e módulos é estática. Não foi comprovada nesta etapa a conectividade do backend, a integridade do banco ou todos os fluxos em produção. Nenhum registro ou módulo foi excluído.
