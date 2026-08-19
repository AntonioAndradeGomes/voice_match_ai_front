// Conta e sessão do recrutador.
//
// Cadastro é `POST /usuarios` (schema `UsuarioCreate`); login é
// `POST /auth/login/json`, que aceita só `{ email, senha }` e devolve o token.

import { API_BASE_URL, apiFetch } from "@/lib/api";

// Mesmo prefixo das outras chaves do projeto (ver storage.ts).
import type { TipoUsuario } from "@/types";

const CHAVE_TOKEN = "voicematch:token";
const CHAVE_USUARIO = "voicematch:user";

// Backup da sessão do admin do sistema durante uma impersonation. Sem isto ela
// se perderia: `impersonar` grava o token da empresa com `lembrar: false`, e
// `guardarToken` limpa os dois storages antes de escrever — ou seja, o token
// original do admin some, e voltar exigiria login de novo.
const CHAVE_TOKEN_ORIGINAL = "voicematch:token-original";
const CHAVE_USUARIO_ORIGINAL = "voicematch:user-original";

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

/**
 * Onde o backup foi parar. O storage importa: guardamos a sessão original no
 * mesmo lugar em que ela vivia, e é isso que preserva a escolha de "manter
 * conectado" do admin na hora de voltar.
 */
function storageDoBackup(): Storage | null {
    if (typeof window === "undefined") return null;
    if (window.localStorage.getItem(CHAVE_TOKEN_ORIGINAL))
        return window.localStorage;
    if (window.sessionStorage.getItem(CHAVE_TOKEN_ORIGINAL))
        return window.sessionStorage;
    return null;
}

/** Há uma sessão de admin guardada esperando para ser retomada. */
export function estaImpersonando(): boolean {
    return storageDoBackup() !== null;
}

function guardarSessaoOriginal(): void {
    if (typeof window === "undefined") return;

    // Já existe backup: impersonar de dentro de uma impersonation não pode
    // sobrescrevê-lo, senão o caminho de volta para o admin de verdade some e
    // a pessoa fica presa na conta do cliente.
    if (estaImpersonando()) return;

    const token = lerToken();
    const usuario = lerUsuarioSalvo();
    if (!token || !usuario) return;

    const destino = storageDaSessao() ?? window.localStorage;
    destino.setItem(CHAVE_TOKEN_ORIGINAL, token);
    destino.setItem(CHAVE_USUARIO_ORIGINAL, JSON.stringify(usuario));
}

function limparSessaoOriginal(): void {
    if (typeof window === "undefined") return;
    for (const storage of [window.localStorage, window.sessionStorage]) {
        storage.removeItem(CHAVE_TOKEN_ORIGINAL);
        storage.removeItem(CHAVE_USUARIO_ORIGINAL);
    }
}

/**
 * Volta para a conta do admin do sistema, sem novo login.
 *
 * Revalida contra o backend em vez de confiar no que estava guardado: o cache
 * local existe só para a UI ter o que mostrar, e o token pode ter vencido
 * enquanto a pessoa navegava dentro da empresa.
 */
export async function desimpersonar(): Promise<UsuarioAutenticado | null> {
    const origem = storageDoBackup();
    if (!origem) return null;

    const token = origem.getItem(CHAVE_TOKEN_ORIGINAL);
    const bruto = origem.getItem(CHAVE_USUARIO_ORIGINAL);

    // De volta para o mesmo tipo de storage de onde veio: se o admin tinha
    // marcado "manter conectado", continua conectado depois de voltar.
    if (token) guardarToken(token, origem === window.localStorage);

    if (bruto) {
        try {
            guardarUsuario(JSON.parse(bruto) as UsuarioAutenticado);
        } catch {
            // Backup corrompido não pode impedir a volta: o token já foi
            // restaurado, e `buscarUsuarioLogado` refaz o cache do usuário.
        }
    }

    limparSessaoOriginal();
    return buscarUsuarioLogado();
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

    // Guarda a sessão do admin antes de sobrescrever — só aqui, depois de a
    // resposta ter chegado, para uma impersonation que falhou não deixar
    // backup órfão para trás.
    guardarSessaoOriginal();

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
    // Também o backup: sair no meio de uma impersonation deixaria a sessão do
    // admin guardada, e o próximo login apareceria como se estivesse
    // impersonando alguém.
    limparSessaoOriginal();
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
