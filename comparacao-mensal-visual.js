// Script para a página de comparação mensal visual
// Carrega e exibe os gráficos e análises de tendências

const METRIC_TARGETS = {
    coberturaCodigo: {
        geral: { value: 50, higherIsBetter: true }
    },
    passRate: { value: 90, higherIsBetter: true },
    densidadeTestes: { value: 4, higherIsBetter: true },
    coberturaTestesPercentual: { value: 100, higherIsBetter: true },
    leadTimeTestes: { value: 2.5, higherIsBetter: false },
    leadTimeBugs: { value: 2.0, higherIsBetter: false },
    bugsNaoProdutivos: {
        total: { value: 10, higherIsBetter: false }
    },
    bugsProducao: {
        total: { value: 2, higherIsBetter: false }
    },
    healthScore: {
        target: 8.0,
        limits: {
            nonProdBugs: 20,
            prodBugs: 10,
            leadTime: 10
        }
    },
    automacao: {
        cenariosNovos: { value: 5, higherIsBetter: true }
    }
};

/**
 * Calcula um "Health Score" geral para um centro em um determinado mês.
 * O score é uma média ponderada de várias métricas normalizadas.
 * @param {object} centerData - Dados do centro para um mês.
 * @returns {number} - O score de 0 a 100.
 */
function calculateMonthHealthScore(centerData) {
    if (!centerData) return 0;

    const { sprint1, sprint2 } = centerData;

    // --- Normalização de Métricas (0-100) ---
    // Para métricas "quanto maior, melhor", a pontuação é (valor / meta) * 100, com teto de 100.
    // Para métricas "quanto menor, melhor", a pontuação é (1 - (valor / teto_ruim)) * 100, com piso de 0.

    const s1_cov = getSprintAverageCodeCoverage(sprint1);
    const s2_cov = getSprintAverageCodeCoverage(sprint2);
    const avgCoverage = (s1_cov > 0 && s2_cov > 0) ? (s1_cov + s2_cov) / 2 : (s1_cov || s2_cov);
    const coverageScore = Math.min(100, (avgCoverage / METRIC_TARGETS.coberturaCodigo.geral.value) * 100);

    const avgPassRate = getAverageSprintMetric(centerData, 'passRate');
    const passRateScore = Math.min(100, (avgPassRate / METRIC_TARGETS.passRate.value) * 100);

    const avgTestCoverage = getMonthTestCoverage(centerData, METRIC_TARGETS.densidadeTestes.value);
    const testCoverageScore = Math.min(100, (avgTestCoverage / METRIC_TARGETS.coberturaTestesPercentual.value) * 100);

    const totalNonProdBugs = getSprintTotalNonProdBugs(sprint1) + getSprintTotalNonProdBugs(sprint2);
    const nonProdBugsScore = Math.max(0, (1 - (totalNonProdBugs / METRIC_TARGETS.healthScore.limits.nonProdBugs)) * 100);

    const totalProdBugs = getTotalProductionBugs(centerData);
    const prodBugsScore = Math.max(0, (1 - (totalProdBugs / METRIC_TARGETS.healthScore.limits.prodBugs)) * 100);

    const avgLtTests = getAverageSprintMetric(centerData, 'leadTimeTestes');
    const ltTestScore = Math.max(0, (1 - (avgLtTests / METRIC_TARGETS.healthScore.limits.leadTime)) * 100);

    const avgLtBugs = getAverageSprintMetric(centerData, 'leadTimeBugs');
    const ltBugScore = Math.max(0, (1 - (avgLtBugs / METRIC_TARGETS.healthScore.limits.leadTime)) * 100);

    // --- Média Ponderada ---
    const weights = {
        coverage: 0.20,
        passRate: 0.20,
        testCoverage: 0.15,
        nonProdBugs: 0.15,
        prodBugs: 0.15,
        ltTest: 0.075,
        ltBug: 0.075,
    };

    const totalScore =
        coverageScore * weights.coverage + passRateScore * weights.passRate + testCoverageScore * weights.testCoverage +
        nonProdBugsScore * weights.nonProdBugs + prodBugsScore * weights.prodBugs + ltTestScore * weights.ltTest + ltBugScore * weights.ltBug;

    return totalScore;
}
/**
 * Adiciona uma imagem de canvas a um PDF, tratando quebras de página para conteúdo longo.
 * @param {jsPDF} pdf - A instância do jsPDF.
 * @param {HTMLCanvasElement} canvas - O canvas a ser adicionado.
 */
function addCanvasWithPageBreaks(pdf, canvas) {
    const margin = 10; // 10mm de margem
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = pdfHeight - (margin * 2);
    const imgData = canvas.toDataURL('image/png');
    const totalImgHeight = (canvas.height * contentWidth) / canvas.width;
    let heightLeft = totalImgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, totalImgHeight);
    heightLeft -= contentHeight;

    while (heightLeft > 0) {
        position -= contentHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position + margin, contentWidth, totalImgHeight);
        heightLeft -= contentHeight;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    updateMetricTargets();
    // Registrar o plugin de datalabels para Chart.js
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }

    // Configurações globais para um visual mais "executivo"
    Chart.defaults.font.family = "'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#555';
    
    Chart.defaults.plugins.title.font.weight = 'bold';
    Chart.defaults.plugins.title.font.size = 16;
    Chart.defaults.plugins.title.color = '#1a1a1a';
    Chart.defaults.plugins.title.padding = 15;

    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyle = 'rectRounded';
    Chart.defaults.plugins.legend.position = 'bottom';
    Chart.defaults.plugins.legend.labels.padding = 20;
    
    // Tooltips mais modernos
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    Chart.defaults.plugins.tooltip.titleColor = '#1a1a1a';
    Chart.defaults.plugins.tooltip.bodyColor = '#4a4a4a';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(0,0,0,0.1)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.displayColors = true;
    
    // Variáveis globais
    let currentCenter;
    let codeCoverageChart, leadTimeChart, overallHealthChart, reworkChart, automatedTestsChart, testCasesPerUsChart, qaEfficiencyChart, spilloverChart, consolidatedBugsChart;
    let currentSort = { column: null, direction: 'asc' };
    let currentTrendMetrics = [];
    
    // Configurar listeners para controles
    document.getElementById('product-select').addEventListener('change', function() {
        currentCenter = this.value;
        updateAllData();
    });
    
    document.getElementById('period-select').addEventListener('change', function() {
        updateAllData();
    });

    document.getElementById('save-pdf-btn').addEventListener('click', saveToPDF);
    document.getElementById('return-btn').addEventListener('click', function() {
        window.location.href = 'relatorio-mensal.html';
    });

    // Configurar listeners para ordenação da tabela
    document.querySelectorAll('.trend-table th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }
            renderTrendTable();
        });
    });
    
    // Carregar dados iniciais
    populateProductSelect();
    updateAllData();

    function updateMetricTargets() {
        if (typeof dadosRelatorio === 'undefined' || !dadosRelatorio.metas) return;
        const metas = dadosRelatorio.metas;

        if (metas.coberturaCodigo && metas.coberturaCodigo.geral !== undefined) {
            METRIC_TARGETS.coberturaCodigo.geral.value = metas.coberturaCodigo.geral;
        }
        if (metas.passRate !== undefined) METRIC_TARGETS.passRate.value = metas.passRate;
        if (metas.densidadeTestes !== undefined) METRIC_TARGETS.densidadeTestes.value = metas.densidadeTestes;
        if (metas.coberturaTestesPercentual !== undefined) METRIC_TARGETS.coberturaTestesPercentual.value = metas.coberturaTestesPercentual;
        if (metas.leadTimeTestes !== undefined) METRIC_TARGETS.leadTimeTestes.value = metas.leadTimeTestes;
        if (metas.leadTimeBugs !== undefined) METRIC_TARGETS.leadTimeBugs.value = metas.leadTimeBugs;
        
        if (metas.bugsNaoProdutivos && metas.bugsNaoProdutivos.total !== undefined) {
            METRIC_TARGETS.bugsNaoProdutivos.total.value = metas.bugsNaoProdutivos.total;
        }
        if (metas.bugsProducao && metas.bugsProducao.total !== undefined) {
            METRIC_TARGETS.bugsProducao.total.value = metas.bugsProducao.total;
        }

        if (metas.healthScore) {
            if (metas.healthScore.target !== undefined) METRIC_TARGETS.healthScore.target = metas.healthScore.target;
            if (metas.healthScore.limits) {
                if (metas.healthScore.limits.nonProdBugs !== undefined) METRIC_TARGETS.healthScore.limits.nonProdBugs = metas.healthScore.limits.nonProdBugs;
                if (metas.healthScore.limits.prodBugs !== undefined) METRIC_TARGETS.healthScore.limits.prodBugs = metas.healthScore.limits.prodBugs;
                if (metas.healthScore.limits.leadTime !== undefined) METRIC_TARGETS.healthScore.limits.leadTime = metas.healthScore.limits.leadTime;
            }
        }

        if (metas.automacao && metas.automacao.cenariosNovos !== undefined) {
            METRIC_TARGETS.automacao.cenariosNovos.value = metas.automacao.cenariosNovos;
        }
    }

    function populateProductSelect() {
        const productSelect = document.getElementById('product-select');
        const allProducts = new Set();
        
        Object.keys(dadosRelatorio).forEach(month => {
            if (!/^\d{4}-\d{2}$/.test(month)) return;
            Object.keys(dadosRelatorio[month]).forEach(prod => allProducts.add(prod));
        });
        
        const products = Array.from(allProducts).sort();
        productSelect.innerHTML = products.map(p => `<option value="${p}">${formatProductName(p)}</option>`).join('');
        
        if (products.length > 0) {
            // Tenta iniciar com 'Policy' por padrão, se não existir, usa o primeiro da lista
            const defaultCenter = products.includes('Policy') ? 'Policy' : products[0];
            productSelect.value = defaultCenter;
            currentCenter = defaultCenter;
        }
    }
    
    // Atualizar todos os dados
    function updateAllData() {
        updateOverallHealthChart();
        updateSummaryCards();
        updateCodeCoverageChart();
        updateReworkChart();
        updateLeadTimeChart();
        updateAutomatedTestsChart();
        updateTestCasesPerUsChart();
        updateQaEfficiencyChart();
        updateSpilloverChart();
        updateConsolidatedBugsChart();
        updateTrendAnalysis();
    }
    
    // Atualizar cards de resumo
    function updateSummaryCards() {
        const months = getAvailableMonths();
        if (months.length === 0) return;
        
        const latestMonth = months[months.length - 1];
        const monthData = dadosRelatorio[latestMonth]?.[currentCenter];
        if (!monthData) return;

        const s1_cov = getSprintAverageCodeCoverage(monthData.sprint1);
        const s2_cov = getSprintAverageCodeCoverage(monthData.sprint2);
        const averageCoverage = (s1_cov > 0 && s2_cov > 0) ? (s1_cov + s2_cov) / 2 : (s1_cov || s2_cov);
        const passRate = getAverageSprintMetric(monthData, 'passRate');
        const testCoverage = getMonthTestCoverage(monthData, METRIC_TARGETS.densidadeTestes.value);
        const totalBugsNonProd = getSprintTotalNonProdBugs(monthData.sprint1) + getSprintTotalNonProdBugs(monthData.sprint2);
        const totalBugsProd = getTotalProductionBugs(monthData);
        const totalBugs = totalBugsNonProd + totalBugsProd;

        const updateCard = (elementId, value, formattedValue, target, higherIsBetter) => {
            const element = document.getElementById(elementId);
            if (!element) return;
            element.textContent = formattedValue;
            element.className = 'summary-value'; // Reseta classes anteriores

            // Define o status com base na meta (bom, neutro, ruim)
            const isGood = higherIsBetter ? value >= target : value <= target;
            const isNeutral = higherIsBetter ? value >= target * 0.9 && value < target : value <= target * 1.15 && value > target;

            if (isGood) {
                element.classList.add('trend-positive');
            } else if (isNeutral) {
                element.classList.add('trend-neutral');
            } else {
                element.classList.add('trend-negative');
            }
        };

        // Atualiza os cards com cores de status
        updateCard('pass-rate-value', passRate, passRate.toFixed(1) + '%', METRIC_TARGETS.passRate.value, true);
        updateCard('test-coverage-value', testCoverage, testCoverage.toFixed(1) + '%', METRIC_TARGETS.coberturaTestesPercentual.value, true);
        updateCard('bugs-value', totalBugs, totalBugs.toString(), METRIC_TARGETS.bugsNaoProdutivos.total.value, false);
        updateCard('coverage-value', averageCoverage, averageCoverage.toFixed(1) + '%', METRIC_TARGETS.coberturaCodigo.geral.value, true);
    }

    // Função para obter meses disponíveis ordenados
    function getAvailableMonths() {
        const months = Object.keys(dadosRelatorio).filter(month => 
            /^\d{4}-\d{2}$/.test(month) && dadosRelatorio[month][currentCenter]
        ).sort();
        
        const periodSelect = document.getElementById('period-select');
        const period = periodSelect ? periodSelect.value : '12';
        
        if (period === 'all') return months;
        return months.slice(-parseInt(period));
    }
    
    // Função para formatar mês para exibição
    function formatMonth(monthStr) {
        // Cria a data considerando o fuso horário UTC para evitar problemas de dia anterior
        const parts = monthStr.split('-');
        const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, 1));
        const month = date.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' });
        const year = date.getUTCFullYear().toString().slice(-2);
        return `${month}/${year}`;
    }

    // Gráfico de Saúde Geral
    function updateOverallHealthChart() {
        const canvas = document.getElementById('overall-health-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const months = getAvailableMonths();

        const healthScores100 = months.map(month => {
            const centerData = dadosRelatorio[month]?.[currentCenter];
            return calculateMonthHealthScore(centerData);
        });

        // Converte a pontuação para uma escala de 0-10
        const healthScores10 = healthScores100.map(score => score / 10);

        // Calcular Média Móvel (3 meses)
        const movingAverage = healthScores10.map((_, idx, arr) => {
            const window = 3;
            if (idx < window - 1) return null;
            let sum = 0;
            for (let i = 0; i < window; i++) sum += arr[idx - i];
            return sum / window;
        });

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        const lastScore100 = healthScores100[healthScores100.length - 1] || 0;
        
        const getColorStops = (score) => {
            if (score >= 80) return ['rgba(46, 204, 113, 0.8)', 'rgba(46, 204, 113, 0.05)']; // Verde
            if (score >= 60) return ['rgba(243, 156, 18, 0.8)', 'rgba(243, 156, 18, 0.05)']; // Laranja
            return ['rgba(231, 76, 60, 0.8)', 'rgba(231, 76, 60, 0.05)']; // Vermelho
        };
        const [colorStart, colorEnd] = getColorStops(lastScore100);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);

        if (overallHealthChart) {
            overallHealthChart.data.labels = months.map(formatMonth);
            overallHealthChart.data.datasets[0].data = healthScores10;
            overallHealthChart.data.datasets[0].borderColor = colorStart.replace('0.6', '1');
            overallHealthChart.data.datasets[0].backgroundColor = gradient;
            
            if (overallHealthChart.data.datasets[1]) {
                overallHealthChart.data.datasets[1].data = movingAverage;
            }
            
            overallHealthChart.options.plugins.title.text = `Índice de Qualidade Geral - ${formatProductName(currentCenter)}`;
            overallHealthChart.update();
            return;
        }

        overallHealthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months.map(formatMonth),
                datasets: [{
                    label: 'Índice de Qualidade Geral',
                    data: healthScores10,
                    borderColor: colorStart.replace('0.6', '1'),
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                }, {
                    label: 'Tendência (Média Móvel 3m)',
                    data: movingAverage,
                    borderColor: 'rgba(88, 89, 91, 0.5)', // Sura Gray com transparência
                    borderDash: [5, 5],
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                layout: { padding: { top: 25 } },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 10, title: { display: true, text: 'Pontuação (0-10)', font: { weight: 'bold', size: 14 } }, grid: { borderDash: [5, 5], color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: `Índice de Qualidade Geral - ${formatProductName(currentCenter)}`,
                        font: { size: 20 } // Mantém destaque extra para o gráfico principal
                    },
                    datalabels: {
                        align: 'end',
                        anchor: 'end',
                        backgroundColor: (context) => context.dataset.borderColor,
                        borderRadius: 4,
                        color: 'white',
                        font: { weight: 'bold', size: 13 },
                        formatter: (value) => value.toFixed(1),
                        offset: 4,
                        padding: 6,
                    }
                }
            }
        });
    }

    // Gráfico de cobertura de código
    function updateCodeCoverageChart() {
        const canvas = document.getElementById('code-coverage-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const months = getAvailableMonths();
        
        const GOAL = METRIC_TARGETS.coberturaCodigo.geral.value;
        const averageCoverageData = [];
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(0, 51, 160, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 51, 160, 0.0)');

        months.forEach(month => {
            const centerData = dadosRelatorio[month]?.[currentCenter];
            const s1_cov = getSprintAverageCodeCoverage(centerData?.sprint1);
            const s2_cov = getSprintAverageCodeCoverage(centerData?.sprint2);
            const avg = (s1_cov > 0 && s2_cov > 0) ? (s1_cov + s2_cov) / 2 : (s1_cov || s2_cov);
            averageCoverageData.push(avg);
        });
        
        const datasets = [
            {
                label: 'Cobertura Média',
                data: averageCoverageData,
                borderColor: 'rgba(0, 51, 160, 1)', // Sura Blue
                backgroundColor: gradient,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
            },
            {
                label: `Meta (${GOAL}%)`,
                data: Array(months.length).fill(GOAL),
                borderColor: 'rgba(0, 167, 157, 1)', // Sura Green
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                borderWidth: 2,
            }
        ];

        if (codeCoverageChart) {
            codeCoverageChart.data.labels = months.map(formatMonth);
            codeCoverageChart.data.datasets = datasets;
            codeCoverageChart.update();
            return;
        }

        codeCoverageChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months.map(formatMonth),
                datasets: datasets
            },
            options: {
                layout: { padding: { top: 25 } },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Cobertura (%)',
                            font: { weight: 'bold', size: 14 }
                        },
                        grid: { borderDash: [5, 5], color: 'rgba(0,0,0,0.05)' }
                    },
                    x: { grid: { display: false } }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Evolução da Cobertura Geral de Código',
                        font: { size: 18 }
                    },
                    datalabels: {
                        display: (context) => {
                            // Apenas no dataset de 'Cobertura Média' e no último ponto
                            return context.dataset.label === 'Cobertura Média' && context.dataIndex === context.dataset.data.length - 1;
                        },
                        align: 'end',
                        anchor: 'end',
                        backgroundColor: (context) => context.dataset.borderColor,
                        borderRadius: 4,
                        color: 'white',
                        font: { weight: 'bold', size: 12 },
                        padding: 4,
                        offset: 4,
                        formatter: (value) => value.toFixed(1) + '%'
                    }
                }
            }
        });
    }
    
    // Gráfico de lead time
    function updateLeadTimeChart() {
        const canvas = document.getElementById('leadtime-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const months = getAvailableMonths();
        
        // Preparar dados para lead time de testes e bugs
        const leadTimeTestesData = [];
        const leadTimeBugsData = [];
        const monthLabels = [];
        
        months.forEach(month => {
            const centerData = dadosRelatorio[month]?.[currentCenter];
            
            leadTimeTestesData.push(getAverageSprintMetric(centerData, 'leadTimeTestes'));
            leadTimeBugsData.push(getAverageSprintMetric(centerData, 'leadTimeBugs'));
            monthLabels.push(formatMonth(month));
        });
        
        // Criar gradientes para o gráfico
        const gradientTestes = ctx.createLinearGradient(0, 0, 0, 400);
        gradientTestes.addColorStop(0, 'rgba(52, 152, 219, 0.5)');
        gradientTestes.addColorStop(1, 'rgba(52, 152, 219, 0.0)');
        
        const gradientBugs = ctx.createLinearGradient(0, 0, 0, 400);
        gradientBugs.addColorStop(0, 'rgba(231, 76, 60, 0.5)');
        gradientBugs.addColorStop(1, 'rgba(231, 76, 60, 0.0)');

        if (leadTimeChart) {
            leadTimeChart.data.labels = monthLabels;
            leadTimeChart.data.datasets[0].data = leadTimeTestesData;
            leadTimeChart.data.datasets[1].data = leadTimeBugsData;
            leadTimeChart.update();
            return;
        }

        leadTimeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthLabels,
                datasets: [
                    {
                        label: 'Lead Time de Testes',
                        data: leadTimeTestesData,
                        backgroundColor: gradientTestes,
                        borderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                        pointRadius: 6,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Lead Time de Bugs',
                        data: leadTimeBugsData,
                        backgroundColor: gradientBugs,
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: 'rgba(231, 76, 60, 1)',
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }
                ]
            },
            options: {
                layout: { padding: { top: 25 } },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Dias',
                            font: {
                                size: 15,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            font: {
                                size: 13
                            }
                        },
                        grid: { borderDash: [5, 5], color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        ticks: {
                            font: { size: 13 }
                        },
                        grid: { display: false }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Evolução do Lead Time (em dias)',
                        font: { size: 18 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#333',
                        bodyColor: '#333',
                        borderColor: '#ddd',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                let value = context.raw;
                                let label = context.dataset.label || '';
                                
                                if (label) {
                                    label += ': ';
                                }
                                
                                label += value.toFixed(1) + ' dias';
                                return label;
                            }
                        }
                    },
                    datalabels: {
                        display: function(context) {
                            // Mostrar apenas o último valor de cada série
                            return context.dataIndex === context.dataset.data.length - 1;
                        },
                        backgroundColor: function(context) {
                            return context.dataset.borderColor;
                        },
                        borderRadius: 4,
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 12
                        },
                        padding: 6,
                        offset: 4,
                        formatter: function(value) {
                            return value.toFixed(1) + 'd';
                        }
                    }
                }
            }
        });
    }

    // Gráfico de Retrabalho (Rework)
    function updateReworkChart() {
        const canvas = document.getElementById('rework-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const months = getAvailableMonths();

        let totalProd = 0;
        let totalNonProd = 0;

        months.forEach(month => {
            const centerData = dadosRelatorio[month]?.[currentCenter];
            if (centerData) {
                const s1 = centerData.sprint1 || {};
                const s2 = centerData.sprint2 || {};
                totalProd += (s1.reexecucaoBugsProd || 0) + (s2.reexecucaoBugsProd || 0);
                totalNonProd += (s1.reexecucaoBugsNaoProd || 0) + (s2.reexecucaoBugsNaoProd || 0);
            }
        });

        if (reworkChart) {
            reworkChart.data.datasets[0].data = [totalProd, totalNonProd];
            reworkChart.update();
            return;
        }

        reworkChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Reexecução (Prod)', 'Reexecução (Não-Prod)'],
                datasets: [{
                    data: [totalProd, totalNonProd],
                    backgroundColor: [
                        '#0033A0', // Sura Blue
                        '#00A79D'  // Sura Green
                    ],
                    borderColor: [
                        '#ffffff',
                        '#ffffff'
                    ],
                    borderWidth: 3,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '50%',
                plugins: {
                    title: { display: true, text: 'Volume de Retrabalho (Total Acumulado)' },
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold', size: 14 },
                        formatter: (value, ctx) => {
                            if (value === 0) return '';
                            const dataArr = ctx.chart.data.datasets[0].data;
                            const sum = dataArr.reduce((a, b) => a + b, 0);
                            const percentage = (value * 100 / sum).toFixed(1) + "%";
                            return `${value}\n(${percentage})`;
                        },
                        textAlign: 'center'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Gráfico de Testes Automatizados
    function updateAutomatedTestsChart() {
        const canvas = document.getElementById('automated-tests-chart');
        if (!canvas) {
            // Se o canvas não for encontrado, exibe um erro no console e para a função
            // para não quebrar o resto da página.
            return;
        }
        const ctx = canvas.getContext('2d');
        const months = getAvailableMonths();

        const automatedTestsData = [];
        let cumulativeTotal = 0;

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(0, 167, 157, 0.5)'); // Sura Green
        gradient.addColorStop(1, 'rgba(0, 167, 157, 0.0)');

        months.forEach(month => {
            const centerData = dadosRelatorio[month]?.[currentCenter];
            let monthlyAdded = 0;

            if (centerData) {
                const s1 = centerData.sprint1 || {};
                const s2 = centerData.sprint2 || {};
                // CORREÇÃO: Acessa a propriedade 'cenarios' dentro do objeto 'testesAutomatizados'
                monthlyAdded = (s1.testesAutomatizados?.cenarios || 0) + (s2.testesAutomatizados?.cenarios || 0);
            }
            cumulativeTotal += monthlyAdded;
            automatedTestsData.push(cumulativeTotal);
        });

        if (automatedTestsChart) {
            automatedTestsChart.data.labels = months.map(formatMonth);
            automatedTestsChart.data.datasets[0].data = automatedTestsData;
            automatedTestsChart.update();
            return;
        }

        automatedTestsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months.map(formatMonth),
                datasets: [{
                    label: 'Total Acumulado de Testes Automatizados',
                    data: automatedTestsData,
                    borderColor: 'rgba(0, 167, 157, 1)',
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                }]
            },
            options: {
                layout: { padding: { top: 25 } },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Quantidade de Testes', font: { weight: 'bold', size: 14 } },
                        grid: { borderDash: [5, 5], color: 'rgba(0,0,0,0.05)' }
                    },
                    x: { grid: { display: false } }
                },
                plugins: {
                    title: { display: true, text: 'Evolução de Testes Automatizados', font: { size: 18 } },
                    datalabels: {
                        align: 'end',
                        anchor: 'end',
                        backgroundColor: (context) => context.dataset.borderColor,
                        borderRadius: 4,
                        color: 'white',
                        font: { weight: 'bold', size: 12 },
                        padding: 6,
                        offset: 4,
                        formatter: (value) => value > 0 ? value : ''
                    }
                }
            }
        });
    }

    // Gráfico de Média de Casos de Teste por US
    function updateTestCasesPerUsChart() {
        const canvas = document.getElementById('test-cases-per-us-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const months = getAvailableMonths();
        const TARGET = METRIC_TARGETS.densidadeTestes.value;

        const avgData = [];

        months.forEach(month => {
            const centerData = dadosRelatorio[month]?.[currentCenter];
            let totalUS = 0;
            let totalCTs = 0;

            if (centerData) {
                const s1 = centerData.sprint1 || {};
                const s2 = centerData.sprint2 || {};
                
                totalUS = (s1.usSprint || 0) + (s2.usSprint || 0);
                totalCTs = (s1.casosTestePorUs || 0) + (s2.casosTestePorUs || 0);
            }

            const avg = totalUS > 0 ? (totalCTs / totalUS) : 0;
            avgData.push(avg);
        });

        if (testCasesPerUsChart) {
            testCasesPerUsChart.data.labels = months.map(formatMonth);
            testCasesPerUsChart.data.datasets[0].data = avgData;
            testCasesPerUsChart.data.datasets[1].data = Array(months.length).fill(TARGET);
            testCasesPerUsChart.update();
            return;
        }

        const gradCTs = ctx.createLinearGradient(0, 0, 0, 300);
        gradCTs.addColorStop(0, '#9b59b6'); gradCTs.addColorStop(1, '#8e44ad');

        testCasesPerUsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months.map(formatMonth),
                datasets: [{
                    label: 'Média de CTs por US',
                    data: avgData,
                    backgroundColor: gradCTs,
                    borderRadius: 4,
                    barPercentage: 0.6,
                    order: 2
                }, {
                    type: 'line',
                    label: `Meta (${TARGET})`,
                    data: Array(months.length).fill(TARGET),
                    borderColor: 'rgba(0, 167, 157, 1)', // Sura Green
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    order: 1
                }]
            },
            options: {
                layout: { padding: { top: 25 } },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'CTs / US', font: { weight: 'bold', size: 14 } },
                        grid: { borderDash: [5, 5], color: 'rgba(0,0,0,0.05)' }
                    },
                    x: { grid: { display: false } }
                },
                plugins: {
                    title: { display: true, text: 'Densidade de Testes (CTs por História)', font: { size: 18 } },
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        color: '#555',
                        font: { weight: 'bold', size: 12 },
                        formatter: (value, context) => context.datasetIndex === 0 && value > 0 ? value.toFixed(1) : ''
                    },
                    legend: { 
                        display: true,
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Gráfico de Eficiência do QA
    function updateQaEfficiencyChart() {
        const canvas = document.getElementById('qa-efficiency-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const months = getAvailableMonths();

        const escritaData = [];
        const execucaoData = [];
        const reexecucaoData = [];

        months.forEach(month => {
            const centerData = dadosRelatorio[month]?.[currentCenter];
            let escrita = 0, execucao = 0, reexecucao = 0;

            if (centerData) {
                const s1 = centerData.sprint1?.eficiencia || { escrita: 0, execucao: 0, reexecucao: 0 };
                const s2 = centerData.sprint2?.eficiencia || { escrita: 0, execucao: 0, reexecucao: 0 };
                
                escrita = (s1.escrita + s2.escrita) / 2;
                execucao = (s1.execucao + s2.execucao) / 2;
                reexecucao = (s1.reexecucao + s2.reexecucao) / 2;
            }
            escritaData.push(escrita);
            execucaoData.push(execucao);
            reexecucaoData.push(reexecucao);
        });

        if (qaEfficiencyChart) {
            qaEfficiencyChart.data.labels = months.map(formatMonth);
            qaEfficiencyChart.data.datasets[0].data = escritaData;
            qaEfficiencyChart.data.datasets[1].data = execucaoData;
            qaEfficiencyChart.data.datasets[2].data = reexecucaoData;
            qaEfficiencyChart.update();
            return;
        }

        const gradEscrita = ctx.createLinearGradient(0, 0, 0, 300);
        gradEscrita.addColorStop(0, '#3498db'); gradEscrita.addColorStop(1, '#2980b9');

        const gradExec = ctx.createLinearGradient(0, 0, 0, 300);
        gradExec.addColorStop(0, '#2ecc71'); gradExec.addColorStop(1, '#27ae60');

        const gradReexec = ctx.createLinearGradient(0, 0, 0, 300);
        gradReexec.addColorStop(0, '#e67e22'); gradReexec.addColorStop(1, '#d35400');

        qaEfficiencyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months.map(formatMonth),
                datasets: [
                    { label: 'Escrita (Meta: 7\')', data: escritaData, backgroundColor: gradEscrita, borderRadius: 4, barPercentage: 0.6 },
                    { label: 'Execução (Meta: 7\')', data: execucaoData, backgroundColor: gradExec, borderRadius: 4, barPercentage: 0.6 },
                    { label: 'Reexecução (Meta: 5\')', data: reexecucaoData, backgroundColor: gradReexec, borderRadius: 4, barPercentage: 0.6 }
                ]
            },
            options: {
                layout: { padding: { top: 25 } },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Minutos', font: { weight: 'bold', size: 14 } }, grid: { borderDash: [5, 5], color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    title: { display: true, text: 'Eficiência QA (Tempos Médios)', font: { size: 18 } },
                    datalabels: {
                        anchor: 'end', align: 'top', color: '#555', font: { weight: 'bold', size: 11 },
                        formatter: (value) => value > 0 ? value.toFixed(1) : ''
                    }
                }
            }
        });
    }

    // Gráfico de Transbordo (Spillover)
    function updateSpilloverChart() {
        // Tenta encontrar o canvas, se não existir, cria dinamicamente na seção de gráficos
        let canvas = document.getElementById('spillover-chart');
        if (!canvas) {
            const chartsSection = document.querySelector('.charts-section');
            if (chartsSection) {
                const container = document.createElement('div');
                container.className = 'chart-container';
                // Estilos inline para garantir consistência visual
                container.style.backgroundColor = '#fff';
                container.style.borderRadius = '8px';
                container.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                container.style.padding = '15px';
                container.style.margin = '10px';
                container.style.minHeight = '300px';
                container.style.flex = '1 1 45%'; // Tenta ocupar metade da largura em layouts flex

                canvas = document.createElement('canvas');
                canvas.id = 'spillover-chart';
                
                container.appendChild(canvas);
                chartsSection.appendChild(container);
            } else {
                return; // Não foi possível encontrar onde inserir
            }
        }

        const ctx = canvas.getContext('2d');
        const monthsToDisplay = getAvailableMonths();
        const allMonths = Object.keys(dadosRelatorio).filter(m => /^\d{4}-\d{2}$/.test(m)).sort();
        
        const spilloverData = [];
        const seenUS = new Set();

        // Itera sobre todo o histórico para construir o conjunto de US vistas corretamente
        allMonths.forEach(month => {
            const centerData = dadosRelatorio[month]?.[currentCenter];
            let monthlySpillover = 0;

            if (centerData) {
                const checkSprint = (sprint) => {
                    if (sprint && sprint.listaUserStories) {
                        sprint.listaUserStories.forEach(us => {
                            if (us.nome) {
                                const id = String(us.nome).trim();
                                if (seenUS.has(id)) {
                                    monthlySpillover++;
                                } else {
                                    seenUS.add(id);
                                }
                            }
                        });
                    }
                };
                checkSprint(centerData.sprint1);
                checkSprint(centerData.sprint2);
            }

            // Só adiciona aos dados do gráfico se o mês estiver na visualização atual
            if (monthsToDisplay.includes(month)) {
                spilloverData.push(monthlySpillover);
            }
        });

        if (spilloverChart) {
            spilloverChart.data.labels = monthsToDisplay.map(formatMonth);
            spilloverChart.data.datasets[0].data = spilloverData;
            spilloverChart.update();
            return;
        }

        const gradSpill = ctx.createLinearGradient(0, 0, 0, 300);
        gradSpill.addColorStop(0, '#e67e22'); gradSpill.addColorStop(1, '#d35400');

        spilloverChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthsToDisplay.map(formatMonth),
                datasets: [{
                    label: 'User Stories Recorrentes (Transbordo)',
                    data: spilloverData,
                    backgroundColor: gradSpill,
                    borderRadius: 4,
                    barPercentage: 0.5
                }]
            },
            options: {
                layout: { padding: { top: 25 } },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Qtd. US', font: { weight: 'bold', size: 14 } },
                        grid: { borderDash: [5, 5], color: 'rgba(0,0,0,0.05)' },
                        ticks: { stepSize: 1 }
                    },
                    x: { grid: { display: false } }
                },
                plugins: {
                    title: { display: true, text: 'Volume de Transbordo (Spillover)', font: { size: 18 } },
                    datalabels: {
                        anchor: 'end', align: 'top', color: '#555', font: { weight: 'bold', size: 12 },
                        formatter: (value) => value > 0 ? value : ''
                    },
                    legend: { display: true, position: 'bottom' }
                }
            }
        });
    }

    // Gráfico Consolidado de Bugs (Volume e Criticidade)
    function updateConsolidatedBugsChart() {
        // 1. Ocultar gráficos antigos se existirem
        ['bugs-chart', 'bugs-severity-chart'].forEach(id => {
            const oldCanvas = document.getElementById(id);
            if (oldCanvas) {
                const container = oldCanvas.closest('.chart-container') || oldCanvas.parentElement;
                if (container) container.style.display = 'none';
            }
        });

        // 2. Criar ou obter o novo gráfico
        let canvas = document.getElementById('consolidated-bugs-chart');
        if (!canvas) {
            const chartsSection = document.querySelector('.charts-section');
            if (chartsSection) {
                const container = document.createElement('div');
                container.className = 'chart-container';
                container.style.backgroundColor = '#fff';
                container.style.borderRadius = '8px';
                container.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                container.style.padding = '15px';
                container.style.margin = '10px';
                container.style.minHeight = '300px';
                container.style.flex = '1 1 45%';

                canvas = document.createElement('canvas');
                canvas.id = 'consolidated-bugs-chart';
                
                container.appendChild(canvas);
                chartsSection.appendChild(container);
            } else {
                return;
            }
        }

        const ctx = canvas.getContext('2d');
        const months = getAvailableMonths();

        const lowData = [];
        const mediumData = [];
        const highData = [];

        months.forEach(month => {
            const centerData = dadosRelatorio[month]?.[currentCenter];
            let low = 0, medium = 0, high = 0;

            if (centerData) {
                const prodBugs = getProductionBugsObject(centerData);

                low = prodBugs.baixa;
                medium = prodBugs.media;
                high = prodBugs.alta;
            }
            lowData.push(low);
            mediumData.push(medium);
            highData.push(high);
        });

        if (consolidatedBugsChart) {
            consolidatedBugsChart.data.labels = months.map(formatMonth);
            consolidatedBugsChart.data.datasets[0].data = lowData;
            consolidatedBugsChart.data.datasets[1].data = mediumData;
            consolidatedBugsChart.data.datasets[2].data = highData;
            consolidatedBugsChart.update();
            return;
        }

        const gradLow = ctx.createLinearGradient(0, 0, 0, 400); gradLow.addColorStop(0, '#2ecc71'); gradLow.addColorStop(1, '#27ae60');
        const gradMed = ctx.createLinearGradient(0, 0, 0, 400); gradMed.addColorStop(0, '#f1c40f'); gradMed.addColorStop(1, '#f39c12');
        const gradHigh = ctx.createLinearGradient(0, 0, 0, 400); gradHigh.addColorStop(0, '#e74c3c'); gradHigh.addColorStop(1, '#c0392b');

        consolidatedBugsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months.map(formatMonth),
                datasets: [
                    { label: 'Baixa', data: lowData, backgroundColor: gradLow, borderRadius: 4, stack: 'stack0' },
                    { label: 'Média', data: mediumData, backgroundColor: gradMed, borderRadius: 4, stack: 'stack0' },
                    { label: 'Alta', data: highData, backgroundColor: gradHigh, borderRadius: 4, stack: 'stack0' }
                ]
            },
            options: {
                layout: { padding: { top: 20 } },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Volume Total' }, grid: { borderDash: [5, 5], color: 'rgba(0,0,0,0.05)' } }
                },
                plugins: {
                    title: { display: true, text: 'Evolução de Volume e Criticidade de Bugs (Produção)' },
                    datalabels: { color: 'white', font: { weight: 'bold', size: 11 }, formatter: (value) => value > 0 ? value : '' }
                }
            }
        });
    }

    // Atualizar a análise de tendências
    function updateTrendAnalysis() {
        const months = getAvailableMonths();
        if (months.length < 2) {
            document.getElementById('trend-table-body').innerHTML = '<tr><td colspan="5">Não há dados suficientes para análise de tendências</td></tr>';
            currentTrendMetrics = [];
            return;
        }
        
        const currentMonthData = dadosRelatorio[months[months.length - 1]]?.[currentCenter];
        const previousMonthData = dadosRelatorio[months[months.length - 2]]?.[currentCenter];
        if (!currentMonthData || !previousMonthData) return;
        
        
        // Métricas para análise
        const metrics = [
            {
                name: 'Índice de Qualidade',
                getCurrentValue: () => calculateMonthHealthScore(currentMonthData) / 10,
                getPreviousValue: () => calculateMonthHealthScore(previousMonthData) / 10,
                format: value => value.toFixed(1) + ' / 10',
                isPositiveIncrease: true,
                target: METRIC_TARGETS.healthScore.target
            },
            {
                name: 'Cobertura de Código (média)',
                getCurrentValue: () => {
                    const s1 = getSprintAverageCodeCoverage(currentMonthData.sprint1);
                    const s2 = getSprintAverageCodeCoverage(currentMonthData.sprint2);
                    return (s1 > 0 && s2 > 0) ? (s1 + s2) / 2 : (s1 || s2);
                },
                getPreviousValue: () => {
                    const s1 = getSprintAverageCodeCoverage(previousMonthData.sprint1);
                    const s2 = getSprintAverageCodeCoverage(previousMonthData.sprint2);
                    return (s1 > 0 && s2 > 0) ? (s1 + s2) / 2 : (s1 || s2);
                },
                format: value => value.toFixed(1) + '%',
                isPositiveIncrease: true,
                target: METRIC_TARGETS.coberturaCodigo.geral.value
            },
            {
                name: 'Pass Rate (média)',
                getCurrentValue: () => getAverageSprintMetric(currentMonthData, 'passRate'),
                getPreviousValue: () => getAverageSprintMetric(previousMonthData, 'passRate'),
                format: value => value.toFixed(1) + '%',
                isPositiveIncrease: true,
                target: METRIC_TARGETS.passRate.value
            },
            {
                name: 'Bugs Não Produtivos (total)',
                getCurrentValue: () => getSprintTotalNonProdBugs(currentMonthData.sprint1) + getSprintTotalNonProdBugs(currentMonthData.sprint2),
                getPreviousValue: () => getSprintTotalNonProdBugs(previousMonthData.sprint1) + getSprintTotalNonProdBugs(previousMonthData.sprint2),
                format: value => value,
                isPositiveIncrease: false,
                target: METRIC_TARGETS.bugsNaoProdutivos.total.value
            },
            {
                name: 'Bugs em Produção (total)',
                getCurrentValue: () => getTotalProductionBugs(currentMonthData),
                getPreviousValue: () => getTotalProductionBugs(previousMonthData),
                format: value => value,
                isPositiveIncrease: false,
                target: METRIC_TARGETS.bugsProducao.total.value
            },
            {
                name: 'Cobertura de Testes (média)',
                getCurrentValue: () => getMonthTestCoverage(currentMonthData, METRIC_TARGETS.densidadeTestes.value),
                getPreviousValue: () => getMonthTestCoverage(previousMonthData, METRIC_TARGETS.densidadeTestes.value),
                format: value => value.toFixed(1) + '%',
                isPositiveIncrease: true,
                target: METRIC_TARGETS.coberturaTestesPercentual.value
            },
            {
                name: 'Lead Time de Testes (média)',
                getCurrentValue: () => getAverageSprintMetric(currentMonthData, 'leadTimeTestes'),
                getPreviousValue: () => getAverageSprintMetric(previousMonthData, 'leadTimeTestes'),
                format: value => value.toFixed(1) + ' dias',
                isPositiveIncrease: false,
                target: METRIC_TARGETS.leadTimeTestes.value
            },
            {
                name: 'Lead Time de Bugs (média)',
                getCurrentValue: () => getAverageSprintMetric(currentMonthData, 'leadTimeBugs'),
                getPreviousValue: () => getAverageSprintMetric(previousMonthData, 'leadTimeBugs'),
                format: value => value.toFixed(1) + ' dias',
                isPositiveIncrease: false,
                target: METRIC_TARGETS.leadTimeBugs.value
            },
            {
                name: 'Retrabalho (Bugs Reexecutados)',
                getCurrentValue: () => {
                    const s1 = currentMonthData.sprint1 || {};
                    const s2 = currentMonthData.sprint2 || {};
                    return (s1.reexecucaoBugsNaoProd || 0) + (s1.reexecucaoBugsProd || 0) + (s2.reexecucaoBugsNaoProd || 0) + (s2.reexecucaoBugsProd || 0);
                },
                getPreviousValue: () => {
                    const s1 = previousMonthData.sprint1 || {};
                    const s2 = previousMonthData.sprint2 || {};
                    return (s1.reexecucaoBugsNaoProd || 0) + (s1.reexecucaoBugsProd || 0) + (s2.reexecucaoBugsNaoProd || 0) + (s2.reexecucaoBugsProd || 0);
                },
                format: value => value,
                isPositiveIncrease: false,
                target: 0
            },
            {
                name: 'Novos Cenários Automatizados',
                getCurrentValue: () => (currentMonthData.sprint1?.testesAutomatizados?.cenarios || 0) + (currentMonthData.sprint2?.testesAutomatizados?.cenarios || 0),
                getPreviousValue: () => (previousMonthData.sprint1?.testesAutomatizados?.cenarios || 0) + (previousMonthData.sprint2?.testesAutomatizados?.cenarios || 0),
                format: value => value,
                isPositiveIncrease: true,
                target: METRIC_TARGETS.automacao.cenariosNovos.value
            }
        ];
        
        // Calcular métricas e armazenar para ordenação
        currentTrendMetrics = metrics.map(metric => {
            const currentValue = metric.getCurrentValue();
            const previousValue = metric.getPreviousValue();
            const difference = currentValue - previousValue;
            const percentChange = previousValue !== 0 ? (difference / previousValue) * 100 : (currentValue > 0 ? 100 : 0);
            
            let trendClass, trendArrow, statusClass, statusText;
            if (metric.isPositiveIncrease) {
                trendClass = difference > 0 ? 'trend-positive' : difference < 0 ? 'trend-negative' : 'trend-neutral';
                trendArrow = difference > 0 ? '↑' : difference < 0 ? '↓' : '→';
                
                // Status baseado na meta
                if (currentValue >= metric.target) {
                    statusClass = 'badge-positive';
                    statusText = 'Atingido';
                } else if (currentValue >= metric.target * 0.9) {
                    statusClass = 'badge-neutral';
                    statusText = 'Próximo';
                } else {
                    statusClass = 'badge-negative';
                    statusText = 'Abaixo';
                }
            } else {
                trendClass = difference < 0 ? 'trend-positive' : difference > 0 ? 'trend-negative' : 'trend-neutral';
                trendArrow = difference < 0 ? '↓' : difference > 0 ? '↑' : '→';
                
                // Status baseado na meta (para métricas onde menor é melhor)
                if (currentValue <= metric.target) {
                    statusClass = 'badge-positive';
                    statusText = 'Atingido';
                } else if (currentValue <= metric.target * 1.1) {
                    statusClass = 'badge-neutral';
                    statusText = 'Próximo';
                } else {
                    statusClass = 'badge-negative';
                    statusText = 'Acima';
                }
            }
            
            return {
                name: metric.name,
                prev: previousValue,
                curr: currentValue,
                prevFmt: metric.format(previousValue),
                currFmt: metric.format(currentValue),
                change: percentChange,
                trendClass,
                trendArrow,
                statusClass,
                statusText,
                rowClass: statusClass.replace('badge-', 'status-'),
                targetFmt: metric.format(metric.target)
            };
        });

        renderTrendTable();
    }

    function renderTrendTable() {
        // Injeta a coluna de Meta no cabeçalho se não existir
        const headerRow = document.querySelector('.trend-table thead tr');
        if (headerRow && headerRow.children.length === 5) {
            const metaTh = document.createElement('th');
            metaTh.textContent = 'Meta';
            headerRow.insertBefore(metaTh, headerRow.lastElementChild);
        }

        const tableBody = document.getElementById('trend-table-body');
        tableBody.innerHTML = '';

        let data = [...currentTrendMetrics];

        if (currentSort.column) {
            data.sort((a, b) => {
                let valA, valB;
                switch (currentSort.column) {
                    case 'name': valA = a.name; valB = b.name; break;
                    case 'prev': valA = a.prev; valB = b.prev; break;
                    case 'curr': valA = a.curr; valB = b.curr; break;
                    case 'change': valA = a.change; valB = b.change; break;
                    case 'status': valA = a.statusText; valB = b.statusText; break;
                }
                
                if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
                if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        data.forEach(item => {
            const row = document.createElement('tr');
            row.className = item.rowClass;
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.prevFmt}</td>
                <td>${item.currFmt}</td>
                <td class="${item.trendClass}">${item.change >= 0 ? '+' : ''}${item.change.toFixed(1)}% ${item.trendArrow}</td>
                <td style="font-weight: bold; color: #555;">${item.targetFmt}</td>
                <td><span class="metric-badge ${item.statusClass}">${item.statusText}</span></td>
            `;
            tableBody.appendChild(row);
        });
        
        // Atualizar ícones de ordenação
        document.querySelectorAll('.trend-table th[data-sort]').forEach(th => {
            const existingIcon = th.querySelector('.sort-icon');
            if (existingIcon) existingIcon.remove();
            
            if (th.dataset.sort === currentSort.column) {
                const icon = document.createElement('span');
                icon.className = 'sort-icon';
                icon.textContent = currentSort.direction === 'asc' ? ' ▲' : ' ▼';
                icon.style.fontSize = '0.8em';
                icon.style.marginLeft = '5px';
                th.appendChild(icon);
            }
        });
    }
    
    // Função para salvar o relatório como PDF
    async function saveToPDF() {
        const { jsPDF } = window.jspdf;
        const element = document.getElementById('comparison-container');
        const productSelect = document.getElementById('product-select');
        
        alert('Preparando PDF para todos os centers... Isso pode levar alguns segundos.');

        const originalCenter = currentCenter;
        const pdf = new jsPDF('p', 'mm', 'a4');

        // --- INÍCIO: Criar Capa ---
        const logoImg = document.getElementById('company-logo');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const today = new Date();
        const formattedDate = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        const months = getAvailableMonths();
        let periodText = 'Análise de Tendências';
        if (months.length > 0) {
            const firstMonth = formatMonth(months[0]);
            const lastMonth = formatMonth(months[months.length - 1]);
            periodText = months.length > 1 ? `Período de Análise: ${firstMonth} a ${lastMonth}` : `Mês de Análise: ${firstMonth}`;
        }

        // Adicionar logo
        if (logoImg && logoImg.complete && logoImg.naturalHeight !== 0) {
            pdf.addImage(logoImg, 'PNG', (pdfWidth / 2) - 30, 40, 60, 24);
        }

        // Adicionar Título, Período e Data
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor('#0033A0'); // Sura Blue
        pdf.text('Análise de Tendências de Qualidade', pdfWidth / 2, 85, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(16);
        pdf.setTextColor('#58595B'); // Sura Gray
        pdf.text(periodText, pdfWidth / 2, 100, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text(`Gerado em: ${formattedDate}`, pdfWidth / 2, pdfHeight - 30, { align: 'center' });
        // --- FIM: Criar Capa ---

        try {
            const firstMonthKey = Object.keys(dadosRelatorio).find(k => k !== 'historico');
            if (!firstMonthKey) {
                alert('Não há dados para gerar o PDF.');
                return;
            }
            const centerKeys = Object.keys(dadosRelatorio[firstMonthKey]).sort();

            for (let i = 0; i < centerKeys.length; i++) {
                const centerKey = centerKeys[i];

                // Adiciona uma nova página para cada center, pois a primeira página é a capa.
                pdf.addPage();

                // Atualiza a UI para o center atual
                currentCenter = centerKey;
                productSelect.value = centerKey;
                updateAllData();

                // Aguarda a renderização dos gráficos
                await new Promise(resolve => setTimeout(resolve, 500));

                // --- ESTRATÉGIA DE CAPTURA FRAGMENTADA ---
                // Captura a parte principal (Gráficos) e a tabela de tendências separadamente
                // para evitar quebras de layout e permitir ajuste de escala para caber em uma página.

                const trendSection = document.getElementById('trend-analysis-section');
                const chartsSection = document.querySelector('.charts-section');

                const originalTrendDisplay = trendSection.style.display;
                const originalChartsDisplay = chartsSection.style.display;

                // Oculta seções para capturar apenas o topo (Header, Health, Cards)
                trendSection.style.display = 'none';
                chartsSection.style.display = 'none';

                // 1. Captura do Topo
                const topCanvas = await html2canvas(element, {
                    scale: 1.5, // Reduzido para otimizar memória
                    useCORS: true,
                    logging: false,
                    onclone: (doc) => {
                        if (doc.defaultView.Chart) doc.defaultView.Chart.defaults.animation = false;

                        const header = doc.querySelector('header');
                        if (header) header.style.display = 'none';
                        const controls = doc.querySelector('.controls');
                        if (controls) controls.style.display = 'none';
                        
                        // Garante ocultação no clone
                        const cloneTrend = doc.getElementById('trend-analysis-section');
                        if (cloneTrend) cloneTrend.style.display = 'none';
                        const cloneCharts = doc.querySelector('.charts-section');
                        if (cloneCharts) cloneCharts.style.display = 'none';

                        const clonedContainer = doc.getElementById('comparison-container');
                        if (clonedContainer) {
                            clonedContainer.style.boxShadow = 'none';
                            clonedContainer.style.border = 'none';
                            clonedContainer.style.backgroundColor = 'white'; // Garante fundo branco
                            clonedContainer.style.padding = '10px';
                            clonedContainer.style.height = 'auto'; // Remove altura fixa se houver
                            clonedContainer.style.minHeight = '0';

                            // Adiciona um título customizado para a página do PDF
                            const centerName = formatProductName(centerKey);
                            const pdfTitle = doc.createElement('div');
                            pdfTitle.innerHTML = `<h1 style="text-align: center; color: #0033A0; margin-bottom: 10px; font-size: 16px;">Análise de Tendências - ${centerName}</h1>`;
                            clonedContainer.prepend(pdfTitle);
                        }
                    }
                });

                // Restaura visibilidade para capturar as outras partes
                trendSection.style.display = originalTrendDisplay;
                chartsSection.style.display = originalChartsDisplay;

                // 2. Captura da Tabela de Tendências
                const trendCanvas = await html2canvas(trendSection, {
                    scale: 1.5, // Reduzido para otimizar memória
                    useCORS: true,
                    logging: false,
                    onclone: (doc) => {
                        const cloneTrend = doc.getElementById('trend-analysis-section');
                        if (cloneTrend) {
                            cloneTrend.style.margin = '0';
                            cloneTrend.style.padding = '10px';
                            cloneTrend.style.boxShadow = 'none';
                            cloneTrend.style.border = '1px solid #eee';
                            cloneTrend.style.backgroundColor = 'white';
                        }
                    }
                });

                // 3. Captura dos Gráficos
                const chartsCanvas = await html2canvas(chartsSection, {
                    scale: 1.5,
                    useCORS: true,
                    logging: false,
                    onclone: (doc) => {
                        const cloneCharts = doc.querySelector('.charts-section');
                        if (cloneCharts) {
                            cloneCharts.style.margin = '0';
                            cloneCharts.style.padding = '10px';
                            cloneCharts.style.boxShadow = 'none';
                            cloneCharts.style.border = 'none';
                            cloneCharts.style.backgroundColor = 'white';
                        }
                    }
                });

                // 4. Montagem Inteligente no PDF
                const margin = 10;
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const contentWidth = pdfWidth - (margin * 2);
                const contentHeight = pdfHeight - (margin * 2);

                const topH = (topCanvas.height * contentWidth) / topCanvas.width;
                const trendH = (trendCanvas.height * contentWidth) / trendCanvas.width;
                const chartsH = (chartsCanvas.height * contentWidth) / chartsCanvas.width;
                const spacing = 5;

                const totalNeeded = topH + trendH + chartsH + (spacing * 2);

                // Verifica se cabe tudo em uma página
                if (totalNeeded <= contentHeight) {
                    // Cabe perfeitamente
                    pdf.addImage(topCanvas, 'PNG', margin, margin, contentWidth, topH);
                    pdf.addImage(trendCanvas, 'PNG', margin, margin + topH + spacing, contentWidth, trendH);
                    pdf.addImage(chartsCanvas, 'PNG', margin, margin + topH + trendH + (spacing * 2), contentWidth, chartsH);
                } else {
                    // Não cabe. Tenta escalar para caber (se o estouro for pequeno, ex: até 25%)
                    if (totalNeeded <= contentHeight * 1.25) {
                        const scaleFactor = contentHeight / totalNeeded;
                        const newTopH = topH * scaleFactor;
                        const newTrendH = trendH * scaleFactor;
                        const newChartsH = chartsH * scaleFactor;
                        const newSpacing = spacing * scaleFactor;
                        
                        pdf.addImage(topCanvas, 'PNG', margin, margin, contentWidth, newTopH);
                        pdf.addImage(trendCanvas, 'PNG', margin, margin + newTopH + newSpacing, contentWidth, newTrendH);
                        pdf.addImage(chartsCanvas, 'PNG', margin, margin + newTopH + newTrendH + (newSpacing * 2), contentWidth, newChartsH);
                    } else {
                        // Muito grande para escalar. Adiciona em páginas separadas.
                        let currentY = margin;
                        
                        // Adiciona Topo
                        pdf.addImage(topCanvas, 'PNG', margin, currentY, contentWidth, topH);
                        currentY += topH + spacing;

                        // Adiciona Tabela (verifica espaço)
                        if (currentY + trendH > contentHeight) {
                            pdf.addPage();
                            currentY = margin;
                        }
                        pdf.addImage(trendCanvas, 'PNG', margin, currentY, contentWidth, trendH);
                        currentY += trendH + spacing;

                        // Adiciona Gráficos (verifica espaço)
                        if (currentY + chartsH > contentHeight) {
                            pdf.addPage();
                            currentY = margin;
                        }
                        // Se gráficos forem maiores que uma página inteira, escala para caber na página
                        if (chartsH > contentHeight) {
                            pdf.addImage(chartsCanvas, 'PNG', margin, margin, contentWidth, contentHeight);
                        } else {
                            pdf.addImage(chartsCanvas, 'PNG', margin, currentY, contentWidth, chartsH);
                        }
                    }
                }
            }
            
            // Adiciona a página final de metodologia
            pdf.addPage();
            const methodologyElement = document.getElementById('pdf-methodology-section');
            methodologyElement.style.display = 'block'; // Torna visível para captura
            const methodologyCanvas = await html2canvas(methodologyElement, {
                scale: 2,
                useCORS: true
            });
            methodologyElement.style.display = 'none'; // Esconde novamente
            addCanvasWithPageBreaks(pdf, methodologyCanvas);

            pdf.save(`Comparacao_Mensal_Todos_Centers.pdf`);

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert('Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.');
        } finally {
            // Restaura o estado original
            currentCenter = originalCenter;
            productSelect.value = originalCenter;
            updateAllData();
        }
    }
});