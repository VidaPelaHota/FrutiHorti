# FrutiHorti — Padrões de Desenvolvimento e Fluxo de Trabalho

## 1. Sobre o Projeto

O **FrutiHorti** é um projeto desenvolvido pela equipe **VidaPelaHota**, utilizando React e JavaScript no frontend, Node.js no backend e MySQL como banco de dados.

Este documento apresenta as convenções de desenvolvimento, o padrão de commits e o fluxo de trabalho definido pela equipe para o desenvolvimento, revisão e integração das tarefas do projeto.

### 1.1. Executando com Docker

As credenciais do MySQL não ficam no `docker-compose.yml`; elas são lidas de um arquivo `.env` na raiz do projeto (ignorado pelo git).

1. Copie o modelo: `cp .env.example .env`
2. Defina senhas próprias em `MYSQL_ROOT_PASSWORD` e `MYSQL_PASSWORD`.
3. Suba os serviços: `docker compose up --build`

Se alguma variável obrigatória não estiver definida, o `docker compose` falha informando qual está faltando.

> Observação: o MySQL só aplica essas credenciais na criação do volume. Se o volume `mysql_data` já existir com as credenciais antigas, recrie-o com `docker compose down -v` (isso apaga os dados locais).

### 1.2. Migrações do banco

O `db/hortifruti_basico.sql` só roda na criação do volume e já traz o esquema atual. Um banco criado antes de uma migração precisa recebê-la manualmente, na ordem da numeração em `db/migrations/`. Faça um backup antes (`mysqldump`).

- `001_stock_by_lot.sql`: estoque por lote (tabela `estoque_lote`, `lote_id` nas movimentações; remove `produtos.lote_id`). Retorno: `001_stock_by_lot.rollback.sql`, que mantém o saldo total, mas perde a divisão do saldo entre lotes.
- `002_movement_price_and_waste_report.sql`: grava o preço de lista e o desconto aplicado em cada saída (`preco_unitario`, `percentual_desconto`) e cria o índice do relatório mensal. Saídas antigas ficam com `NULL` e o relatório usa o preço atual para elas, avisando que o valor é estimado. Retorno: `002_movement_price_and_waste_report.rollback.sql`.

A pipeline de CI aplica as migrações sobre o esquema da etapa 1 e depois os retornos, para garantir que o caminho funciona nos dois sentidos.

Exemplo com o serviço `mysql` do compose (bash):

```bash
docker compose exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < db/migrations/002_movement_price_and_waste_report.sql
```

No PowerShell, o `<` não funciona; use `Get-Content`:

```powershell
Get-Content db\migrations\002_movement_price_and_waste_report.sql | docker compose exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
```

### 1.3. Rotas da API

Todas as rotas ficam na raiz do backend (`http://localhost:3000`), sem prefixo `/api`.

| Método | Rota | Uso |
| ------ | ---- | --- |
| GET | `/health` | Verificação de saúde |
| GET | `/categories` | Categorias cadastradas |
| GET | `/products` | Vitrine (sem produtos inativos), com preço e desconto automático |
| POST | `/products` | Cadastro com o primeiro lote |
| GET | `/products/:id` | Detalhe com os lotes |
| PUT | `/products/:id` | Edita nome, categoria, preço, estoque mínimo e localização. Lote, validade e quantidade retornam 400: use a entrada de estoque |
| DELETE | `/products/:id` | Exclui; com histórico, apenas inativa |
| POST | `/products/:id/activate` e `/deactivate` | Reativa ou inativa |
| GET | `/stock` | Tela de estoque (inclui inativos) |
| GET | `/products/:id/movements` | Histórico, com preço e desconto de cada saída |
| POST | `/products/:id/stock/entries` | Entrada (`quantidade`, `codigo_lote`, `data_validade` opcionais) |
| POST | `/products/:id/stock/exits` | Saída FEFO (`quantidade`, `subtipo`: venda, perda, ajuste, outro) |
| GET | `/reports/waste?month=YYYY-MM` | Relatório mensal de desperdício (padrão: mês atual da loja) |

### 1.4. Configuração das regras

Variáveis de ambiente do backend (todas opcionais):

- `STORE_TIMEZONE` (padrão `America/Sao_Paulo`): fuso usado para "hoje" e para os limites do mês do relatório.
- `EXPIRING_SOON_DAYS` (padrão `3`): dias para o alerta de "próximo do vencimento".
- `DISCOUNT_TIERS` (padrão `1:50,2:30,3:20`): desconto automático por dias até o vencimento, no formato `dias:percentual`. Lotes vencidos nunca recebem desconto, porque não podem ser vendidos.

### 1.5. Testes

```bash
npm test                      # backend (node:test), na raiz ou em backend/
npm --prefix frontend test    # frontend (Vitest)
```

Os testes de integração rodam contra um MySQL real com o esquema atual e ficam desligados sem `INTEGRATION_DB=1`:

```bash
cd backend
INTEGRATION_DB=1 DB_HOST=127.0.0.1 DB_PORT=3307 DB_USERNAME=frutihorti DB_PASSWORD=... DB_DATABASE=hortifruti npm run test:integration
```

## 2. Organização das Branches

O projeto utiliza três níveis de branches:

- `main`: versão estável e integrada do projeto.
- `develop`: branch utilizada para integração das funcionalidades desenvolvidas.
- `feature/*` e `fix/*`: branches utilizadas para o desenvolvimento individual das tarefas.

A equipe não realizará o desenvolvimento diretamente na `main` ou na `develop`.

### 2.1. Branches de Desenvolvimento

Cada tarefa do Jira deverá possuir uma branch própria, criada a partir da `main`.

O padrão de nomenclatura será:

```text
feature/FRUT-ID-nome-da-funcionalidade
fix/FRUT-ID-descricao-do-bug
```

Exemplos:

```text
feature/FRUT-15-cadastro-produto
fix/FRUT-20-validacao-validade
```

O ID da tarefa do Jira deverá ser utilizado na branch para facilitar a identificação e o rastreamento das alterações.

### 2.2. Fluxo das Branches

O fluxo de desenvolvimento será:

```text
main
  ↓
feature/fix
  ↓
develop
  ↓
main
```

As branches de desenvolvimento serão criadas a partir da `main` e, após a conclusão da tarefa, deverão abrir um Pull Request para a `develop`.

Após a integração e validação das funcionalidades na `develop`, será realizado um Pull Request da `develop` para a `main`.

## 3. Fluxo de Trabalho das Tarefas

O desenvolvimento das tarefas será realizado a partir do backlog do Jira.

O fluxo definido pela equipe será:

1. A tarefa é registrada e priorizada no Jira.
2. A tarefa é atribuída ao integrante responsável.
3. A tarefa é movida para a coluna de desenvolvimento.
4. O responsável cria uma branch a partir da `main`.
5. O desenvolvimento é realizado na branch da tarefa.
6. Os commits são realizados seguindo o padrão definido pela equipe.
7. Ao finalizar o desenvolvimento, o responsável abre um Pull Request para a `develop`.
8. Outro integrante realiza a revisão do código.
9. A pipeline de CI/CD deve ser executada com sucesso.
10. Após a aprovação, a alteração pode ser integrada à `develop`.
11. As alterações integradas à `develop` são posteriormente encaminhadas para a `main` através de Pull Request.
12. O merge para a `main` será realizado somente pelo integrante responsável por Quality Assurance (QA).

O responsável pela tarefa deverá permanecer como responsável pela atividade no Jira durante o desenvolvimento.

## 4. Pull Requests e Code Review

Toda alteração desenvolvida em uma branch de tarefa deverá ser integrada por meio de Pull Request.

O Pull Request deverá:

- Ser direcionado para a `develop`.
- Possuir pelo menos uma aprovação de outro integrante da equipe.
- Não poderá ser aprovado pelo próprio autor.
- Possuir a pipeline executada com sucesso antes da integração.
- Conter uma descrição clara das alterações realizadas.
- Informar o ID da tarefa relacionada no Jira.

A revisão de código será realizada entre os desenvolvedores, sem a necessidade de um responsável específico para cada revisão.

O revisor poderá realizar testes localmente quando considerar necessário para validar a alteração.

Caso sejam solicitadas alterações durante a revisão, elas deverão ser realizadas na mesma branch e no mesmo Pull Request.

### 4.1. Integração com a `main`

Após as funcionalidades estarem integradas na `develop`, será aberto um Pull Request da `develop` para a `main`.

O merge para a `main` será realizado exclusivamente pelo **QA**, garantindo uma etapa adicional de controle antes da atualização da versão principal do projeto.

## 5. Convenção de Commits

A equipe utilizará o padrão **Conventional Commits**.

Os principais tipos de commits utilizados serão:

| Tipo | Utilização |
|---|---|
| `feat` | Criação de uma nova funcionalidade |
| `fix` | Correção de um bug |
| `refactor` | Alteração interna do código sem mudança no comportamento externo |
| `test` | Alterações relacionadas a testes |
| `docs` | Alterações na documentação |
| `chore` | Alterações de manutenção que não modificam diretamente a funcionalidade |

### 5.1. Formato

Os commits deverão seguir o formato:

```text
tipo: descrição da alteração
```

Exemplos:

```text
feat: adicionar cadastro de produto
fix: impedir venda de produtos vencidos
refactor: separar validação de estoque
test: adicionar testes para data de validade
docs: atualizar documentação do projeto
```

Os commits deverão ser objetivos e explicar claramente o que foi realizado.

As mensagens de commit serão escritas em português.

## 6. Convenções de Código

As convenções de código definidas pela equipe são:

### Linguagens e tecnologias

- **Frontend:** React e JavaScript
- **Backend:** Node.js
- **Banco de dados:** MySQL

### Nomenclatura

- Variáveis e funções devem utilizar `camelCase`.
- Classes e componentes React devem utilizar `PascalCase`.
- Constantes que representem valores fixos devem utilizar `UPPER_SNAKE_CASE` quando aplicável.
- Os nomes devem ser descritivos e representar claramente seu propósito.
- Abreviações devem ser evitadas quando prejudicarem a compreensão do código.

Exemplos:

```text
productName
expirationDate
stockQuantity
registerProduct()
ProductList
```

Todos os nomes de classes, componentes, métodos, funções, variáveis e comentários do código deverão ser escritos em **inglês**.

A equipe deverá manter uma nomenclatura consistente entre frontend, backend e banco de dados, evitando a mistura de português e inglês na implementação.

## 7. Boas Práticas de Manutenibilidade

Durante o desenvolvimento, a equipe deverá:

- Evitar duplicação de código.
- Criar funções, componentes e módulos reutilizáveis quando necessário.
- Manter cada função ou método com uma responsabilidade bem definida.
- Avaliar a refatoração de funções que ultrapassem 40 linhas.
- Evitar funções ou componentes com responsabilidades muito diferentes.
- Centralizar valores fixos em constantes ou configurações quando aplicável.
- Priorizar legibilidade e facilidade de manutenção.
- Evitar soluções excessivamente complexas para problemas simples.
- Realizar o tratamento adequado de exceções e erros.
- Não utilizar blocos `catch` vazios.
- Preservar, sempre que possível, o comportamento das funcionalidades que não fazem parte da alteração.

## 8. CI/CD

O projeto utilizará uma pipeline de CI/CD para realizar verificações automáticas antes da integração das alterações.

A pipeline deverá realizar:

- Instalação das dependências.
- Execução do ESLint.
- Verificação do build da aplicação.

As verificações serão executadas nas branches de desenvolvimento e deverão ser concluídas com sucesso antes que a alteração seja integrada à `develop`.

Pull Requests que apresentarem erros nas verificações obrigatórias não deverão ser integrados.

Os testes automatizados serão acompanhados separadamente pelo responsável de QA, conforme definido no Acordo de Manutenibilidade da equipe.

## 9. Jira

O **Jira** será utilizado para gerenciamento do backlog e acompanhamento das tarefas do projeto.

A equipe utiliza os tipos:

- **História**
- **Task**
- **Bug**

Cada tarefa deverá possuir um responsável e, ao entrar em desenvolvimento, deverá ser atribuída ao integrante responsável e movida para a coluna de desenvolvimento.

As branches deverão utilizar o ID da tarefa do Jira para facilitar o rastreamento entre o backlog, o código e os Pull Requests.

## 10. Regras Gerais do Fluxo

As principais regras definidas pela equipe são:

1. Toda tarefa deve estar registrada no Jira.
2. Cada tarefa em desenvolvimento deve possuir uma branch própria.
3. As branches de desenvolvimento devem ser criadas a partir da `main`.
4. O desenvolvimento não deve ser realizado diretamente na `main` ou `develop`.
5. Toda alteração deve passar por Pull Request.
6. Todo Pull Request deve possuir aprovação de pelo menos um integrante diferente do autor.
7. O autor não pode aprovar o próprio Pull Request.
8. A pipeline deve passar antes da integração.
9. Alterações solicitadas durante a revisão devem ser realizadas no mesmo Pull Request.
10. A integração das branches de desenvolvimento ocorre na `develop`.
11. A integração da `develop` na `main` ocorre através de Pull Request.
12. O merge para a `main` é responsabilidade exclusiva do QA.
13. As branches utilizadas nas tarefas não serão excluídas após o merge.
14. Os commits devem seguir o padrão Conventional Commits.
15. O código deve seguir as convenções de nomenclatura e manutenibilidade definidas pela equipe.

## 11. Responsabilidades da Equipe

As responsabilidades definidas no Acordo de Manutenibilidade permanecem válidas:

- **Product Owner (PO):** Larissa da Silva Costa
- **Engenheiro de Requisitos:** Vitória Milho Furtado
- **Quality Assurance (QA):** Davi Rudinei Peres
- **Desenvolvedor Frontend:** Pedro Henrique Coppola
- **Desenvolvedor Backend:** Otávio Santana Possenti
- **DevOps:** Henrique Osmar Adelino

O QA será responsável pelo merge das alterações para a `main`, enquanto os desenvolvedores serão responsáveis pelo desenvolvimento e revisão das alterações.

## 12. Referência

As regras deste documento complementam o **Acordo de Manutenibilidade e Engenharia de Software** elaborado pela equipe em 07/08/2026, mantendo as decisões anteriormente estabelecidas sobre qualidade, débito técnico, DoR, DoD, testes, padrões de código e manutenibilidade.