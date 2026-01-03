/**
 * utils.js - Funções utilitárias compartilhadas para cálculos de métricas de QA.
 */

/**
 * Calcula a porcentagem de cobertura de testes com base no número de User Stories e Casos de Teste.
 * Meta: 3 casos de teste por User Story.
 */
function calculateTestCoverage(usCount, testCaseCount) {
    if (!usCount || usCount === 0) return 0;
    const targetTestCases = usCount * 3;
    const coverage = targetTestCases > 0 
        ? Math.round((testCaseCount / targetTestCases) * 100)
        : 0;
    return Math.min(100, coverage);
}

/**
 * Calcula a cobertura de testes consolidada do mês (soma de US e CTs das sprints).
 */
function getMonthTestCoverage(centerData) {
    if (!centerData) return 0;
    const s1 = centerData.sprint1 || {};
    const s2 = centerData.sprint2 || {};
    const totalUS = (s1.usSprint || 0) + (s2.usSprint || 0);
    const totalCasosTeste = (s1.casosTestePorUs || 0) + (s2.casosTestePorUs || 0);
    return calculateTestCoverage(totalUS, totalCasosTeste);
}

/**
 * Calcula a média de cobertura de código para uma sprint.
 */
function getSprintAverageCodeCoverage(sprintData) {
    if (!sprintData || !sprintData.coberturaCodigo) return 0;
    const coverage = sprintData.coberturaCodigo;
    const values = [coverage.linhas, coverage.classes, coverage.metodos, coverage.branches];
    const validValues = values.filter(v => typeof v === 'number');
    if (validValues.length === 0) return 0;
    return validValues.reduce((a, b) => a + b, 0) / validValues.length;
}

/**
 * Retorna o total de bugs não produtivos de uma sprint.
 */
function getSprintTotalNonProdBugs(sprintData) {
    if (!sprintData || !sprintData.bugsNaoProdutivos) return 0;
    const bugs = sprintData.bugsNaoProdutivos;
    return (bugs.baixa || 0) + (bugs.media || 0) + (bugs.alta || 0);
}

/**
 * Retorna o objeto de bugs de produção, com fallback para soma das sprints se o consolidado não existir.
 */
function getProductionBugsObject(centerData) {
    if (centerData.bugsProducao) return centerData.bugsProducao;
    const s1 = centerData.sprint1?.bugsProducao || { baixa: 0, media: 0, alta: 0 };
    const s2 = centerData.sprint2?.bugsProducao || { baixa: 0, media: 0, alta: 0 };
    return {
        baixa: s1.baixa + s2.baixa,
        media: s1.media + s2.media,
        alta: s1.alta + s2.alta
    };
}

/**
 * Retorna o total numérico de bugs de produção.
 */
function getTotalProductionBugs(centerData) {
    const bugs = getProductionBugsObject(centerData);
    return (bugs.baixa || 0) + (bugs.media || 0) + (bugs.alta || 0);
}

function getAverageSprintMetric(centerData, metricKey) {
    if (!centerData) return 0;
    const s1 = centerData.sprint1?.[metricKey] || 0;
    const s2 = centerData.sprint2?.[metricKey] || 0;
    if (s1 > 0 && s2 > 0) return (s1 + s2) / 2;
    return s1 || s2;
}

/**
 * Formata o nome do produto para exibição correta na interface.
 * Centraliza a regra de negócio para nomes como 'Integracoes'.
 */
function formatProductName(name) {
    return name === 'Integracoes' ? 'Integrações' : name;
}