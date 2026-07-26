"use client";

import { motion } from "motion/react";
import { use, useEffect, useState } from "react";

import { MensagemBubble } from "@/_components/chat/mensagem-bubble";
import { Avatar, AvatarFallback, AvatarImage } from "@/_components/ui/avatar";
import { Badge } from "@/_components/ui/badge";
import { ScrollArea } from "@/_components/ui/scroll-area";
import { MOCK_CANDIDATO, MOCK_MENSAGENS, MOCK_VAGA } from "@/lib/chat-mock";
import {
    getCandidatoById,
    getMensagensByCandidato,
    getVagaById,
} from "@/lib/storage";
import { getCandidatoStatusBadge } from "@/lib/vaga-status";
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
            <div className="flex items-center gap-3 border-b border-border py-4 pr-16 pl-6">
                <Avatar>
                    {conversa.candidato.avatarUrl && (
                        <AvatarImage
                            src={conversa.candidato.avatarUrl}
                            alt={conversa.candidato.nome}
                        />
                    )}
                    <AvatarFallback>
                        {conversa.candidato.nome.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                    <span className="font-medium">
                        {conversa.candidato.nome}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Entrevista para{" "}
                        {conversa.vaga?.titulo ?? "vaga removida"}
                    </span>
                </div>

                <Badge
                    variant={
                        getCandidatoStatusBadge(conversa.candidato).variant
                    }
                    className="ml-auto"
                >
                    {getCandidatoStatusBadge(conversa.candidato).label}
                </Badge>
            </div>

            <ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col gap-3 px-6 py-6">
                    {conversa.mensagens.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">
                            Essa entrevista ainda não tem mensagens.
                        </p>
                    ) : (
                        conversa.mensagens.map((mensagem, index) => (
                            <MensagemBubble
                                key={mensagem.id}
                                mensagem={mensagem}
                                index={index}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>

            {conversa.candidato.status === "finalizado" && (
                <div className="border-t border-border px-6 py-3 text-center text-sm text-muted-foreground">
                    Entrevista finalizada — veja o scorecard na página da vaga.
                </div>
            )}
        </motion.div>
    );
}
