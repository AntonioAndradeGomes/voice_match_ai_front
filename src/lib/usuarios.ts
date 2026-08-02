// Conta e sessão do recrutador.
//
// Cadastro é `POST /usuarios` (schema `UsuarioCreate`); login é
// `POST /auth/login/json`, que aceita só `{ email, senha }` e devolve o token.

import { API_BASE_URL, apiFetch } from "@/lib/api";

// Mesmo prefixo das outras chaves do projeto (ver storage.ts).
const CHAVE_TOKEN = "voicematch:token";

export interface NovoUsuario {
    nome_completo: string;
    email: string;
    senha: string;
    recrutador: {
        empresa: string;
        cnpj?: string;
        cargo?: string;
    };
}

export interface UsuarioCriado {
    id: string;
    nome_completo: string;
    email: string;
    tipo_usuario: string;
    data_criacao: string;
}

/**
 * O FastAPI devolve o erro em `detail`, em duas formas — ambas observadas neste
 * backend:
 *
 *   400 → "Este endereço de email já está cadastrado na base principal."
 *   422 → [{ msg: "String should have at least 6 characters", ... }]
 *
 * Sem tratar as duas, a pessoa receberia só "erro 400" e não saberia que o
 * problema é o e-mail já existir.
 */
function mensagemDoErro(corpo: unknown): string | null {
    if (corpo === null || typeof corpo !== "object") return null;

    const detalhe = (corpo as { detail?: unknown }).detail;

    if (typeof detalhe === "string") return detalhe;

    if (Array.isArray(detalhe)) {
        const mensagens = detalhe
            .map((item) => (item as { msg?: string }).msg)
            .filter((msg): msg is string => Boolean(msg));
        return mensagens.length ? mensagens.join("; ") : null;
    }

    return null;
}

export async function criarUsuario(dados: NovoUsuario): Promise<UsuarioCriado> {
    const resposta = await apiFetch(`${API_BASE_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });

    // `catch` porque uma resposta de erro pode não trazer JSON (ex.: 502 do
    // túnel, que devolve HTML).
    const corpo = await resposta.json().catch(() => null);

    if (!resposta.ok) {
        throw new Error(
            mensagemDoErro(corpo) ??
                `Não foi possível criar a conta (erro ${resposta.status}).`,
        );
    }

    return corpo as UsuarioCriado;
}

// Sessão

export interface UsuarioAutenticado extends UsuarioCriado {
    recrutador?: {
        empresa: string;
        cnpj?: string | null;
        cargo?: string | null;
    };
}

interface RespostaLogin {
    access_token: string;
    token_type: string;
    user: UsuarioAutenticado;
}

// As três funções abaixo checam `window` porque o módulo também é avaliado no
// SSR, onde `localStorage` não existe.

export function guardarToken(token: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CHAVE_TOKEN, token);
}

export function lerToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(CHAVE_TOKEN);
}

export function limparToken(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(CHAVE_TOKEN);
}

/**
 * Autentica e guarda o token. Devolve o usuário para quem chamou decidir o que
 * fazer (saudação, redirecionamento).
 */
export async function entrar(
    email: string,
    senha: string,
): Promise<UsuarioAutenticado> {
    const resposta = await apiFetch(`${API_BASE_URL}/auth/login/json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
    });

    const corpo = await resposta.json().catch(() => null);

    if (!resposta.ok) {
        throw new Error(
            mensagemDoErro(corpo) ??
                `Não foi possível entrar (erro ${resposta.status}).`,
        );
    }

    const { access_token, user } = corpo as RespostaLogin;
    guardarToken(access_token);
    return user;
}
