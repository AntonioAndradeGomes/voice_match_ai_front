import type { TipoUsuario } from "@/types";

/**
 * Simulação de papel, para conseguir percorrer o fluxo do admin do sistema
 * antes de o backend existir.
 *
 * Hoje o backend só emite `recrutador`, então a área `/admin` é inalcançável:
 * o RouteGuard devolve para a home. Isto permite ver as telas.
 *
 * **Só funciona fora de produção.** Em build de produção as funções abaixo são
 * inertes — um seletor de papel no cliente não pode existir num app publicado,
 * mesmo sabendo que a autorização de verdade é do backend. Não é uma flag que
 * alguém precise lembrar de desligar antes do deploy: ela não vai junto.
 *
 * Também não dá acesso a nada de real: com o backend no ar, qualquer chamada
 * de `/empresas` volta 403 para quem não é admin do sistema de verdade. O que
 * isto muda é só o que a interface desenha.
 */

const CHAVE = "voicematch:papel-simulado";

const PAPEIS_VALIDOS: TipoUsuario[] = [
    "recrutador",
    "admin_empresa",
    "admin_sistema",
];

/** `sessionStorage`, e não `localStorage`: a simulação morre com a aba, então
 *  não fica esquecida ligada numa próxima sessão. */
export function simulacaoDisponivel() {
    return process.env.NODE_ENV !== "production";
}

export function lerPapelSimulado(): TipoUsuario | null {
    if (!simulacaoDisponivel() || typeof window === "undefined") return null;
    const guardado = window.sessionStorage.getItem(CHAVE);
    return PAPEIS_VALIDOS.includes(guardado as TipoUsuario)
        ? (guardado as TipoUsuario)
        : null;
}

export function limparPapelSimulado() {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(CHAVE);
}

/**
 * Lê `?papel=` da URL e guarda. Aceita `off` para desligar.
 *
 * Devolve true quando a URL trazia o parâmetro, para quem chamou saber que
 * precisa limpá-lo do endereço — deixar `?papel=admin_sistema` visível
 * convida a compartilhar o link achando que é uma rota de verdade.
 */
export function aplicarPapelDaUrl(): boolean {
    if (!simulacaoDisponivel() || typeof window === "undefined") return false;

    const parametro = new URLSearchParams(window.location.search).get("papel");
    if (!parametro) return false;

    if (parametro === "off") {
        limparPapelSimulado();
        return true;
    }

    if (PAPEIS_VALIDOS.includes(parametro as TipoUsuario)) {
        window.sessionStorage.setItem(CHAVE, parametro);
        return true;
    }

    return false;
}
