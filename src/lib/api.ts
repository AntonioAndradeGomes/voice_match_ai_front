// URL base da API do backend.
// Em desenvolvimento local, aponta para localhost:8000.
// Na Vercel (produção/hackathon), configure a variável de ambiente
// NEXT_PUBLIC_API_URL com a URL pública do backend (ex: https://xxxx.ngrok-free.app).
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Wrapper sobre fetch para chamadas à API que automaticamente adiciona o cabeçalho
 * `ngrok-skip-browser-warning: 69420`.
 * Isso ignora a tela amarela de aviso do ngrok gratuito, permitindo que as requisições
 * de API retornem JSON em vez da página HTML de aviso do ngrok na Vercel.
 */
export async function apiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set("ngrok-skip-browser-warning", "69420");
    return fetch(input, {
        ...init,
        headers,
    });
}
