// Máscara e validação de CNPJ, usadas no cadastro do recrutador.
//
// Módulo separado do `inscricao.ts` (que tem o CPF) porque são fluxos
// diferentes: lá é o candidato se inscrevendo, aqui é a empresa criando conta.

function somenteDigitos(valor: string): string {
    return valor.replace(/\D/g, "");
}

/** Formata progressivamente para 00.000.000/0000-00. */
export function formatarCNPJ(valor: string): string {
    const digitos = somenteDigitos(valor).slice(0, 14);

    // Fatiar em vez de encadear regex: cada bloco fica explícito e a máscara
    // funciona também com o campo parcialmente preenchido.
    const raiz = digitos.slice(0, 2);
    const meio1 = digitos.slice(2, 5);
    const meio2 = digitos.slice(5, 8);
    const filial = digitos.slice(8, 12);
    const verificador = digitos.slice(12, 14);

    let saida = raiz;
    if (meio1) saida += `.${meio1}`;
    if (meio2) saida += `.${meio2}`;
    if (filial) saida += `/${filial}`;
    if (verificador) saida += `-${verificador}`;
    return saida;
}

/**
 * Valida os dois dígitos verificadores do CNPJ (módulo 11). Ter 14 dígitos não
 * basta: sem conferir os verificadores, qualquer erro de digitação passa.
 */
export function cnpjValido(valor: string): boolean {
    const digitos = somenteDigitos(valor);
    if (digitos.length !== 14) return false;

    // Sequências repetidas (11.111.111/1111-11 etc.) satisfazem o cálculo, mas
    // não são CNPJs reais — a Receita as trata como inválidas.
    if (/^(\d)\1{13}$/.test(digitos)) return false;

    // Pesos de 2 a 9, cíclicos, aplicados da direita para a esquerda.
    const digitoVerificador = (ate: number) => {
        let soma = 0;
        let peso = 2;

        for (let i = ate - 1; i >= 0; i -= 1) {
            soma += Number(digitos[i]) * peso;
            peso = peso === 9 ? 2 : peso + 1;
        }

        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };

    return (
        digitoVerificador(12) === Number(digitos[12]) &&
        digitoVerificador(13) === Number(digitos[13])
    );
}
