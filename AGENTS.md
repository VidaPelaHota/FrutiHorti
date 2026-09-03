# AGENTS

## 1. Processo e gestão de débito técnico

- Todo atalho técnico, código temporário, solução provisória ou necessidade de refatoração identificada durante o desenvolvimento deve ser registrada no backlog como issue/card do tipo Débito Técnico no Jira.
- O débito deve conter: descrição objetiva do problema, motivo da criação e, quando possível, o impacto esperado se não for resolvido.
- Débitos que afetem regra de negócio crítica, integridade dos dados, segurança, desempenho ou manutenção do sistema devem receber prioridade maior.
- Débitos de menor impacto podem permanecer no backlog e ser resolvidos conforme capacidade da equipe.

## 2. Priorização e pagamento da dívida

- A prioridade deve ser definida pelo impacto no sistema.
- Débitos que afetem segurança, integridade dos dados, desempenho, regra de negócio crítica ou o trabalho de outro integrante devem ter prioridade sobre novas funcionalidades.
- Quando representarem risco ao projeto, devem ser tratados antes de evoluções.

## 3. Critérios de qualidade: DoR e DoD

### Definition of Ready (DoR)
Uma tarefa só pode entrar em desenvolvimento quando:
- possuir descrição clara;
- ter objetivo definido;
- ter critérios de aceitação objetivos;
- ter esforço estimado pela equipe;
- ter responsável definido;
- ter informações necessárias disponíveis.

Se algum critério não for atendido, a tarefa deve permanecer no backlog.

### Definition of Done (DoD)
Uma tarefa só é considerada concluída quando:
- o código foi implementado conforme os requisitos;
- o código segue os padrões da equipe;
- a implementação foi revisada por pelo menos um outro integrante via Pull Request;
- a funcionalidade foi validada pelos critérios de aceitação;
- não existem bugs críticos ou de alta severidade conhecidos;
- o Pull Request foi aprovado e integrado à branch main.

## 4. Estratégia de testabilidade

- O foco principal dos testes é garantir o funcionamento das regras de negócio e dos fluxos mais importantes do sistema.
- Regras de negócio críticas devem ter testes automatizados.
- A regra crítica principal do projeto é impedir a venda de produtos cuja data de validade seja menor ou igual à data atual.
- O QA também deve executar testes manuais dos principais fluxos antes das entregas, incluindo:
  - cadastro e consulta de produtos;
  - registro de entrada e saída de estoque;
  - controle de lote e validade;
  - impedimento da venda de produtos vencidos;
  - funcionamento das evoluções do sistema.
- Novas funcionalidades com regras relevantes devem ter testes para fluxo esperado e situações de erro.

## 5. Registro e resolução de bugs

Todo bug identificado durante o desenvolvimento ou testes deve ser registrado no backlog com:
- descrição do problema;
- passos para reprodução;
- comportamento esperado;
- comportamento obtido;
- severidade.

### Severidades
- Crítico: compromete regra crítica, segurança ou integridade dos dados; bloqueia a entrega.
- Alto: compromete funcionalidade importante; deve ser corrigido antes da entrega.
- Médio: afeta parcialmente uma funcionalidade, sem impedir uso geral.
- Baixo: impacto pequeno, como falhas visuais ou comportamentos pouco relevantes.

Bugs críticos e altos têm prioridade sobre novas funcionalidades.

## 6. Guia de estilo e padrões de código

### Tecnologias
- Frontend: React e JavaScript
- Backend: Node.js
- Banco de dados: MySQL

### Nomenclatura
- Variáveis e funções: camelCase
- Classes e componentes React: PascalCase
- Constantes fixas: UPPER_SNAKE_CASE, quando aplicável
- Nomes devem ser descritivos e claros
- Evitar abreviações quando prejudicarem a legibilidade
- Todos os nomes de classes, componentes, métodos, funções, variáveis e comentários devem ser em inglês
- Manter nomenclatura consistente entre frontend, backend e banco de dados

### Boas práticas
- Evitar duplicação de código; criar funções, componentes e módulos reutilizáveis.
- Cada função deve ter responsabilidade bem definida.
- Funções com mais de 40 linhas devem ser avaliadas para refatoração.
- Evitar funções ou componentes com responsabilidades muito diferentes.
- Centralizar valores fixos em constantes ou configurações quando possível.
- Priorizar legibilidade e manutenção.
- Tratar exceções e erros adequadamente.
- Não usar blocos catch vazios.
- Preservar comportamento das funcionalidades não afetadas pela alteração.

## 7. Fluxo de versionamento e pipeline de CI/CD

### Estratégia de branches
- A branch main é a versão estável integrada do projeto.
- Não desenvolver diretamente na main.
- Novas funcionalidades: feature/nome-da-funcionalidade
- Correções de bugs: fix/descricao-do-bug
- Alterações devem ser enviadas por Pull Request para a main.
- Todo PR precisa de aprovação de pelo menos um outro integrante.

### Commits
Usar Conventional Commits, com tipos como:
- feat: nova funcionalidade
- fix: correção de bug
- refactor: alteração interna sem mudança de comportamento
- test: alterações em testes
- docs: documentação
- chore: manutenção

Exemplos:
- feat: add product registration
- fix: prevent sale of expired products
- refactor: separate stock validation
- test: add expiration date tests
- docs: update project setup

### Verificação automática e lint
- ESLint será usado para padronização e análise estática do código JavaScript/React.
- O pipeline de CI/CD deve realizar:
  - instalação das dependências;
  - execução do ESLint;
  - verificação do build da aplicação.
- Nenhum PR deve ser integrado à main se as verificações obrigatórias gerarem erro.
- Testes automatizados seguirão separados pelo responsável de QA e não são obrigatórios como parte da conclusão da tarefa de desenvolvimento neste momento.
