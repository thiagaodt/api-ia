import ParqueService from '../services/ParqueService.js';

export default class WebhookController {

    static async handle(req, res) {
        try {
            const queryResult = req.body.queryResult || {};
            const intentName = queryResult.intent ? queryResult.intent.displayName : 'Desconhecido';
            const parameters = queryResult.parameters || {};

            const session = req.body.session;

            let fulfillmentText = "Não entendi.";
            let outputContexts = [];

            switch (intentName) {
                case '1. Relatar Problema': 
                case 'Relatar Problema':
                    const atracaoNome = parameters.atracao;

                    if (!atracaoNome) {
                        fulfillmentText = "Qual atração apresentou problema?";
                    } else {
                        const atracao = await ParqueService.buscarTempoAtracao(atracaoNome);
                        
                        if (atracao) {
                            fulfillmentText = `A atração ${atracao.nome} tem manutenção estimada de ${atracao.tempo_manutencao} horas. Deseja registrar um chamado?`;
                            outputContexts = [{
                                name: `${session}/contexts/ctx-cadastro`,
                                lifespanCount: 5,
                                parameters: { atracao: atracao.nome }
                            }];
                        } else {
                            fulfillmentText = `Não encontrei a atração "${atracaoNome}". Tente digitar o nome completo.`;
                        }
                    }
                    break;

                case 'Coletar Dados':
                case '2. Enviar Dados':
                    const contexto = queryResult.outputContexts ? queryResult.outputContexts.find(c => c.name.includes('ctx-cadastro')) : null;
                    const atracaoParaSalvar = (contexto && contexto.parameters && contexto.parameters.atracao) 
                                              ? contexto.parameters.atracao 
                                              : parameters.atracao;

                    const telefoneUsuario = parameters.telefone || parameters.number;
                    const nomeUsuario = (parameters.nome && parameters.nome.name) ? parameters.nome.name : parameters.nome;

                    if (!atracaoParaSalvar) {
                        fulfillmentText = "Ocorreu um erro: Perdi a informação da atração (Contexto vazio). Vamos recomeçar?";
                    } else {
                        const resultado = await ParqueService.registrarChamado({
                            nome: nomeUsuario,
                            cpf: parameters.cpf,
                            telefone: telefoneUsuario,
                            localizacao: parameters.localizacao
                        }, atracaoParaSalvar);

                        fulfillmentText = `✅ Chamado registrado com sucesso!\nProtocolo: ${resultado.protocolo}\nTécnico: ${resultado.tecnicoNome}\n\nPosso ajudar em algo mais?`;
                        outputContexts = [
                            { name: `${session}/contexts/ctx-cadastro`, lifespanCount: 0 },
                            { name: `${session}/contexts/ctx-pos-atendimento`, lifespanCount: 2 }
                        ];
                    }
                    break;

                case '3. Consultar Status':
                case 'Consultar Status':
                    let valorBruto = parameters.protocolo || parameters.number;

                    if (!valorBruto) {
                        fulfillmentText = "Por favor, informe o número do protocolo.";
                    } else {
                        let protocoloFormatado = String(valorBruto).trim();
                        if (!protocoloFormatado.startsWith('#')) {
                            protocoloFormatado = '#' + protocoloFormatado;
                        }

                        const status = await ParqueService.consultarStatus(protocoloFormatado);
                        if (status) {
                            fulfillmentText = `📋 Status: ${status.status_chamado}\n\nTécnico: ${status.nome_tecnico}\n\nDeseja algo mais?`;
                        } else {
                            fulfillmentText = `Não encontrei o protocolo ${protocoloFormatado}. Verifique se digitou corretamente.`;
                        }
                        outputContexts = [{ name: `${session}/contexts/ctx-pos-atendimento`, lifespanCount: 2 }];
                    }
                    break;

                case 'Mais Ajuda - Sim':
                    fulfillmentText = "Claro! Como posso ajudar?\n1. Relatar Problema\n2. Consultar Status\n3. Horários\n4. Enfermaria";
                    outputContexts = [{ name: `${session}/contexts/ctx-pos-atendimento`, lifespanCount: 0 }];
                    break;

                case 'Mais Ajuda - Não':
                    fulfillmentText = "Obrigado! Tenha um dia mágico no parque! 🎢✨";
                    outputContexts = [{ name: `${session}/contexts/ctx-pos-atendimento`, lifespanCount: 0 }];
                    break;

                case 'Info - Horario':
                    fulfillmentText = "🕒 O parque funciona todos os dias das **09h às 22h**.\nAs filas dos brinquedos fecham às 21h30.\n\nPosso ajudar em algo mais?";
                    outputContexts = [{ name: `${session}/contexts/ctx-pos-atendimento`, lifespanCount: 2 }];
                    break;

                case 'Info - Enfermaria':
                    fulfillmentText = "🏥 O posto de primeiros socorros fica localizado na Ala principal, Bloco E\n\nPosso ajudar em algo mais?";
                    outputContexts = [{ name: `${session}/contexts/ctx-pos-atendimento`, lifespanCount: 2 }];
                    break;

                default:
                    fulfillmentText = `Intenção não tratada no código: ${intentName}`;
            }

            return res.json({
                fulfillmentText: fulfillmentText,
                outputContexts: outputContexts
            });

        } catch (error) {
            return res.json({
                fulfillmentText: "Ocorreu um erro interno no servidor (Verifique o terminal)."
            });
        }
    }
}