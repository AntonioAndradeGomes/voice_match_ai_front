import { Avatar, AvatarFallback, AvatarImage } from "@/_components/ui/avatar";
import { Badge } from "@/_components/ui/badge";
import { getCandidatoBadge } from "@/lib/vaga-status";
import type { Candidato, Vaga } from "@/types";

export function ChatHeader({
    candidato,
    vaga,
}: {
    candidato: Candidato;
    vaga: Vaga | null;
}) {
    const badge = getCandidatoBadge(candidato);

    return (
        <div className="flex items-center gap-3 border-b border-border py-4 pr-16 pl-6">
            <Avatar>
                {candidato.avatarUrl && (
                    <AvatarImage
                        src={candidato.avatarUrl}
                        alt={candidato.nome}
                    />
                )}
                <AvatarFallback>
                    {candidato.nome.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
                <span className="font-medium">{candidato.nome}</span>
                <span className="text-xs text-muted-foreground">
                    Entrevista para {vaga?.titulo ?? "vaga removida"}
                </span>
            </div>

            <Badge variant={badge.variant} className="ml-auto">
                {badge.label}
            </Badge>
        </div>
    );
}
