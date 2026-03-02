import Database from '../config/db.js'; 

class ParqueService {
    
    constructor() {
        this.db = new Database();
    }

    async buscarTempoAtracao(nomeAtracao) {
        const termoBusca = nomeAtracao.replace(/[- ]/g, '%');
        const sql = `SELECT * FROM atracoes WHERE nome LIKE ?`;
        const rows = await this.db.ExecutaComando(sql, [`%${termoBusca}%`]);
        return rows.length > 0 ? rows[0] : null;
    }

    async registrarChamado(dadosCliente, nomeAtracao) {
        const atracao = await this.buscarTempoAtracao(nomeAtracao);
        if (!atracao) throw new Error("Atração não encontrada.");
        let clienteId;
        const sqlBuscaCliente = `SELECT id FROM clientes WHERE cpf = ?`;
        const rowsCliente = await this.db.ExecutaComando(sqlBuscaCliente, [dadosCliente.cpf]);
        
        if (rowsCliente.length > 0) {
            clienteId = rowsCliente[0].id;
        } else {
            const sqlInsertCliente = `INSERT INTO clientes (nome, cpf, telefone) VALUES (?, ?, ?)`;
            clienteId = await this.db.ExecutaComandoLastInserted(sqlInsertCliente, [
                dadosCliente.nome, 
                dadosCliente.cpf, 
                dadosCliente.telefone
            ]);
        }

        const sqlTecnico = `SELECT id, nome FROM tecnicos WHERE disponivel = 1 ORDER BY RAND() LIMIT 1`;
        const rowsTecnico = await this.db.ExecutaComando(sqlTecnico, []);
        
        if (rowsTecnico.length === 0) throw new Error("Nenhum técnico disponível.");
        const tecnico = rowsTecnico[0];

        const protocolo = '#' + Math.floor(Math.random() * 1000000);
        
        const sqlChamado = `INSERT INTO chamados (numero_protocolo, id_cliente, id_tecnico, id_atracao, localizacao_usuario, status_chamado) VALUES (?, ?, ?, ?, ?, 'Aberto')`;
        
        await this.db.ExecutaComandoLastInserted(sqlChamado, [
            protocolo, 
            clienteId, 
            tecnico.id, 
            atracao.id,
            dadosCliente.localizacao
        ]);

        return { protocolo, tecnicoNome: tecnico.nome };
    }

    async consultarStatus(protocolo) {
        const sql = `
            SELECT c.status_chamado, t.nome as nome_tecnico, a.nome as nome_atracao
            FROM chamados c
            JOIN tecnicos t ON c.id_tecnico = t.id
            JOIN atracoes a ON c.id_atracao = a.id
            WHERE c.numero_protocolo = ?
        `;
        
        const rows = await this.db.ExecutaComando(sql, [protocolo]);
        return rows.length > 0 ? rows[0] : null;
    }
}

export default new ParqueService();