"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { ChatFooter } from "@/_components/chat/chat-footer";
import { ChatHeader } from "@/_components/chat/chat-header";
import { ChatMensagens } from "@/_components/chat/chat-mensagens";
import { carregarConversa, type Conversa } from "@/lib/chat";

// Corpo da tela de chat de uma entrevista, reaproveitado tanto por
// /chat/[vagaId]/[candidatoId] quanto por /vagas/[id]/[candidatoId]/chat.
export function ChatConversa({
    vagaId,
    candidatoId,
}: {
    vagaId: string;
    candidatoId: string;
}) {
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
