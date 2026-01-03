/**
 * @file Este arquivo automatiza o preenchimento completo do formulário de dados.
 * 
 * OBJETIVO: Preencher os dados para múltiplos "Centers" (produtos) de uma só vez para um mês específico.
 * 
 * COMO USAR:
 * 1. Edite a constante `mesParaPreencher` com o mês desejado.
 * 2. Edite o objeto `dadosParaPreenchimento` com os valores para cada Center.
 * 3. Rode o teste no Cypress.
 * 4. Ao final, clique em "Download do Arquivo" na página para salvar o `dadosPreenchimento.js` atualizado.
 */

describe('Automação de Preenchimento Completo por Center', () => {

    // ===================================================================================
    //  ÁREA DE CONFIGURAÇÃO - EDITE OS DADOS ABAIXO CONFORME NECESSÁRIO
    // ===================================================================================
    const mesParaPreencher = 'dezembro de 2025'; // Use o texto exato que aparece no seletor de mês (ex: 'dezembro de 2025')

    const dadosParaPreenchimento = {
        // Adicione ou remova "Centers" (produtos) conforme necessário.
        // O nome da chave (ex: 'Policy', 'Claims') deve ser o valor exato no seletor de produto.
        
        'Policy': {
            qaValor: 26000,
            bugsProducao: { 'baixa': 0, 'media': 1, 'alta': 0 },
            sprint1: {
                'coberturaCodigo-linhas': 95.5, 'coberturaCodigo-classes': 92.1, 'coberturaCodigo-metodos': 88.4, 'coberturaCodigo-branches': 85.0,
                'passRate': 99.8,
                'bugsNaoProdutivos-baixa': 5, 'bugsNaoProdutivos-media': 2, 'bugsNaoProdutivos-alta': 1,
                'usSprint': 10, 'casosTestePorUs': 25, 'leadTimeTestes': 2.5, 'leadTimeBugs': 4.1,
                'testesAutomatizados-cenarios': 15, 'testesAutomatizados-tempoManual': 120, 'testesAutomatizados-tempoAutom': 10,
                'ctEscritos': 15,
                'ctExecutados': 120,
                'reexecucaoBugsNaoProd': 20,
                'reexecucaoBugsProd': 5,
            },
            sprint2: {
                'coberturaCodigo-linhas': 96.2, 'coberturaCodigo-classes': 93.5, 'coberturaCodigo-metodos': 89.1, 'coberturaCodigo-branches': 86.3,
                'passRate': 100,
                'bugsNaoProdutivos-baixa': 3, 'bugsNaoProdutivos-media': 1, 'bugsNaoProdutivos-alta': 0,
                'usSprint': 12, 'casosTestePorUs': 30, 'leadTimeTestes': 2.1, 'leadTimeBugs': 3.5,
                'testesAutomatizados-cenarios': 18, 'testesAutomatizados-tempoManual': 140, 'testesAutomatizados-tempoAutom': 12,
                'ctEscritos': 8,
                'ctExecutados': 95,
                'reexecucaoBugsNaoProd': 12,
                'reexecucaoBugsProd': 3,
            }
        },

        'Claims': {
            qaValor: 9000,
            bugsProducao: { 'baixa': 1, 'media': 2, 'alta': 1 },
            sprint1: {
                'coberturaCodigo-linhas': 91.0, 'coberturaCodigo-classes': 90.0, 'coberturaCodigo-metodos': 85.0, 'coberturaCodigo-branches': 82.5,
                'passRate': 98.5,
                'bugsNaoProdutivos-baixa': 8, 'bugsNaoProdutivos-media': 4, 'bugsNaoProdutivos-alta': 2,
                'usSprint': 8, 'casosTestePorUs': 20, 'leadTimeTestes': 3.0, 'leadTimeBugs': 5.0,
                'testesAutomatizados-cenarios': 10, 'testesAutomatizados-tempoManual': 80, 'testesAutomatizados-tempoAutom': 8,
                'ctEscritos': 12,
                'ctExecutados': 100,
                'reexecucaoBugsNaoProd': 25,
                'reexecucaoBugsProd': 5,
            },
            sprint2: {
                'coberturaCodigo-linhas': 92.3, 'coberturaCodigo-classes': 91.2, 'coberturaCodigo-metodos': 86.7, 'coberturaCodigo-branches': 84.1,
                'passRate': 99.1,
                'bugsNaoProdutivos-baixa': 6, 'bugsNaoProdutivos-media': 2, 'bugsNaoProdutivos-alta': 0,
                'usSprint': 9, 'casosTestePorUs': 22, 'leadTimeTestes': 2.8, 'leadTimeBugs': 4.5,
                'testesAutomatizados-cenarios': 12, 'testesAutomatizados-tempoManual': 95, 'testesAutomatizados-tempoAutom': 9,
                'ctEscritos': 5,
                'ctExecutados': 70,
                'reexecucaoBugsNaoProd': 15,
                'reexecucaoBugsProd': 3,
            }
        },

        'Billing': {
            qaValor: 12000,
            bugsProducao: { 'baixa': 0, 'media': 0, 'alta': 0 },
            sprint1: {
                'coberturaCodigo-linhas': 98.0, 'coberturaCodigo-classes': 97.0, 'coberturaCodigo-metodos': 95.0, 'coberturaCodigo-branches': 94.0,
                'passRate': 100,
                'bugsNaoProdutivos-baixa': 2, 'bugsNaoProdutivos-media': 0, 'bugsNaoProdutivos-alta': 0,
                'usSprint': 15, 'casosTestePorUs': 40, 'leadTimeTestes': 1.5, 'leadTimeBugs': 2.0,
                'testesAutomatizados-cenarios': 25, 'testesAutomatizados-tempoManual': 200, 'testesAutomatizados-tempoAutom': 15,
                'ctEscritos': 25,
                'ctExecutados': 200,
                'reexecucaoBugsNaoProd': 5,
                'reexecucaoBugsProd': 0,
            },
            sprint2: {
                'coberturaCodigo-linhas': 98.5, 'coberturaCodigo-classes': 97.8, 'coberturaCodigo-metodos': 96.2, 'coberturaCodigo-branches': 95.1,
                'passRate': 100,
                'bugsNaoProdutivos-baixa': 1, 'bugsNaoProdutivos-media': 0, 'bugsNaoProdutivos-alta': 0,
                'usSprint': 16, 'casosTestePorUs': 45, 'leadTimeTestes': 1.4, 'leadTimeBugs': 1.9,
                'testesAutomatizados-cenarios': 30, 'testesAutomatizados-tempoManual': 240, 'testesAutomatizados-tempoAutom': 18,
                'ctEscritos': 18,
                'ctExecutados': 180,
                'reexecucaoBugsNaoProd': 2,
                'reexecucaoBugsProd': 0,
            }
        },

        'Portal': {
            qaValor: 6000,
            bugsProducao: { 'baixa': 1, 'media': 0, 'alta': 0 },
            sprint1: {
                'coberturaCodigo-linhas': 90.5, 'coberturaCodigo-classes': 88.1, 'coberturaCodigo-metodos': 84.4, 'coberturaCodigo-branches': 81.0,
                'passRate': 99.0,
                'bugsNaoProdutivos-baixa': 7, 'bugsNaoProdutivos-media': 3, 'bugsNaoProdutivos-alta': 1,
                'usSprint': 11, 'casosTestePorUs': 28, 'leadTimeTestes': 2.9, 'leadTimeBugs': 4.8,
                'testesAutomatizados-cenarios': 5, 'testesAutomatizados-tempoManual': 40, 'testesAutomatizados-tempoAutom': 5,
                'ctEscritos': 5,
                'ctExecutados': 50,
                'reexecucaoBugsNaoProd': 10,
                'reexecucaoBugsProd': 2,
            },
            sprint2: {
                'coberturaCodigo-linhas': 91.2, 'coberturaCodigo-classes': 89.5, 'coberturaCodigo-metodos': 85.1, 'coberturaCodigo-branches': 82.3,
                'passRate': 99.5,
                'bugsNaoProdutivos-baixa': 4, 'bugsNaoProdutivos-media': 1, 'bugsNaoProdutivos-alta': 0,
                'usSprint': 13, 'casosTestePorUs': 32, 'leadTimeTestes': 2.5, 'leadTimeBugs': 4.2,
                'testesAutomatizados-cenarios': 8, 'testesAutomatizados-tempoManual': 60, 'testesAutomatizados-tempoAutom': 6,
                'ctEscritos': 2,
                'ctExecutados': 30,
                'reexecucaoBugsNaoProd': 8,
                'reexecucaoBugsProd': 0,
            }
        },

        'Integracoes': {
            qaValor: 8000,
            bugsProducao: { 'baixa': 3, 'media': 1, 'alta': 0 },
            sprint1: {
                'coberturaCodigo-linhas': 85.0, 'coberturaCodigo-classes': 82.0, 'coberturaCodigo-metodos': 80.0, 'coberturaCodigo-branches': 78.0,
                'passRate': 97.0,
                'bugsNaoProdutivos-baixa': 10, 'bugsNaoProdutivos-media': 5, 'bugsNaoProdutivos-alta': 2,
                'usSprint': 18, 'casosTestePorUs': 40, 'leadTimeTestes': 3.5, 'leadTimeBugs': 5.5,
                'testesAutomatizados-cenarios': 20, 'testesAutomatizados-tempoManual': 160, 'testesAutomatizados-tempoAutom': 14,
                'ctEscritos': 10,
                'ctExecutados': 80,
                'reexecucaoBugsNaoProd': 12,
                'reexecucaoBugsProd': 3,
            },
            sprint2: {
                'coberturaCodigo-linhas': 86.0, 'coberturaCodigo-classes': 83.0, 'coberturaCodigo-metodos': 81.0, 'coberturaCodigo-branches': 79.0,
                'passRate': 98.0,
                'bugsNaoProdutivos-baixa': 8, 'bugsNaoProdutivos-media': 3, 'bugsNaoProdutivos-alta': 1,
                'usSprint': 20, 'casosTestePorUs': 42, 'leadTimeTestes': 3.2, 'leadTimeBugs': 5.1,
                'testesAutomatizados-cenarios': 22, 'testesAutomatizados-tempoManual': 175, 'testesAutomatizados-tempoAutom': 15,
                'ctEscritos': 8,
                'ctExecutados': 60,
                'reexecucaoBugsNaoProd': 9,
                'reexecucaoBugsProd': 1,
            }
        }

        // Adicione outros Centers aqui no mesmo formato...

    };
    // ===================================================================================
    //  FIM DA ÁREA DE CONFIGURAÇÃO
    // ===================================================================================

    it('Preenche o formulário para todos os Centers configurados', () => {
        // Ajuste a URL conforme necessário (ex: 'http://localhost:3000' ou './index.html')
        cy.visit('http://localhost:3001/formulario-dados.html'); 

        const centers = Object.keys(dadosParaPreenchimento);

        centers.forEach((center) => {
            const dados = dadosParaPreenchimento[center];

            // Seleciona o Mês e o Center (Produto)
            // Assumindo IDs '#mes' e '#center'. Ajuste os seletores conforme o HTML real.
            cy.get('#month-select').select(mesParaPreencher);
            cy.get('#product-select').select(center);

            // Preenche QA Valor
            cy.get('#qaValor').clear().type(dados.qaValor);

            // Preenche Bugs de Produção
            Object.keys(dados.bugsProducao).forEach((key) => {
                cy.get(`#bugsProducao-${key}`).clear().type(dados.bugsProducao[key]);
            });

            // Preenche dados das Sprints
            ['sprint1', 'sprint2'].forEach((sprint) => {
                Object.keys(dados[sprint]).forEach((key) => {
                    cy.get(`#${sprint}-${key}`).clear().type(dados[sprint][key]);
                });
            });

            // Salva os dados do Center atual
            // Ajuste o seletor do botão de salvar conforme o HTML real.
            cy.get('#save-btn').click();
            cy.wait(500); // Pausa para garantir o processamento
        });
    });
});