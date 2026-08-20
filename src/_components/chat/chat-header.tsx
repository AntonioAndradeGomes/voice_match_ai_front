import { Avatar, AvatarFallback, AvatarImage } from "@/_components/ui/avatar";
import { Badge } from "@/_components/ui/badge";
import { CheckCircle2, CircleDot } from "lucide-react";
import { getCandidatoBadge } from "@/lib/vaga-status";
import type { Candidato, Vaga } from "@/types";

export function ChatHeader({
    candidato,
    vaga,
    etapaAtual = 1,
    isFinalizada = false,
}: {
    candidato: Candidato;
    vaga: Vaga | null;
    etapaAtual?: number;
    isFinalizada?: boolean;
}) {
    const badge = getCandidatoBadge(candidato);

    const etapas = [
        { id: 1, nome: "1. Pessoal" },
        { id: 2, nome: "2. Fit Cultural" },
        { id: 3, nome: "3. Técnica" },
    ];

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3.5 pl-6 pr-16 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <Avatar>
                    {candidato.avatarUrl && (
                        <AvatarImage
                            src={candidato.avatarUrl}
                            alt={candidato.nome}
                        />
                    )}
                    <AvatarFallback className="bg-primary/10 font-bold text-primary">
                        {candidato.nome.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                    <span className="font-medium text-foreground">{candidato.nome}</span>
                    <span className="text-xs text-muted-foreground">
                        Entrevista de Voz • {vaga?.titulo ?? "Vaga"}
                    </span>
                </div>
            </div>

            {/* Indicador de Fases das 3 Perguntas */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-1.5 text-xs">
                {etapas.map((etapa) => {
                    const isConcluida = isFinalizada || etapa.id < etapaAtual;
                    const isAtiva = !isFinalizada && etapa.id === etapaAtual;

                    return (
                        <div
                            key={etapa.id}
                            className={`flex items-center gap-1 font-medium transition-colors ${
                                isConcluida
                                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                    : isAtiva
                                    ? "text-primary font-bold"
                                    : "text-muted-foreground/60"
                            }`}
                        >
                            {isConcluida ? (
                                <CheckCircle2 className="size-3.5" />
                            ) : isAtiva ? (
                                <CircleDot className="size-3.5 animate-pulse" />
                            ) : (
                                <span className="size-1.5 rounded-full bg-muted-foreground/40 mx-1" />
                            )}
                            <span>{etapa.nome}</span>
                            {etapa.id < 3 && (
                                <span className="text-muted-foreground/40 ml-1.5">➔</span>
                            )}
                        </div>
                    );
                })}
            </div>

            <Badge variant={isFinalizada ? "success" : badge.variant} className="font-medium">
                {isFinalizada ? "Entrevista Concluída" : `Etapa ${Math.min(etapaAtual, 3)}/3`}
            </Badge>
        </div>
    );
}
