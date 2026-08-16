import { apiFetch, API_BASE_URL } from "@/lib/api";

const CHAVE = "voicematch:habilidades";

export type TipoHabilidade = "hard" | "soft";

export interface HabilidadeBackend {
    id: string;
    nome: string;
    tipo: "HARD" | "SOFT";
    categoria: string;
    empresa_id: string | null;
}

export interface CatalogoHabilidades {
    hard: string[];
    soft: string[];
    itensDetalhados?: HabilidadeBackend[];
}

export const HARD_SKILLS_PADRAO = [
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript (ES6+)",
    "Vue.js",
    "Angular",
    "HTML5 / CSS3",
    "Tailwind CSS",
    "Redux / Zustand",
    "Consumo de APIs (REST / GraphQL)",
    "Node.js (Express / NestJS)",
    "Python (FastAPI / Django)",
    "Java (Spring Boot)",
    "C# (.NET Core)",
    "Go (Golang)",
    "PHP (Laravel)",
    "Criação de APIs RESTful e WebSockets",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "Docker & Docker Compose",
    "Kubernetes",
    "AWS (S3, EC2, Lambda)",
    "CI/CD (GitHub Actions / GitLab)",
    "Git & Git Flow",
    "Linux & Nginx",
    "Clean Architecture & SOLID",
    "Testes Automatizados (Jest, Pytest, Cypress)",
];

export const SOFT_SKILLS_PADRAO = [
    "Comunicação Clara e Articulada",
    "Resolução de Problemas sob Pressão",
    "Trabalho em Equipe e Colaboração",
    "Adaptabilidade e Aprendizado Rápido",
    "Organização e Gestão de Tempo",
    "Pensamento Crítico e Análise",
    "Liderança e Mentoria Técnica",
    "Gestão de Conflitos e Inteligência Emocional",
];

function isBrowser() {
    return typeof window !== "undefined";
}

function padrao(): CatalogoHabilidades {
    return { hard: [...HARD_SKILLS_PADRAO], soft: [...SOFT_SKILLS_PADRAO], itensDetalhados: [] };
}

function salvar(catalogo: CatalogoHabilidades) {
    if (!isBrowser()) return;
    window.localStorage.setItem(CHAVE, JSON.stringify(catalogo));
}

function normalizar(nome: string) {
    return nome.trim();
}

function chaveComparacao(nome: string) {
    return nome
        .trim()
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
}

export function existeHabilidade(
    catalogo: CatalogoHabilidades,
    tipo: TipoHabilidade,
    nome: string,
) {
    const alvo = chaveComparacao(nome);
    return catalogo[tipo].some((item) => chaveComparacao(item) === alvo);
}

/**
 * Catálogo em cache síncrono local.
 */
export function getCatalogo(): CatalogoHabilidades {
    if (!isBrowser()) return padrao();

    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return padrao();

    try {
        const salvo = JSON.parse(bruto) as Partial<CatalogoHabilidades>;
        return {
            hard: Array.isArray(salvo.hard) && salvo.hard.length > 0 ? salvo.hard : [...HARD_SKILLS_PADRAO],
            soft: Array.isArray(salvo.soft) && salvo.soft.length > 0 ? salvo.soft : [...SOFT_SKILLS_PADRAO],
            itensDetalhados: salvo.itensDetalhados || [],
        };
    } catch {
        return padrao();
    }
}

/**
 * Busca a lista completa de habilidades diretamente do Backend via API.
 */
export async function fetchCatalogoAPI(): Promise<CatalogoHabilidades> {
    try {
        const res = await apiFetch(`${API_BASE_URL}/habilidades/?limit=200`);
        if (res.ok) {
            const data: HabilidadeBackend[] = await res.json();
            const hard = data.filter((h) => h.tipo === "HARD").map((h) => h.nome);
            const soft = data.filter((h) => h.tipo === "SOFT").map((h) => h.nome);

            const catalogo: CatalogoHabilidades = {
                hard: hard.length > 0 ? hard : [...HARD_SKILLS_PADRAO],
                soft: soft.length > 0 ? soft : [...SOFT_SKILLS_PADRAO],
                itensDetalhados: data,
            };
            salvar(catalogo);
            return catalogo;
        }
    } catch (e) {
        console.warn("Falha ao buscar habilidades da API. Usando cache local:", e);
    }
    return getCatalogo();
}

/**
 * Adiciona habilidade via API no backend e atualiza o cache local.
 */
export async function adicionarHabilidadeAPI(
    tipo: TipoHabilidade,
    nome: string,
    categoria: string = "Geral",
): Promise<CatalogoHabilidades | null> {
    const limpo = normalizar(nome);
    if (!limpo) return null;

    const catalogo = getCatalogo();
    if (existeHabilidade(catalogo, tipo, limpo)) return null;

    try {
        const res = await apiFetch(`${API_BASE_URL}/habilidades/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome: limpo,
                tipo: tipo.toUpperCase(),
                categoria,
            }),
        });

        if (res.ok) {
            const novaHab: HabilidadeBackend = await res.json();
            const atualizado: CatalogoHabilidades = {
                ...catalogo,
                [tipo]: [...catalogo[tipo], limpo],
                itensDetalhados: [...(catalogo.itensDetalhados || []), novaHab],
            };
            salvar(atualizado);
            return atualizado;
        }
    } catch (e) {
        console.warn("Falha ao salvar habilidade na API. Salvando localmente:", e);
    }

    // Fallback local
    const atualizado: CatalogoHabilidades = {
        ...catalogo,
        [tipo]: [...catalogo[tipo], limpo],
    };
    salvar(atualizado);
    return atualizado;
}

/**
 * Remove habilidade via API no backend e atualiza o cache local.
 */
export async function removerHabilidadeAPI(
    tipo: TipoHabilidade,
    nome: string,
): Promise<CatalogoHabilidades> {
    const catalogo = getCatalogo();
    const itemDetalhado = catalogo.itensDetalhados?.find(
        (h) => h.nome.toLowerCase() === nome.toLowerCase() && h.tipo.toLowerCase() === tipo,
    );

    if (itemDetalhado?.id) {
        try {
            await apiFetch(`${API_BASE_URL}/habilidades/${itemDetalhado.id}`, {
                method: "DELETE",
            });
        } catch (e) {
            console.warn("Falha ao remover habilidade da API:", e);
        }
    }

    const atualizado: CatalogoHabilidades = {
        ...catalogo,
        [tipo]: catalogo[tipo].filter((item) => item !== nome),
        itensDetalhados: catalogo.itensDetalhados?.filter(
            (h) => !(h.nome.toLowerCase() === nome.toLowerCase() && h.tipo.toLowerCase() === tipo),
        ),
    };
    salvar(atualizado);
    return atualizado;
}

export function adicionarHabilidade(tipo: TipoHabilidade, nome: string): CatalogoHabilidades | null {
    const limpo = normalizar(nome);
    if (!limpo) return null;
    const catalogo = getCatalogo();
    if (existeHabilidade(catalogo, tipo, limpo)) return null;
    const atualizado: CatalogoHabilidades = {
        ...catalogo,
        [tipo]: [...catalogo[tipo], limpo],
    };
    salvar(atualizado);
    // Dispara criação assíncrona em background
    adicionarHabilidadeAPI(tipo, nome).catch(console.error);
    return atualizado;
}

export function removerHabilidade(tipo: TipoHabilidade, nome: string): CatalogoHabilidades {
    const catalogo = getCatalogo();
    const atualizado: CatalogoHabilidades = {
        ...catalogo,
        [tipo]: catalogo[tipo].filter((item) => item !== nome),
    };
    salvar(atualizado);
    // Dispara remoção assíncrona em background
    removerHabilidadeAPI(tipo, nome).catch(console.error);
    return atualizado;
}

export function restaurarPadrao(): CatalogoHabilidades {
    const novo = padrao();
    salvar(novo);
    return novo;
}

export function getHardSkills() {
    return getCatalogo().hard;
}

export function getSoftSkills() {
    return getCatalogo().soft;
}
