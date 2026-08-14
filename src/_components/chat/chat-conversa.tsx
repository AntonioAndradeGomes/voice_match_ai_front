"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { ChatFooter } from "@/_components/chat/chat-footer";
import { ChatHeader } from "@/_components/chat/chat-header";
import { ChatMensagens } from "@/_components/chat/chat-mensagens";
import { carregarConversa, type Conversa } from "@/lib/chat";

// Corpo da conversa de uma entrevista, reaproveitado tanto pela página pública
// /chat/[vagaId]/[candidatoId] (link enviado ao candidato) quanto pelo dialog
// "Ver chat" que o recrutador abre a partir de /vagas/[id] (ver
// candidato-chat-dialog.tsx) — por isso o componente não assume estar em tela
// cheia, só precisa de um ancestral com altura definida.
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

    if (conversa.entrevistaDisponivel === false) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl bg-card p-8 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
                    <span className="flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="size-7" />
                    </span>
                    <div className="flex flex-col gap-2">
                        <h2 className="font-heading text-lg font-medium">
                            Entrevista Indisponível
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {conversa.motivoBloqueio ||
                                "A entrevista de voz não está disponível para esta candidatura."}
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80"
                    >
                        <ArrowLeft className="size-4" /> Voltar ao Início
                    </Link>
                </div>
            </div>
        );
    }

    const recarregarConversa = () => {
        carregarConversa(candidatoId, vagaId).then((res) => setConversa(res));
    };

    const ultimasIAPerguntas = conversa?.mensagens.filter((m) => m.autor === "ia");
    const perguntaAtualId = ultimasIAPerguntas && ultimasIAPerguntas.length > 0
        ? ultimasIAPerguntas[ultimasIAPerguntas.length - 1].id
        : undefined;

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
            <ChatFooter
                status={conversa.candidato.status}
                perguntaAtualId={perguntaAtualId}
                onRespostaEnviada={recarregarConversa}
            />
        </motion.div>
    );
}
