# KOVIAN Gestão

Aplicação administrativa do ecossistema KOVIAN para alunos, modalidades, aulas, pagamentos e relatórios.

## Stack
- React + TypeScript + Vite
- API e persistência fornecidas pelo ambiente AppDeploy
- Autenticação Google, com acesso administrativo limitado no backend
- Interface responsiva e instalável (PWA)

## Estrutura
- `src/`: frontend
- `backend/`: endpoints e regras de acesso
- `tests/tests.json`: cenários de QA
- `appdeploy.auth-login.json`: configuração do login Google
- `manifest.webmanifest` e `kovian-icon.svg`: PWA e ícone

## Desenvolvimento
Instale as dependências com `npm install` e inicie com `npm run dev`. O build de produção é `npm run build`. O SDK `@appdeploy/client` e os serviços de backend são providos pelo ambiente AppDeploy.

## Privacidade e segurança
- Não versionar dados pessoais de alunos, pagamentos ou aulas.
- Não incluir credenciais, tokens, segredos ou bancos de produção no Git.
- As rotas de dados exigem autenticação e autorização administrativa no backend.
- O backend não deve semear cadastros reais; use a importação/cadastro dentro do aplicativo.

## Publicação
Este repositório mantém o código versionado. Commits no GitHub não significam publicação automática no AppDeploy; publicar é uma etapa separada.
