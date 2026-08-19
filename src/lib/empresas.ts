import { API_BASE_URL, apiFetch } from "@/lib/api";
import type { Empresa, StatusEmpresa } from "@/types";

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
