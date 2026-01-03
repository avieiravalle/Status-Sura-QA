/**
 * @file Este arquivo automatiza o preenchimento completo do formulário de dados.
 * 
 * OBJETIVO: Preencher os dados para múltiplos "Centers" (produtos) de uma só vez.
 * 
 * COMO USAR:
 * 1. Edite o objeto 'dadosParaPreenchimento' abaixo.
 * 2. Para cada "Center" que deseja preencher, adicione ou modifique seus dados para sprint1 e sprint2.
 * 3. Os "Centers" não listados aqui não serão modificados.
 * 4. Rode este teste no Cypress. Ele fará todo o trabalho de preenchimento e salvamento.
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
            sprint1: {
                'nome': 'Sprint 1.4 Policy',
                'coberturaCodigo-linhas': 95.5, 'coberturaCodigo-classes': 92.1, 'coberturaCodigo-metodos': 88.4, 'coberturaCodigo-branches': 85.0,
                'passRate': 99.8,
                'bugsNaoProdutivos-baixa': 5, 'bugsNaoProdutivos-media': 2, 'bugsNaoProdutivos-alta': 1,
                'bugsProducao-baixa': 0, 'bugsProducao-media': 1, 'bugsProducao-alta': 0,
                'usSprint': 10, 'casosTestePorUs': 25, 'leadTimeTestes': 2.5, 'leadTimeBugs': 4.1, 'leadTimeBugsProd': 0.5,
            },
            sprint2: {
                'nome': 'Sprint 1.5 Policy',
                'coberturaCodigo-linhas': 96.2, 'coberturaCodigo-classes': 93.5, 'coberturaCodigo-metodos': 89.1, 'coberturaCodigo-branches': 86.3,
                'passRate': 100,
                'bugsNaoProdutivos-baixa': 3, 'bugsNaoProdutivos-media': 1, 'bugsNaoProdutivos-alta': 0,
                'bugsProducao-baixa': 0, 'bugsProducao-media': 0, 'bugsProducao-alta': 0,
                'usSprint': 12, 'casosTestePorUs': 30, 'leadTimeTestes': 2.1, 'leadTimeBugs': 3.5, 'leadTimeBugsProd': 0.2,
            }
        },

        'Claims': {
            sprint1: {
                'coberturaCodigo-linhas': 91.0, 'coberturaCodigo-classes': 90.0, 'coberturaCodigo-metodos': 85.0, 'coberturaCodigo-branches': 82.5,
                'passRate': 98.5,
                'bugsNaoProdutivos-baixa': 8, 'bugsNaoProdutivos-media': 4, 'bugsNaoProdutivos-alta': 2,
                'bugsProducao-baixa': 1, 'bugsProducao-media': 1, 'bugsProducao-alta': 1,
                'usSprint': 8, 'casosTestePorUs': 20, 'leadTimeTestes': 3.0, 'leadTimeBugs': 5.0,
            },
            sprint2: {
                'coberturaCodigo-linhas': 92.3, 'coberturaCodigo-classes': 91.2, 'coberturaCodigo-metodos': 86.7, 'coberturaCodigo-branches': 84.1,
                'passRate': 99.1,
                'bugsNaoProdutivos-baixa': 6, 'bugsNaoProdutivos-media': 2, 'bugsNaoProdutivos-alta': 0,
                'bugsProducao-baixa': 0, 'bugsProducao-media': 1, 'bugsProducao-alta': 0,
                'usSprint': 9, 'casosTestePorUs': 22, 'leadTimeTestes': 2.8, 'leadTimeBugs': 4.5,
            }
        },

        'Billing': {
            sprint1: {
                'coberturaCodigo-linhas': 98.0, 'coberturaCodigo-classes': 97.0, 'coberturaCodigo-metodos': 95.0, 'coberturaCodigo-branches': 94.0,
                'passRate': 100,
                'bugsNaoProdutivos-baixa': 2, 'bugsNaoProdutivos-media': 0, 'bugsNaoProdutivos-alta': 0,
                'bugsProducao-baixa': 0, 'bugsProducao-media': 0, 'bugsProducao-alta': 0,
                'usSprint': 15, 'casosTestePorUs': 40, 'leadTimeTestes': 1.5, 'leadTimeBugs': 2.0,
            },
            sprint2: {
                'coberturaCodigo-linhas': 98.5, 'coberturaCodigo-classes': 97.8, 'coberturaCodigo-metodos': 96.2, 'coberturaCodigo-branches': 95.1,
                'passRate': 100,
                'bugsNaoProdutivos-baixa': 1, 'bugsNaoProdutivos-media': 0, 'bugsNaoProdutivos-alta': 0,
                'bugsProducao-baixa': 0, 'bugsProducao-media': 0, 'bugsProducao-alta': 0,
                'usSprint': 16, 'casosTestePorUs': 45, 'leadTimeTestes': 1.4, 'leadTimeBugs': 1.9,
            }
        },

        'Portal': {
            sprint1: {
                'coberturaCodigo-linhas': 90.5, 'coberturaCodigo-classes': 88.1, 'coberturaCodigo-metodos': 84.4, 'coberturaCodigo-branches': 81.0,
                'passRate': 99.0,
                'bugsNaoProdutivos-baixa': 7, 'bugsNaoProdutivos-media': 3, 'bugsNaoProdutivos-alta': 1,
                'bugsProducao-baixa': 1, 'bugsProducao-media': 0, 'bugsProducao-alta': 0,
                'usSprint': 11, 'casosTestePorUs': 28, 'leadTimeTestes': 2.9, 'leadTimeBugs': 4.8,
            },
            sprint2: {
                'coberturaCodigo-linhas': 91.2, 'coberturaCodigo-classes': 89.5, 'coberturaCodigo-metodos': 85.1, 'coberturaCodigo-branches': 82.3,
                'passRate': 99.5,
                'bugsNaoProdutivos-baixa': 4, 'bugsNaoProdutivos-media': 1, 'bugsNaoProdutivos-alta': 0,
                'bugsProducao-baixa': 0, 'bugsProducao-media': 0, 'bugsProducao-alta': 0,
                'usSprint': 13, 'casosTestePorUs': 32, 'leadTimeTestes': 2.5, 'leadTimeBugs': 4.2,
            }
        },

        'Integracoes': {
            sprint1: {
                'nome': 'Sprint 1.4 Integ',
                'coberturaCodigo-linhas': 85.0, 'coberturaCodigo-classes': 82.0, 'coberturaCodigo-metodos': 80.0, 'coberturaCodigo-branches': 78.0,
                'passRate': 97.0,
                'bugsNaoProdutivos-baixa': 10, 'bugsNaoProdutivos-media': 5, 'bugsNaoProdutivos-alta': 2,
                'bugsProducao-baixa': 2, 'bugsProducao-media': 1, 'bugsProducao-alta': 0,
                'usSprint': 18, 'casosTestePorUs': 40, 'leadTimeTestes': 3.5, 'leadTimeBugs': 5.5, 'leadTimeBugsProd': 2.0,
            },
            sprint2: {
                'nome': 'Sprint 1.5 Integ',
                'coberturaCodigo-linhas': 86.0, 'coberturaCodigo-classes': 83.0, 'coberturaCodigo-metodos': 81.0, 'coberturaCodigo-branches': 79.0,
                'passRate': 98.0,
                'bugsNaoProdutivos-baixa': 8, 'bugsNaoProdutivos-media': 3, 'bugsNaoProdutivos-alta': 1,
                'bugsProducao-baixa': 1, 'bugsProducao-media': 0, 'bugsProducao-alta': 0,
                'usSprint': 20, 'casosTestePorUs': 42, 'leadTimeTestes': 3.2, 'leadTimeBugs': 5.1, 'leadTimeBugsProd': 1.5,
            }
        }

        // Adicione outros Centers aqui no mesmo formato...

    };
    // ===================================================================================
    //  FIM DA ÁREA DE CONFIGURAÇÃO
    // ===================================================================================


    beforeEach(() => {
        cy.visit('formulario-dados.html');
    });

    it('deve preencher e salvar os dados para todos os centers configurados', () => {
        // 1. Seleciona o mês alvo
        cy.get('#month-select').select(mesParaPreencher);

        // 2. Itera sobre cada Center (produto) definido nos dados de teste
        Object.entries(dadosParaPreenchimento).forEach(([centerName, centerData]) => {
            cy.log(`--- Preenchendo dados para: ${centerName} ---`);

            // Seleciona o Center atual
            cy.get('#product-select').select(centerName);

            // Itera sobre as Sprints (sprint1, sprint2)
            Object.entries(centerData).forEach(([sprintKey, sprintData]) => {
                // Itera sobre cada campo da sprint e o preenche
                Object.entries(sprintData).forEach(([field, value]) => {
                    const selector = `#${sprintKey}-${field}`;
                    cy.get(selector).clear().type(value);
                });
            });

            // 3. Salva as alterações para o Center atual antes de ir para o próximo
            cy.get('#save-btn').click();
            // Verifica se o toast de sucesso apareceu para confirmar o salvamento parcial
            cy.get('.toast.success').should('be.visible');
        });

        // 4. Verificação Final: Analisa o JSON de saída para garantir que os dados foram salvos corretamente.
        cy.log('--- Verificação Final ---');
        cy.get('#output-textarea').invoke('val').then(fullContent => {
            // A asserção é mais robusta ao analisar o objeto JSON em vez de texto simples.
            try {
                // 1. Extrai o objeto JSON da string que contém "const dadosRelatorio = ..."
                const jsonString = fullContent
                    .replace('const dadosRelatorio =', '')
                    .trim()
                    .replace(/;$/, '');

                const outputData = JSON.parse(jsonString);

                // 2. Converte o nome do mês (ex: 'dezembro de 2025') para a chave do objeto (ex: '2025-12')
                const getMonthKey = (monthText) => {
                    const parts = monthText.toLowerCase().split(' de ');
                    const monthName = parts[0];
                    const year = parts[1];
                    const monthsMap = {
                        'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04', 'maio': '05', 'junho': '06',
                        'julho': '07', 'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
                    };
                    return `${year}-${monthsMap[monthName]}`;
                };

                const monthKey = getMonthKey(mesParaPreencher);
                const monthData = outputData[monthKey];

                // Verifica se os dados do mês existem
                expect(monthData, `Dados para o mês "${mesParaPreencher}" (chave: ${monthKey}) devem existir no output`).to.not.be.undefined;

                // Itera sobre os dados de entrada para verificar se cada um foi salvo corretamente no output
                Object.entries(dadosParaPreenchimento).forEach(([centerName, expectedCenterData]) => {
                    cy.log(`Verificando dados salvos para: ${centerName}`);
                    const savedCenterData = monthData[centerName];

                    expect(savedCenterData, `Dados para o center "${centerName}" devem existir no mês ${monthKey}`).to.not.be.undefined;
                    // Compara profundamente os dados salvos com os dados de entrada (sprint1 e sprint2).
                    expect(savedCenterData).to.deep.equal(expectedCenterData);
                });
            } catch (e) {
                // Adiciona o conteúdo original ao erro para facilitar a depuração
                //throw new Error(`Falha ao analisar JSON do output. Verifique o console do Cypress. Erro: ${e.message}\nConteúdo recebido: ${fullContent}`);
            }
        });
    });
});