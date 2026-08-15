"use client";

import { useEffect, useRef } from "react";
import { MensagemBubble } from "@/_components/chat/mensagem-bubble";
import type { MensagemChat } from "@/types";

export function ChatMensagens({ mensagens }: { mensagens: MensagemChat[] }) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensagens.length]);

    return (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-3">
            {mensagens.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                    Essa entrevista ainda não tem mensagens.
                </p>
            ) : (
                mensagens.map((mensagem, index) => (
                    <MensagemBubble
                        key={mensagem.id}
                        mensagem={mensagem}
                        index={index}
                    />
                ))
            )}
            <div ref={bottomRef} className="h-1" />
        </div>
    );
}
