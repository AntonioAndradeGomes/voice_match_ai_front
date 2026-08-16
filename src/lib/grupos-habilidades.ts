// Grupos de habilidades: templates de perfil de competências que o recrutador
// monta uma vez e aplica na criação de vaga, em vez de escolher skill por skill
// e reajustar peso por peso toda vez.
//
// Persiste em localStorage pelo mesmo motivo de lib/habilidades.ts: o backend
// tem o router /habilidades, mas nenhuma migration cria as tabelas — a chamada
// responde 500. Quando isso for resolvido, troque o corpo destas funções
// mantendo as assinaturas.

import type { SkillComPeso } from "@/types";

const CHAVE = "voicematch:grupos-habilidades";

/** Faixa do peso, a mesma que a criação de vaga usa nos sliders. */
export const PESO_MINIMO = 1;
export const PESO_MAXIMO = 10;

export interface GrupoHabilidades {
    id: string;
    nome: string;
    descricao: string;
    hardSkills: SkillComPeso[];
    softSkills: SkillComPeso[];
    createdAt: string;
}

/** O que a tela entrega para salvar. Sem `id` é criação; com `id`, edição. */
export interface EntradaGrupo {
    id?: string;
    nome: string;
    descricao: string;
    hardSkills: SkillComPeso[];
    softSkills: SkillComPeso[];
}

function isBrowser() {
    return typeof window !== "undefined";
}

/** Comparação contra duplicata: ignora caixa e acento, como no catálogo. */
function chaveComparacao(nome: string) {
    return nome
        .trim()
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
}

/**
 * Saneia uma lista vinda do storage. Um grupo com peso fora da faixa ou com
 * skill sem nome quebraria os sliders da criação de vaga, e o dado veio de uma
 * versão anterior ou de edição manual — descartar o inválido é mais seguro do
 * que confiar.
 */
function sanearSkills(valor: unknown): SkillComPeso[] {
    if (!Array.isArray(valor)) return [];

    return valor.flatMap((item) => {
        if (typeof item !== "object" || item === null) return [];

        const { nome, peso } = item as { nome?: unknown; peso?: unknown };
        if (typeof nome !== "string" || nome.trim() === "") return [];

        const numero = Number(peso);
        const pesoValido = Number.isFinite(numero)
            ? Math.min(PESO_MAXIMO, Math.max(PESO_MINIMO, Math.round(numero)))
            : PESO_MINIMO;

        return [{ nome: nome.trim(), peso: pesoValido }];
    });
}

function sanearGrupo(valor: unknown): GrupoHabilidades | null {
    if (typeof valor !== "object" || valor === null) return null;

    const bruto = valor as Partial<GrupoHabilidades>;
    if (typeof bruto.id !== "string" || typeof bruto.nome !== "string") {
        return null;
    }
    if (bruto.nome.trim() === "") return null;

    return {
        id: bruto.id,
        nome: bruto.nome.trim(),
        descricao: typeof bruto.descricao === "string" ? bruto.descricao : "",
        hardSkills: sanearSkills(bruto.hardSkills),
        softSkills: sanearSkills(bruto.softSkills),
        createdAt:
            typeof bruto.createdAt === "string"
                ? bruto.createdAt
                : new Date().toISOString(),
    };
}

function lerLista(): GrupoHabilidades[] {
    if (!isBrowser()) return [];

    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return [];

    try {
        const salvo = JSON.parse(bruto);
        if (!Array.isArray(salvo)) return [];
        return salvo
            .map(sanearGrupo)
            .filter((grupo): grupo is GrupoHabilidades => grupo !== null);
    } catch {
        return [];
    }
}

function salvarLista(grupos: GrupoHabilidades[]) {
    if (!isBrowser()) return;
    window.localStorage.setItem(CHAVE, JSON.stringify(grupos));
}

/** Ordenado por nome: a lista é um catálogo para procurar, não um histórico. */
export function getGrupos(): GrupoHabilidades[] {
    return lerLista().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function getGrupoById(id: string): GrupoHabilidades | null {
    return lerLista().find((grupo) => grupo.id === id) ?? null;
}

/**
 * Já existe grupo com este nome? `ignorarId` deixa a edição manter o próprio
 * nome sem se acusar de duplicata.
 */
export function existeNome(nome: string, ignorarId?: string): boolean {
    const alvo = chaveComparacao(nome);
    return lerLista().some(
        (grupo) =>
            grupo.id !== ignorarId && chaveComparacao(grupo.nome) === alvo,
    );
}

export function totalSkills(grupo: GrupoHabilidades): number {
    return grupo.hardSkills.length + grupo.softSkills.length;
}

/**
 * Cria ou atualiza. Devolve `null` quando o nome está vazio ou repetido, para
 * a tela distinguir "não salvei" de "salvei" sem reler a lista.
 */
export function salvarGrupo(entrada: EntradaGrupo): GrupoHabilidades | null {
    const nome = entrada.nome.trim();
    if (!nome) return null;
    if (existeNome(nome, entrada.id)) return null;

    const lista = lerLista();
    const existente = entrada.id
        ? lista.find((grupo) => grupo.id === entrada.id)
        : undefined;

    const grupo: GrupoHabilidades = {
        id: existente?.id ?? crypto.randomUUID(),
        nome,
        descricao: entrada.descricao.trim(),
        hardSkills: sanearSkills(entrada.hardSkills),
        softSkills: sanearSkills(entrada.softSkills),
        createdAt: existente?.createdAt ?? new Date().toISOString(),
    };

    salvarLista(
        existente
            ? lista.map((item) => (item.id === grupo.id ? grupo : item))
            : [...lista, grupo],
    );

    return grupo;
}

export function removerGrupo(id: string): GrupoHabilidades[] {
    const restante = lerLista().filter((grupo) => grupo.id !== id);
    salvarLista(restante);
    return restante.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/**
 * Aplica as skills de um grupo sobre as que já estão no formulário.
 *
 * Mescla em vez de substituir: o peso do grupo vence, porque é ele que
 * padroniza o requisito, mas skill que o recrutador escolheu à mão e não está
 * no grupo continua ali. No caso comum — formulário vazio — o resultado é
 * idêntico a preencher do zero, e no caso em que já havia trabalho feito nada
 * é perdido em silêncio.
 */
export function mesclarSkills(
    atuais: SkillComPeso[],
    doGrupo: SkillComPeso[],
): SkillComPeso[] {
    const pesoDoGrupo = new Map(
        doGrupo.map((skill) => [skill.nome, skill.peso]),
    );

    const atualizadas = atuais.map((skill) =>
        pesoDoGrupo.has(skill.nome)
            ? { ...skill, peso: pesoDoGrupo.get(skill.nome)! }
            : skill,
    );

    const jaPresentes = new Set(atuais.map((skill) => skill.nome));
    const novas = doGrupo.filter((skill) => !jaPresentes.has(skill.nome));

    return [...atualizadas, ...novas];
}
