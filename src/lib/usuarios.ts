// Conta e sessão do recrutador.
//
// Cadastro é `POST /usuarios` (schema `UsuarioCreate`); login é
// `POST /auth/login/json`, que aceita só `{ email, senha }` e devolve o token.

import { API_BASE_URL, apiFetch } from "@/lib/api";

// Mesmo prefixo das outras chaves do projeto (ver storage.ts).
import type { TipoUsuario } from "@/types";

const CHAVE_TOKEN = "voicematch:token";
const CHAVE_USUARIO = "voicematch:user";

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
    tipo_usuario: TipoUsuario;
    data_criacao: string;
    /**
     * Empresa à qual o usuário pertence. Nulo para `admin_sistema`, que opera a
     * plataforma e não é de empresa nenhuma.
     *
     * Opcional porque o backend ainda não devolve este campo — ver
     * `docs/multi-tenant-contrato-backend.md`.
     */
    empresa_id?: string | null;
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

// As funções abaixo checam `window` porque o módulo também é avaliado no
// SSR, onde `localStorage` não existe.
//
// A sessão vai para um de dois lugares, conforme o "manter conectado" do
// login: `localStorage` sobrevive a fechar o navegador; `sessionStorage`
// morre junto com a aba. O backend emite um token de validade fixa (7 dias) e
// não aceita pedir outra, então a diferença entre lembrar e não lembrar é
// esta escolha de onde guardar — não dá para encurtar o token em si.

function storageDaSessao(): Storage | null {
    if (typeof window === "undefined") return null;
    if (window.localStorage.getItem(CHAVE_TOKEN)) return window.localStorage;
    if (window.sessionStorage.getItem(CHAVE_TOKEN)) return window.sessionStorage;
    return null;
}

export function guardarToken(token: string, lembrar: boolean): void {
    if (typeof window === "undefined") return;
    // Limpa os dois antes de gravar: sem isso, trocar de "lembrar" para "não
    // lembrar" deixaria o token antigo no localStorage, e ele venceria na
    // leitura — a sessão continuaria sobrevivendo ao fechar o navegador.
    window.localStorage.removeItem(CHAVE_TOKEN);
    window.sessionStorage.removeItem(CHAVE_TOKEN);
    (lembrar ? window.localStorage : window.sessionStorage).setItem(
        CHAVE_TOKEN,
        token,
    );
}

export function lerToken(): string | null {
    if (typeof window === "undefined") return null;
    return (
        window.localStorage.getItem(CHAVE_TOKEN) ??
        window.sessionStorage.getItem(CHAVE_TOKEN)
    );
}

export function limparToken(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(CHAVE_TOKEN);
    window.sessionStorage.removeItem(CHAVE_TOKEN);
}

// O backend não guarda sessão (JWT é stateless): o usuário devolvido no
// login/`/auth/me` fica cacheado aqui só pra UI ter algo pra mostrar
// instantaneamente (nome na sidebar, guarda de rota) sem esperar a rede, e
// pra sobreviver a uma falha de rede sem forçar logout (ver
// buscarUsuarioLogado abaixo).
function guardarUsuario(usuario: UsuarioAutenticado): void {
    if (typeof window === "undefined") return;
    // Acompanha onde o token foi parar, para o usuário cacheado não sobreviver
    // mais que a própria sessão.
    const destino = storageDaSessao() ?? window.localStorage;
    window.localStorage.removeItem(CHAVE_USUARIO);
    window.sessionStorage.removeItem(CHAVE_USUARIO);
    destino.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

export function lerUsuarioSalvo(): UsuarioAutenticado | null {
    if (typeof window === "undefined") return null;
    const bruto =
        window.localStorage.getItem(CHAVE_USUARIO) ??
        window.sessionStorage.getItem(CHAVE_USUARIO);
    if (!bruto) return null;
    try {
        return JSON.parse(bruto) as UsuarioAutenticado;
    } catch {
        return null;
    }
}

function limparUsuario(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(CHAVE_USUARIO);
    window.sessionStorage.removeItem(CHAVE_USUARIO);
}

// Login de demonstração: só entra em ação quando a chamada ao backend nem
// completa (servidor ou túnel ngrok fora do ar) — pra dashboard continuar
// navegável em demo/hackathon mesmo sem backend disponível. Com o backend no
// ar, a validação é sempre a real (POST /auth/login/json); essas credenciais
// nem chegam a ser comparadas nesse caso.
const ADMIN_DEMO_EMAIL = "admin@voicematch.ai";
const ADMIN_DEMO_SENHA = "admin123";
const TOKEN_DEMO = "demo-token";

function autenticarComoAdminDemo(
    email: string,
    senha: string,
    lembrar: boolean,
): UsuarioAutenticado | null {
    if (email !== ADMIN_DEMO_EMAIL || senha !== ADMIN_DEMO_SENHA) return null;

    const usuario: UsuarioAutenticado = {
        id: "00000000-0000-0000-0000-000000000000",
        nome_completo: "Admin (demo)",
        email: ADMIN_DEMO_EMAIL,
        tipo_usuario: "recrutador",
        data_criacao: new Date().toISOString(),
        recrutador: { empresa: "VoiceMatchAi (demo)" },
    };

    guardarToken(TOKEN_DEMO, lembrar);
    guardarUsuario(usuario);
    return usuario;
}

/**
 * Autentica e guarda o token. Devolve o usuário para quem chamou decidir o que
 * fazer (saudação, redirecionamento).
 */
export async function entrar(
    email: string,
    senha: string,
    lembrar: boolean,
): Promise<UsuarioAutenticado> {
    let resposta: Response;
    try {
        resposta = await apiFetch(`${API_BASE_URL}/auth/login/json`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha }),
        });
    } catch {
        const usuarioDemo = autenticarComoAdminDemo(email, senha, lembrar);
        if (usuarioDemo) return usuarioDemo;
        throw new Error(
            "Não foi possível conectar ao servidor. Tente novamente em instantes.",
        );
    }

    const corpo = await resposta.json().catch(() => null);

    if (!resposta.ok) {
        throw new Error(
            mensagemDoErro(corpo) ??
                `Não foi possível entrar (erro ${resposta.status}).`,
        );
    }

    const { access_token, user } = corpo as RespostaLogin;
    guardarToken(access_token, lembrar);
    guardarUsuario(user);
    return user;
}

export async function impersonar(empresaId: string): Promise<UsuarioAutenticado> {
    const resposta = await apiFetch(`${API_BASE_URL}/admin/empresas/${empresaId}/impersonar`, {
        method: "POST",
    });

    const corpo = await resposta.json().catch(() => null);

    if (!resposta.ok) {
        throw new Error(
            mensagemDoErro(corpo) ??
                `Não foi possível entrar na empresa (erro ${resposta.status}).`,
        );
    }

    const { access_token, user } = corpo as RespostaLogin;
    
    // Para manter a segurança da sessão e evitar que se confunda com o login
    // regular e permaneça em cache, não usamos o 'lembrar: true'.
    guardarToken(access_token, false);
    guardarUsuario(user);
    return user;
}

/** Encerra a sessão local. Não existe endpoint de logout — o JWT é stateless. */
export function sair(): void {
    limparToken();
    limparUsuario();
}

/**
 * Confirma a sessão atual contra o backend (usada ao carregar o app). Sem
 * token, nem tenta. Com o backend fora do ar, mantém o usuário já cacheado em
 * vez de derrubar a sessão por causa de uma falha de rede — mesma filosofia
 * de resiliência de lib/storage.ts.
 */
export async function buscarUsuarioLogado(): Promise<UsuarioAutenticado | null> {
    const token = lerToken();
    if (!token) return null;
    if (token === TOKEN_DEMO) return lerUsuarioSalvo();

    try {
        const resposta = await apiFetch(`${API_BASE_URL}/auth/me`);
        if (resposta.status === 401) {
            sair();
            return null;
        }
        if (!resposta.ok) return lerUsuarioSalvo();

        const usuario = (await resposta.json()) as UsuarioAutenticado;
        guardarUsuario(usuario);
        return usuario;
    } catch {
        return lerUsuarioSalvo();
    }
}

// Papéis. Ver docs/multi-tenant-contrato-backend.md.
//
// Hoje o backend só emite `recrutador`, então estas funções devolvem false na
// prática — existem para as telas já ficarem escritas do jeito certo, e
// passarem a funcionar sozinhas quando a API entregar os papéis novos.

/** Opera a plataforma VoiceMatch: cadastra e gerencia as empresas clientes. */
export function ehAdminSistema(usuario: UsuarioAutenticado | null): boolean {
    return usuario?.tipo_usuario === "admin_sistema";
}

/** Administra UMA empresa cliente. Não confundir com o admin do sistema. */
export function ehAdminEmpresa(usuario: UsuarioAutenticado | null): boolean {
    return usuario?.tipo_usuario === "admin_empresa";
}
