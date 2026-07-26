import { Play } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import type { MensagemChat } from "@/types";

function formatHora(timestamp: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(timestamp));
}

function formatDuracao(segundos: number) {
    const minutos = Math.floor(segundos / 60);
    const resto = Math.floor(segundos % 60);
    return `${minutos}:${String(resto).padStart(2, "0")}`;
}

// Alturas da onda sonora derivadas do id da mensagem: precisam parecer
// aleatórias mas ficar estáveis entre renders (sem Math.random no render).
function alturasOnda(id: string) {
    let seed = 0;
    for (let i = 0; i < id.length; i++)
        seed = (seed * 31 + id.charCodeAt(i)) >>> 0;

    return Array.from({ length: 24 }, (_, i) => {
        seed = (seed * 1103515245 + 12345) >>> 0;
        return 20 + (seed % 100) * 0.8 * (i % 5 === 0 ? 0.5 : 1);
    });
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
                        <div className="flex items-center gap-2">
                            <span
                                className={cn(
                                    "flex size-6 shrink-0 items-center justify-center rounded-full",
                                    enviada
                                        ? "bg-primary-foreground/20"
                                        : "bg-muted",
                                )}
                            >
                                <Play className="size-3 fill-current" />
                            </span>

                            <div className="flex h-6 flex-1 items-center gap-0.5">
                                {alturasOnda(mensagem.id).map((altura, i) => (
                                    <span
                                        key={i}
                                        className={cn(
                                            "w-0.5 rounded-full",
                                            enviada
                                                ? "bg-primary-foreground/50"
                                                : "bg-foreground/20",
                                        )}
                                        style={{ height: `${altura}%` }}
                                    />
                                ))}
                            </div>

                            {mensagem.duracaoAudio !== undefined && (
                                <span className="shrink-0 text-xs tabular-nums opacity-80">
                                    {formatDuracao(mensagem.duracaoAudio)}
                                </span>
                            )}
                        </div>

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
