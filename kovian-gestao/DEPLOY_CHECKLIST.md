# KOVIAN Gestão — checklist antes da publicação

Esta lista é para a etapa de publicação no AppDeploy. O commit no GitHub, por si só, não altera o aplicativo publicado.

## Código preparado no GitHub
- [x] Snapshot completo do frontend e arquivos de configuração.
- [x] Removidos do backend versionado os cadastros reais usados anteriormente como dados iniciais.
- [x] Campo Modalidade alterado para seletor ligado ao catálogo.
- [x] Validação de salvamento exige modalidade para alunos e aulas.
- [x] Campos Aluno em Aulas/Pagamentos alterados para seletores de registros.
- [x] Controles de formulário móveis com fonte mínima de 16px para evitar zoom automático do Safari ao focar.
- [x] Cenário de QA para seleção de modalidade incluído.
- [x] Selecionar modalidade no cadastro de aluno pode preencher mensalidade e frequência do catálogo.
- [x] Selecionar aluno em pagamentos preenche o valor e sugere vencimento quando o campo está vazio.
- [x] Selecionar aluno em aulas preenche a modalidade vinculada, quando disponível.
- [x] Cabeçalho móvel compacto: nome ao lado da marca, sem e-mail e sem botão Sair duplicado.
- [x] Corrigido o reconhecimento de datas/status no filtro de pagamentos atrasados.
- [x] Cenário de regressão para preenchimento de pagamento/aula incluído em `tests/tests.json`.

## Validar no AppDeploy antes de publicar
- [ ] Aplicar as alterações do GitHub ao snapshot de origem do AppDeploy.
- [ ] Entrar com a conta Google autorizada e confirmar bloqueio de outras contas.
- [ ] Confirmar que os alunos existentes permanecem no banco e que nenhum cadastro duplicado é criado.
- [ ] Criar e editar um aluno, selecionando modalidade pelo catálogo.
- [ ] Criar/editar uma aula e selecionar aluno e modalidade.
- [ ] Abrir Pagamentos e selecionar o aluno; validar valor, vencimento e estado.
- [ ] Testar navegação em iPhone, rolagem, teclado e foco dos campos sem zoom automático.
- [ ] Testar navegação por todas as abas, botões de editar/excluir, filtros e exportação CSV.
- [ ] Conferir relatórios e geração de mensalidades sem duplicação.
- [ ] Revisar logs, erros de rede e resultados de QA/E2E.
- [ ] Publicar somente após os testes e confirmar a URL/versão publicada.

## Estado desta rodada — 2026-09-27

As alterações de código foram gravadas no repositório GitHub `kovacsruan-stack/kovian`, dentro de `products/kovian-gestao`. **Não houve publicação no AppDeploy nesta rodada.** A publicação continua bloqueada até a sincronização do snapshot, os testes com a base existente e a validação real no iPhone descritos acima.

## Dados
Não importar nem versionar dados pessoais de alunos no repositório. A validação deve usar o banco já existente e registros de teste identificáveis, removidos ao final.
