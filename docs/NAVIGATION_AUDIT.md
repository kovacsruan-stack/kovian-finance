# KOVIAN Finance — Auditoria de navegação

Atualizado em 2026-09-29.

## Objetivo

Reduzir a carga cognitiva sem remover recursos: manter as tarefas mais frequentes na navegação principal e organizar as funcionalidades secundárias por intenção do usuário.

## Navegação principal

| Destino | Responsabilidade canônica | Regra contra duplicidade |
|---|---|---|
| Visão geral (/) | Resumo e indicadores | Exibe atalhos e resultados; não cria uma segunda implementação de lançamentos |
| Transações (/transacoes) | Criar e consultar receitas/despesas | Fonte de verdade para movimentações financeiras comuns |
| Contas (/contas) | Contas, saldos e movimentações por conta | Não recriar transações dentro da tela de contas |
| Calendário (/calendario) | Agenda consolidada e criação/edição de aulas | Aulas são agendadas aqui; Gestão não mantém uma aba concorrente de aulas |
| Gestão (/gestao) | Cadastros e operação dos alunos/estúdio | Mantém alunos, modalidades, pagamentos, despesas e lista de espera |

## Menu “Mais”

| Grupo | Rotas |
|---|---|
| Planejamento | Orçamentos (/orcamentos), Metas (/metas), Previsão (/previsao), Dívidas (/dividas) |
| Organização | Cartões (/cartoes), Transferências (/transferencias), Recorrentes (/recorrentes), Categorias (/categorias), Importar/Exportar (/import-export), Patrimônio (/patrimonio), Relatórios (/relatorios), Inteligência (/inteligencia) |
| Sistema | Notificações (/notificacoes), Configurações (/configuracoes) |

## Regras de produto

- Cada operação de escrita deve ter um fluxo canônico; outras telas podem oferecer atalhos que abrem esse fluxo.
- O Calendário agrega eventos financeiros e de Gestão, mas não deve duplicar o armazenamento dos eventos.
- A Visão geral e os Relatórios devem consumir os mesmos serviços e critérios de cálculo.
- Importação deve validar o arquivo, oferecer feedback e detectar duplicidades sem sobrescrever dados silenciosamente.
- A navegação deve continuar acessível por teclado, leitor de tela e telas pequenas.
- Destinos existentes permanecem acessíveis; agrupamento não é remoção de funcionalidade.
- A integração com serviços externos deve manter limites de autenticação e autorização próprios.

## Matriz de validação funcional

| Fluxo | Verificação necessária |
|---|---|
| Cadastro/conta | Confirmação visual, erro legível e persistência após recarga |
| Transação | Criação/edição/cancelamento e atualização consistente do saldo |
| Transferência | Débito/crédito atômicos, mesma moeda e proteção contra repetição |
| Importação | Cabeçalho, encoding/BOM, validação por linha, duplicidade e resumo |
| Calendário | Filtros, eventos de diferentes domínios, edição de aula e exportação |
| Gestão | Seleção de aluno/modalidade, arquivamento e preservação do histórico |
| Relatórios | Consistência dos totais com Transações e período selecionado |
| Acessibilidade | Foco, teclado, nomes acessíveis, estados de carregamento/erro |
| Responsividade | Menu, tabelas, formulários e calendário em viewport móvel |

## Status de validação

A organização dos menus e os testes E2E correspondentes foram atualizados no código. A suíte ainda precisa ser executada localmente; não considerar os fluxos funcionais homologados até validar build, lint, testes unitários, E2E e QA no navegador. Nenhum deploy Vercel deve ser disparado como parte desta auditoria.
