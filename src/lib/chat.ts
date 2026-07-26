import { API_BASE_URL, apiFetch } from "@/lib/api";
import { MOCK_CANDIDATO, MOCK_MENSAGENS, MOCK_VAGA } from "@/lib/chat-mock";
import {
    getCandidatoById,
    getMensagensByCandidato,
    getVagaById,
    getVagaByIdLocal,
} from "@/lib/storage";
import type { Candidato, MensagemChat, Vaga } from "@/types";

export interface Conversa {
    candidato: Candidato;
    vaga: Vaga | null;
    mensagens: MensagemChat[];
}

function isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function carregarConversa(
    candidatoId: string,
    vagaId: string,
): Promise<Conversa> {
    const candidato = getCandidatoById(candidatoId);
    const vaga = await getVagaById(vagaId);

    if (isValidUUID(vagaId) && isValidUUID(candidatoId)) {
        try {
            // 1. Buscar candidatura para pegar o ID da candidatura no backend
            const resCandidatura = await apiFetch(`${API_BASE_URL}/candidaturas/vaga/${vagaId}`);
            if (resCandidatura.ok) {
                const candidaturas = await resCandidatura.json();
                const candidatura = candidaturas.find(
                    (c: { candidato_id: string; id: string }) => c.candidato_id === candidatoId,
                );

                if (candidatura) {
                    // 2. Buscar entrevistas da candidatura
                    const resEntrevistas = await apiFetch(
                        `${API_BASE_URL}/candidaturas/${candidatura.id}/entrevistas`,
                    );
                    if (resEntrevistas.ok) {
                        const entrevistas = await resEntrevistas.json();
                        if (Array.isArray(entrevistas) && entrevistas.length > 0) {
                            const entrevistaId = entrevistas[0].id;
                            // 3. Buscar detalhes completos da entrevista (com perguntas e respostas)
                            const resDet = await apiFetch(`${API_BASE_URL}/entrevistas/${entrevistaId}`);
                            if (resDet.ok) {
                                const entrevistaDet = await resDet.json();
                                const mensagens: MensagemChat[] = [];

                                if (Array.isArray(entrevistaDet.perguntas)) {
                                    const perguntasOrdenadas = [...entrevistaDet.perguntas].sort(
                                        (a, b) => a.ordem - b.ordem,
                                    );

                                    for (const p of perguntasOrdenadas) {
                                        // Pergunta da Iris (IA)
                                        mensagens.push({
                                            id: p.id,
                                            candidatoId,
                                            autor: "ia",
                                            tipo: "texto",
                                            conteudo: p.pergunta_texto,
                                            timestamp: entrevistaDet.data_inicio || new Date().toISOString(),
                                        });

                                        // Resposta do Candidato
                                        if (p.resposta) {
                                            const audioUrlBackend = p.resposta.audio_url
                                                ? p.resposta.audio_url.startsWith("http")
                                                    ? p.resposta.audio_url
                                                    : `${API_BASE_URL}${p.resposta.audio_url}`
                                                : undefined;

                                            mensagens.push({
                                                id: p.resposta.id,
                                                candidatoId,
                                                autor: "candidato",
                                                tipo: p.resposta.audio_url ? "audio" : "texto",
                                                conteudo: p.resposta.transcricao || "(Resposta gravada por áudio)",
                                                audioUrl: audioUrlBackend,
                                                timestamp: p.resposta.data_resposta || new Date().toISOString(),
                                            });
                                        }
                                    }

                                    if (mensagens.length > 0) {
                                        return {
                                            candidato: candidato ?? {
                                                id: candidatoId,
                                                vagaId,
                                                nome: "Candidato",
                                                avatarUrl: null,
                                                status: "em_entrevista",
                                                perfilAvaliado: null,
                                                notaFinal: null,
                                                pontosFortes: null,
                                                pontosFracos: null,
                                                melhorias: null,
                                                createdAt: new Date().toISOString(),
                                            },
                                            vaga,
                                            mensagens,
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.warn("Erro ao buscar conversa no backend:", e);
        }
    }

    if (!candidato) {
        // MOCK: candidato ainda não existe no storage — mostra a conversa de
        // demonstração só para visualizar o layout (ver src/lib/chat-mock.ts).
        return {
            candidato: MOCK_CANDIDATO,
            vaga: MOCK_VAGA,
            mensagens: MOCK_MENSAGENS,
        };
    }

    return {
        candidato,
        vaga: vaga ?? getVagaByIdLocal(vagaId),
        mensagens: getMensagensByCandidato(candidato.id),
    };
}

