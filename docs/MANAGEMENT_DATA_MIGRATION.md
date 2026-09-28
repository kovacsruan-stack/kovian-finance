# KOVIAN Finance — migração do Gestão

## Estado

A camada de Gestão preserva os registros em `management_records`, separados por proprietário e tipo. Os recursos aceitos são:

- `students`: alunos.
- `modalities`: modalidades.
- `lessons`: aulas.
- `payments`: pagamentos.
- `expenses`: despesas registradas no Gestão.
- `waitlist`: lista de espera.

A migração de banco V23 amplia a restrição de recursos sem apagar registros existentes.

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

## Limites e distinções

- A API de importação aceita lotes de até 500 itens; clientes devem paginar a exportação e enviar lotes menores ou iguais a esse limite.
- Despesas do Gestão são preservadas como registros de Gestão e aparecem no calendário. Isso **não** as converte automaticamente em lançamentos contábeis do livro financeiro, evitando duplicidade ou classificação incorreta. A conversão deve ser uma etapa explícita, com conta, categoria, data, status e chave de idempotência definidos.
- A lista de espera é preservada como dados de Gestão; sua importação não cria automaticamente um aluno ativo.
- Esta documentação descreve o contrato implementado. Não significa que dados reais já tenham sido exportados, importados ou reconciliados.
