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
        let ativo = true;
        carregarConversa(candidatoId, vagaId).then((res) => {
            if (ativo) setConversa(res);
        });
        return () => {
            ativo = false;
        };
    }, [candidatoId, vagaId]);

    if (!conversa) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Carregando conversa...</p>
            </div>
        );
    }

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
