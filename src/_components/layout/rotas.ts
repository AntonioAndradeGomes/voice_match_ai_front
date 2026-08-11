// Rotas exatas fora do app: renderizam sem navegação.
const ROUTES_WITHOUT_NAV = ["/login", "/cadastro"];

// Prefixos de rotas (cobrem também as filhas) que renderizam sem navegação.
// O chat usa a tela inteira para a conversa, sem sidebar — é o link enviado
// ao candidato, que não é o recrutador logado. A visão do recrutador sobre a
// mesma conversa é um dialog dentro de /vagas/[id] (candidato-chat-dialog.tsx),
// não uma rota própria. /candidatura é a página pública de inscrição.
const PREFIXOS_SEM_NAV = ["/chat", "/candidatura"];

// Prefixos de rotas que realmente existem no app. Qualquer pathname fora
// dessa lista é uma 404 (ou uma rota futura ainda não cadastrada aqui).
const ROUTE_PREFIXES = [
    "/",
    "/vagas",
    "/relatorios",
    "/chat",
    "/login",
    "/cadastro",
    "/candidatura",
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

// O chat do candidato é a única tela sem sidebar que também não tem marca
// própria (login e cadastro têm o painel de marca; a 404 tem o logo central),
// então é a única onde o logo flutuante faz sentido. Ver FloatingLogo.
export function rotaEhChat(pathname: string) {
    return rotaCasa(pathname, "/chat");
}

// Rotas acessíveis sem login. É um critério independente de rotaTemNav: essa
// aqui é sobre permissão, a outra é só sobre a sidebar aparecer ou não —
// /candidatura e /chat não têm sidebar E são públicas, mas
// /vagas/[id]/[candidatoId]/chat (o dialog "Ver chat" do recrutador) exige
// login mesmo não tendo rota própria hoje.
const PREFIXOS_PUBLICOS = ["/login", "/cadastro", "/candidatura", "/chat"];

export function rotaPublica(pathname: string) {
    return PREFIXOS_PUBLICOS.some((prefixo) => rotaCasa(pathname, prefixo));
}
