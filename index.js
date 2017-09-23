// Importando dependências
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passwordHash = require('password-hash');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const ClienteSchema = require('./schemas/cliente');
// const vendedoresController = require('./controllers/vendedores');
// const loginController = require('./controllers/login');
// const clientesController = require('./controllers/clientes');

// Gerar a aplicação
const app = express();

//Middlewares
app.use(bodyParser.json());
// app.use('/vendedores', vendedoresController);
// app.use('/login', loginController);
// app.use('/clientes', clientesController);

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
            valorParcela = {
                parcela: (valor*(1 + taxaJuros))/parcelas
            };
            response.status(200).send(valorParcela);
        }
    });
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

let SimularEmprestimo = (request, response) => {
    let valor = request.body.valor;
    let parcelas = request.body.parcelas;
    let idUsuario = request.user._id;
    let taxaJuros = 0.08; //juros simples

    ClienteSchema.findById(idUsuario, (error, cliente) => {
        if(error) response.sendStatus(400);
        let renda = cliente.renda;
        if(parcelas <= 0 || valor < 0 || isNaN(valor) | isNaN(parcelas)){
            return response.sendStatus(403);
        }else if(parcelas > 6 || valor > renda * 0.30){
            return response.sendStatus(401);
        }else{
            valorParcela = {
                parcela: (valor*(1 + taxaJuros))/parcelas
            };
            return response.status(200).send(valorParcela);
        }
    });
}

//servidor
app.listen(80, () => {
    console.log("Servidor rodando na porta 80");
})