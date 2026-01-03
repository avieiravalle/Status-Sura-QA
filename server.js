const express = require('express');
const fs = require('fs');
const path = require('path');

// Configuração das Portas
const PORT_RELATORIO = 3000;
const PORT_FORMULARIO = 3001;
const PORT_COMPARACAO = 3002;
const PORT_METAS = 3003;

// Função para configurar e iniciar uma instância do Express
function startServer(port, defaultFile, saveOptions = null) {
    const app = express();

    // Middlewares
    app.use(express.json({ limit: '50mb' })); // Aumentado para suportar PDFs grandes
    app.use(express.static(__dirname));

    // Rota Raiz redireciona para o arquivo específico
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, defaultFile));
    });

    // Endpoint de Salvamento (Apenas necessário onde está o formulário)
    if (saveOptions) {
        app.post('/save-data', (req, res) => {
            const fileName = saveOptions.fileName || 'dadosPreenchimento.js';
            const varName = saveOptions.varName || 'dadosRelatorio';
            
            const fileContent = `const ${varName} = ${JSON.stringify(req.body, null, 2)};`;
            const filePath = path.join(__dirname, fileName);

            fs.writeFile(filePath, fileContent, 'utf8', (err) => {
                if (err) {
                    console.error(`Erro ao salvar o arquivo ${fileName}:`, err);
                    return res.status(500).send('Erro ao salvar o arquivo no servidor.');
                }
                console.log(`Arquivo ${fileName} atualizado com sucesso!`);
                res.send({ message: 'Arquivo atualizado com sucesso!' });
            });
        });

        // Endpoint de Envio de E-mail
        app.post('/send-email', async (req, res) => {
            let nodemailer;
            try {
                nodemailer = require('nodemailer');
            } catch (e) {
                console.error("Erro: Módulo 'nodemailer' não encontrado. Execute 'npm install' para corrigir.");
                return res.status(500).send({ message: 'Funcionalidade de e-mail não configurada no servidor.' });
            }

            const { to, subject, body, attachmentName, attachmentData } = req.body;

            if (!to || !attachmentData) {
                return res.status(400).send({ message: 'Dados incompletos para envio.' });
            }

            // Configuração do Transporter (SMTP)
            // NOTA: Para produção, configure suas credenciais reais (Gmail, Outlook, AWS SES, etc.)
            const transporter = nodemailer.createTransport({
                // Exemplo genérico (substitua pelo seu SMTP):
                host: "smtp.ethereal.email", 
                port: 587,
                secure: false, 
                auth: {
                    user: 'user@ethereal.email', 
                    pass: 'pass' 
                }
            });

            const mailOptions = {
                from: '"Status Report System" <no-reply@example.com>',
                to: to,
                subject: subject || 'Relatório de Qualidade',
                text: body || 'Segue em anexo o relatório solicitado.',
                attachments: [
                    {
                        filename: attachmentName || 'relatorio.pdf',
                        content: attachmentData,
                        encoding: 'base64'
                    }
                ]
            };

            // Simulação de envio (log no console) para evitar erros sem SMTP configurado
            console.log(`[EMAIL] Enviando para: ${to} | Anexo: ${attachmentName}`);
            // await transporter.sendMail(mailOptions); // Descomente para enviar de verdade
            
            res.send({ message: 'Solicitação de envio processada com sucesso!' });
        });
    }

    app.listen(port);
}

// Inicia os servidores
startServer(PORT_RELATORIO, 'relatorio-mensal.html');
startServer(PORT_FORMULARIO, 'formulario-dados.html', { fileName: 'dadosPreenchimento.js', varName: 'dadosRelatorio' }); // Habilita save-data na porta 3001
startServer(PORT_COMPARACAO, 'comparacao-mensal-visual.html');
startServer(PORT_METAS, 'metas-2026.html', { fileName: 'dadosMetas.js', varName: 'dadosMetas' }); // Habilita save-data na porta 3003

// Logs no Console
console.log('===========================================================');
console.log('🚀 Servidores Iniciados com Sucesso!');
console.log('===========================================================');
console.log(`📊 Relatório Mensal:       http://localhost:${PORT_RELATORIO}`);
console.log(`📝 Formulário de Dados:    http://localhost:${PORT_FORMULARIO}`);
console.log(`📈 Comparação Mensal:      http://localhost:${PORT_COMPARACAO}`);
console.log(`🎯 Metas & Planejamento:   http://localhost:${PORT_METAS}`);
console.log('===========================================================');