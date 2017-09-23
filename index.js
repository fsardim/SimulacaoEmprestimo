// Importando dependências
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passwordHash = require('password-hash');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const ClienteSchema = require('./schemas/cliente');

// Gerar a aplicação
const app = express();

//Middlewares
app.use(bodyParser.json());

//Conectar ao bd
mongoose.connect("mongodb://localhost/emprestimo");

//endpoints
app.get('/hello', (request, response) => {
    response.status(200).send("Hello world!");
});
app.get('/cliente', (request, response) => {
    ClienteSchema.find((error, clientes) => {
        if(error) {
            response.sendStatus(400)
            return;
        };
        response.status(200).send(clientes);
    });
});
app.post('/cliente', (request, response) => {
    let cliente = new ClienteSchema(request.body);
    cliente.senha = passwordHash.generate(request.body.senha);
    cliente.save((error, resultado) => {
        if(error) {
            response.status(400).send(error);
            return;
        }
        response.status(201).send(resultado);
    });
});
app.post('/login', (request, response) => {
    const query = {
        email: request.body.email
    };
    ClienteSchema.findOne(query, (error, cliente) => {
        if(cliente && passwordHash.verify(request.body.senha, cliente.senha)) {
            const token = jwt.sign({_id: cliente._id}, 'insomnia');
            response.set('Authorization', token);
            response.status(200).send(cliente);
            return;
        }
        response.sendStatus(403);
    });
});
app.post('/simulacao', expressJwt({secret: 'insomnia'}), (request, response) => {
    let rc = SimularEmprestimo(request, response);
    console.log(rc);
    if (rc > 0)
        response.status(200).send(rc);
    else
        response.sendStatus(401);
});
app.post('/emprestimo', expressJwt({secret: 'insomnia'}), (request, response) => {
    let valor = request.body.valor;
    let parcelas = request.body.parcelas;
    let idUsuario = request.user._id;
    let taxaJuros = 0.08; //juros simples

    ClienteSchema.findById(idUsuario, (error, cliente) => {
        if(error) {response.sendStatus(400); return;}
        let renda = cliente.renda;
        if(parcelas <= 0 || valor < 0 || isNaN(valor) | isNaN(parcelas)){
            response.sendStatus(403);
            return;
        }else if(parcelas > 6 || valor > renda * 0.30){
            response.sendStatus(401);
            return;
        }else{
            let valorParcela = {
                parcela: (valor*(1 + taxaJuros))/parcelas
            };
            let dadosEmprestimo = {
                valor: valor,
                parcelas: parcelas,
                data: new Date()
            }
            cliente.emprestimos = dadosEmprestimo;
            ClienteSchema.findByIdAndUpdate(idUsuario, cliente, (error, resposta) => {
                if(error){
                    response.sendStatus(400);
                    return;
                }
                response.status(200).send(valorParcela);
            });
        }
    });
});

function SimularEmprestimo(request, response){
    let valor = request.body.valor;
    let parcelas = request.body.parcelas;
    let idUsuario = request.user._id;
    let taxaJuros = 0.08; //juros simples

    ClienteSchema.findById(idUsuario, (error, cliente) => {
        if(error){
          return -400;  
        }
        let renda = cliente.renda;
        if(parcelas <= 0 || valor < 0 || isNaN(valor) | isNaN(parcelas)){
            return -403;
        }else if(parcelas > 6 || valor > renda * 0.30){
            return -401;
        }else{
            //processamento ok!
            let valorParcela = (valor*(1 + taxaJuros))/parcelas;
            console.log("Processamento ok: "+valorParcela);
            return valorParcela;
        }
    });
}

//servidor
app.listen(80, () => {
    console.log("Servidor rodando na porta 80");
})