// Grupos de habilidades: templates de perfil de competências que o recrutador
// monta uma vez e aplica na criação de vaga, em vez de escolher skill por skill
// e reajustar peso por peso toda vez.

import { apiFetch, API_BASE_URL } from "@/lib/api";
import { fetchCatalogoAPI, getCatalogo } from "@/lib/habilidades";
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

export interface EntradaGrupo {
    id?: string;
    nome: string;
    descricao: string;
    hardSkills: SkillComPeso[];
    softSkills: SkillComPeso[];
}

interface GrupoHabilidadeItemBackend {
    habilidade_id: string;
    peso: number;
    obrigatoriedade: "OBRIGATORIA" | "DESEJAVEL";
    habilidade?: {
        id: string;
        nome: string;
        tipo: "HARD" | "SOFT";
        categoria: string;
    };
}

interface GrupoHabilidadeBackend {
    id: string;
    nome: string;
    tipo: "HARD" | "SOFT";
    descricao: string | null;
    empresa_id: string | null;
    data_criacao: string;
    itens: GrupoHabilidadeItemBackend[];
}

function isBrowser() {
    return typeof window !== "undefined";
}

function chaveComparacao(nome: string) {
    return nome
        .trim()
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
}

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

function mapearBackendParaFrontend(b: GrupoHabilidadeBackend): GrupoHabilidades {
    const hard: SkillComPeso[] = [];
    const soft: SkillComPeso[] = [];

    for (const item of b.itens || []) {
        const skillNome = item.habilidade?.nome;
        if (!skillNome) continue;

        const skillObj: SkillComPeso = {
            nome: skillNome,
            peso: item.peso,
        };

        if (item.habilidade?.tipo === "SOFT" || (b.tipo === "SOFT" && item.habilidade?.tipo !== "HARD")) {
            soft.push(skillObj);
        } else {
            hard.push(skillObj);
        }
    }

    return {
        id: b.id,
        nome: b.nome,
        descricao: b.descricao ?? "",
        hardSkills: hard,
        softSkills: soft,
        createdAt: b.data_criacao || new Date().toISOString(),
    };
}

/**
 * Busca grupos de habilidades diretamente da API do Backend e atualiza o cache local.
 */
export async function fetchGruposAPI(): Promise<GrupoHabilidades[]> {
    try {
        const res = await apiFetch(`${API_BASE_URL}/grupos-habilidades/?limit=100`);
        if (res.ok) {
            const data: GrupoHabilidadeBackend[] = await res.json();
            const gruposFormatados = data.map(mapearBackendParaFrontend);
            salvarLista(gruposFormatados);
            return gruposFormatados.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        }
    } catch (e) {
        console.warn("Falha ao buscar grupos de habilidades da API. Usando cache local:", e);
    }
    return getGrupos();
}

/** Ordenado por nome: a lista é um catálogo para procurar, não um histórico. */
export function getGrupos(): GrupoHabilidades[] {
    return lerLista().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function getGrupoById(id: string): GrupoHabilidades | null {
    return lerLista().find((grupo) => grupo.id === id) ?? null;
}

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
 * Cria ou atualiza grupo de habilidades com persistência na API do Backend.
 */
export async function salvarGrupoAPI(entrada: EntradaGrupo): Promise<GrupoHabilidades | null> {
    const nome = entrada.nome.trim();
    if (!nome) return null;
    if (existeNome(nome, entrada.id)) return null;

    // Garante que o catálogo com IDs de habilidades esteja carregado
    let catalogo = getCatalogo();
    if (!catalogo.itensDetalhados || catalogo.itensDetalhados.length === 0) {
        catalogo = await fetchCatalogoAPI();
    }

    const habsMap = new Map<string, string>();
    for (const h of catalogo.itensDetalhados || []) {
        habsMap.set(chaveComparacao(h.nome), h.id);
    }

    const itensBackend: { habilidade_id: string; peso: number; obrigatoriedade: string }[] = [];

    for (const hs of entrada.hardSkills) {
        const habId = habsMap.get(chaveComparacao(hs.nome));
        if (habId) {
            itensBackend.push({
                habilidade_id: habId,
                peso: hs.peso,
                obrigatoriedade: "OBRIGATORIA",
            });
        }
    }

    for (const ss of entrada.softSkills) {
        const habId = habsMap.get(chaveComparacao(ss.nome));
        if (habId) {
            itensBackend.push({
                habilidade_id: habId,
                peso: ss.peso,
                obrigatoriedade: "DESEJAVEL",
            });
        }
    }

    const payload = {
        nome,
        tipo: entrada.hardSkills.length >= entrada.softSkills.length ? "HARD" : "SOFT",
        descricao: entrada.descricao.trim() || null,
        empresa_id: null,
        itens: itensBackend,
    };

    try {
        const url = entrada.id
            ? `${API_BASE_URL}/grupos-habilidades/${entrada.id}`
            : `${API_BASE_URL}/grupos-habilidades/`;
        const method = entrada.id ? "PUT" : "POST";

        const res = await apiFetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            const dataBackend: GrupoHabilidadeBackend = await res.json();
            const grupoFront = mapearBackendParaFrontend(dataBackend);
            
            const lista = lerLista();
            salvarLista(
                entrada.id
                    ? lista.map((item) => (item.id === grupoFront.id ? grupoFront : item))
                    : [...lista, grupoFront]
            );
            return grupoFront;
        }
    } catch (e) {
        console.warn("Falha ao salvar grupo de habilidades na API:", e);
    }

    // Fallback local caso a API esteja inacessível
    return salvarGrupo(entrada);
}

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

export async function removerGrupoAPI(id: string): Promise<GrupoHabilidades[]> {
    try {
        await apiFetch(`${API_BASE_URL}/grupos-habilidades/${id}`, {
            method: "DELETE",
        });
    } catch (e) {
        console.warn("Falha ao excluir grupo de habilidades na API:", e);
    }
    return removerGrupo(id);
}

export function removerGrupo(id: string): GrupoHabilidades[] {
    const restante = lerLista().filter((grupo) => grupo.id !== id);
    salvarLista(restante);
    return restante.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

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
