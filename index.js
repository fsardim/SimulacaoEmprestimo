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
        console.log(cliente);
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

    console.log(valor);
    console.log(parcelas);

    if(parcelas === 0 || valor < 0 || isNaN(valor) | isNaN(parcelas)){
        response.sendStatus(403);
        return;
    }else if(parcelas > 6){ //validar tbm a renda do cliente
        response.sendStatus(401);
        return;
    }else{
        valorParcela = {
            parcela: valor/parcelas
        };
        response.status(200).send(valorParcela);
    }
});

//servidor
app.listen(80, () => {
    console.log("Servidor rodando na porta 80");
})