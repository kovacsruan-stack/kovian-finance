# Instruções permanentes do projeto KOVIAN

## Restrição de ferramentas: GitHub Actions

- **Não temos GitHub Actions disponível para este projeto.** Trate GitHub Actions como indisponível.
- Não proponha, configure, dependa de, tente executar, diagnostique ou volte a recomendar workflows de GitHub Actions como solução — incluindo CI, CD, runners, Actions minutes, billing, workflows manuais ou automações via Actions.
- Não interprete arquivos em `.github/workflows/` como prova de que Actions pode ser executado. Eles podem existir no repositório, mas não fazem parte do fluxo operacional disponível.
- Só reconsidere essa decisão se o usuário disser explicitamente que GitHub Actions foi habilitado e pedir para usá-lo.
- Não bloqueie o progresso esperando por Actions. Priorize ferramentas gratuitas já disponíveis e validação local.

## Fluxo de validação preferencial

1. Inspecionar alterações e executar `git diff --check`.
2. Instalar dependências apenas quando necessário e usando o lockfile (`npm ci`, Maven Wrapper ou equivalente).
3. Executar localmente lint, verificação de tipos, testes e build que o projeto realmente suporte.
4. Fazer QA no navegador conectado/disponível, incluindo erros de console, rotas críticas e responsividade mobile.
5. Validar serviços e integrações locais quando suas dependências estiverem disponíveis; registrar claramente o que não pôde ser testado.
6. Conferir o estado do Git, preservar alterações do usuário e publicar no GitHub apenas na branch autorizada.

## Princípios de execução

- Priorizar soluções gratuitas, simples, reproduzíveis e com baixa manutenção.
- Não afirmar que testes, QA ou deploy passaram sem evidência observada.
- Não confundir publicação do código no GitHub com build, deploy ou validação em produção.
- Se uma ferramenta estiver desconectada, tentar o caminho alternativo disponível sem repetir indefinidamente a mesma tentativa.
