// ==========================
// CONFIGURAÇÃO SUPABASE
// Use a chave anon pública para o frontend
// ==========================
const SUPABASE_URL = "https://htsorgukdbfuuypiuksm.supabase.co"; // SUBSTITUA PELA URL DO SEU PROJETO SUPABASE
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0c29yZ3VrZGJmdXV5cGl1a3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDQ0NjMsImV4cCI6MjA4NTI4MDQ2M30.MVwsWMW1AX-tTDu5Vz_x9y6anb-DO10rZW2L_2B0NVM"; // SUBSTITUA PELA SUA CHAVE ANON PÚBLICA

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Referências aos elementos HTML
const empresaNomeInput = document.getElementById('empresaNome');
const dataInicioInput = document.getElementById('dataInicio');
const dataFimInput = document.getElementById('dataFim');
const gerarRelatorioBtn = document.getElementById('gerarRelatorioBtn');
const loadingMessage = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const pdfOutputSection = document.getElementById('pdfOutput');
const pdfViewer = document.getElementById('pdfViewer');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');

// Elementos para exibir métricas
const totalLeadsElem = document.getElementById('totalLeads');
const totalAgendamentosElem = document.getElementById('totalAgendamentos');
const comparecimentosElem = document.getElementById('comparecimentos');
const totalFechamentosElem = document.getElementById('totalFechamentos');
const faturamentoElem = document.getElementById('faturamento');
const ticketMedioElem = document.getElementById('ticketMedio');
const taxaAgendamentoElem = document.getElementById('taxaAgendamento');
const taxaComparecimentoElem = document.getElementById('taxaComparecimento');
const taxaConversaoElem = document.getElementById('taxaConversao');

// ==========================
// FUNÇÃO PARA ATUALIZAR A INTERFACE
// ==========================
function updateUI(metrics) {
    totalLeadsElem.textContent = metrics.totalLeads.toLocaleString('pt-BR');
    totalAgendamentosElem.textContent = metrics.totalAgendamentos.toLocaleString('pt-BR');
    comparecimentosElem.textContent = metrics.comparecimentos.toLocaleString('pt-BR');
    totalFechamentosElem.textContent = metrics.totalFechamentos.toLocaleString('pt-BR');
    faturamentoElem.textContent = `R$ ${metrics.faturamento.toFixed(2).replace('.', ',')}`;
    ticketMedioElem.textContent = `R$ ${metrics.ticketMedio.toFixed(2).replace('.', ',')}`;
    taxaAgendamentoElem.textContent = `${metrics.taxaAgendamento.toFixed(2).replace('.', ',')}%`;
    taxaComparecimentoElem.textContent = `${metrics.taxaComparecimento.toFixed(2).replace('.', ',')}%`;
    taxaConversaoElem.textContent = `${metrics.taxaConversao.toFixed(2).replace('.', ',')}%`;
}

// ==========================
// FUNÇÃO PRINCIPAL PARA GERAR RELATÓRIO
// ==========================
async function gerarRelatorio() {
    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    pdfOutputSection.style.display = 'none'; // Esconde a seção do PDF ao iniciar
    gerarRelatorioBtn.disabled = true;

    const EMPRESA_NOME = empresaNomeInput.value.trim();
    const DATA_INICIO = dataInicioInput.value;
    const DATA_FIM = dataFimInput.value;
    let EMPRESA_ID = null; // Vai armazenar o UUID da empresa

    // Resetar valores da UI
    updateUI({
        totalLeads: 0, totalAgendamentos: 0, comparecimentos: 0,
        totalFechamentos: 0, faturamento: 0, ticketMedio: 0,
        taxaAgendamento: 0, taxaComparecimento: 0, taxaConversao: 0
    });

    try {
        if (!EMPRESA_NOME || !DATA_INICIO || !DATA_FIM) {
            throw new Error("Por favor, preencha todos os campos: Nome da Clínica, Data Início e Data Fim.");
        }

        // --- NOVO: Buscar EMPRESA_ID pelo NOME da Empresa ---
        const { data: empresaData, error: empresaError } = await client
            .from('empresas') // **Assumindo que você tem uma tabela 'empresas' com 'nome' e 'id'**
            .select('id')
            .eq('nome', EMPRESA_NOME)
            .single();

        if (empresaError || !empresaData) {
            console.error("Erro ao buscar empresa:", empresaError);
            throw new Error(`Clínica "${EMPRESA_NOME}" não encontrada. Verifique o nome.`);
        }
        EMPRESA_ID = empresaData.id;
        // --- FIM NOVO ---


        // ==========================
        // LEADS
        // ==========================
        const { data: leads, error: leadsError } = await client
            .from('leads')
            .select('*')
            .eq('empresa_id', EMPRESA_ID)
            .gte('created_at', DATA_INICIO)
            .lte('created_at', DATA_FIM);

        if (leadsError) throw leadsError;

        const totalLeads = leads.length;

        // ==========================
        // AGENDAMENTOS
        // ==========================
        const { data: agendamentos, error: agError } = await client
            .from('agendamentos')
            .select('*')
            .eq('empresa_id', EMPRESA_ID)
            .gte('created_at', DATA_INICIO)
            .lte('created_at', DATA_FIM);

        if (agError) throw agError;

        const totalAgendamentos = agendamentos.length;
        const comparecimentos = agendamentos.filter(a => a.compareceu).length;

        // ==========================
        // NEGÓCIOS
        // ==========================
        const { data: negocios, error: negError } = await client
            .from('negocios')
            .select('*')
            .eq('empresa_id', EMPRESA_ID)
            .eq('fechado', true)
            .gte('created_at', DATA_INICIO)
            .lte('created_at', DATA_FIM);

        if (negError) throw negError;

        const totalFechamentos = negocios.length;

        const faturamento = negocios.reduce((acc, n) => acc + Number(n.valor), 0);

        const ticketMedio = totalFechamentos > 0
            ? faturamento / totalFechamentos
            : 0;

        const taxaAgendamento = totalLeads > 0
            ? (totalAgendamentos / totalLeads) * 100
            : 0;

        const taxaComparecimento = totalAgendamentos > 0
            ? (comparecimentos / totalAgendamentos) * 100
            : 0;

        const taxaConversao = totalLeads > 0
            ? (totalFechamentos / totalLeads) * 100
            : 0;

        // Atualizar a interface com os dados
        const metrics = {
            totalLeads, totalAgendamentos, comparecimentos,
            totalFechamentos, faturamento, ticketMedio,
            taxaAgendamento, taxaComparecimento, taxaConversao
        };
        updateUI(metrics);

        // ==========================
        // GERAR PDF (NOVO LAYOUT)
        // ==========================
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF(); // Default 'p', 'mm', 'a4'

        const marginX = 20;
        let currentY = 20;
        const lineHeight = 7; // Standard line height for text
        const sectionSpacing = 15; // Space between main sections
        const subSectionSpacing = 10; // Space between a heading and its content

        // --- Header ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(44, 62, 80); // Dark blue/grey
        doc.text("RELATÓRIO DE PERFORMANCE CLÍNICA", doc.internal.pageSize.width / 2, currentY, { align: "center" });
        currentY += 10;

        doc.setFontSize(14);
        doc.setTextColor(52, 73, 94); // Slightly lighter dark blue
        doc.text("Máquina de Pacientes", doc.internal.pageSize.width / 2, currentY, { align: "center" });
        currentY += 15;

        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100); // Grey
        doc.text(`Relatório para: ${EMPRESA_NOME}`, marginX, currentY); // Usando o nome da clínica
        currentY += lineHeight;

        doc.text(`Período: ${DATA_INICIO} a ${DATA_FIM}`, marginX, currentY);
        currentY += 10; // Espaço extra após o período

        // Linha horizontal separadora
        doc.setDrawColor(200, 200, 200); // Cinza claro
        doc.line(marginX, currentY, doc.internal.pageSize.width - marginX, currentY);
        currentY += 10;

        // --- Visão Geral de Métricas Chave ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(39, 174, 96); // Verde para destaque
        doc.text("Resumo de Destaques", marginX, currentY);
        currentY += subSectionSpacing;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0); // Preto para valores

        const cardWidth = (doc.internal.pageSize.width - (3 * marginX) - (2 * 5)) / 3; // 3 cartões, 2 lacunas de 5mm
        const cardHeight = 30;
        const cardGap = 5;

        let cardCurrentX = marginX;

        // Cartão 1: Total Leads
        doc.setFillColor(236, 240, 241); // Fundo cinza claro
        doc.rect(cardCurrentX, currentY, cardWidth, cardHeight, 'F');
        doc.setTextColor(52, 73, 94); // Azul escuro
        doc.setFontSize(10);
        doc.text("LEADS GERADOS", cardCurrentX + cardWidth / 2, currentY + 10, { align: "center" });
        doc.setFontSize(18);
        doc.setTextColor(41, 128, 185); // Azul
        doc.text(totalLeads.toLocaleString('pt-BR'), cardCurrentX + cardWidth / 2, currentY + 22, { align: "center" });
        cardCurrentX += cardWidth + cardGap;

        // Cartão 2: Faturamento
        doc.setFillColor(236, 240, 241);
        doc.rect(cardCurrentX, currentY, cardWidth, cardHeight, 'F');
        doc.setTextColor(52, 73, 94);
        doc.setFontSize(10);
        doc.text("FATURAMENTO", cardCurrentX + cardWidth / 2, currentY + 10, { align: "center" });
        doc.setFontSize(18);
        doc.setTextColor(39, 174, 96); // Verde
        doc.text(`R$ ${faturamento.toFixed(2).replace('.', ',')}`, cardCurrentX + cardWidth / 2, currentY + 22, { align: "center" });
        cardCurrentX += cardWidth + cardGap;

        // Cartão 3: Taxa de Conversão
        doc.setFillColor(236, 240, 241);
        doc.rect(cardCurrentX, currentY, cardWidth, cardHeight, 'F');
        doc.setTextColor(52, 73, 94);
        doc.setFontSize(10);
        doc.text("TAXA DE CONVERSÃO", cardCurrentX + cardWidth / 2, currentY + 10, { align: "center" });
        doc.setFontSize(18);
        doc.setTextColor(142, 68, 173); // Roxo
        doc.text(`${taxaConversao.toFixed(2).replace('.', ',')}%`, cardCurrentX + cardWidth / 2, currentY + 22, { align: "center" });
        currentY += cardHeight + sectionSpacing; // Mover Y após os cartões


        // --- Seção: Resultados Operacionais ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(52, 73, 94);
        doc.text("Resultados Operacionais", marginX, currentY);
        currentY += subSectionSpacing;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Total de Leads: ${totalLeads}`, marginX, currentY);
        currentY += lineHeight;
        doc.text(`Agendamentos Realizados: ${totalAgendamentos}`, marginX, currentY);
        currentY += lineHeight;
        doc.text(`Comparecimentos: ${comparecimentos}`, marginX, currentY);
        currentY += lineHeight;
        doc.text(`Fechamentos (Novos Pacientes): ${totalFechamentos}`, marginX, currentY);
        currentY += sectionSpacing;

        // --- Seção: Resultados Financeiros ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(52, 73, 94);
        doc.text("Resultados Financeiros", marginX, currentY);
        currentY += subSectionSpacing;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Faturamento Bruto: R$ ${faturamento.toFixed(2).replace('.', ',')}`, marginX, currentY);
        currentY += lineHeight;
        doc.text(`Ticket Médio por Fechamento: R$ ${ticketMedio.toFixed(2).replace('.', ',')}`, marginX, currentY);
        currentY += sectionSpacing;

        // --- Seção: Indicadores Chave de Performance ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(52, 73, 94);
        doc.text("Indicadores Chave de Performance", marginX, currentY);
        currentY += subSectionSpacing;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Taxa de Agendamento: ${taxaAgendamento.toFixed(2).replace('.', ',')}%`, marginX, currentY);
        currentY += lineHeight;
        doc.text(`Taxa de Comparecimento: ${taxaComparecimento.toFixed(2).replace('.', ',')}%`, marginX, currentY);
        currentY += lineHeight;
        doc.text(`Taxa de Conversão: ${taxaConversao.toFixed(2).replace('.', ',')}%`, marginX, currentY);
        currentY += sectionSpacing;

        // --- Rodapé ---
        const footerY = doc.internal.pageSize.height - 15;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150); // Cinza claro para rodapé
        doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, marginX, footerY);
        doc.text("Desenvolvido por Vendisia", doc.internal.pageSize.width - marginX, footerY, { align: "right" });

        // --- Exibir PDF no iframe e configurar download ---
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        pdfViewer.src = pdfUrl;
        downloadPdfBtn.href = pdfUrl;
        downloadPdfBtn.download = `relatorio_clinica_${EMPRESA_NOME.replace(/ /g, '_')}_${DATA_INICIO}_${DATA_FIM}.pdf`;
        pdfOutputSection.style.display = 'block'; // Mostra a seção do PDF

    } catch (err) {
        console.error("Erro ao gerar relatório:", err);
        errorMessage.textContent = `Erro ao gerar relatório: ${err.message || "Verifique o console para mais detalhes."}`;
        errorMessage.style.display = 'block';
    } finally {
        loadingMessage.style.display = 'none';
        gerarRelatorioBtn.disabled = false;
    }
}

// Adicionar listener ao botão
gerarRelatorioBtn.addEventListener('click', gerarRelatorio);

// Define as datas padrão no carregamento
window.addEventListener('load', () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    dataInicioInput.value = firstDayOfMonth.toISOString().split('T')[0];
    dataFimInput.value = lastDayOfMonth.toISOString().split('T')[0];
});
