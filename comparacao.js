document.addEventListener('DOMContentLoaded', () => {
    const productSelect = document.getElementById('product-select');

    let coverageChart, bugsChart, leadTimeChart, automationChart;

    function prepareChartData(selectedProduct) {
        const labels = Object.keys(dadosRelatorio).sort(); // ex: ['2025-11', '2025-12']
        const data = {
            coverageLines: [],
            coverageBranches: [],
            nonProdBugs: [],
            prodBugs: [],
            leadTimeTests: [],
            leadTimeBugs: [],
            automationScenarios: [],
            automationTimeSaved: []
        };

        labels.forEach(month => {
            const productData = dadosRelatorio[month]?.[selectedProduct];

            if (productData) {
                const sprint1 = productData.sprint1 || {};
                const sprint2 = productData.sprint2 || {};

                // Cobertura: Média das duas sprints
                const coverageSprints = [sprint1.coberturaCodigo, sprint2.coberturaCodigo].filter(c => c);
                const avgLines = coverageSprints.length > 0 ? coverageSprints.reduce((sum, c) => sum + (c.linhas || 0), 0) / coverageSprints.length : 0;
                const avgBranches = coverageSprints.length > 0 ? coverageSprints.reduce((sum, c) => sum + (c.branches || 0), 0) / coverageSprints.length : 0;
                data.coverageLines.push(avgLines.toFixed(2));
                data.coverageBranches.push(avgBranches.toFixed(2));

                // Bugs: Soma das duas sprints + bugs de produção do mês
                const nonProd = (sprint1.bugsNaoProdutivos || { baixa: 0, media: 0, alta: 0 });
                const nonProd2 = (sprint2.bugsNaoProdutivos || { baixa: 0, media: 0, alta: 0 });
                const totalNonProd = nonProd.baixa + nonProd.media + nonProd.alta + nonProd2.baixa + nonProd2.media + nonProd2.alta;
                const prod = (productData.bugsProducao || { baixa: 0, media: 0, alta: 0 });
                const totalProd = prod.baixa + prod.media + prod.alta;
                data.nonProdBugs.push(totalNonProd);
                data.prodBugs.push(totalProd);

                // Lead Time: Média das duas sprints (ignorando valores 0)
                const ltTests = [sprint1.leadTimeTestes, sprint2.leadTimeTestes].filter(lt => lt > 0);
                const avgLtTests = ltTests.length > 0 ? ltTests.reduce((a, b) => a + b, 0) / ltTests.length : 0;
                const ltBugs = [sprint1.leadTimeBugs, sprint2.leadTimeBugs].filter(lt => lt > 0);
                const avgLtBugs = ltBugs.length > 0 ? ltBugs.reduce((a, b) => a + b, 0) / ltBugs.length : 0;
                data.leadTimeTests.push(avgLtTests.toFixed(2));
                data.leadTimeBugs.push(avgLtBugs.toFixed(2));

                // Automação: Soma dos cenários e do tempo economizado
                const auto1 = sprint1.testesAutomatizados || {};
                const auto2 = sprint2.testesAutomatizados || {};
                const totalScenarios = (auto1.cenarios || 0) + (auto2.cenarios || 0);
                const timeSaved = ((auto1.tempoManual || 0) + (auto2.tempoManual || 0)) - ((auto1.tempoAutom || 0) + (auto2.tempoAutom || 0));
                data.automationScenarios.push(totalScenarios);
                data.automationTimeSaved.push(timeSaved);

            } else {
                // Adiciona 0 para todas as métricas se não houver dados do produto no mês
                Object.keys(data).forEach(key => data[key].push(0));
            }
        });

        return { labels, data };
    }

    function renderCharts() {
        const selectedProduct = productSelect.value;
        const { labels, data } = prepareChartData(selectedProduct);

        if (coverageChart) coverageChart.destroy();
        if (bugsChart) bugsChart.destroy();
        if (leadTimeChart) leadTimeChart.destroy();
        if (automationChart) automationChart.destroy();

        // Gráfico de Cobertura
        const coverageCtx = document.getElementById('coverage-chart').getContext('2d');
        coverageChart = new Chart(coverageCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cobertura de Linhas (%)',
                    data: data.coverageLines,
                    borderColor: 'rgba(0, 51, 160, 1)', // Sura Blue
                    backgroundColor: 'rgba(0, 51, 160, 0.2)',
                    fill: false,
                    tension: 0.1
                }, {
                    label: 'Cobertura de Branches (%)',
                    data: data.coverageBranches,
                    borderColor: 'rgba(0, 167, 157, 1)', // Sura Green
                    backgroundColor: 'rgba(0, 167, 157, 0.2)',
                    fill: false,
                    tension: 0.1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Evolução da Cobertura de Código' } } }
        });

        // Gráfico de Bugs
        const bugsCtx = document.getElementById('bugs-chart').getContext('2d');
        bugsChart = new Chart(bugsCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Bugs Não-Produtivos',
                    data: data.nonProdBugs,
                    backgroundColor: 'rgba(255, 159, 64, 0.7)'
                }, {
                    label: 'Bugs Produtivos',
                    data: data.prodBugs,
                    backgroundColor: 'rgba(231, 76, 60, 0.7)' // Red
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Quantidade de Bugs por Mês' } }, scales: { y: { beginAtZero: true } } }
        });

        // Gráfico de Lead Time
        const leadTimeCtx = document.getElementById('leadtime-chart').getContext('2d');
        leadTimeChart = new Chart(leadTimeCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Lead Time de Testes (dias)',
                    data: data.leadTimeTests,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: false,
                    tension: 0.1
                }, {
                    label: 'Lead Time de Bugs (dias)',
                    data: data.leadTimeBugs,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    fill: false,
                    tension: 0.1
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Evolução do Lead Time (em dias)' } }, scales: { y: { beginAtZero: true } } }
        });

        // Gráfico de Automação
        const automationCtx = document.getElementById('automation-time-chart').getContext('2d');
        automationChart = new Chart(automationCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cenários Automatizados',
                    data: data.automationScenarios,
                    backgroundColor: 'rgba(0, 167, 157, 0.7)', // Sura Green
                    yAxisID: 'y'
                }, {
                    label: 'Tempo Economizado (min)',
                    data: data.automationTimeSaved,
                    backgroundColor: 'rgba(88, 89, 91, 0.7)', // Sura Gray
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { title: { display: true, text: 'Ganhos com Automação' } },
                scales: {
                    y: { type: 'linear', display: true, position: 'left', beginAtZero: true, title: { display: true, text: 'Nº de Cenários' } },
                    y1: { type: 'linear', display: true, position: 'right', beginAtZero: true, title: { display: true, text: 'Minutos Economizados' }, grid: { drawOnChartArea: false } }
                }
            }
        });
    }

    // Popula o select de produto dinamicamente
    const firstMonth = Object.keys(dadosRelatorio)[0];
    if (firstMonth && dadosRelatorio[firstMonth]) {
        const products = Object.keys(dadosRelatorio[firstMonth]);
        productSelect.innerHTML = products.map(p => `<option value="${p}">${p}</option>`).join('');
    }

    // Event Listeners
    productSelect.addEventListener('change', renderCharts);

    // Renderização inicial
    renderCharts();
});