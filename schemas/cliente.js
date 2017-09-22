const mongoose = require('mongoose');

const ClienteSchema = mongoose.model("Cliente", {
    nome:{type: String, required: true},
    renda: {type: Number, required: true},
    email: {type: String, required: true},
    senha: {type: String, required: true},
    emprestimos: [{
        valor: {type: Number},
        parcelas: {type: Number},
        data: {type: Date}
    }]
});
module.exports = ClienteSchema;