// Importando dependências
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passwordHash = require('password-hash');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const SimularEmprestimo = require('./functions/simularEmprestimo');
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
    let valor = request.body.valor;
    let parcelas = request.body.parcelas;
    let idUsuario = request.user._id;
    let taxaJuros = 0.08; //juros simples

    ClienteSchema.findById(idUsuario, (error, cliente) => {
        if(error) {response.sendStatus(400); return;}
        let renda = cliente.renda;
        let simulacao = SimularEmprestimo(valor, parcelas, renda, taxaJuros);
        
        if (simulacao.ehValida)
            response.status(200).send(simulacao);
        else
            response.status(401).send(simulacao);
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
        let simulacao = SimularEmprestimo(valor, parcelas, renda, taxaJuros);
        
        if(simulacao.ehValida){
            let dadosEmprestimo = {
                valor: valor,
                parcelas: parcelas,
                data: new Date()
            }
            //inclui o novo empréstimo no set de empréstimos do cliente
            cliente.emprestimos.addToSet(dadosEmprestimo);

            ClienteSchema.findByIdAndUpdate(idUsuario, cliente, (error, resposta) => {
                if(error){response.sendStatus(400); return;}
                response.status(200).send(cliente);
            });
        }else{
            response.status(401).send(simulacao);
        }
    });
});

//servidor
app.listen(80, () => {
    console.log("Servidor rodando na porta 80");
});