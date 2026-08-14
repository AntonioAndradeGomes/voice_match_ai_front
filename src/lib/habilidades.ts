// Catálogo de habilidades oferecidas na criação de vaga.
//
// Persiste em localStorage, e não no backend, porque hoje não existe endpoint
// de habilidades (os routers cobrem vaga, candidato, candidatura, entrevista,
// usuário e áudio). Quando existir, troque o corpo destas funções mantendo as
// assinaturas — mesma estratégia do resto de lib/storage.ts.

const CHAVE = "voicematch:habilidades";

export type TipoHabilidade = "hard" | "soft";

/**
 * Lista base, usada enquanto o recrutador não personaliza nada. Também é o
 * alvo do "restaurar padrão".
 */
export const HARD_SKILLS_PADRAO = [
    "Excel avançado",
    "SQL",
    "Inglês avançado",
    "Gestão de projetos",
    "CRM (Salesforce/HubSpot)",
    "Copywriting",
    "SEO",
    "Análise de dados",
    "Programação (JavaScript/Python)",
    "Design gráfico",
    "Contabilidade",
    "Recrutamento e seleção",
    "Atendimento ao cliente",
    "Negociação comercial",
    "Edição de vídeo",
    "Marketing digital",
    "Gestão financeira",
    "Power BI",
    "Vendas B2B",
];

export const SOFT_SKILLS_PADRAO = [
    "Comunicação",
    "Trabalho em equipe",
    "Proatividade",
    "Resiliência",
    "Liderança",
    "Adaptabilidade",
    "Pensamento crítico",
    "Organização",
    "Empatia",
    "Criatividade",
    "Autonomia",
    "Foco em resultado",
    "Inteligência emocional",
    "Gestão do tempo",
];

export interface CatalogoHabilidades {
    hard: string[];
    soft: string[];
}

function isBrowser() {
    return typeof window !== "undefined";
}

function padrao(): CatalogoHabilidades {
    return { hard: [...HARD_SKILLS_PADRAO], soft: [...SOFT_SKILLS_PADRAO] };
}

/**
 * Catálogo atual. Cai no padrão quando não há nada salvo, quando o JSON está
 * corrompido ou quando falta uma das listas — assim uma gravação parcial
 * antiga não deixa a criação de vaga sem opções.
 */
export function getCatalogo(): CatalogoHabilidades {
    if (!isBrowser()) return padrao();

    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return padrao();

    try {
        const salvo = JSON.parse(bruto) as Partial<CatalogoHabilidades>;
        return {
            hard: Array.isArray(salvo.hard) ? salvo.hard : [...HARD_SKILLS_PADRAO],
            soft: Array.isArray(salvo.soft) ? salvo.soft : [...SOFT_SKILLS_PADRAO],
        };
    } catch {
        return padrao();
    }
}

function salvar(catalogo: CatalogoHabilidades) {
    if (!isBrowser()) return;
    window.localStorage.setItem(CHAVE, JSON.stringify(catalogo));
}

function normalizar(nome: string) {
    return nome.trim();
}

/** Comparação usada contra duplicata: ignora caixa e acento. */
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
 * Acrescenta ao fim da lista e devolve o catálogo novo. Devolve `null` quando
 * o nome está vazio ou já existe, para a tela distinguir "não fiz nada" de
 * "salvei" sem precisar comparar as listas.
 */
export function adicionarHabilidade(
    tipo: TipoHabilidade,
    nome: string,
): CatalogoHabilidades | null {
    const limpo = normalizar(nome);
    if (!limpo) return null;

    const catalogo = getCatalogo();
    if (existeHabilidade(catalogo, tipo, limpo)) return null;

    const atualizado: CatalogoHabilidades = {
        ...catalogo,
        [tipo]: [...catalogo[tipo], limpo],
    };
    salvar(atualizado);
    return atualizado;
}

export function removerHabilidade(
    tipo: TipoHabilidade,
    nome: string,
): CatalogoHabilidades {
    const catalogo = getCatalogo();
    const atualizado: CatalogoHabilidades = {
        ...catalogo,
        [tipo]: catalogo[tipo].filter((item) => item !== nome),
    };
    salvar(atualizado);
    return atualizado;
}

export function restaurarPadrao(): CatalogoHabilidades {
    const novo = padrao();
    salvar(novo);
    return novo;
}

/**
 * As vagas guardam o nome da habilidade, não uma referência ao catálogo.
 * Remover uma daqui não altera vaga nenhuma já criada — é só a lista de
 * sugestões do formulário. A tela avisa isso ao usuário.
 */
export function getHardSkills() {
    return getCatalogo().hard;
}

export function getSoftSkills() {
    return getCatalogo().soft;
}
