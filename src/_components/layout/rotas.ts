// Rotas exatas fora do app: renderizam sem navegação.
const ROUTES_WITHOUT_NAV = ["/login", "/cadastro"];

// Prefixos de rotas (cobrem também as filhas) que renderizam sem navegação.
// O chat usa a tela inteira para a conversa, sem sidebar.
const PREFIXOS_SEM_NAV = ["/chat"];

// Prefixos de rotas que realmente existem no app. Qualquer pathname fora
// dessa lista é uma 404 (ou uma rota futura ainda não cadastrada aqui).
const ROUTE_PREFIXES = [
    "/",
    "/vagas",
    "/relatorios",
    "/chat",
    "/login",
    "/cadastro",
];

export function rotaCasa(pathname: string, prefixo: string) {
    return prefixo === "/"
        ? pathname === "/"
        : pathname === prefixo || pathname.startsWith(`${prefixo}/`);
}

export function rotaExiste(pathname: string) {
    return ROUTE_PREFIXES.some((prefixo) => rotaCasa(pathname, prefixo));
}

// Rotas onde a sidebar aparece. Usado tanto pela sidebar (pra saber se
// renderiza) quanto pelo toggle de tema flutuante (que só aparece quando a
// sidebar NÃO está presente, já que normalmente o toggle mora nela).
export function rotaTemNav(pathname: string) {
    if (!rotaExiste(pathname)) return false;
    if (ROUTES_WITHOUT_NAV.includes(pathname)) return false;
    return !PREFIXOS_SEM_NAV.some((prefixo) => rotaCasa(pathname, prefixo));
}
