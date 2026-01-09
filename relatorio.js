// --- Estado da Aplicação ---
const appState = {
    currentMonth: '', // Será definido dinamicamente na inicialização
    currentCenter: '', // Será definido dinamicamente na inicialização
    isGeneratingPdf: false,
};

// --- Constantes e Configurações ---
const METRIC_TARGETS = {
    coberturaCodigo: {
        linhas: { value: 50, higherIsBetter: true },
        classes: { value: 50, higherIsBetter: true },
        metodos: { value: 50, higherIsBetter: true },
        branches: { value: 50, higherIsBetter: true }
    },
    passRate: { value: 90, higherIsBetter: true },
    coberturaTestesPercentual: { value: 100, higherIsBetter: true },
    leadTimeTestes: { value: 2.5, higherIsBetter: false },
    leadTimeBugs: { value: 2.0, higherIsBetter: false },
    leadTimeBugsProd: { value: 2.0, higherIsBetter: false },
    bugsNaoProdutivos: {
        baixa: { value: 5, higherIsBetter: false },
        media: { value: 3, higherIsBetter: false },
        alta: { value: 1, higherIsBetter: false },
        total: { value: 10, higherIsBetter: false }
    },
    bugsProducao: {
        baixa: { value: 5, higherIsBetter: false },
        media: { value: 2, higherIsBetter: false },
        alta: { value: 0, higherIsBetter: false },
        total: { value: 2, higherIsBetter: false }
    },
    eficienciaQa: {
        escrita: { value: 7, higherIsBetter: false },
        execucao: { value: 7, higherIsBetter: false },
        reexecucao: { value: 5, higherIsBetter: false }
    }
};

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', function() {
    updateMetricTargets();
    initializeControls();

    document.getElementById('feed-data-btn').addEventListener('click', () => window.open('formulario-dados.html', '_blank'));
    document.getElementById('new-month-btn').addEventListener('click', createNewMonth);
    document.getElementById('compare-btn').addEventListener('click', openComparisonReport);
    document.getElementById('save-pdf-btn').addEventListener('click', () => saveToPDF('download'));
    document.getElementById('email-pdf-btn').addEventListener('click', () => saveToPDF('email'));
    document.getElementById('clear-action-plan-btn').addEventListener('click', clearActionPlan);
    document.getElementById('generate-action-plan-btn').addEventListener('click', fillActionPlanWithSuggestions);

    // Adicionar listener para o campo de plano de ação
    document.getElementById('action-plan-textarea').addEventListener('input', saveActionPlan);

    // Carregar relatório inicial
    updateReport();
});

function updateMetricTargets() {
    if (typeof dadosRelatorio === 'undefined' || !dadosRelatorio.metas) return;
    const metas = dadosRelatorio.metas;
    const setVal = (obj, key, val) => { if (obj[key]) obj[key].value = val; };

    if (metas.coberturaCodigo) {
        setVal(METRIC_TARGETS.coberturaCodigo, 'linhas', metas.coberturaCodigo.linhas);
        setVal(METRIC_TARGETS.coberturaCodigo, 'classes', metas.coberturaCodigo.classes);
        setVal(METRIC_TARGETS.coberturaCodigo, 'metodos', metas.coberturaCodigo.metodos);
        setVal(METRIC_TARGETS.coberturaCodigo, 'branches', metas.coberturaCodigo.branches);
    }
    if (metas.passRate !== undefined) METRIC_TARGETS.passRate.value = metas.passRate;
    if (metas.coberturaTestesPercentual !== undefined) METRIC_TARGETS.coberturaTestesPercentual.value = metas.coberturaTestesPercentual;
    if (metas.leadTimeTestes !== undefined) METRIC_TARGETS.leadTimeTestes.value = metas.leadTimeTestes;
    if (metas.leadTimeBugs !== undefined) METRIC_TARGETS.leadTimeBugs.value = metas.leadTimeBugs;
    if (metas.leadTimeBugsProd !== undefined) METRIC_TARGETS.leadTimeBugsProd.value = metas.leadTimeBugsProd;

    if (metas.bugsNaoProdutivos) {
        setVal(METRIC_TARGETS.bugsNaoProdutivos, 'baixa', metas.bugsNaoProdutivos.baixa);
        setVal(METRIC_TARGETS.bugsNaoProdutivos, 'media', metas.bugsNaoProdutivos.media);
        setVal(METRIC_TARGETS.bugsNaoProdutivos, 'alta', metas.bugsNaoProdutivos.alta);
        setVal(METRIC_TARGETS.bugsNaoProdutivos, 'total', metas.bugsNaoProdutivos.total);
    }

    if (metas.bugsProducao) {
        setVal(METRIC_TARGETS.bugsProducao, 'baixa', metas.bugsProducao.baixa);
        setVal(METRIC_TARGETS.bugsProducao, 'media', metas.bugsProducao.media);
        setVal(METRIC_TARGETS.bugsProducao, 'alta', metas.bugsProducao.alta);
        setVal(METRIC_TARGETS.bugsProducao, 'total', metas.bugsProducao.total);
    }

    if (metas.eficienciaQa) {
        setVal(METRIC_TARGETS.eficienciaQa, 'escrita', metas.eficienciaQa.escrita);
        setVal(METRIC_TARGETS.eficienciaQa, 'execucao', metas.eficienciaQa.execucao);
        setVal(METRIC_TARGETS.eficienciaQa, 'reexecucao', metas.eficienciaQa.reexecucao);
    }
}

/**
 * Inicializa os controles de seleção (mês e produto), define o estado inicial e anexa os listeners.
 * Garante que a página seja totalmente orientada pelos dados do `dadosPreenchimento.js`.
 */
function initializeControls() {
    const monthSelect = document.getElementById('month-select');
    const productSelect = document.getElementById('product-select');

    // 1. Popula o seletor de Mês
    const months = Object.keys(dadosRelatorio).sort().reverse(); // Mais recentes primeiro
    if (months.length === 0) {
        showDataError();
        return;
    }
    monthSelect.innerHTML = '';
    months.forEach(monthKey => {
        const date = new Date(monthKey);
        const monthName = date.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' });
        const year = date.getFullYear();
        const option = document.createElement('option');
        option.value = monthKey;
        option.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
        monthSelect.appendChild(option);
    });

    // 2. Popula o seletor de Produto com todos os produtos possíveis de todos os meses
    const allProducts = new Set();
    Object.values(dadosRelatorio).forEach(monthData => {
        Object.keys(monthData).forEach(product => allProducts.add(product));
    });
    const productList = Array.from(allProducts).sort();

    productSelect.innerHTML = '';
    productList.forEach(productKey => {
        const option = document.createElement('option');
        option.value = productKey;
        option.textContent = formatProductName(productKey);
        productSelect.appendChild(option);
    });

    // 3. Define o estado inicial e adiciona listeners
    appState.currentMonth = months[0];
    // Tenta iniciar com 'Policy' por padrão, se não existir, usa o primeiro da lista
    appState.currentCenter = productList.includes('Policy') ? 'Policy' : productList[0];
    monthSelect.value = appState.currentMonth;
    productSelect.value = appState.currentCenter;

    monthSelect.addEventListener('change', function() { appState.currentMonth = this.value; updateReport(); });
    productSelect.addEventListener('change', function() { appState.currentCenter = this.value; updateReport(); });
}

// --- Funções Principais de Atualização da UI ---

/**
 * Função principal para atualizar toda a interface do relatório.
 * Verifica a existência dos dados antes de prosseguir.
 */
function updateReport() {
    // Validação de dados
    if (!dadosRelatorio?.[appState.currentMonth]?.[appState.currentCenter]) {
        console.error(`Dados não encontrados para o mês ${appState.currentMonth} e center ${appState.currentCenter}.`);
        showDataError();
        return;
    }

    updateReportDate();
    updateSprintData();
    updateBugsProdutivos();
    updateSummary();
    loadActionPlan();

    // Garante que o plano de ação está habilitado se houver dados
    document.getElementById('action-plan-textarea').disabled = false;
}

/**
 * Exibe uma mensagem de erro na UI quando os dados não são encontrados.
 */
function showDataError() {
    const errorMessageHTML = '<p style="color: var(--tertiary-color); text-align: center;">Dados não disponíveis para a seleção atual.</p>';
    const contentIds = ['sprint1-content', 'sprint2-content', 'bugs-content', 'summary-grid'];
    contentIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.innerHTML = errorMessageHTML;
    });
    const actionPlanTextarea = document.getElementById('action-plan-textarea');
    actionPlanTextarea.value = '';
    actionPlanTextarea.disabled = true;
}

/**
 * Atualiza a data exibida no cabeçalho do relatório.
 */
function updateReportDate() {
    const date = new Date(appState.currentMonth);
    const monthName = date.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' });
    const year = date.getFullYear();
    document.getElementById('report-date').textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
}

/**
 * Atualiza as seções de dados das Sprints.
 */
function updateSprintData() {
    const { sprint1, sprint2 } = dadosRelatorio[appState.currentMonth][appState.currentCenter];

    // Atualiza os títulos das seções (H2) com o nome definido pelo usuário
    if (sprint1 && sprint1.nome) {
        document.getElementById('sprint1-header').textContent = sprint1.nome;
    }
    if (sprint2 && sprint2.nome) {
        document.getElementById('sprint2-header').textContent = sprint2.nome;
    }

    const previousIdsS1 = getPreviousSprintIds(appState.currentMonth, appState.currentCenter, 'sprint1');
    const cumulativeS1 = calculateCumulativeScenarios(appState.currentMonth, appState.currentCenter, 'sprint1');
    const sprint1Content = document.getElementById('sprint1-content');
    sprint1Content.replaceChildren(generateSprintHTML(sprint1, cumulativeS1, previousIdsS1));

    const previousIdsS2 = getPreviousSprintIds(appState.currentMonth, appState.currentCenter, 'sprint2');
    const cumulativeS2 = calculateCumulativeScenarios(appState.currentMonth, appState.currentCenter, 'sprint2');
    const sprint2Content = document.getElementById('sprint2-content');
    sprint2Content.replaceChildren(generateSprintHTML(sprint2, cumulativeS2, previousIdsS2));
}

/**
 * Atualiza a seção de Bugs Produtivos com os dados consolidados do mês.
 */
function updateBugsProdutivos() {
    const centerData = dadosRelatorio[appState.currentMonth][appState.currentCenter];
    const bugsContent = document.getElementById('bugs-content');
    bugsContent.replaceChildren(); // Limpa conteúdo anterior

    if (!centerData) return;

    const bugsData = getProductionBugsObject(centerData);
    bugsContent.appendChild(generateBugsProdutivosHTML(bugsData));
}

/**
 * Cria uma linha de tabela para uma métrica, incluindo cor e indicador de tendência.
 * @param {string} label - O rótulo da métrica.
 * @param {number|string} value - O valor da métrica.
 * @param {string} unit - A unidade da métrica.
 * @param {object|null} targetConfig - A configuração da meta.
 * @returns {HTMLTableRowElement} - O elemento da linha da tabela.
 */
function createMetricRow(label, value, unit, targetConfig) {
    const row = document.createElement('tr');
    row.className = 'data-row';
 
    const labelCell = document.createElement('td');
    labelCell.textContent = label;
    row.appendChild(labelCell);
 
    const valueCell = document.createElement('td');
    valueCell.textContent = (targetConfig && targetConfig.customDisplay) ? targetConfig.customDisplay : `${value.toLocaleString('pt-BR')}${unit}`;
 
    // A cor do valor é definida pelo atingimento da meta.
    if (targetConfig && targetConfig.evaluate !== false) {
        const isMet = targetConfig.higherIsBetter ? value >= targetConfig.value : value <= targetConfig.value;
        valueCell.className = isMet ? 'positive' : 'negative';
        if (!isMet) {
            valueCell.style.fontWeight = 'bold';
        }
    }
    row.appendChild(valueCell);
 
    const targetCell = document.createElement('td');
    targetCell.textContent = (targetConfig && targetConfig.displayTarget !== false) ? `${targetConfig.value.toLocaleString('pt-BR')}${unit}` : '-';
    row.appendChild(targetCell);
 
    return row;
}

/**
 * Cria uma tabela de dados completa.
 * @param {string} title - O título da tabela.
 * @param {HTMLTableRowElement[]} rows - Um array de linhas (criadas com createMetricRow).
 * @returns {HTMLTableElement} - O elemento da tabela.
 */
function createTable(title, rows) {
    const table = document.createElement('table');
    table.className = 'data-table';

    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const headerCell = document.createElement('th');
    headerCell.colSpan = 2;
    headerCell.textContent = title;
    headerCell.style.backgroundColor = '#0033A0';
    headerCell.style.color = '#ffffff';
    headerRow.appendChild(headerCell);

    const metaHeaderCell = document.createElement('th');
    metaHeaderCell.textContent = 'Meta';
    metaHeaderCell.style.backgroundColor = '#0033A0';
    metaHeaderCell.style.color = '#ffffff';
    headerRow.appendChild(metaHeaderCell);

    const tbody = table.createTBody();
    rows.forEach(row => tbody.appendChild(row));

    return table;
}

/**
 * Gera o conteúdo HTML para uma única sprint.
 * @param {object} sprintData - Os dados da sprint.
 * @returns {DocumentFragment} - Um fragmento de documento com o HTML da sprint.
 */
function generateSprintHTML(sprintData, cumulativeScenarios = null, previousIds = new Set()) {
    const fragment = document.createDocumentFragment();

    // Cálculo automático de totais e Pass Rate baseado nas User Stories
    let totalExecuted = sprintData.ctExecutados || 0;
    let totalPassed = sprintData.ctPassados || (sprintData.passRate !== undefined ? Math.round((sprintData.passRate / 100) * totalExecuted) : 0);
    let passRateCalc = sprintData.passRate;

    if (sprintData.listaUserStories && sprintData.listaUserStories.length > 0) {
        totalExecuted = 0;
        totalPassed = 0;
        sprintData.listaUserStories.forEach(us => {
            const passed = (us.passed !== undefined && us.passed !== null && us.passed !== '') ? Number(us.passed) : 0;
            const failed = (us.failed !== undefined && us.failed !== null && us.failed !== '') ? Number(us.failed) : 0;
            const executed = passed + failed;
            totalExecuted += executed;
            totalPassed += passed;
        });
        passRateCalc = totalExecuted > 0 ? Math.min(100, Number(((totalPassed / totalExecuted) * 100).toFixed(1))) : 0;
    }

    // Novo cálculo: Densidade de Testes (Meta: 4 CTs por US)
    const META_CTS_POR_US = 4;
    const totalEsperadoCts = sprintData.usSprint * META_CTS_POR_US;

    // Cálculos de métricas
    // Cobertura Atingida: (Executados / Total Ideal Baseado na Meta) * 100
    const coberturaTestesCalc = totalEsperadoCts > 0 ? Math.min(100, Math.round((totalExecuted / totalEsperadoCts) * 100)) : 0;
    const mediaCtsPorUs = sprintData.usSprint > 0 ? Math.round(sprintData.casosTestePorUs / sprintData.usSprint) : 0;

    const percentDensity = totalEsperadoCts > 0 ? Math.min(100, (sprintData.casosTestePorUs / totalEsperadoCts) * 100) : (sprintData.casosTestePorUs > 0 ? 100 : 0);
    const densityDisplay = `${percentDensity.toFixed(1)}% (${sprintData.casosTestePorUs}/${totalEsperadoCts})`;

    // Identifica se houve reexecuções (Execuções > Planejado)
    const percentExecuted = sprintData.casosTestePorUs > 0 ? Math.round((totalExecuted / sprintData.casosTestePorUs) * 100) : 0;
    const execDisplay = (sprintData.casosTestePorUs > 0 && totalExecuted > sprintData.casosTestePorUs) 
        ? `${totalExecuted} (${percentExecuted}% do planejado)` 
        : totalExecuted;

    fragment.appendChild(createTable('Cobertura de Código', [
        createMetricRow('Linhas', sprintData.coberturaCodigo.linhas, '%', METRIC_TARGETS.coberturaCodigo.linhas),
        createMetricRow('Classes', sprintData.coberturaCodigo.classes, '%', METRIC_TARGETS.coberturaCodigo.classes),
        createMetricRow('Métodos', sprintData.coberturaCodigo.metodos, '%', METRIC_TARGETS.coberturaCodigo.metodos),
        createMetricRow('Branches', sprintData.coberturaCodigo.branches, '%', METRIC_TARGETS.coberturaCodigo.branches)
    ]));

    fragment.appendChild(createTable('Cobertura de Testes (Funcional)', [
        createMetricRow('User Stories (US)', sprintData.usSprint, '', { value: `1 US / ${mediaCtsPorUs} CTs`, evaluate: false }),
        createMetricRow('Densidade de Testes (Criados)', percentDensity, '%', { value: 100, higherIsBetter: true, customDisplay: densityDisplay }),
        createMetricRow('Execuções Totais', totalExecuted, '', { value: totalExecuted, evaluate: false, customDisplay: execDisplay }),
        createMetricRow('Cobertura Atingida', coberturaTestesCalc, '%', { value: 90, higherIsBetter: true }),
        createMetricRow('Pass Rate', passRateCalc, '%', { ...METRIC_TARGETS.passRate, customDisplay: `${passRateCalc}% (${totalPassed}/${totalExecuted})` })
    ]));

    // Se houver detalhamento de User Stories, adiciona uma tabela extra
    if (sprintData.listaUserStories && sprintData.listaUserStories.length > 0) {
        // Cabeçalho da tabela de detalhamento
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th style="background-color: #f9f9f9; font-size: 0.9em;">História</th>
            <th style="background-color: #f9f9f9; font-size: 0.9em;">Total CTs</th>
            <th style="background-color: #f9f9f9; font-size: 0.9em;">Exec</th>
            <th style="background-color: #f9f9f9; font-size: 0.9em;">Pass</th>
            <th style="background-color: #f9f9f9; font-size: 0.9em;">Fail</th>
        `;

        const usRows = sprintData.listaUserStories.map(us => {
            const row = document.createElement('tr');
            row.className = 'data-row';
            const cts = us.cts || 0;
            const ctsClass = cts < 4 ? 'negative' : '';
            const ctsStyle = ctsClass === 'negative' ? 'style="font-weight: bold;"' : '';
            const passed = (us.passed !== undefined && us.passed !== null && us.passed !== '') ? Number(us.passed) : 0;
            const failed = (us.failed !== undefined && us.failed !== null && us.failed !== '') ? Number(us.failed) : 0;
            const executed = passed + failed;
            const passedClass = passed < executed ? 'negative' : '';
            const passedStyle = passedClass === 'negative' ? 'style="font-weight: bold;"' : '';
            
            const isSpillover = us.nome && previousIds.has(String(us.nome));
            const spilloverIcon = isSpillover ? '<span title="Transbordo de sprint anterior" style="cursor: help; margin-right: 4px;">🔄</span>' : '';

            row.innerHTML = `
                <td style="padding-left: 20px; color: #555;">${spilloverIcon}• ${us.nome || 'Sem nome'}</td>
                <td class="${ctsClass}" ${ctsStyle}>${cts}</td>
                <td>${executed}</td>
                <td class="${passedClass}" ${passedStyle}>${passed}</td>
                <td style="color: #e74c3c; font-weight: bold;">${failed}</td>
            `;
            return row;
        });

        // Cria uma tabela "filha" ou seção de detalhamento
        const detailTable = createTable('Detalhamento por História', usRows);
        
        // Substitui o cabeçalho padrão da tabela criada por createTable para ajustar as colunas
        const thead = detailTable.querySelector('thead');
        if(thead) {
            // Remove a linha de "Meta" padrão e insere o novo cabeçalho
            thead.innerHTML = ''; 
            const titleRow = document.createElement('tr');
            const titleCell = document.createElement('th');
            titleCell.colSpan = 5;
            titleCell.textContent = 'Detalhamento por História';
            titleCell.style.backgroundColor = '#0033A0';
            titleCell.style.color = '#ffffff';
            titleRow.appendChild(titleCell);
            thead.appendChild(titleRow);
            thead.appendChild(headerRow);
        }

        fragment.appendChild(detailTable);
    }

    fragment.appendChild(createTable('Execuções QA', [
        createMetricRow('Lead Time de Testes', sprintData.leadTimeTestes, ' dias', METRIC_TARGETS.leadTimeTestes),
        createMetricRow('Lead Time de Bugs', sprintData.leadTimeBugs, ' dias', METRIC_TARGETS.leadTimeBugs),
        createMetricRow('Lead Time de Bugs produção', sprintData.leadTimeBugsProd || 0, ' dias', METRIC_TARGETS.leadTimeBugsProd)
    ]));

    fragment.appendChild(createTable('Bugs Não Produtivos', [
        createMetricRow('Baixa Criticidade', sprintData.bugsNaoProdutivos.baixa, '', METRIC_TARGETS.bugsNaoProdutivos.baixa),
        createMetricRow('Média Criticidade', sprintData.bugsNaoProdutivos.media, '', METRIC_TARGETS.bugsNaoProdutivos.media),
        createMetricRow('Alta Criticidade', sprintData.bugsNaoProdutivos.alta, '', METRIC_TARGETS.bugsNaoProdutivos.alta)
    ]));

    // Seção de Automação de Testes
    const autoData = sprintData.testesAutomatizados || { cenarios: 0, tempoManual: 0, tempoAutom: 0 };
    const economia = autoData.tempoManual - autoData.tempoAutom;
    const cenariosDisplay = cumulativeScenarios !== null ? cumulativeScenarios : autoData.cenarios;

    fragment.appendChild(createTable('Automação de Testes', [
        createMetricRow('Cenários Automatizados', cenariosDisplay, '', { value: 50, higherIsBetter: true, displayTarget: true }),
        createMetricRow('Tempo Exec. Manual', autoData.tempoManual, ' min', { value: 0, higherIsBetter: false, displayTarget: true }),
        createMetricRow('Tempo Exec. Automatizado', autoData.tempoAutom, ' min', { value: 60, higherIsBetter: false, displayTarget: true }),
        createMetricRow('Economia de Tempo', economia, ' min', { value: 0, higherIsBetter: true, displayTarget: false })
    ]));

    // Seção de Eficiência do QA
    const eficienciaData = sprintData.eficiencia || { escrita: 0, execucao: 0, reexecucao: 0 };
    fragment.appendChild(createTable('Eficiência do QA (Médias)', [
        createMetricRow('Escrita de CTs', eficienciaData.escrita, ' min', METRIC_TARGETS.eficienciaQa.escrita),
        createMetricRow('Execução de CTs', eficienciaData.execucao, ' min', METRIC_TARGETS.eficienciaQa.execucao),
        createMetricRow('Reexecução de Bugs', eficienciaData.reexecucao, ' min', METRIC_TARGETS.eficienciaQa.reexecucao)
    ]));

    return fragment;
}

/**
 * Gera o conteúdo HTML para a seção de bugs produtivos.
 * @param {object} bugsData - Dados consolidados de bugs do mês.
 * @returns {HTMLTableElement} - O elemento de tabela com os dados de bugs.
 */
function generateBugsProdutivosHTML(bugsData) {
    return createTable('Consolidado do Mês', [
        createMetricRow('Baixa Criticidade', bugsData.baixa, '', METRIC_TARGETS.bugsProducao.baixa),
        createMetricRow('Média Criticidade', bugsData.media, '', METRIC_TARGETS.bugsProducao.media),
        createMetricRow('Alta Criticidade', bugsData.alta, '', METRIC_TARGETS.bugsProducao.alta)
    ]);
}

/**
 * Retorna um Set com os IDs das User Stories de sprints anteriores para detecção de transbordo.
 */
function getPreviousSprintIds(targetMonth, center, targetSprintKey) {
    const months = Object.keys(dadosRelatorio).sort();
    const previousIds = new Set();

    for (const month of months) {
        const centerData = dadosRelatorio[month][center];
        if (!centerData) continue;

        // Se chegamos no mês alvo
        if (month === targetMonth) {
            if (targetSprintKey === 'sprint1') {
                return previousIds;
            } else if (targetSprintKey === 'sprint2') {
                if (centerData.sprint1 && centerData.sprint1.listaUserStories) {
                    centerData.sprint1.listaUserStories.forEach(us => { if(us.nome) previousIds.add(String(us.nome)); });
                }
                return previousIds;
            }
        }

        // Meses anteriores
        if (month < targetMonth) {
            if (centerData.sprint1 && centerData.sprint1.listaUserStories) centerData.sprint1.listaUserStories.forEach(us => { if(us.nome) previousIds.add(String(us.nome)); });
            if (centerData.sprint2 && centerData.sprint2.listaUserStories) centerData.sprint2.listaUserStories.forEach(us => { if(us.nome) previousIds.add(String(us.nome)); });
        }
    }
    return previousIds;
}

/**
 * Calcula o total acumulado de cenários automatizados até a sprint especificada.
 */
function calculateCumulativeScenarios(targetMonth, center, sprintTarget) {
    const months = Object.keys(dadosRelatorio).sort();
    let total = 0;

    for (const month of months) {
        const centerData = dadosRelatorio[month][center];
        if (!centerData) continue;

        // Sprint 1
        total += (centerData.sprint1?.testesAutomatizados?.cenarios || 0);
        if (month === targetMonth && sprintTarget === 'sprint1') return total;

        // Sprint 2
        total += (centerData.sprint2?.testesAutomatizados?.cenarios || 0);
        if (month === targetMonth && sprintTarget === 'sprint2') return total;
    }
    return total;
}

/**
 * Atualiza a seção de resumo geral dos centers.
 */
function updateSummary() {
    const summaryGrid = document.getElementById('summary-grid');
    summaryGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    const summaryMetricsConfig = [
        { 
            name: 'Cobertura de Código', unit: '%', 
            getValue: (s1, s2) => {
                return (getSprintAverageCodeCoverage(s1) + getSprintAverageCodeCoverage(s2)) / 2;
            }, 
            getStatus: (v) => {
                const target = METRIC_TARGETS.coberturaCodigo.linhas.value;
                return v >= target ? 'positive' : v >= (target - 10) ? 'neutral' : 'negative';
            }
        },
        { name: 'Pass Rate', unit: '%', getValue: (s1, s2) => (s1.passRate + s2.passRate) / 2, getStatus: (v) => v >= METRIC_TARGETS.passRate.value ? 'positive' : v >= (METRIC_TARGETS.passRate.value - 5) ? 'neutral' : 'negative' },
        { name: 'Cobertura de Testes', unit: '%', getValue: (s1, s2, centerData) => getMonthTestCoverage(centerData), getStatus: (v) => v >= METRIC_TARGETS.coberturaTestesPercentual.value ? 'positive' : v >= (METRIC_TARGETS.coberturaTestesPercentual.value - 10) ? 'neutral' : 'negative' },
        { 
            name: 'Bugs (Não Prod.)', unit: '', 
            getValue: (s1, s2) => getSprintTotalNonProdBugs(s1) + getSprintTotalNonProdBugs(s2), 
            getStatus: (v) => {
                const target = METRIC_TARGETS.bugsNaoProdutivos.total.value;
                return v <= target ? 'positive' : v <= (target + 5) ? 'neutral' : 'negative';
            }
        },
        { name: 'Bugs (Prod.)', unit: '', getValue: (s1, s2, centerData) => {
            const bugs = getProductionBugsObject(centerData);
            return bugs.baixa + bugs.media + bugs.alta;
        }, getStatus: (v) => {
            const target = METRIC_TARGETS.bugsProducao.total.value;
            return v <= target ? 'positive' : v <= (target + 2) ? 'neutral' : 'negative';
        } },
        { name: 'Lead Time Testes', unit: ' dias', getValue: (s1, s2) => (s1.leadTimeTestes + s2.leadTimeTestes) / 2, getStatus: (v) => v <= METRIC_TARGETS.leadTimeTestes.value ? 'positive' : v <= (METRIC_TARGETS.leadTimeTestes.value + 0.5) ? 'neutral' : 'negative' },
    ];

    const monthData = dadosRelatorio[appState.currentMonth];
    const centerList = Object.keys(monthData);

    // --- 2. Renderizar os cards ---
    centerList.forEach(centerKey => {
        const centerData = dadosRelatorio[appState.currentMonth][centerKey];
        if (!centerData) return;

        const { sprint1, sprint2 } = centerData;

        const centerElement = document.createElement('div');
        centerElement.className = 'product-summary';

        // Adiciona a classe de destaque se o center for o selecionado
        if (centerKey === appState.currentCenter) {
            centerElement.classList.add('selected-center');
        }

        const title = document.createElement('h4');
        title.textContent = centerKey;
        centerElement.appendChild(title);

        summaryMetricsConfig.forEach(metricConfig => {
            const value = metricConfig.getValue(sprint1, sprint2, centerData);
            const status = metricConfig.getStatus(value);

            const metricDiv = document.createElement('div');
            metricDiv.className = 'metric';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'metric-name';
            nameSpan.textContent = `${metricConfig.name}:`;

            const valueSpan = document.createElement('span');
            valueSpan.className = `metric-value ${status}`;
            if (status === 'negative') {
                valueSpan.style.fontWeight = 'bold';
            }
            const formattedValue = isFinite(value) ? (Number.isInteger(value) ? value : value.toFixed(1)) : '∞';
            valueSpan.textContent = `${formattedValue}${metricConfig.unit}`;

            metricDiv.appendChild(nameSpan);
            metricDiv.appendChild(valueSpan);
            centerElement.appendChild(metricDiv);
        });

        fragment.appendChild(centerElement);
    });
    summaryGrid.appendChild(fragment);
}

function getActionPlanKey() {
    return `actionPlan-${appState.currentMonth}-${appState.currentCenter}`;
}

function loadActionPlan() {
    const key = getActionPlanKey();
    const savedPlan = localStorage.getItem(key);
    
    if (savedPlan) {
        document.getElementById('action-plan-textarea').value = savedPlan;
    } else {
        document.getElementById('action-plan-textarea').value = generateMissedMetricsText();
    }
}

function saveActionPlan() {
    localStorage.setItem(getActionPlanKey(), this.value);
}

function clearActionPlan() {
    const key = getActionPlanKey();
    if (!localStorage.getItem(key)) {
        showToast('O plano de ação já está vazio.', 'info');
        return;
    }

    showModal({
        title: 'Confirmar Limpeza',
        message: 'Tem certeza que deseja limpar o plano de ação para este mês e center? Esta ação não pode ser desfeita.',
        buttons: [
            { text: 'Cancelar', className: 'secondary', callback: hideModal },
            { text: 'Confirmar', className: 'primary', callback: () => {
                localStorage.removeItem(key);
                document.getElementById('action-plan-textarea').value = '';
                hideModal();
                showToast('Plano de ação limpo com sucesso.', 'success');
            }}
        ]
    });
}

function fillActionPlanWithSuggestions() {
    const textarea = document.getElementById('action-plan-textarea');
    const currentText = textarea.value;
    
    if (currentText.trim() !== '') {
        showModal({
            title: 'Substituir Plano?',
            message: 'Já existe texto no plano de ação. Deseja substituir pelo modelo de métricas não alcançadas?',
            buttons: [
                { text: 'Cancelar', className: 'secondary', callback: hideModal },
                { text: 'Substituir', className: 'primary', callback: () => {
                    textarea.value = generateMissedMetricsText();
                    saveActionPlan.call(textarea);
                    hideModal();
                }}
            ]
        });
    } else {
        textarea.value = generateMissedMetricsText();
        saveActionPlan.call(textarea);
    }
}

function generateMissedMetricsText() {
    const missed = identifyMissedMetrics();
    if (missed.length === 0) return "Todas as metas foram atingidas! \n\nObservações:";
    
    return "Métricas não alcançadas:\n\n" + 
           missed.map(m => `* ${m}\n  - Plano de Ação: `).join('\n\n') + 
           "\n\nOutras observações:";
}

function identifyMissedMetrics() {
    const centerData = dadosRelatorio[appState.currentMonth][appState.currentCenter];
    if (!centerData) return [];
    
    const { sprint1, sprint2 } = centerData;
    const missed = [];

    const check = (label, value, targetConfig) => {
        if (!targetConfig) return;
        const isMet = targetConfig.higherIsBetter ? value >= targetConfig.value : value <= targetConfig.value;
        if (!isMet) {
            missed.push(`${label} (Atual: ${Number.isInteger(value) ? value : value.toFixed(1)}, Meta: ${targetConfig.value})`);
        }
    };

    // Cobertura Código (Média)
    ['linhas', 'classes', 'metodos', 'branches'].forEach(type => {
        const val = (sprint1.coberturaCodigo[type] + sprint2.coberturaCodigo[type]) / 2;
        check(`Cobertura de Código - ${type.charAt(0).toUpperCase() + type.slice(1)}`, val, METRIC_TARGETS.coberturaCodigo[type]);
    });

    check('Pass Rate', (sprint1.passRate + sprint2.passRate) / 2, METRIC_TARGETS.passRate);

    const totalUS = (sprint1.usSprint || 0) + (sprint2.usSprint || 0);
    const totalTC = (sprint1.casosTestePorUs || 0) + (sprint2.casosTestePorUs || 0);
    const cobTestes = calculateTestCoverage(totalUS, totalTC);
    check('Cobertura de Testes', cobTestes, METRIC_TARGETS.coberturaTestesPercentual);

    check('Lead Time Testes', (sprint1.leadTimeTestes + sprint2.leadTimeTestes) / 2, METRIC_TARGETS.leadTimeTestes);
    check('Lead Time Bugs', (sprint1.leadTimeBugs + sprint2.leadTimeBugs) / 2, METRIC_TARGETS.leadTimeBugs);

    // Validação de Bugs Não Produtivos (Total) - Usa meta dinâmica
    const totalNonProdBugs = getSprintTotalNonProdBugs(sprint1) + getSprintTotalNonProdBugs(sprint2);
    if (METRIC_TARGETS.bugsNaoProdutivos.total) {
        check('Bugs Não Produtivos (Total)', totalNonProdBugs, METRIC_TARGETS.bugsNaoProdutivos.total);
    }

    const prodBugs = getProductionBugsObject(centerData);
    
    // Validação de Bugs de Produção (Total) - Usa meta dinâmica
    const totalProdBugs = prodBugs.baixa + prodBugs.media + prodBugs.alta;
    if (METRIC_TARGETS.bugsProducao.total) {
        check('Bugs Produção (Total)', totalProdBugs, METRIC_TARGETS.bugsProducao.total);
    }

    ['baixa', 'media', 'alta'].forEach(type => {
        check(`Bugs Produção (${type})`, prodBugs[type], METRIC_TARGETS.bugsProducao[type]);
    });

    return missed;
}

// --- Funções de Ações do Usuário ---

function createNewMonth() {
    const lastMonth = Object.keys(dadosRelatorio).sort().pop();
    const lastMonthDate = new Date(lastMonth);

    lastMonthDate.setUTCMonth(lastMonthDate.getUTCMonth() + 1);
    const newMonth = lastMonthDate.toISOString().slice(0, 7);

    if (dadosRelatorio[newMonth]) {
        showModal({
            title: 'Mês Existente',
            message: `O mês ${newMonth} já existe no relatório.`,
            buttons: [{ text: 'OK', className: 'primary', callback: hideModal }]
        });
        return;
    }

    dadosRelatorio[newMonth] = structuredClone(dadosRelatorio[lastMonth]);

    const monthName = lastMonthDate.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' });
    const year = lastMonthDate.getFullYear();

    Object.keys(dadosRelatorio[newMonth]).forEach(center => {
        dadosRelatorio[newMonth][center].sprint1.nome = `Sprint ${monthName} 01`;
        dadosRelatorio[newMonth][center].sprint2.nome = `Sprint ${monthName} 02`;
    });

    const option = document.createElement('option');
    option.value = newMonth;
    option.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
    document.getElementById('month-select').prepend(option);
    document.getElementById('month-select').value = newMonth;

    appState.currentMonth = newMonth;
    updateReport();

    const lastMonthName = new Date(lastMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    showToast(`Novo mês criado: ${monthName} ${year} (baseado em ${lastMonthName}). O download será iniciado.`, 'success', 5000);

    const fileContent = `const dadosRelatorio = ${JSON.stringify(dadosRelatorio, null, 2)};`;
    downloadFile(fileContent, 'dadosPreenchimento.js');
}

function openComparisonReport() {
    window.open('comparacao-mensal-visual.html', '_blank');
}

function downloadFile(content, fileName) {
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Controla o estado visual do botão de PDF.
 * @param {boolean} isLoading - Se a geração de PDF está em andamento.
 * @param {string} mode - 'download' ou 'email'
 */
function setPdfButtonLoading(isLoading, mode = 'download') {
    const btnId = mode === 'email' ? 'email-pdf-btn' : 'save-pdf-btn';
    const btn = document.getElementById(btnId);
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');

    appState.isGeneratingPdf = isLoading;
    btn.disabled = isLoading;
    btnText.style.display = isLoading ? 'none' : 'inline';
    btnLoader.style.display = isLoading ? 'inline' : 'none';
}

/**
 * Adds a canvas image to a PDF, handling page breaks for tall content.
 * It draws the first part of the image on the current page, then adds new pages for the rest.
 * @param {jsPDF} pdf - The jsPDF instance.
 * @param {HTMLCanvasElement} canvas - The canvas to add.
 */
function addCanvasWithPageBreaks(pdf, canvas) {
    const margin = 10; // 10mm de margem
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Área de conteúdo útil na página, descontando as margens
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = pdfHeight - (margin * 2);

    const imgData = canvas.toDataURL('image/png');
    // Altura total da imagem, dimensionada para a largura do conteúdo
    const totalImgHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = totalImgHeight;
    let position = 0;

    // Adiciona a imagem na página atual, respeitando as margens.
    pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, totalImgHeight);
    heightLeft -= contentHeight;

    // Adiciona páginas subsequentes se a imagem for mais alta que a área de conteúdo
    while (heightLeft > 0) {
        position -= contentHeight; // Desloca a posição para cima pela altura do conteúdo já desenhado.
        pdf.addPage();
        // Desenha a mesma imagem grande, mas deslocada verticalmente para que a próxima seção apareça na nova página
        pdf.addImage(imgData, 'PNG', margin, position + margin, contentWidth, totalImgHeight);
        heightLeft -= contentHeight;
    }
}

/**
 * Gera e salva o relatório completo de todos os centers como um arquivo PDF.
 * @param {string} mode - 'download' para baixar, 'email' para enviar.
 */
async function saveToPDF(mode = 'download') {
    if (appState.isGeneratingPdf) return;
    
    let emailAddress = null;
    if (mode === 'email') {
        emailAddress = prompt("Digite o e-mail do destinatário:");
        if (!emailAddress) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
            showToast('E-mail inválido.', 'error');
            return;
        }
    }

    setPdfButtonLoading(true, mode);

    const { jsPDF } = window.jspdf;
    const reportContainer = document.getElementById('report-container');

    try {
        const pdf = new jsPDF('p', 'mm', 'a4');

        // --- INÍCIO: Criar Capa ---
        const logoImg = document.getElementById('company-logo');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const today = new Date();
        const formattedDate = today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        const reportDate = new Date(appState.currentMonth);
        const reportMonthName = reportDate.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' });
        const reportYear = reportDate.getFullYear();
        const periodText = `${reportMonthName.charAt(0).toUpperCase() + reportMonthName.slice(1)} de ${reportYear}`;

        // Adicionar logo
        if (logoImg && logoImg.complete && logoImg.naturalHeight !== 0) {
            pdf.addImage(logoImg, 'PNG', (pdfWidth / 2) - 30, 40, 60, 24);
        }

        // Adicionar Título, Período e Data
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor('#0033A0'); // Sura Blue
        pdf.text('Relatório Mensal de Qualidade', pdfWidth / 2, 85, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(16);
        pdf.setTextColor('#58595B'); // Sura Gray
        pdf.text(periodText, pdfWidth / 2, 100, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text(`Gerado em: ${formattedDate}`, pdfWidth / 2, pdfHeight - 30, { align: 'center' });
        // --- FIM: Criar Capa ---

        const originalCurrentCenter = appState.currentCenter;
        const centerKeys = Object.keys(dadosRelatorio[appState.currentMonth]);

        // --- PARTE 1: Gerar relatório para cada Center (Completo) ---
        for (const centerKey of centerKeys) {
            // Atualiza o estado da aplicação e a UI para o center atual
            appState.currentCenter = centerKey;
            document.getElementById('product-select').value = centerKey; // Sincroniza o dropdown
            updateReport();

            // Aguarda um pequeno instante para garantir que o DOM foi atualizado antes da captura
            await new Promise(resolve => requestAnimationFrame(resolve));

            const canvas = await html2canvas(reportContainer, {
                scale: 1.5, // Reduzido para evitar erro "Invalid string length" em relatórios longos
                logging: false,
                useCORS: true,
                windowWidth: 1600, // Garante que o layout seja capturado em modo desktop (sem cortes)
                onclone: (doc) => {
                    // No documento clonado, removemos estilos que não queremos no PDF
                    const clonedContainer = doc.getElementById('report-container');
                    if (clonedContainer) {
                        clonedContainer.style.boxShadow = 'none';
                        clonedContainer.style.border = 'none';
                        clonedContainer.style.margin = '0';
                        clonedContainer.style.maxWidth = 'none';
                        clonedContainer.style.width = '1400px'; // Força a largura exata do HTML para manter o layout
                    }

                    // Esconde o header e os controles originais para evitar repetição
                    const header = doc.querySelector('header');
                    if (header) header.style.display = 'none';
                    const controls = doc.querySelector('.controls');
                    if (controls) controls.style.display = 'none';

                    // Cria um título customizado para a página do PDF
                    const pdfTitle = doc.createElement('div');
                    pdfTitle.style.textAlign = 'center';
                    pdfTitle.style.marginBottom = '20px';
                    const centerName = formatProductName(centerKey);
                    const dateText = new Date(appState.currentMonth).toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
                    pdfTitle.innerHTML = `<h1 style="color: var(--header-color); margin-bottom: 5px;">Relatório de Qualidade - ${centerName}</h1><p>${dateText}</p>`;
                    if (clonedContainer) {
                        clonedContainer.prepend(pdfTitle);
                    }
                }
            });

            // Calcula as dimensões exatas baseadas no HTML (1px = 0.264583mm)
            // Mantém a fidelidade visual 1:1 com o HTML
            const mmPerPx = 0.264583;
            const imgWidth = (canvas.width / 1.5) * mmPerPx; 
            const imgHeight = (canvas.height / 1.5) * mmPerPx;

            // Adiciona uma página com o tamanho exato do conteúdo (papel ajustável)
            pdf.addPage([imgWidth, imgHeight]);
            pdf.addImage(canvas, 'PNG', 0, 0, imgWidth, imgHeight);
        }

        // --- PARTE 2: Adicionar página de Metodologia ---
        pdf.addPage('a4', 'p');
        const methodologyElement = document.getElementById('pdf-methodology-section');
        methodologyElement.style.display = 'block'; // Torna visível para captura
        const methodologyCanvas = await html2canvas(methodologyElement, {
            scale: 2,
            useCORS: true
        });
        methodologyElement.style.display = 'none'; // Esconde novamente
        addCanvasWithPageBreaks(pdf, methodologyCanvas);

        const reportDateText = new Date(appState.currentMonth).toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).replace(' de ', '_');
        const fileName = `Relatorio_Mensal_Todos_Centers_${reportDateText}.pdf`;

        if (mode === 'download') {
            pdf.save(fileName);
            showToast('PDF gerado e baixado com sucesso!', 'success');
        } else if (mode === 'email') {
            // Converte PDF para Base64 (sem o prefixo data:application/pdf;base64,)
            const pdfBase64 = pdf.output('datauristring').split(',')[1];
            
            // Envia para o backend
            const response = await fetch('/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: emailAddress,
                    subject: `Relatório Mensal de Qualidade - ${reportDateText.replace('_', ' ')}`,
                    body: `Olá,\n\nSegue em anexo o relatório mensal de qualidade referente a ${reportDateText.replace('_', ' ')}.\n\nAtenciosamente,\nEquipe de QA`,
                    attachmentName: fileName,
                    attachmentData: pdfBase64
                })
            });

            if (response.ok) {
                showToast('E-mail enviado com sucesso!', 'success');
            } else {
                throw new Error('Erro ao enviar e-mail.');
            }
        }

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        showModal({
            title: 'Erro ao Gerar PDF',
            message: 'Ocorreu um erro inesperado durante a geração do PDF: ' + error.message,
            buttons: [{ text: 'Fechar', className: 'primary', callback: hideModal }]
        });
    } finally {
        // Restaura o estado original da UI
        appState.currentCenter = originalCurrentCenter;
        document.getElementById('product-select').value = originalCurrentCenter;
        updateReport();

        setPdfButtonLoading(false, mode);
    }
}

// --- Sistema de Notificação (Modal e Toast) ---

/**
 * Exibe uma notificação "toast" no canto da tela.
 * @param {string} message - A mensagem a ser exibida.
 * @param {'info'|'success'|'error'} type - O tipo de toast (para estilização).
 * @param {number} duration - Duração em milissegundos para o toast ficar visível.
 */
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    // Define a duração da animação de fade-out
    toast.style.animation = `slideIn 0.5s forwards, fadeOut 0.5s ${duration / 1000 - 0.5}s forwards`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, duration);
}

/**
 * Exibe um modal customizado.
 * @param {object} options - Opções do modal.
 * @param {string} options.title - O título do modal.
 * @param {string} options.message - A mensagem principal.
 * @param {Array<object>} options.buttons - Array de objetos de botão.
 */
function showModal({ title, message, buttons }) {
    const modal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalButtons = document.getElementById('modal-buttons');

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalButtons.innerHTML = ''; // Limpa botões anteriores

    buttons.forEach(btnInfo => {
        const button = document.createElement('button');
        button.textContent = btnInfo.text;
        button.className = btnInfo.className;
        button.addEventListener('click', btnInfo.callback);
        modalButtons.appendChild(button);
    });

    modal.style.display = 'flex';
}

function hideModal() {
    const modal = document.getElementById('custom-modal');
    modal.style.display = 'none';
}