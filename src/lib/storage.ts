// Camada de dados isolada. Hoje persiste em localStorage; no futuro, troque o
// corpo destas funções por chamadas a uma API/backend (Supabase, Firebase, REST)
// mantendo as mesmas assinaturas — nenhuma tela deve importar localStorage direto.

import { normalizarVaga } from "@/lib/migracoes";
import type { Candidato, MensagemChat, StatusCandidato, Vaga } from "@/types";
import { API_BASE_URL, apiFetch } from "@/lib/api";

const KEYS = {
    vagas: "voicematch:vagas",
    candidatos: "voicematch:candidatos",
    mensagens: "voicematch:mensagens",
} as const;

function isBrowser() {
    return typeof window !== "undefined";
}

function readList<T>(key: string): T[] {
    if (!isBrowser()) return [];
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
        return [];
    }
}

function writeList<T>(key: string, list: T[]) {
    if (!isBrowser()) return;
    window.localStorage.setItem(key, JSON.stringify(list));
}

export function getVagasLocal(): Vaga[] {
    return readList<unknown>(KEYS.vagas)
        .map(normalizarVaga)
        .sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
        );
}

export async function getVagas(): Promise<Vaga[]> {
    try {
        const response = await apiFetch(`${API_BASE_URL}/vagas`);
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                const backendVagas = data.map(normalizarVaga).sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                );
                writeList(KEYS.vagas, backendVagas);
                return backendVagas;
            }
        }
    } catch (e) {
        console.warn("API do backend indisponível, utilizando dados locais.", e);
    }

    let localVagas = getVagasLocal();
    if (localVagas.length === 0) {
        const { seedDadosTeste } = require("@/lib/seed");
        seedDadosTeste();
        localVagas = getVagasLocal();
    }
    return localVagas;
}

export async function getVagaById(id: string): Promise<Vaga | null> {
    const vagas = await getVagas();
    return vagas.find((vaga) => vaga.id === id) ?? null;
}

export function getVagaByIdLocal(id: string): Vaga | null {
    return getVagasLocal().find((vaga) => vaga.id === id) ?? null;
}

export async function saveVaga(vaga: Vaga): Promise<Vaga> {
    const payload = {
        titulo: vaga.titulo,
        descricao: vaga.descricao,
        status: "ativa",
        requisitos_hard: { items: vaga.hardSkills },
        requisitos_soft: { items: vaga.softSkills },
        recrutador_id: "32b043a7-d234-460c-a38a-70340e2ce04f"
    };

    try {
        const response = await apiFetch(`${API_BASE_URL}/vagas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const data = await response.json();
            vaga.id = data.id;
            vaga.createdAt = data.data_criacao;
        } else {
            console.warn("Falha ao salvar vaga no backend API. Salvando localmente.");
        }
    } catch (e) {
        console.warn("API de vagas indisponível. Salvando localmente.", e);
    }

    const vagas = readList<Vaga>(KEYS.vagas);
    vagas.push(vaga);
    writeList(KEYS.vagas, vagas);
    return vaga;
}

// Helper para validar UUID v4
function isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// Candidatos

export function getCandidatosLocal(): Candidato[] {
    return readList<Candidato>(KEYS.candidatos).sort(
        (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getCandidatos(): Promise<Candidato[]> {
    try {
        const response = await apiFetch(`${API_BASE_URL}/candidatos`);
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                const backendCandidatos: Candidato[] = data.map((cand) => ({
                    id: cand.id,
                    vagaId: "",
                    nome: cand.nome,
                    avatarUrl: null,
                    status: "aguardando",
                    perfilAvaliado: null,
                    notaFinal: null,
                    pontosFortes: null,
                    pontosFracos: null,
                    melhorias: null,
                    createdAt: cand.data_cadastro || new Date().toISOString(),
                    inscricao: {
                        email: cand.email,
                        cpf: null,
                        telefone: cand.telefone || "",
                        linkedin: "",
                        curriculoNome: cand.curriculo_url || "",
                    },
                }));
                const locais = getCandidatosLocal();
                const idsBackend = new Set(backendCandidatos.map((c) => c.id));
                return [
                    ...backendCandidatos,
                    ...locais.filter((c) => !idsBackend.has(c.id)),
                ];
            }
        }
    } catch (e) {
        console.warn("API de candidatos indisponível, usando localStorage.", e);
    }
    return getCandidatosLocal();
}

export function getCandidatosByVagaLocal(vagaId: string): Candidato[] {
    return getCandidatosLocal().filter((candidato) => candidato.vagaId === vagaId);
}

export async function getCandidatosByVaga(vagaId: string): Promise<Candidato[]> {
    if (isValidUUID(vagaId)) {
        try {
            const response = await apiFetch(`${API_BASE_URL}/candidaturas/vaga/${vagaId}`);
            if (response.ok) {
                const candidaturas = await response.json();
                if (Array.isArray(candidaturas)) {
                    const lista: Candidato[] = [];
                    for (const cand of candidaturas) {
                        try {
                            const resCand = await apiFetch(`${API_BASE_URL}/candidatos/${cand.candidato_id}`);
                            if (resCand.ok) {
                                const dadosCand = await resCand.json();
                                const statusFrontend: StatusCandidato =
                                    cand.status === "finalizado" ? "finalizado" :
                                    cand.status === "em_entrevista" ? "em_entrevista" : "aguardando";

                                lista.push({
                                    id: dadosCand.id,
                                    vagaId: cand.vaga_id,
                                    nome: dadosCand.nome,
                                    avatarUrl: null,
                                    status: statusFrontend,
                                    perfilAvaliado: null,
                                    notaFinal: null,
                                    pontosFortes: null,
                                    pontosFracos: null,
                                    melhorias: null,
                                    createdAt: cand.data_candidatura || new Date().toISOString(),
                                    inscricao: {
                                        email: dadosCand.email,
                                        cpf: null,
                                        telefone: dadosCand.telefone || "",
                                        linkedin: "",
                                        curriculoNome: dadosCand.curriculo_url || "",
                                    },
                                });
                            }
                        } catch (err) {
                            console.warn("Erro ao carregar dados do candidato:", cand.candidato_id, err);
                        }
                    }

                    const locais = getCandidatosByVagaLocal(vagaId);
                    const idsBackend = new Set(lista.map((c) => c.id));
                    const mescladas = [
                        ...lista,
                        ...locais.filter((c) => !idsBackend.has(c.id)),
                    ].sort(
                        (a, b) =>
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                    );

                    return mescladas;
                }
            }
        } catch (e) {
            console.warn("API de candidaturas indisponível, usando localStorage.", e);
        }
    }
    return getCandidatosByVagaLocal(vagaId);
}

export function getCandidatoById(id: string): Candidato | null {
    return getCandidatosLocal().find((candidato) => candidato.id === id) ?? null;
}

export async function saveCandidato(candidato: Candidato): Promise<Candidato> {
    if (isValidUUID(candidato.vagaId)) {
        try {
            const email = candidato.inscricao?.email || "";
            const telefone = candidato.inscricao?.telefone || "";
            const curriculoNome = candidato.inscricao?.curriculoNome || null;

            // 1. Criar Candidato no Backend
            const resCandidato = await apiFetch(`${API_BASE_URL}/candidatos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: candidato.nome,
                    email,
                    telefone,
                    curriculo_url: curriculoNome,
                }),
            });

            let backendCandidatoId = candidato.id;

            if (resCandidato.ok) {
                const dataCand = await resCandidato.json();
                backendCandidatoId = dataCand.id;
            } else if (resCandidato.status === 400) {
                // Email já cadastrado — tenta buscar candidato existente
                const listRes = await apiFetch(`${API_BASE_URL}/candidatos`);
                if (listRes.ok) {
                    const todos = await listRes.json();
                    const existente = todos.find(
                        (c: { email: string; id: string }) => c.email === email,
                    );
                    if (existente) {
                        backendCandidatoId = existente.id;
                    }
                }
            }

            candidato.id = backendCandidatoId;

            // 2. Criar Candidatura no Backend
            const resCandidatura = await apiFetch(`${API_BASE_URL}/candidaturas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vaga_id: candidato.vagaId,
                    candidato_id: backendCandidatoId,
                }),
            });

            if (resCandidatura.ok) {
                const dataCand = await resCandidatura.json();
                candidato.createdAt = dataCand.data_candidatura;
            }
        } catch (e) {
            console.warn("Erro ao salvar candidato no backend:", e);
        }
    }

    const candidatos = readList<Candidato>(KEYS.candidatos);
    candidatos.push(candidato);
    writeList(KEYS.candidatos, candidatos);
    return candidato;
}

export function updateCandidato(
    id: string,
    changes: Partial<Omit<Candidato, "id">>,
): Candidato | null {
    const candidatos = readList<Candidato>(KEYS.candidatos);
    const index = candidatos.findIndex((candidato) => candidato.id === id);
    if (index === -1) return null;

    const atualizado = { ...candidatos[index], ...changes };
    candidatos[index] = atualizado;
    writeList(KEYS.candidatos, candidatos);
    return atualizado;
}

// Mensagens do chat de entrevista

export function getMensagensByCandidato(candidatoId: string): MensagemChat[] {
    return readList<MensagemChat>(KEYS.mensagens)
        .filter((mensagem) => mensagem.candidatoId === candidatoId)
        .sort(
            (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime(),
        );
}

export function saveMensagem(mensagem: MensagemChat): MensagemChat {
    const mensagens = readList<MensagemChat>(KEYS.mensagens);
    mensagens.push(mensagem);
    writeList(KEYS.mensagens, mensagens);
    return mensagem;
}
