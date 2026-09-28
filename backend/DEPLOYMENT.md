# Deploy do KOVIAN Finance API (FastAPI)

## Papel deste serviço

O repositório contém duas aplicações de backend distintas:

- O backend principal Java/Spring Boot, iniciado pelo `Dockerfile` da raiz.
- O serviço Python/FastAPI deste diretório (`backend/Dockerfile`), que inclui a API de ingestão de pagamentos do Gestão quando a PR de integração estiver incorporada.

A variável `KOVIAN_FINANCE_API_URL` do Gestão deve apontar para a origem pública **deste serviço FastAPI**, e não para o frontend, nem automaticamente para a origem do backend Java. O endpoint de ingestão é `POST /api/v1/integrations/gestao/payments?account_id=...`.

## Build e execução

Construa a imagem usando o diretório `backend` como contexto:

```bash
docker build -t kovian-finance-api ./backend
docker run --rm -p 8000:8000 \
  -e PORT=8000 \
  -e DATABASE_URL='postgresql+asyncpg://USER:PASSWORD@HOST:5432/DB' \
  -e JWT_SECRET='configure-um-segredo-aleatorio-com-32-caracteres-ou-mais' \
  kovian-finance-api
```

O serviço expõe `GET /health`. Configure TLS e restrinja acesso à base de dados no ambiente de hospedagem.

## Migrações

Antes de habilitar tráfego, execute as migrações em uma tarefa controlada no mesmo release:

```bash
alembic upgrade head
```

Revise as migrações e faça backup antes de aplicá-las a uma base com dados reais. Não execute migrações destrutivas automaticamente durante a inicialização de cada réplica.

## Segredos de integração

Configure no gerenciador de segredos do serviço Finance:

- `GESTAO_INTEGRATION_TOKEN`: segredo aleatório de alta entropia, com pelo menos 32 caracteres.
- `GESTAO_OWNER_MAP`: objeto JSON que mapeia o UUID do proprietário no Gestão ao ID do usuário Finance.
- `GESTAO_ACCOUNT_MAP`: objeto JSON que mapeia o UUID do proprietário no Gestão ao UUID da conta Finance autorizada.

No backend do Gestão, configure o mesmo token em `KOVIAN_FINANCE_INTEGRATION_TOKEN`, além de `KOVIAN_FINANCE_API_URL`, `KOVIAN_FINANCE_OWNER_ID` e `KOVIAN_FINANCE_ACCOUNT_ID`.

Nunca inclua segredos reais em arquivos versionados, imagens públicas, frontend ou logs.

## Critério de liberação

A integração só deve ser habilitada depois de confirmar: migrações aplicadas, usuário e conta mapeados, token igual nos dois serviços, conta ativa em BRL, teste de pagamento, repetição idempotente e falha de rede com retry. O deploy do FastAPI é separado do deploy do backend Java e do frontend.
