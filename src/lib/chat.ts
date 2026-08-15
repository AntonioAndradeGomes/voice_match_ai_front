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
    entrevistaDisponivel?: boolean;
    motivoBloqueio?: string;
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

    try {
        let resCandidatura: Response | null = null;
        if (isValidUUID(vagaId)) {
            resCandidatura = await apiFetch(`${API_BASE_URL}/candidaturas/vaga/${vagaId}`);
        } else {
            resCandidatura = await apiFetch(`${API_BASE_URL}/candidaturas`);
        }

        if (resCandidatura && resCandidatura.ok) {
            const candidaturas = await resCandidatura.json();
            let candidatura = candidaturas.find(
                (c: { candidato_id: string; id: string }) => c.candidato_id === candidatoId,
            );
            if (!candidatura && candidaturas.length > 0) {
                candidatura = candidaturas[candidaturas.length - 1];
            }

            if (candidatura) {
                // Verificar se a candidatura foi reprovada ou está pendente na triagem
                if (candidatura.status === "reprovada_triagem") {
                    return {
                        candidato: candidato ?? {
                            id: candidatoId,
                            vagaId,
                            nome: "Candidato",
                            avatarUrl: null,
                            status: "aguardando",
                            perfilAvaliado: null,
                            notaFinal: null,
                            pontosFortes: null,
                            pontosFracos: null,
                            melhorias: null,
                            createdAt: new Date().toISOString(),
                        },
                        vaga,
                        mensagens: [],
                        entrevistaDisponivel: false,
                        motivoBloqueio: "A sua candidatura não atingiu o score mínimo na triagem de currículo para avançar à etapa de entrevista por voz.",
                    };
                }

                if (candidatura.status === "pendente_triagem") {
                    return {
                        candidato: candidato ?? {
                            id: candidatoId,
                            vagaId,
                            nome: "Candidato",
                            avatarUrl: null,
                            status: "aguardando",
                            perfilAvaliado: null,
                            notaFinal: null,
                            pontosFortes: null,
                            pontosFracos: null,
                            melhorias: null,
                            createdAt: new Date().toISOString(),
                        },
                        vaga,
                        mensagens: [],
                        entrevistaDisponivel: false,
                        motivoBloqueio: "A triagem de currículo desta candidatura ainda está sendo processada. Por favor, aguarde.",
                    };
                }

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
                                    const etapaNome: "pessoal" | "fit_cultural" | "tecnica" =
                                        p.ordem === 1 ? "pessoal" : p.ordem === 2 ? "fit_cultural" : "tecnica";

                                    // Pergunta da Iris (IA)
                                    mensagens.push({
                                        id: p.id,
                                        candidatoId,
                                        autor: "ia",
                                        tipo: "texto",
                                        conteudo: p.pergunta_texto,
                                        ordem: p.ordem,
                                        etapa: etapaNome,
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
                                            ordem: p.ordem,
                                            etapa: etapaNome,
                                            audioUrl: audioUrlBackend,
                                            timestamp: p.resposta.data_resposta || new Date().toISOString(),
                                        });
                                    }
                                }

                                const totalRespostas = perguntasOrdenadas.filter((p) => p.resposta).length;
                                const isFinalizada =
                                    entrevistaDet.status === "concluida" || totalRespostas >= 3;

                                // Se finalizada, adicionar a mensagem do parecer consolidado
                                if (isFinalizada) {
                                    const feedbackTexto =
                                        entrevistaDet.feedback_candidato ||
                                        "Agradecemos profundamente sua participação e dedicação na entrevista de voz do VoiceMatch AI! Todas as suas respostas para as etapas de Apresentação Pessoal, Fit Cultural e Avaliação Técnica foram registradas com sucesso.";

                                    mensagens.push({
                                        id: `parecer-final-${entrevistaDet.id}`,
                                        candidatoId,
                                        autor: "ia",
                                        tipo: "texto",
                                        conteudo: feedbackTexto,
                                        etapa: "conclusao",
                                        isParecerConsolidado: true,
                                        timestamp: entrevistaDet.data_fim || new Date().toISOString(),
                                    });
                                }

                                if (mensagens.length > 0) {
                                    return {
                                        candidato: candidato
                                            ? {
                                                  ...candidato,
                                                  status: isFinalizada ? "finalizado" : "em_entrevista",
                                                  notaFinal: entrevistaDet.score_geral !== null ? Number(entrevistaDet.score_geral) : candidato.notaFinal,
                                              }
                                            : {
                                                  id: candidatoId,
                                                  vagaId,
                                                  nome: "Candidato",
                                                  avatarUrl: null,
                                                  status: isFinalizada ? "finalizado" : "em_entrevista",
                                                  perfilAvaliado: null,
                                                  notaFinal: entrevistaDet.score_geral !== null ? Number(entrevistaDet.score_geral) : null,
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

    if (!candidato) {
        // MOCK: candidato ainda não existe no storage — mostra a conversa de
        // demonstração só para visualizar o layout (ver src/lib/chat-mock.ts).
        return {
            candidato: MOCK_CANDIDATO,
            vaga: MOCK_VAGA,
            mensagens: MOCK_MENSAGENS,
        };
    }

    const mensagensLocais = getMensagensByCandidato(candidato.id);
    if (mensagensLocais.length === 0) {
        mensagensLocais.push({
            id: `pergunta-1-${candidato.id}`,
            candidatoId: candidato.id,
            autor: "ia",
            tipo: "texto",
            etapa: "pessoal",
            ordem: 1,
            conteudo: `Olá ${candidato.nome}! Seja bem-vindo(a) à entrevista de voz do VoiceMatch AI. Para iniciarmos nossa primeira etapa (Apresentação Pessoal), por favor se apresente e compartilhe sobre sua trajetória profissional e motivações.`,
            timestamp: new Date().toISOString(),
        });
    }

    return {
        candidato,
        vaga: vaga ?? getVagaByIdLocal(vagaId),
        mensagens: mensagensLocais,
    };
}

export async function enviarAudioResposta(
    perguntaId: string,
    audioBlob: Blob,
): Promise<boolean> {
    const formData = new FormData();
    const extension = audioBlob.type.includes("wav") ? "wav" : "webm";
    formData.append("file", audioBlob, `resposta.${extension}`);

    try {
        const response = await apiFetch(`${API_BASE_URL}/audio/upload/${perguntaId}`, {
            method: "POST",
            body: formData,
        });

        return response.ok;
    } catch (e) {
        console.error("Erro ao enviar resposta por áudio:", e);
        return false;
    }
}

export async function finalizarEntrevista(entrevistaId: string): Promise<boolean> {
    try {
        const response = await apiFetch(`${API_BASE_URL}/entrevistas/${entrevistaId}/finalizar`, {
            method: "POST",
        });
        return response.ok;
    } catch (e) {
        console.error("Erro ao finalizar entrevista:", e);
        return false;
    }
}
