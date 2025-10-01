require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const app = express();
const cors = require('cors');
const fs = require('fs');

app.use(cors());
app.use(express.json());

app.use(express.static('public'));

// Rota para a página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const db = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: {
        ca: fs.readFileSync('./ca.pem')
    }
});

db.connect((err) => {
    if (err) {
        console.error('❌ Erro ao conectar:', err);
        return;
    }
    console.log('✅ CONECTADO AO AIVEN!');
    console.log('🔗 Host:', process.env.MYSQL_HOST);
    
    // Fazer uma query de teste
    db.query('SELECT DATABASE() as db', (err, result) => {
        if (err) {
            console.error('Erro na query:', err);
            return;
        }
        console.log('📊 Database atual:', result[0].db);
    });
});

// Criar nota
app.post("/notas", (req, res) => {
    const { titulo, conteudo } = req.body;
    db.query(
        "INSERT INTO notas (titulo, conteudo) VALUES (?, ?)", 
        [titulo, conteudo], 
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.status(201).send({ id: result.insertId, titulo, conteudo });
        }
    );
});

// Listar notas
app.get("/notas", (req, res) => {
    db.query("SELECT * FROM notas ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).send(err);
        res.status(200).send(results);
    });
});

// Deletar nota
app.delete("/notas/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM notas WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Nota deletada com sucesso" });
    });
});

// Atualizar nota
app.put("/notas/:id", (req, res) => {
    const { id } = req.params;
    const { titulo, conteudo } = req.body;
    db.query(
        "UPDATE notas SET titulo = ?, conteudo = ? WHERE id = ?", 
        [titulo, conteudo, id], 
        (err) => {
            if (err) return res.status(500).send(err);
            res.json({ message: "Nota atualizada com sucesso" });
        }
    );
});

app.listen(PORT, () => {
    console.log("Servidor rodando em http://localhost:${PORT}");
});