"use client";

import { motion } from "motion/react";
import { use, useEffect, useState } from "react";

import { ChatFooter } from "@/_components/chat/chat-footer";
import { ChatHeader } from "@/_components/chat/chat-header";
import { ChatMensagens } from "@/_components/chat/chat-mensagens";
import { MOCK_CANDIDATO, MOCK_MENSAGENS, MOCK_VAGA } from "@/lib/chat-mock";
import {
    getCandidatoById,
    getMensagensByCandidato,
    getVagaById,
} from "@/lib/storage";
import type { Candidato, MensagemChat, Vaga } from "@/types";

interface Conversa {
    candidato: Candidato;
    vaga: Vaga | null;
    mensagens: MensagemChat[];
}

function carregarConversa(candidatoId: string, vagaId: string): Conversa {
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

export default function ChatPage({
    params,
}: {
    params: Promise<{ vagaId: string; candidatoId: string }>;
}) {
    const { vagaId, candidatoId } = use(params);
    const [conversa, setConversa] = useState<Conversa | null>(null);

    useEffect(() => {
        // localStorage não existe no SSR; a leitura real só é possível depois do
        // mount no cliente, por isso o estado inicial é preenchido aqui.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setConversa(carregarConversa(candidatoId, vagaId));
    }, [candidatoId, vagaId]);

    if (!conversa) return null;

    return (
        <motion.div
            key={conversa.candidato.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex h-full flex-col"
        >
            <ChatHeader candidato={conversa.candidato} vaga={conversa.vaga} />
            <ChatMensagens mensagens={conversa.mensagens} />
            <ChatFooter status={conversa.candidato.status} />
        </motion.div>
    );
}
