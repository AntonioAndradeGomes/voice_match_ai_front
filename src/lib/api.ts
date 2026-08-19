// URL base da API do backend.
// Em desenvolvimento local, aponta para localhost:8000.
// Na Vercel (produção/hackathon), configure a variável de ambiente
// NEXT_PUBLIC_API_URL com a URL pública do backend (ex: https://xxxx.ngrok-free.app).
import {
    registrarFalhaDeRede,
    registrarRespostaDoServidor,
} from "@/lib/conexao";

export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Mesma chave usada em lib/usuarios.ts (CHAVE_TOKEN) — repetida aqui em vez
// de importada de lá pra não criar um import circular (usuarios.ts já
// importa apiFetch daqui). Se mudar lá, muda aqui também.
const CHAVE_TOKEN = "voicematch:token";

/**
 * Wrapper sobre fetch para chamadas à API que automaticamente adiciona o cabeçalho
 * `ngrok-skip-browser-warning: 69420` e, quando há uma sessão ativa, o
 * `Authorization: Bearer <token>`.
 * O ngrok-skip-browser-warning ignora a tela amarela de aviso do ngrok gratuito,
 * permitindo que as requisições de API retornem JSON em vez da página HTML de
 * aviso do ngrok na Vercel.
 *
 * Também é o ponto único onde se sabe se o servidor está acessível, então é
 * daqui que sai o sinal para o aviso de conexão (ver lib/conexao.ts). Ficar
 * aqui, e não em cada chamada, cobre de graça tudo que fala com a API.
 */
export async function apiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set("ngrok-skip-browser-warning", "69420");

    if (typeof window !== "undefined") {
        // Procura nos dois: com "manter conectado" desmarcado no login, a
        // sessão fica em sessionStorage (ver guardarToken em lib/usuarios.ts).
        const token =
            window.localStorage.getItem(CHAVE_TOKEN) ??
            window.sessionStorage.getItem(CHAVE_TOKEN);
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
    }

    try {
        const resposta = await fetch(input, {
            ...init,
            headers,
        });
        // Qualquer resposta serve: 500 e 401 são respostas, o servidor está de
        // pé e quem chamou trata o status. Só a ausência de resposta significa
        // que ele está inacessível.
        registrarRespostaDoServidor();
        return resposta;
    } catch (erro) {
        registrarFalhaDeRede();
        // Repassa intacto: os `catch` que já existem em storage.ts, chat.ts e
        // companhia continuam caindo no fallback como antes.
        throw erro;
    }
}
