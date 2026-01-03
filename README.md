# Status Mês Sura - Dashboard de Qualidade

Este projeto é uma solução completa para gestão, visualização e reporte de métricas de Qualidade de Software (QA). Ele permite o acompanhamento de KPIs, geração de relatórios em PDF, análise de tendências e cálculo de ROI de QA para diversos produtos (Centers).

## 🚀 Funcionalidades

### 1. Relatório Mensal (Dashboard)
*   **Visualização de Métricas:** Cobertura de código, Pass Rate, Bugs (Prod/Não-Prod), Lead Time e Automação.
*   **Cálculo de ROI:** Análise financeira automática comparando o custo do QA vs. valor entregue (bugs evitados e testes executados).
*   **Exportação PDF:** Geração de relatórios executivos em PDF com quebra de página inteligente.
*   **Planos de Ação:** Campo para registro e persistência local de planos de ação para métricas não atingidas.

### 2. Formulário de Dados
*   **Entrada Manual:** Interface amigável para inserir ou editar dados de Sprints e consolidado mensal.
*   **Persistência:** Salva os dados diretamente no arquivo `dadosPreenchimento.js` através do servidor Node.js.
*   **Migração:** Ferramentas para arquivar meses antigos e limpar dados.

### 3. Comparação Visual (Tendências)
*   **Gráficos Evolutivos:** Linhas do tempo para Cobertura, Lead Time e Saúde Geral do projeto.
*   **Análise de Retrabalho:** Gráficos específicos para monitorar o volume de bugs reexecutados.
*   **Tabela de Tendências:** Comparativo percentual entre o mês atual e o anterior.

### 4. Automação de Preenchimento (Cypress)
*   **Bulk Insert:** Script para preencher dados de múltiplos produtos simultaneamente de forma automatizada.

---

## 📦 Instalação

1.  **Pré-requisitos:** Certifique-se de ter o Node.js instalado.
2.  **Clone o repositório** ou extraia os arquivos.
3.  **Instale as dependências:**
    Abra o terminal na pasta raiz do projeto e execute:
    ```bash
    npm install
    ```

---

## 🖥️ Executando o Servidor (Node.js)

O projeto utiliza um servidor `express` customizado para servir as páginas e lidar com a gravação de arquivos.

1.  No terminal, execute:
    ```bash
    node server.js
    ```

2.  O console exibirá os links de acesso. O servidor abre **3 portas distintas**, uma para cada módulo:

| Módulo | Porta | URL | Descrição |
| :--- | :--- | :--- | :--- |
| **Relatório Mensal** | `3000` | `http://localhost:3000` | Visualização principal para stakeholders. |
| **Formulário** | `3001` | `http://localhost:3001` | Entrada de dados (Habilita salvamento em disco). |
| **Comparação** | `3002` | `http://localhost:3002` | Análise de tendências e gráficos históricos. |

> **Nota:** Para salvar dados, você deve usar a porta **3001**. As outras portas são apenas para leitura/visualização.

---

## 🤖 Automação com Cypress

O projeto inclui um script Cypress para facilitar o preenchimento de dados em massa, ideal para fechar o mês rapidamente.

### Configurando os Dados
1.  Abra o arquivo `automacao-preenchimento-completo.cy.js`.
2.  Edite o objeto `dadosParaPreenchimento` no início do arquivo.
3.  Defina o mês alvo na variável `mesParaPreencher` (ex: `'dezembro de 2025'`).
4.  Insira os dados das Sprints para cada Center (Policy, Claims, Billing, etc.).

### Executando o Teste
1.  Certifique-se de que o servidor Node.js está rodando (`node server.js`).
2.  Abra a interface do Cypress:
    ```bash
    npx cypress open
    ```
3.  Selecione **E2E Testing**.
4.  Escolha o navegador (Chrome/Electron).
5.  Clique na spec `automacao-preenchimento-completo.cy.js`.

O Cypress irá:
1.  Acessar o formulário (`localhost:3001`).
2.  Selecionar o mês e produto.
3.  Preencher todos os campos automaticamente.
4.  Clicar em Salvar.
5.  Verificar se os dados foram persistidos corretamente no JSON de saída.

---

## 🛠️ Estrutura Técnica

### Arquivos Principais
*   `server.js`: Configuração do servidor Express. Gerencia as rotas e o endpoint `/save-data` que escreve no disco.
*   `dadosPreenchimento.js`: "Banco de dados" em formato JSON/JS. Contém todo o histórico de métricas.
*   `relatorio.js`: Lógica de negócio do dashboard, cálculos de ROI e geração de PDF.
*   `comparacao-mensal-visual.js`: Lógica dos gráficos Chart.js para análise de tendências.

### Tecnologias Utilizadas
*   **Frontend:** HTML5, CSS3, JavaScript (Vanilla).
*   **Backend:** Node.js, Express.
*   **Bibliotecas:**
    *   `Chart.js`: Gráficos visuais.
    *   `jsPDF` & `html2canvas`: Geração de relatórios em PDF.
    *   `Cypress`: Testes E2E e automação de entrada de dados.

---

## 📝 Como Usar (Fluxo Manual)

1.  **Iniciar:** Rode `node server.js`.
2.  **Criar Mês:** Acesse `http://localhost:3000`, clique em "Criar Novo Mês". Isso duplicará a estrutura do mês anterior.
3.  **Preencher:**
    *   Acesse `http://localhost:3001`.
    *   Selecione o Mês Novo e o Produto.
    *   Preencha as métricas das Sprints 1 e 2.
    *   Clique em **Salvar Alterações**.
4.  **Visualizar:**
    *   Volte para `http://localhost:3000`.
    *   Analise os KPIs e o ROI.
    *   Se necessário, escreva Planos de Ação no campo de texto.
5.  **Exportar:**
    *   Clique em **Salvar como PDF** para gerar o relatório executivo.
6.  **Analisar Tendências:**
    *   Acesse `http://localhost:3002` para ver a evolução comparada aos meses anteriores.

---