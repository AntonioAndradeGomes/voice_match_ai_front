// Normalização do que já está gravado no localStorage.
//
// O formato de `Vaga` mudou depois que já existiam vagas salvas: `descricaoFuncao`
// virou `descricao`, `area`/`funcao` saíram, as skills passaram de `string[]` para
// `SkillComPeso[]` e entraram `modalidade`/`localizacao`. O que está no storage
// continua no formato antigo, e `JSON.parse` não valida nada — o cast em
// `readList` só finge que o dado tem o tipo novo.
//
// Sem converter, a tela recebe campo `undefined` e quebra no primeiro acesso
// (`vaga.localizacao.trim()`). Fazer isso na leitura mantém o conserto num ponto
// só: toda tela passa a receber `Vaga` completa. Quando existir backend, este
// arquivo sai junto com o localStorage.

import {
    criarPerfilNeutro,
    MODALIDADES,
    type Modalidade,
    type SkillComPeso,
    type Vaga,
} from "@/types";

/** Peso neutro para skill que veio do formato antigo, sem peso declarado.
 *  Mesma convenção do `criarPerfilNeutro` (5 numa escala de 0 a 10). */
const PESO_NEUTRO = 5;

function texto(valor: unknown): string {
    return typeof valor === "string" ? valor : "";
}

function normalizarSkills(valor: unknown): SkillComPeso[] {
    if (!Array.isArray(valor)) return [];

    return valor
        .map((item): SkillComPeso => {
            // Formato antigo: array de strings.
            if (typeof item === "string") {
                return { nome: item, peso: PESO_NEUTRO };
            }
            if (item !== null && typeof item === "object") {
                const registro = item as Record<string, unknown>;
                const peso = Number(registro.peso);
                return {
                    nome: texto(registro.nome),
                    peso: Number.isFinite(peso) ? peso : PESO_NEUTRO,
                };
            }
            return { nome: "", peso: PESO_NEUTRO };
        })
        .filter((skill) => skill.nome !== "");
}

function normalizarModalidade(valor: unknown): Modalidade {
    // Vaga antiga não tinha modalidade. "presencial" é o padrão do formulário
    // de criação, então é o palpite que menos contraria o resto do app.
    return MODALIDADES.includes(valor as Modalidade)
        ? (valor as Modalidade)
        : "presencial";
}

export function normalizarVaga(bruta: unknown): Vaga {
    const dados = (bruta ?? {}) as Record<string, unknown>;

    const hardRaw =
        dados.requisitos_hard &&
        typeof dados.requisitos_hard === "object" &&
        "items" in (dados.requisitos_hard as object)
            ? (dados.requisitos_hard as Record<string, unknown>).items
            : dados.hardSkills;

    const softRaw =
        dados.requisitos_soft &&
        typeof dados.requisitos_soft === "object" &&
        "items" in (dados.requisitos_soft as object)
            ? (dados.requisitos_soft as Record<string, unknown>).items
            : dados.softSkills;

    return {
        id: texto(dados.id),
        titulo: texto(dados.titulo),
        // `descricaoFuncao` é o nome antigo do mesmo campo.
        descricao: texto(dados.descricao) || texto(dados.descricaoFuncao),
        hardSkills: normalizarSkills(hardRaw),
        softSkills: normalizarSkills(softRaw),
        experienciaPrevia: texto(dados.experienciaPrevia),
        modalidade: normalizarModalidade(dados.modalidade),
        localizacao: texto(dados.localizacao),
        perfilIdeal:
            dados.perfilIdeal !== null && typeof dados.perfilIdeal === "object"
                ? (dados.perfilIdeal as Vaga["perfilIdeal"])
                : criarPerfilNeutro(),
        createdAt:
            texto(dados.data_criacao) ||
            texto(dados.createdAt) ||
            new Date(0).toISOString(),
    };
}
