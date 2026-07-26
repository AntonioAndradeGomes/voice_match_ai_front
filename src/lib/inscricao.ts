// Máscaras e validações do formulário público de candidatura. Funções puras:
// nada de React aqui, para que as regras possam ser testadas e reaproveitadas
// por uma validação de servidor quando existir backend.

export const TAMANHO_MAXIMO_CURRICULO = 5 * 1024 * 1024; // 5 MB
export const EXTENSAO_CURRICULO = ".pdf";
export const MIME_CURRICULO = "application/pdf";

function somenteDigitos(valor: string): string {
    return valor.replace(/\D/g, "");
}

export function formatarCPF(valor: string): string {
    const digitos = somenteDigitos(valor).slice(0, 11);

    return digitos
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

/**
 * Valida os dois dígitos verificadores do CPF. Um CPF com 11 dígitos ainda pode
 * ser inválido, então checar só o comprimento deixaria passar erro de digitação.
 */
export function cpfValido(valor: string): boolean {
    const digitos = somenteDigitos(valor);
    if (digitos.length !== 11) return false;

    // Sequências repetidas (111.111.111-11 etc.) satisfazem o cálculo mas não
    // são CPFs reais — a Receita as trata como inválidas.
    if (/^(\d)\1{10}$/.test(digitos)) return false;

    const digitoVerificador = (ate: number) => {
        let soma = 0;
        for (let i = 0; i < ate; i++) {
            soma += Number(digitos[i]) * (ate + 1 - i);
        }
        const resto = (soma * 10) % 11;
        return resto === 10 ? 0 : resto;
    };

    return (
        digitoVerificador(9) === Number(digitos[9]) &&
        digitoVerificador(10) === Number(digitos[10])
    );
}

/** Máscara de celular brasileiro: (82) 99999-9999. */
export function formatarTelefoneBR(valor: string): string {
    const digitos = somenteDigitos(valor).slice(0, 11);
    if (digitos.length <= 2) return digitos.replace(/^(\d{0,2})/, "($1");

    const ddd = digitos.slice(0, 2);
    const resto = digitos.slice(2);
    // Celular tem 9 dígitos; fixo tem 8. O corte muda conforme o tamanho.
    const corte = resto.length > 8 ? 5 : 4;

    return resto.length <= corte
        ? `(${ddd}) ${resto}`
        : `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

export function telefoneBRValido(valor: string): boolean {
    const digitos = somenteDigitos(valor);
    return digitos.length === 10 || digitos.length === 11;
}

/** Número internacional: aceita formato livre, exige um mínimo de dígitos. */
export function telefoneInternacionalValido(valor: string): boolean {
    const digitos = somenteDigitos(valor);
    return digitos.length >= 8 && digitos.length <= 15;
}

export function emailValido(valor: string): boolean {
    // Deliberadamente permissivo: a validação que vale é o email chegar. Barra
    // só o que é claramente digitação errada (sem @, sem domínio, com espaço).
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
}

export function linkedinValido(valor: string): boolean {
    const limpo = valor.trim();
    if (limpo === "") return false;

    try {
        const url = new URL(
            limpo.startsWith("http") ? limpo : `https://${limpo}`,
        );
        return url.hostname.endsWith("linkedin.com") && url.pathname.length > 1;
    } catch {
        return false;
    }
}

/** Normaliza o LinkedIn para uma URL absoluta antes de salvar. */
export function normalizarLinkedin(valor: string): string {
    const limpo = valor.trim();
    return limpo.startsWith("http") ? limpo : `https://${limpo}`;
}

/**
 * Só PDF. Checa a extensão E o MIME type: extensão sozinha é trocável, e alguns
 * navegadores não preenchem o MIME — exigir os dois só quando ambos existem
 * evita rejeitar arquivo legítimo.
 */
export function curriculoInvalido(arquivo: File): string | null {
    const extensao = arquivo.name
        .slice(arquivo.name.lastIndexOf("."))
        .toLowerCase();

    if (extensao !== EXTENSAO_CURRICULO) {
        return "Formato não aceito. Envie um arquivo PDF.";
    }
    if (arquivo.type !== "" && arquivo.type !== MIME_CURRICULO) {
        return "O arquivo não parece ser um PDF válido.";
    }
    if (arquivo.size > TAMANHO_MAXIMO_CURRICULO) {
        return "Arquivo maior que 5 MB.";
    }
    return null;
}

export interface CamposCandidatura {
    nome: string;
    cpf: string;
    naoBrasileiro: boolean;
    email: string;
    telefone: string;
    linkedin: string;
    curriculo: File | null;
}

export type ErrosCandidatura = Partial<Record<keyof CamposCandidatura, string>>;

export function validarCandidatura(
    campos: CamposCandidatura,
): ErrosCandidatura {
    const erros: ErrosCandidatura = {};

    if (campos.nome.trim().length < 3) {
        erros.nome = "Informe seu nome completo.";
    }

    // Candidato estrangeiro não tem CPF — o campo some e para de ser exigido.
    if (!campos.naoBrasileiro && !cpfValido(campos.cpf)) {
        erros.cpf =
            campos.cpf.trim() === "" ? "Informe seu CPF." : "CPF inválido.";
    }

    if (!emailValido(campos.email)) {
        erros.email = "Informe um email válido.";
    }

    const telefoneOk = campos.naoBrasileiro
        ? telefoneInternacionalValido(campos.telefone)
        : telefoneBRValido(campos.telefone);
    if (!telefoneOk) {
        erros.telefone = "Informe um celular válido com DDD.";
    }

    if (!linkedinValido(campos.linkedin)) {
        erros.linkedin = "Cole a URL completa do seu perfil do LinkedIn.";
    }

    if (campos.curriculo === null) {
        erros.curriculo = "Anexe seu currículo em PDF.";
    } else {
        const problema = curriculoInvalido(campos.curriculo);
        if (problema) erros.curriculo = problema;
    }

    return erros;
}
