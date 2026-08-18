// Estado global de "o servidor respondeu?".
//
// Existe por causa de um efeito colateral da camada de fallback do storage.ts:
// `getVagas()` grava a lista no localStorage a cada leitura bem-sucedida, mas
// `getCandidatosByVaga()` nunca grava. Com o backend fora do ar, a tela mostra
// as vagas do cache — dado real, porém velho — e os candidatos aparecem
// zerados, porque nunca houve cache deles. O recrutador lê isso como "essa vaga
// não tem candidatos", que é a conclusão errada.
//
// Guardar isso aqui, e não em contexto do React, é de propósito: quem detecta a
// falha é o `apiFetch`, uma função solta que roda fora da árvore de componentes
// e não pode chamar hook nenhum.

// `false` até que algo prove o contrário: no primeiro carregamento nada foi
// pedido ao servidor ainda, e abrir o app com um aviso de erro seria mentira.
let servidorInacessivel = false;

const ouvintes = new Set<() => void>();

function avisar() {
    for (const ouvinte of ouvintes) ouvinte();
}

/**
 * Chamado pelo `apiFetch` quando o fetch é rejeitado — servidor fora do ar,
 * DNS, CORS, cabo na tomada. Uma resposta de erro (500, 401) não conta: o
 * servidor respondeu, então o aviso de "sem conexão" seria enganoso.
 */
export function registrarFalhaDeRede() {
    if (servidorInacessivel) return;
    servidorInacessivel = true;
    avisar();
}

/** Chamado pelo `apiFetch` sempre que uma resposta chega, qualquer que seja. */
export function registrarRespostaDoServidor() {
    if (!servidorInacessivel) return;
    servidorInacessivel = false;
    avisar();
}

export function assinarConexao(ouvinte: () => void) {
    ouvintes.add(ouvinte);
    return () => {
        ouvintes.delete(ouvinte);
    };
}

export function lerServidorInacessivel() {
    return servidorInacessivel;
}

/**
 * Snapshot do servidor para o `useSyncExternalStore`. Constante de propósito:
 * no SSR não houve chamada de API nenhuma, e devolver um valor que difere do
 * primeiro render do cliente acusaria divergência de hidratação.
 */
export function lerServidorInacessivelNoServidor() {
    return false;
}
