# KOVIAN Gestão

Aplicação administrativa do ecossistema KOVIAN para alunos, modalidades, aulas, pagamentos e relatórios. A direção do produto é reunir Gestão e Finance em uma única experiência, mantendo módulos e domínios separados internamente.

## Produto unificado: Gestão + Finance

O objetivo é oferecer um único produto, **KOVIAN Gestão**, com módulos operacionais e financeiros. A integração está em andamento; este repositório ainda não contém o código operacional completo do Finance nem uma sessão compartilhada entre os dois serviços.

- Gestão permanece responsável por alunos, modalidades, aulas e pagamentos operacionais.
- Finance permanece a fonte de verdade para contas, transações, cartões, orçamento, metas, dívidas, patrimônio e previsões.
- A integração de recebimentos deve ser idempotente, auditável e vinculada por identificadores estáveis, nunca pelo nome do aluno.
- Não compartilhar tokens entre APIs sem validar emissor, audiência e permissões.
- Não remover a autenticação atual nem migrar dados reais sem testes, backup e plano de rollback.

A Finance possui uma base de endpoint de ingestão de mensalidades em PR separada, ainda draft. O Gestão ainda não envia eventos automaticamente para ela. Antes de ativar, faltam configuração segura do serviço, vínculo de contas, conexão do produtor e testes ponta a ponta.

O desenho técnico e os critérios de aceite estão em [docs/architecture/kovian-gestao-finance-integration.md](../../docs/architecture/kovian-gestao-finance-integration.md).

## Stack
- React + TypeScript + Vite
- API e persistência fornecidas pelo ambiente AppDeploy
- Autenticação Google, com acesso administrativo limitado no backend
- Interface responsiva e instalável (PWA)

## Estrutura
- src/: frontend
- backend/: endpoints e regras de acesso
- tests/tests.json: cenários de QA
- appdeploy.auth-login.json: configuração do login Google
- manifest.webmanifest e kovian-icon.svg: PWA e ícone

## Desenvolvimento
Instale as dependências com npm install e inicie com npm run dev. O build de produção é npm run build. O SDK @appdeploy/client e os serviços de backend são providos pelo ambiente AppDeploy.

## Privacidade e segurança
- Não versionar dados pessoais de alunos, pagamentos ou aulas.
- Não incluir credenciais, tokens, segredos ou bancos de produção no Git.
- As rotas de dados exigem autenticação e autorização administrativa no backend.
- O backend não deve semear cadastros reais; use a importação/cadastro dentro do aplicativo.

## Publicação
Este repositório mantém o código versionado. Commits no GitHub não significam publicação automática no AppDeploy; publicar é uma etapa separada.
