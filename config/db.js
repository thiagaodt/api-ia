import mysql from 'mysql2';

export default class Database {

    #conexao;

    constructor() {
        console.log("Iniciando Pool de Conexão...");
        
        this.#conexao = mysql.createPool({
            host: '127.0.0.1', 
            database: 'parque', 
            user: 'root', 
            password: '', 
            idleTimeout: 30000,
            connectionLimit: 10
        });

        this.#conexao.getConnection((err, conn) => {
            if (err) {
                console.error("[ERRO CRÍTICO DB] Não foi possível conectar ao MySQL!", err.code);
            } else {
                console.log("Conexão com MySQL estabelecida com sucesso!");
                conn.release();
            }
        });
    }

    ExecutaComando(sql, valores) {
        var cnn = this.#conexao;
        return new Promise((resolve, reject) => {
            cnn.query(sql, valores, (error, results) => {
                if (error) {
                    console.error("error.sqlMessage);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    }

    ExecutaComandoLastInserted(sql, valores) {
        var cnn = this.#conexao;
        return new Promise((resolve, reject) => {
            console.log(`Executando: ${sql}`);
            cnn.query(sql, valores, (error, results) => {
                if (error) {
                    console.error(error.sqlMessage);
                    reject(error);
                } else {
                    resolve(results.insertId);
                }
            });
        });
    }
}