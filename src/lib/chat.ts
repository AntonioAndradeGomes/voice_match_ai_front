import { MOCK_CANDIDATO, MOCK_MENSAGENS, MOCK_VAGA } from "@/lib/chat-mock";
import {
    getCandidatoById,
    getMensagensByCandidato,
    getVagaById,
} from "@/lib/storage";
import type { Candidato, MensagemChat, Vaga } from "@/types";

export interface Conversa {
    candidato: Candidato;
    vaga: Vaga | null;
    mensagens: MensagemChat[];
}

export function carregarConversa(
    candidatoId: string,
    vagaId: string,
): Conversa {
    const candidato = getCandidatoById(candidatoId);

    if (!candidato) {
        // MOCK: candidato ainda não existe no storage — mostra a conversa de
        // demonstração só para visualizar o layout (ver src/lib/chat-mock.ts).
        // Some sozinho assim que essa entrevista existir de verdade.
        return {
            candidato: MOCK_CANDIDATO,
            vaga: MOCK_VAGA,
            mensagens: MOCK_MENSAGENS,
        };
    }

    return {
        candidato,
        vaga: getVagaById(vagaId),
        mensagens: getMensagensByCandidato(candidato.id),
    };
}
