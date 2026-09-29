# KOVIAN Finance — migração do Gestão

## Estado

A camada de Gestão preserva os registros em `management_records`, separados por proprietário e tipo. Os recursos aceitos são:

- `students`: alunos.
- `modalities`: modalidades.
- `lessons`: aulas.
- `payments`: pagamentos.
- `expenses`: despesas registradas no Gestão.
- `waitlist`: lista de espera.
- `calendar_events`: eventos importados do calendário Fitness, mantidos separados das aulas vinculadas a alunos.

As migrations V23 e V24 ampliam a restrição de recursos sem apagar registros existentes.

## Importação idempotente

Endpoint autenticado:

`POST /api/v1/management/import-batch/{resource}`

O corpo contém `records`, com até 500 itens por chamada. Cada item precisa de um `sourceId` estável do sistema de origem e de um objeto `data`.

A mesma combinação de proprietário, recurso e `sourceId` é usada para reconhecer registros já importados. Repetir um lote não deve criar uma segunda cópia; diferenças atualizam o registro existente. A resposta informa quantos registros foram inseridos, atualizados, mantidos sem alteração e quantos vínculos de aluno não foram resolvidos.

## Ordem recomendada

1. Exportar e guardar uma cópia de segurança de cada recurso na origem.
2. Importar `students` e `modalities`.
3. Importar `lessons` e `payments`, preservando os IDs originais em `sourceId`. Quando possível, o importador remapeia o vínculo do aluno pelo ID de origem; usa o nome apenas quando existe uma correspondência única.
4. Importar `expenses` e `waitlist`.
5. Conferir as contagens de origem e destino, revisar `unresolvedStudentLinks` e repetir a conferência antes de liberar o uso.

Não apagar nem desativar o sistema de origem até a reconciliação dos totais e a conferência manual dos registros críticos.

## Reconciliação no destino

Endpoint autenticado e somente de leitura:

`POST /api/v1/management/reconcile`

Envie `expectedCounts` como um mapa de recurso para quantidade esperada no destino, por exemplo:

```json
{
  "expectedCounts": {
    "students": 120,
    "modalities": 8,
    "lessons": 950,
    "payments": 310
  }
}
```

A resposta informa, por recurso, a quantidade atualmente armazenada, a diferença em relação à quantidade esperada e se as contagens conferem. Também verifica aulas e pagamentos cujo `studentId` não aponta para um aluno existente do mesmo proprietário. O campo `reconciled` só será verdadeiro quando todas as contagens fornecidas coincidirem e não houver vínculos de aluno pendentes.

Use as contagens do mesmo snapshot/exportação da origem. Como o endpoint conta todos os registros presentes no destino, recursos que já contenham dados próprios devem ser reconciliados por uma estratégia que separe esses registros antes de interpretar a diferença. A conferência de contagem não substitui a validação de IDs de origem, amostras de histórico ou backups.

## Limites e distinções

- A API de importação aceita lotes de até 500 itens; clientes devem paginar a exportação e enviar lotes menores ou iguais a esse limite.
- Despesas do Gestão são preservadas como registros de Gestão e aparecem no calendário. Isso **não** as converte automaticamente em lançamentos contábeis do livro financeiro, evitando duplicidade ou classificação incorreta. A conversão deve ser uma etapa explícita, com conta, categoria, data, status e chave de idempotência definidos.
- A lista de espera é preservada como dados de Gestão; sua importação não cria automaticamente um aluno ativo.
- Esta documentação descreve o contrato implementado. Não significa que dados reais já tenham sido exportados, importados ou reconciliados.

## Backend de referência

O repositório contém o backend principal Java/Spring e um backend Python/FastAPI separado. O fluxo documentado para o Finance em produção refere-se ao contrato Java/Spring e às migrations Flyway em `src/main/resources/db/migration`. As migrations Alembic e as rotas Python mantêm uma implementação paralela; não se deve presumir que sejam executadas pelo deploy Java. Antes de importar dados, confirme qual serviço está conectado ao ambiente de destino.
## Importação pela interface

Na tela **Gestão**, selecione o recurso e use **Importar dados do Gestão antigo** para carregar um JSON exportado. A interface mostra uma prévia e só grava após confirmação; envia lotes de até 500 registros e usa o ID da origem como `sourceId`. Faça a importação recurso por recurso, começando por alunos e modalidades. Arquivos com mais de 10 MB devem ser divididos antes do envio.

Na tela **Calendário**, a área **Trazer agenda do Kovian Fitness** aceita um arquivo `.ics` exportado pelo Fitness. Cada evento com data é importado como `calendar_events`, com UID como `sourceId`, permitindo reimportação idempotente. Os eventos aparecem no calendário do Finance sem exigir vínculo artificial com aluno. Isso migra eventos, mas não recria regras de recorrência, turmas, presença, nem conexões com Google Calendar/Outlook. Essas funções exigem integração própria com os serviços e modelos correspondentes.
