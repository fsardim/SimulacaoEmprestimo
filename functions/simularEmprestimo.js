function SimularEmprestimo(valor, parcelas, renda, taxaJuros){
    resposta = {
        ehValida: false,
        msg: "",
        valorParcela: 0
    };
    if(parcelas <= 0 || valor < 0 || isNaN(valor) | isNaN(parcelas)){
        resposta.msg = "Valor inválido";
        return resposta;
    }else if(parcelas > 6 || valor > renda * 0.30){
        resposta.msg = "Valor de parcelas inválido ou valor do empréstimo supera 30% da renda";
        return resposta;
    }else{
        resposta.ehValida = true;
        resposta.msg = "Simulação ok!";
        resposta.valorParcela = (valor*(1 + taxaJuros))/parcelas;
        return resposta;
    }
}
module.exports = SimularEmprestimo;