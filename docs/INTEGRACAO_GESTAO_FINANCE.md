# Integração KOVIAN Gestão → KOVIAN Finance

Atualizado em: 2026-09-28

## Decisão de arquitetura

- **KOVIAN Finance é o nome e destino definitivos** do produto integrado.
- As funcionalidades de alunos, modalidades, aulas, pagamentos e relatórios do Gestão devem passar a fazer parte do Finance.
- O calendário e os comportamentos úteis do KOVIAN Fitness são referência funcional para o calendário integrado.
- O frontend do FitHub é a referência visual indicada pelo produto. A aplicação deve manter a identidade KOVIAN e não perder funcionalidades existentes.
- O domínio financeiro continua sendo responsável pelos dados e operações financeiras; o domínio de Gestão é responsável pelos cadastros e operações de alunos.

## Regra de preservação de dados

A migração só pode ser considerada concluída quando os dados existentes do Gestão estiverem disponíveis no Finance e forem validados. Até lá:

1. Não apagar, desativar ou substituir o armazenamento atual do Gestão como parte de uma publicação do Finance.
2. Não fazer migração destrutiva nem recriar os alunos manualmente.
3. Preservar identificadores de alunos sempre que possível e manter referências de aulas, pagamentos, modalidades e históricos.
4. Não deduplicar apenas pelo nome quando houver identificador ou telefone confiável; conflitos devem ser revisados.
5. Comparar contagens por entidade e validar amostras de relacionamentos antes de qualquer corte.
6. Manter exportação/backup verificável e plano de retorno antes de alterar a fonte de dados.
7. Não armazenar dados pessoais reais de alunos em arquivos versionados ou fixtures.

## Estado técnico conhecido

- O código do Gestão está versionado em `kovian-gestao/`, dentro do repositório Finance, mas ainda é uma aplicação React/Vite separada.
- O frontend do Gestão utiliza `@appdeploy/client`; seus endpoints usam o SDK e a persistência do AppDeploy.
- O backend principal do Finance usa Spring Boot, PostgreSQL e Flyway. A presença do código Gestão no mesmo repositório **não significa** que os dados já foram migrados para o banco do Finance.
- O calendário financeiro atual está em `frontend/src/pages/CalendarPage.tsx`. O calendário do Fitness está em outra aplicação e precisa ser adaptado, não copiado cegamente.
- Nenhuma migração de dados de produção deve ser declarada concluída sem acesso autorizado à origem, execução e reconciliação dos registros.

## Proteções implementadas neste checkpoint

- Novas aulas e pagamentos do Gestão passam a gravar `studentId` quando a associação ao cadastro é inequívoca, mantendo o campo de nome para compatibilidade com registros antigos.
- A ação de remover um aluno foi convertida em inativação: o registro e seu histórico permanecem armazenados. A interface informa explicitamente essa operação.
- A importação existente continua sendo aditiva e ignora duplicatas identificadas por telefone ou, quando não há telefone, pelo nome normalizado. Isso não substitui a reconciliação formal da migração.

## Sequência de integração

1. Inventariar entidades, campos, identificadores e relacionamentos do Gestão e do Fitness.
2. Implementar no backend principal do Finance o modelo de domínio de Gestão e suas migrações versionadas.
3. Criar uma importação idempotente com relatório de inseridos, atualizados, ignorados e conflitos; preservar os IDs de origem em campos explícitos.
4. Migrar dados em lote com paginação completa, sem limite silencioso de registros.
5. Reconciliar contagens e vínculos de alunos, modalidades, aulas e pagamentos.
6. Integrar telas e navegação do Gestão ao frontend Finance, usando o padrão visual de referência.
7. Adaptar o calendário do Fitness ao domínio unificado, com eventos vinculados a entidades reais e ações funcionais.
8. Executar testes locais, QA responsivo e validação de ponta a ponta.
9. Só então planejar o corte para a nova persistência; manter a origem intacta até a validação final.

## Critério de conclusão

A integração estará concluída quando o Finance operar como aplicação única, com as funcionalidades previstas, dados históricos preservados e reconciliados, calendário integrado, experiência visual alinhada à referência e validação técnica documentada. Commits no GitHub, isoladamente, não comprovam deploy ou migração de dados.
