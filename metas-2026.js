document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a estrutura de dados se não existir
    if (typeof dadosMetas === 'undefined') {
        console.error("Arquivo dadosMetas.js não carregado.");
        window.dadosMetas = {};
    }

    if (!dadosMetas.planejamento2026) {
        dadosMetas.planejamento2026 = {
            metas: {
                coberturaCodigo: 50,
                passRate: 95,
                coberturaTestes: 100,
                leadTimeTestes: 2.5,
                leadTimeBugs: 2.0,
                bugsProducao: 2,
                bugsNaoProd: 10,
                automacao: 5
            },
            metasMensais: {}, // Armazena arrays de 12 posições para cada métrica
            atividades: []
        };
    }

    const data = dadosMetas.planejamento2026;
    const kpiForm = document.getElementById('kpi-form');
    const timelineBody = document.getElementById('timeline-body');
    const timelineHeaderRow = document.getElementById('timeline-header-row');
    const activitiesBody = document.getElementById('activities-body');
    const addActivityBtn = document.getElementById('add-activity-btn');
    const addTimelineRowBtn = document.getElementById('add-timeline-row-btn');
    const distributeBtn = document.getElementById('distribute-btn');
    const saveBtn = document.getElementById('save-btn');
    const savePdfBtn = document.getElementById('save-pdf-btn');
    let timelineChart; // Variável para armazenar a instância do gráfico

    // Configuração das métricas para a linha do tempo
    const metricConfig = [
        { key: 'coberturaCodigo', label: 'Cob. Código (%)' },
        { key: 'passRate', label: 'Pass Rate (%)' },
        { key: 'coberturaTestes', label: 'Cob. Testes (%)' },
        { key: 'leadTimeTestes', label: 'Lead Time Testes' },
        { key: 'leadTimeBugs', label: 'Lead Time Bugs' },
        { key: 'bugsProducao', label: 'Bugs Prod (Max)' },
        { key: 'bugsNaoProd', label: 'Bugs Não-Prod' },
        { key: 'automacao', label: 'Automação (Novos)' }
    ];

    // Retorna lista combinada de métricas padrão + personalizadas
    function getMetricsList() {
        return [...metricConfig, ...(data.customMetrics || [])];
    }

    // --- Funções de Carregamento ---

    function loadKPIs() {
        const inputs = kpiForm.querySelectorAll('input');
        inputs.forEach(input => {
            const path = input.dataset.path.split('.')[1]; // ex: 'coberturaCodigo'
            if (data.metas[path] !== undefined) {
                input.value = data.metas[path];
            }
        });
    }

    function loadTimeline() {
        // Garante que a estrutura existe
        if (!data.metasMensais) data.metasMensais = {};
        getMetricsList().forEach(m => {
            if (!data.metasMensais[m.key]) {
                data.metasMensais[m.key] = new Array(12).fill('');
            }
        });

        // Renderiza Cabeçalho (Meses)
        const months = ['Métrica', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        timelineHeaderRow.innerHTML = months.map(m => `<th>${m}</th>`).join('');

        // Renderiza Corpo (Linhas por métrica)
        timelineBody.innerHTML = '';
        getMetricsList().forEach(metric => {
            const row = document.createElement('tr');
            
            // Coluna Nome da Métrica
            const tdLabel = document.createElement('td');
            tdLabel.textContent = metric.label;
            
            // Botão de excluir para métricas personalizadas
            if (metric.key.startsWith('custom_')) {
                const delBtn = document.createElement('span');
                delBtn.textContent = ' 🗑️';
                delBtn.style.cursor = 'pointer';
                delBtn.title = 'Remover esta meta';
                delBtn.style.marginLeft = '10px';
                delBtn.onclick = () => removeTimelineRow(metric.key, metric.label);
                tdLabel.appendChild(delBtn);
            }

            row.appendChild(tdLabel);

            // Colunas dos Meses (Inputs)
            for (let i = 0; i < 12; i++) {
                const td = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'number';
                input.step = '0.1';
                input.className = 'timeline-input';
                input.dataset.metric = metric.key;
                input.dataset.month = i;
                
                // Carrega valor salvo ou vazio
                const savedVal = data.metasMensais[metric.key][i];
                input.value = (savedVal !== undefined && savedVal !== null) ? savedVal : '';
                
                td.appendChild(input);
                row.appendChild(td);
            }
            timelineBody.appendChild(row);
        });

        // Adiciona listeners para atualizar o gráfico em tempo real
        const inputs = timelineBody.querySelectorAll('input.timeline-input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                // Atualiza o dado localmente antes de renderizar o gráfico
                const metric = input.dataset.metric;
                const monthIdx = parseInt(input.dataset.month);
                const val = input.value === '' ? '' : parseFloat(input.value);
                
                if (!data.metasMensais[metric]) data.metasMensais[metric] = new Array(12).fill('');
                data.metasMensais[metric][monthIdx] = val;
                
                updateTimelineChart();
            });
        });

        updateTimelineChart();
    }

    function updateTimelineChart() {
        const ctx = document.getElementById('timeline-chart').getContext('2d');
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        // Cores para as linhas
        const colors = [
            '#0033A0', '#00A79D', '#e74c3c', '#f39c12', 
            '#9b59b6', '#34495e', '#2ecc71', '#e67e22'
        ];

        const datasets = getMetricsList().map((metric, index) => {
            const rawData = data.metasMensais[metric.key] || new Array(12).fill('');
            // Converte strings vazias para null para que o gráfico não desenhe zero
            const plotData = rawData.map(v => (v === '' || v === null) ? null : parseFloat(v));

            return {
                label: metric.label,
                data: plotData,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length],
                tension: 0.3,
                fill: false,
                spanGaps: true // Conecta pontos ignorando nulls
            };
        });

        if (timelineChart) {
            timelineChart.data.datasets = datasets;
            timelineChart.update();
        } else {
            timelineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Curva de Evolução das Metas'
                        },
                        legend: {
                            position: 'bottom'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Valor da Meta'
                            }
                        }
                    }
                }
            });
        }
    }

    function distributeLinearProgression() {
        let updated = false;
        getMetricsList().forEach(metric => {
            const inputs = timelineBody.querySelectorAll(`input[data-metric="${metric.key}"]`);
            if (inputs.length !== 12) return;

            const valJan = parseFloat(inputs[0].value);
            const valDec = parseFloat(inputs[11].value);

            if (!isNaN(valJan) && !isNaN(valDec)) {
                const step = (valDec - valJan) / 11;
                const isInt = ['bugsProducao', 'bugsNaoProd', 'automacao'].includes(metric.key);

                // Garante inicialização do array no objeto de dados
                if (!data.metasMensais[metric.key]) data.metasMensais[metric.key] = new Array(12).fill('');
                
                // Salva Jan e Dez explicitamente
                data.metasMensais[metric.key][0] = valJan;
                data.metasMensais[metric.key][11] = valDec;

                for (let i = 1; i < 11; i++) {
                    let calculated = valJan + (step * i);
                    calculated = isInt ? Math.round(calculated) : parseFloat(calculated.toFixed(1));
                    
                    inputs[i].value = calculated;
                    data.metasMensais[metric.key][i] = calculated;
                }
                updated = true;
            }
        });

        if (updated) {
            updateTimelineChart();
            showToast('Valores distribuídos linearmente (Jan ➔ Dez).');
        } else {
            showToast('Preencha os valores de Janeiro e Dezembro para calcular.', true);
        }
    }

    function loadActivities() {
        activitiesBody.innerHTML = '';
        data.atividades.forEach((activity, index) => {
            renderActivityRow(activity, index);
        });
    }

    function renderActivityRow(activity = {}, index = null) {
        const row = document.createElement('tr');
        const isNew = index === null;
        const idx = isNew ? data.atividades.length : index;

        row.innerHTML = `
            <td><input type="text" class="act-desc" value="${activity.descricao || ''}" placeholder="Descrição da atividade"></td>
            <td><input type="text" class="act-owner" value="${activity.responsavel || ''}" placeholder="Nome"></td>
            <td><input type="date" class="act-date" value="${activity.prazo || ''}"></td>
            <td>
                <select class="act-status">
                    <option value="Pendente" ${activity.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="Em Andamento" ${activity.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                    <option value="Concluído" ${activity.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
                    <option value="Atrasado" ${activity.status === 'Atrasado' ? 'selected' : ''}>Atrasado</option>
                </select>
            </td>
            <td style="text-align: center;">
                <button class="btn-delete" title="Remover">🗑️</button>
            </td>
        `;

        // Listener para remover
        row.querySelector('.btn-delete').addEventListener('click', () => {
            row.remove();
        });

        activitiesBody.appendChild(row);
    }

    // --- Funções de Salvamento ---

    function saveKPIs() {
        const inputs = kpiForm.querySelectorAll('input');
        inputs.forEach(input => {
            const path = input.dataset.path.split('.')[1];
            data.metas[path] = parseFloat(input.value) || 0;
        });
    }

    function saveTimeline() {
        if (!data.metasMensais) data.metasMensais = {};
        
        const inputs = timelineBody.querySelectorAll('input.timeline-input');
        inputs.forEach(input => {
            const metric = input.dataset.metric;
            const monthIdx = parseInt(input.dataset.month);
            const val = input.value === '' ? '' : parseFloat(input.value);
            
            if (!data.metasMensais[metric]) data.metasMensais[metric] = new Array(12).fill('');
            data.metasMensais[metric][monthIdx] = val;
        });
    }

    function saveActivities() {
        const rows = activitiesBody.querySelectorAll('tr');
        const newActivities = [];

        rows.forEach(row => {
            const desc = row.querySelector('.act-desc').value;
            if (desc.trim()) { // Só salva se tiver descrição
                newActivities.push({
                    descricao: desc,
                    responsavel: row.querySelector('.act-owner').value,
                    prazo: row.querySelector('.act-date').value,
                    status: row.querySelector('.act-status').value
                });
            }
        });

        data.atividades = newActivities;
    }

    async function saveData() {
        saveKPIs();
        saveTimeline();
        saveActivities();

        // Atualiza o objeto global
        dadosMetas.planejamento2026 = data;

        try {
            const response = await fetch('/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosMetas)
            });

            if (response.ok) {
                showToast('Planejamento salvo com sucesso!');
            } else {
                showToast('Erro ao salvar dados.', true);
            }
        } catch (error) {
            console.error(error);
            showToast('Erro de conexão.', true);
        }
    }

    function showToast(msg, isError = false) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.backgroundColor = isError ? '#e74c3c' : '#2ecc71';
        toast.textContent = msg;
        document.getElementById('toast-container').appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // --- Funções de Gerenciamento de Metas Personalizadas ---

    function addTimelineRow() {
        const name = prompt("Digite o nome da nova meta:");
        if (!name || !name.trim()) return;

        if (!data.customMetrics) data.customMetrics = [];
        
        const key = 'custom_' + Date.now();
        data.customMetrics.push({ key: key, label: name.trim() });
        
        loadTimeline();
        showToast(`Meta "${name}" adicionada.`);
    }

    function removeTimelineRow(key, label) {
        if (confirm(`Deseja remover a meta "${label}" e todos os seus dados?`)) {
            data.customMetrics = data.customMetrics.filter(m => m.key !== key);
            if (data.metasMensais[key]) delete data.metasMensais[key];
            
            loadTimeline();
            showToast('Meta removida.');
        }
    }

    // --- Função de Exportação PDF ---

    async function saveToPDF() {
        if (!window.jspdf || !window.html2canvas) {
            alert('Bibliotecas PDF não carregadas.');
            return;
        }

        const originalText = savePdfBtn.textContent;
        savePdfBtn.textContent = 'Gerando PDF...';
        savePdfBtn.disabled = true;

        try {
            const { jsPDF } = window.jspdf;
            const element = document.querySelector('.container');
            
            // Captura o elemento visualmente
            const canvas = await html2canvas(element, {
                scale: 2, // Melhora a qualidade
                useCORS: true,
                logging: false,
                windowWidth: element.scrollWidth // Garante que tabelas largas sejam capturadas
            });

            const imgData = canvas.toDataURL('image/png');
            
            // Calcula as dimensões para uma única página longa
            // Mantém a largura A4 (210mm) e ajusta a altura proporcionalmente
            const pdfWidth = 210;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // Cria o PDF com tamanho personalizado para caber tudo em uma página
            const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
            
            // Adiciona a imagem ocupando toda a página
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            pdf.save('Planejamento_Qualidade_2026.pdf');
            showToast('PDF salvo com sucesso!');
        } catch (error) {
            console.error(error);
            showToast('Erro ao gerar PDF.', true);
        } finally {
            savePdfBtn.textContent = originalText;
            savePdfBtn.disabled = false;
        }
    }

    // --- Event Listeners ---
    addActivityBtn.addEventListener('click', () => renderActivityRow());
    addTimelineRowBtn.addEventListener('click', addTimelineRow);
    distributeBtn.addEventListener('click', distributeLinearProgression);
    saveBtn.addEventListener('click', saveData);
    if (savePdfBtn) savePdfBtn.addEventListener('click', saveToPDF);

    // Inicialização
    loadKPIs();
    loadTimeline();
    loadActivities();
});