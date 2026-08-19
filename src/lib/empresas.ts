import { API_BASE_URL, apiFetch } from "@/lib/api";
import type {
    Empresa,
    StatusEmpresa,
    UsuarioDaEmpresa,
} from "@/types";

/**
 * Camada de dados das empresas (multi-tenant).
 *
 * O backend ainda não tem nada disso — não existe tabela `empresa`, nem papel
 * de admin do sistema, nem rota. O contrato do que ele precisa expor está em
 * `docs/multi-tenant-contrato-backend.md`.
 *
 * Enquanto os endpoints não existirem, as funções abaixo servem um conjunto
 * fixo de exemplo para as telas serem navegáveis — e marcam `demonstracao` na
 * resposta, para a UI poder avisar. A regra é a mesma que valeu para os
 * relatórios: dado inventado não pode se passar por dado real.
 *
 * Quando o backend entregar, o modo de demonstração se desliga sozinho: ele
 * depende da resposta da API, não de uma flag que alguém precise lembrar de
 * trocar.
 */

export interface RespostaEmpresas {
    empresas: Empresa[];
    /** true = os dados são de exemplo, porque a API ainda não tem a rota. */
    demonstracao: boolean;
}

interface EmpresaApi {
    id: string;
    nome: string;
    cnpj: string | null;
    status: StatusEmpresa;
    data_criacao: string;
    total_usuarios: number;
    total_vagas: number;
    total_candidaturas: number;
}

function normalizar(api: EmpresaApi): Empresa {
    return {
        id: api.id,
        nome: api.nome,
        cnpj: api.cnpj,
        status: api.status,
        dataCriacao: api.data_criacao,
        totalUsuarios: api.total_usuarios ?? 0,
        totalVagas: api.total_vagas ?? 0,
        totalCandidaturas: api.total_candidaturas ?? 0,
    };
}

/**
 * Empresas de exemplo. Nomes propositalmente fictícios e óbvios — nada de
 * "Acme Recrutamento" parecendo cliente real numa demonstração para
 * empresário. Vêm com `(exemplo)` no nome porque a faixa de aviso pode passar
 * despercebida numa captura de tela.
 */
const EMPRESAS_DE_EXEMPLO: Empresa[] = [
    {
        id: "exemplo-1",
        nome: "Empresa Demonstração 1 (exemplo)",
        cnpj: null,
        status: "ativa",
        dataCriacao: "2026-08-01T12:00:00Z",
        totalUsuarios: 3,
        totalVagas: 11,
        totalCandidaturas: 46,
    },
    {
        id: "exemplo-2",
        nome: "Empresa Demonstração 2 (exemplo)",
        cnpj: null,
        status: "ativa",
        dataCriacao: "2026-08-10T12:00:00Z",
        totalUsuarios: 1,
        totalVagas: 4,
        totalCandidaturas: 12,
    },
    {
        id: "exemplo-3",
        nome: "Empresa Demonstração 3 (exemplo)",
        cnpj: null,
        status: "suspensa",
        dataCriacao: "2026-07-22T12:00:00Z",
        totalUsuarios: 2,
        totalVagas: 0,
        totalCandidaturas: 0,
    },
];

/**
 * 404 e 405 significam "a rota ainda não existe" — é o caso esperado hoje, e
 * o único que liga o modo de demonstração. Qualquer outro status é erro de
 * verdade (401 sem sessão, 403 sem permissão, 500 quebrado) e precisa subir
 * para a tela, em vez de virar dado de mentira.
 */
function rotaAindaNaoExiste(status: number) {
    return status === 404 || status === 405;
}

export async function listarEmpresas(): Promise<RespostaEmpresas> {
    const resposta = await apiFetch(`${API_BASE_URL}/empresas`);

    if (rotaAindaNaoExiste(resposta.status)) {
        return { empresas: EMPRESAS_DE_EXEMPLO, demonstracao: true };
    }

    if (!resposta.ok) {
        throw new Error(
            resposta.status === 403
                ? "Esta área é exclusiva do administrador do sistema."
                : `Não foi possível carregar as empresas (erro ${resposta.status}).`,
        );
    }

    const corpo = (await resposta.json()) as EmpresaApi[];
    return {
        empresas: Array.isArray(corpo) ? corpo.map(normalizar) : [],
        demonstracao: false,
    };
}

export interface NovaEmpresa {
    nome: string;
    cnpj?: string;
}

export async function criarEmpresa(dados: NovaEmpresa): Promise<Empresa> {
    const resposta = await apiFetch(`${API_BASE_URL}/empresas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: dados.nome, cnpj: dados.cnpj || null }),
    });

    if (rotaAindaNaoExiste(resposta.status)) {
        throw new Error(
            "O cadastro de empresas ainda não existe no servidor. Esta tela está em modo de demonstração.",
        );
    }

    if (resposta.status === 409) {
        throw new Error("Já existe uma empresa cadastrada com esse CNPJ.");
    }

    if (!resposta.ok) {
        throw new Error(
            `Não foi possível cadastrar a empresa (erro ${resposta.status}).`,
        );
    }

    return normalizar((await resposta.json()) as EmpresaApi);
}

export async function alterarStatusEmpresa(
    id: string,
    status: StatusEmpresa,
): Promise<Empresa> {
    const resposta = await apiFetch(`${API_BASE_URL}/empresas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });

    if (rotaAindaNaoExiste(resposta.status)) {
        throw new Error(
            "Alterar status ainda não existe no servidor. Esta tela está em modo de demonstração.",
        );
    }

    if (!resposta.ok) {
        throw new Error(
            `Não foi possível alterar o status (erro ${resposta.status}).`,
        );
    }

    return normalizar((await resposta.json()) as EmpresaApi);
}

// --- Detalhe da empresa -------------------------------------------------

export interface RespostaEmpresa {
    empresa: Empresa | null;
    usuarios: UsuarioDaEmpresa[];
    demonstracao: boolean;
}

interface UsuarioApi {
    id: string;
    nome_completo: string;
    email: string;
    tipo_usuario: UsuarioDaEmpresa["tipoUsuario"];
    data_criacao: string;
}

function normalizarUsuario(api: UsuarioApi): UsuarioDaEmpresa {
    return {
        id: api.id,
        nomeCompleto: api.nome_completo,
        email: api.email,
        tipoUsuario: api.tipo_usuario,
        dataCriacao: api.data_criacao,
    };
}

const USUARIOS_DE_EXEMPLO: Record<string, UsuarioDaEmpresa[]> = {
    "exemplo-1": [
        {
            id: "u1",
            nomeCompleto: "Ana Souza (exemplo)",
            email: "ana@exemplo.com",
            tipoUsuario: "admin_empresa",
            dataCriacao: "2026-08-01T12:00:00Z",
        },
        {
            id: "u2",
            nomeCompleto: "Bruno Lima (exemplo)",
            email: "bruno@exemplo.com",
            tipoUsuario: "recrutador",
            dataCriacao: "2026-08-03T12:00:00Z",
        },
        {
            id: "u3",
            nomeCompleto: "Carla Dias (exemplo)",
            email: "carla@exemplo.com",
            tipoUsuario: "recrutador",
            dataCriacao: "2026-08-05T12:00:00Z",
        },
    ],
    "exemplo-2": [
        {
            id: "u4",
            nomeCompleto: "Diego Alves (exemplo)",
            email: "diego@exemplo.com",
            tipoUsuario: "admin_empresa",
            dataCriacao: "2026-08-10T12:00:00Z",
        },
    ],
    // "exemplo-3" fica sem ninguém de propósito: é o caso de empresa
    // cadastrada e sem primeiro acesso liberado, que a tela precisa saber
    // mostrar.
    "exemplo-3": [],
};

export async function buscarEmpresa(id: string): Promise<RespostaEmpresa> {
    const [resEmpresa, resUsuarios] = await Promise.all([
        apiFetch(`${API_BASE_URL}/empresas/${id}`),
        apiFetch(`${API_BASE_URL}/empresas/${id}/usuarios`),
    ]);

    if (rotaAindaNaoExiste(resEmpresa.status)) {
        return {
            empresa: EMPRESAS_DE_EXEMPLO.find((e) => e.id === id) ?? null,
            usuarios: USUARIOS_DE_EXEMPLO[id] ?? [],
            demonstracao: true,
        };
    }

    if (!resEmpresa.ok) {
        throw new Error(
            resEmpresa.status === 404
                ? "Empresa não encontrada."
                : `Não foi possível carregar a empresa (erro ${resEmpresa.status}).`,
        );
    }

    const empresa = normalizar((await resEmpresa.json()) as EmpresaApi);
    // A lista de usuários é secundária: se ela falhar, a tela ainda mostra a
    // empresa em vez de virar uma página de erro inteira.
    const usuarios = resUsuarios.ok
        ? ((await resUsuarios.json()) as UsuarioApi[]).map(normalizarUsuario)
        : [];

    return { empresa, usuarios, demonstracao: false };
}

export interface NovoAdminEmpresa {
    nome_completo: string;
    email: string;
    senha: string;
}

/**
 * Cria o admin da empresa — o primeiro acesso do cliente. Sem isto, a empresa
 * fica cadastrada e ninguém consegue entrar nela.
 */
export async function criarAdminDaEmpresa(
    empresaId: string,
    dados: NovoAdminEmpresa,
): Promise<UsuarioDaEmpresa> {
    const resposta = await apiFetch(
        `${API_BASE_URL}/empresas/${empresaId}/usuarios`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
        },
    );

    if (rotaAindaNaoExiste(resposta.status)) {
        throw new Error(
            "O cadastro de usuários da empresa ainda não existe no servidor. Esta tela está em modo de demonstração.",
        );
    }

    if (resposta.status === 409) {
        throw new Error("Já existe um usuário com esse e-mail.");
    }

    if (!resposta.ok) {
        throw new Error(
            `Não foi possível cadastrar o administrador (erro ${resposta.status}).`,
        );
    }

    return normalizarUsuario((await resposta.json()) as UsuarioApi);
}
