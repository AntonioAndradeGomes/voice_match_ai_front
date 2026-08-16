import { motion } from "motion/react";
import { Sparkles, CheckCircle, Info } from "lucide-react";
import { AudioPlayer } from "@/_components/ui/audio-player";
import { Badge } from "@/_components/ui/badge";
import { cn } from "@/lib/utils";
import type { MensagemChat } from "@/types";

function formatHora(timestamp: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(timestamp));
}

const ETAPA_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    pessoal: { label: "Etapa 1: Apresentação Pessoal", variant: "secondary" },
    fit_cultural: { label: "Etapa 2: Fit Cultural & Equipe", variant: "secondary" },
    tecnica: { label: "Etapa 3: Pergunta Técnica", variant: "secondary" },
};

export function MensagemBubble({
    mensagem,
    index = 0,
}: {
    mensagem: MensagemChat;
    index?: number;
}) {
    const enviada = mensagem.autor === "ia";

    // Card Especial de Parecer Consolidado no Encerramento
    if (mensagem.isParecerConsolidado) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="my-4 flex w-full justify-center px-2"
            >
                <div className="flex max-w-2xl flex-col gap-3.5 rounded-3xl border border-primary/30 bg-card p-5 shadow-md ring-1 ring-primary/10">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Sparkles className="size-4" />
                            </span>
                            <div>
                                <h3 className="font-heading text-sm font-bold text-foreground">
                                    Parecer da Iris & Conclusão da Entrevista
                                </h3>
                                <p className="text-[11px] text-muted-foreground">
                                    Ciclo de 3 etapas finalizado com sucesso
                                </p>
                            </div>
                        </div>
                        <Badge variant="success" className="gap-1 text-[11px] font-semibold">
                            <CheckCircle className="size-3" /> Concluída
                        </Badge>
                    </div>

                    <div className="text-xs sm:text-sm font-normal leading-relaxed text-foreground/90 whitespace-pre-line">
                        {mensagem.conteudo}
                    </div>

                    {/* Aviso Obrigatório: Dependência da análise do recrutador */}
                    <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-300">
                        <Info className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div className="flex flex-col gap-0.5">
                            <span className="font-bold">Próximos Passos:</span>
                            <span>
                                O avanço para as próximas fases do processo seletivo dependerá <strong>estritamente da análise e deliberação da equipe de recrutamento</strong>.
                            </span>
                        </div>
                    </div>

                    <span className="self-end text-[10px] tabular-nums text-muted-foreground">
                        {formatHora(mensagem.timestamp)}
                    </span>
                </div>
            </motion.div>
        );
    }

    const etapaInfo = mensagem.etapa && ETAPA_LABEL[mensagem.etapa];

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
                    "flex max-w-[85%] flex-col gap-1.5 rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                    enviada
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-card-foreground ring-1 ring-foreground/5 dark:ring-foreground/10",
                )}
            >
                {etapaInfo && enviada && (
                    <div className="mb-1 flex items-center gap-1.5">
                        <span className="rounded-md bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary-foreground">
                            {etapaInfo.label}
                        </span>
                    </div>
                )}

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
                                "text-xs italic leading-relaxed",
                                enviada
                                    ? "text-primary-foreground/80"
                                    : "text-muted-foreground",
                            )}
                        >
                            &ldquo;{mensagem.conteudo}&rdquo;
                        </p>
                    </>
                ) : (
                    <p className="leading-relaxed">{mensagem.conteudo}</p>
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
