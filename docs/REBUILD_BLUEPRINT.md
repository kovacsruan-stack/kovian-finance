# KOVIAN Finance — Especificação da reconstrução

**Objetivo:** reconstruir a aplicação com uma implementação nova, simples e didática para quem está estudando Análise e Desenvolvimento de Sistemas (ADS).

> Este documento é uma decisão de arquitetura e escopo. Não significa que o código já foi reconstruído, testado ou publicado.

## 1. Princípio de reconstrução

O código atual é material de consulta, não uma base que precisa ser preservada por padrão. Vamos redesenhar e reimplementar telas, componentes, contratos, regras de negócio, autenticação e persistência. Reaproveitar um trecho só quando houver justificativa técnica, segurança verificada e benefício claro.

Não copiar automaticamente arquitetura excessivamente complexa, dependências, abstrações ou fluxos problemáticos. Não remover funcionalidades ou dados sem inventário, decisão registrada e plano de migração/recuperação.

## 2. Papel do produto

Gestão financeira pessoal, com o backend como fonte canônica dos registros e saldos.

## 3. MVP inicial

1. Autenticação e isolamento por usuário
2. contas
3. receitas, despesas e transferências
4. categorias
5. orçamento básico
6. dashboard
7. exportação/backup.

Funcionalidades secundárias serão inventariadas e classificadas como **MVP**, **fase posterior**, **não reconstruir** ou **investigar**. Essa classificação não autoriza apagar registros ou módulos do sistema antigo.

## 4. Arquitetura comum do ecossistema

Manter a mesma separação conceitual e organização nos três projetos, com nomes e responsabilidades consistentes:

- `frontend/`: aplicação web responsiva.
- `backend/`: API REST e regras de negócio.
- `docs/`: arquitetura, decisões, contratos, setup e QA.
- `.env.example`: somente nomes de variáveis e exemplos claramente fictícios.
- `.gitignore`: arquivos locais, builds e segredos fora do Git.
- `README.md`: propósito, pré-requisitos, execução local, testes e estrutura.

### Frontend (padrão comum)

React + TypeScript; componentes acessíveis e reutilizáveis; páginas por funcionalidade; chamadas HTTP concentradas em `services/`; tipos compartilhados em `types/`; validação de formulários; estados padronizados de carregamento, vazio, sucesso e erro.

Estrutura de referência:

```text
frontend/src/
  assets/
  components/
  layouts/
  pages/
  hooks/
  services/
  types/
  utils/
  App.tsx
  main.tsx
```

### Backend (padrão comum)

API REST organizada por camadas simples: `controller` (HTTP), `service` (regras), `repository` (persistência), `entity` (modelo persistido), `dto` (entrada/saída), `config`, `security` e `exception`. Evitar microserviços e abstrações prematuras.

Estrutura de referência:

```text
backend/src/main/
  java/.../config/
  java/.../security/
  java/.../controller/
  java/.../service/
  java/.../repository/
  java/.../entity/
  java/.../dto/
  java/.../exception/
  resources/
    application.yml
    db/migration/
backend/src/test/
```

**Decisão de tecnologia:** padronizar primeiro a arquitetura e os contratos. A linguagem/runtime definitivo do backend será fixado após a comparação técnica documentada, especialmente para a orquestração de IA do KOVI-AÍ. Não fazer uma migração de linguagem às cegas.

## 5. Dados e integrações

- PostgreSQL como persistência durável quando aplicável; migrações versionadas.
- Nunca usar dados reais em testes.
- Não alterar nem eliminar bancos atuais durante a reconstrução.
- Antes de qualquer migração: inventariar tabelas, relações, volumes, consumidores e estratégia de backup/rollback.
- Integrações entre produtos por APIs autenticadas e contratos explícitos; sem acesso irrestrito ao banco de outro produto.
- Chaves e credenciais somente no servidor/gestor de segredos; nenhum segredo real no frontend, Git ou logs.

## 6. Segurança e autenticação

- Autorização validada no backend em toda operação protegida.
- Isolamento por usuário e papel testado no servidor.
- Segredos não codificados no repositório.
- Autenticação compartilhada só será adotada após validar o fluxo completo e os limites de confiança.
- Ações sensíveis devem exigir confirmação e deixar trilha de auditoria.

## 7. Plano de execução

1. Inventariar funcionalidades, rotas, contratos, dados, integrações e dependências.
2. Registrar decisões de arquitetura e escopo do MVP.
3. Construir a base nova do frontend e backend.
4. Implementar um fluxo vertical de ponta a ponta por vez.
5. Criar testes unitários e de integração com dados fictícios.
6. Validar build, segurança, responsividade e QA local.
7. Planejar migração e publicação somente depois dos gates de validação.

## 8. Critérios de aceite

- Aplicação inicia localmente com instruções reproduzíveis.
- Fluxos do MVP funcionam de ponta a ponta.
- Erros e estados de carregamento/vazio são tratados.
- Dados de usuários distintos permanecem isolados.
- Testes cobrem regras críticas e falhas relevantes.
- Layout utilizável em dispositivos móveis.
- Nenhum segredo real está no repositório.
- Não há dependência de GitHub Actions.
- Nenhum deploy, teste ou migração é declarado concluído sem execução e evidência.

## 9. Regras de segurança operacional

- A branch `main` permanece intacta durante a reconstrução.
- Não excluir branches, PRs, serviços, bancos, tabelas ou dados sem avaliação explícita.
- Não interromper serviços existentes antes de identificar dependências e plano de reversão.
- Toda alteração deve ser revisável por diff e feita em branch de reconstrução.
