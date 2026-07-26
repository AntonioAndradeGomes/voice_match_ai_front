import { motion } from "motion/react";

import { AudioPlayer } from "@/_components/ui/audio-player";
import { cn } from "@/lib/utils";
import type { MensagemChat } from "@/types";

function formatHora(timestamp: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(timestamp));
}

// Esta tela é do entrevistador: as mensagens da IA (quem conduz a entrevista
// em nome do entrevistador) são "enviadas" — ficam à direita, em azul. As
// respostas do candidato ficam à esquerda, como mensagens recebidas.
export function MensagemBubble({
    mensagem,
    index = 0,
}: {
    mensagem: MensagemChat;
    index?: number;
}) {
    const enviada = mensagem.autor === "ia";

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
            className={cn(
                "flex w-full",
                enviada ? "justify-end" : "justify-start",
            )}
        >
            <div
                className={cn(
                    "flex max-w-[80%] flex-col gap-1.5 rounded-2xl px-4 py-2.5 text-sm",
                    enviada
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-card-foreground ring-1 ring-foreground/5 dark:ring-foreground/10",
                )}
            >
                {mensagem.tipo === "audio" ? (
                    <>
                        {mensagem.audioUrl && (
                            <AudioPlayer
                                src={mensagem.audioUrl}
                                duracaoInicial={mensagem.duracaoAudio}
                                seed={mensagem.id}
                                onColorido={enviada}
                            />
                        )}

                        <p
                            className={cn(
                                "text-xs italic",
                                enviada
                                    ? "text-primary-foreground/80"
                                    : "text-muted-foreground",
                            )}
                        >
                            &ldquo;{mensagem.conteudo}&rdquo;
                        </p>
                    </>
                ) : (
                    <p>{mensagem.conteudo}</p>
                )}

                <span
                    className={cn(
                        "self-end text-[10px] tabular-nums opacity-70",
                        enviada
                            ? "text-primary-foreground"
                            : "text-muted-foreground",
                    )}
                >
                    {formatHora(mensagem.timestamp)}
                </span>
            </div>
        </motion.div>
    );
}
