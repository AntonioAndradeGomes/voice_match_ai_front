import {
    ExternalLink,
    FileText,
    Mail,
    MessagesSquare,
    Phone,
} from "lucide-react";
import Link from "next/link";

import { PerfilRadarChart } from "@/_components/candidatos/perfil-radar-chart";
import { Avatar, AvatarFallback } from "@/_components/ui/avatar";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/_components/ui/dialog";
import { ScrollArea } from "@/_components/ui/scroll-area";
import { formatarCPF } from "@/lib/inscricao";
import { getCandidatoBadge } from "@/lib/vaga-status";
import type { Candidato } from "@/types";

function LinhaInscricao({
    icone: Icone,
    valor,
    href,
}: {
    icone: typeof Mail;
    valor: string;
    href?: string;
}) {
    const conteudo = (
        <span className="flex items-center gap-2 text-sm">
            <Icone className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 truncate">{valor}</span>
        </span>
    );

    if (!href) return conteudo;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
        >
            {conteudo}
        </a>
    );
}

export function CandidatoDetalheModal({
    candidato,
    vagaId,
    open,
    onOpenChange,
}: {
    candidato: Candidato | null;
    vagaId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!candidato) return null;

    const badge = getCandidatoBadge(candidato);
    const { inscricao } = candidato;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>
                                {candidato.nome.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-1 flex-col">
                            <DialogTitle className="truncate">
                                {candidato.nome}
                            </DialogTitle>
                        </div>
                        <Badge variant={badge.variant} className="shrink-0">
                            {badge.label}
                        </Badge>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[65vh]">
                    <div className="flex flex-col gap-6 pr-1">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Dados da candidatura
                            </span>

                            {inscricao ? (
                                <div className="flex flex-col gap-2 rounded-2xl bg-muted/50 p-4">
                                    <LinhaInscricao
                                        icone={Mail}
                                        valor={inscricao.email}
                                        href={`mailto:${inscricao.email}`}
                                    />
                                    <LinhaInscricao
                                        icone={Phone}
                                        valor={inscricao.telefone}
                                    />
                                    {inscricao.cpf && (
                                        <LinhaInscricao
                                            icone={FileText}
                                            valor={formatarCPF(inscricao.cpf)}
                                        />
                                    )}
                                    {inscricao.linkedin && (
                                        <LinhaInscricao
                                            icone={ExternalLink}
                                            valor={inscricao.linkedin}
                                            href={inscricao.linkedin}
                                        />
                                    )}
                                    {inscricao.curriculoNome && (
                                        <LinhaInscricao
                                            icone={FileText}
                                            valor={inscricao.curriculoNome}
                                        />
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Sem dados de candidatura registrados.
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Perfil comportamental avaliado
                            </span>

                            {candidato.perfilAvaliado ? (
                                <PerfilRadarChart
                                    perfil={candidato.perfilAvaliado}
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Perfil ainda não avaliado — a entrevista
                                    precisa ser concluída primeiro.
                                </p>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button
                        nativeButton={false}
                        render={
                            <Link
                                href={`/vagas/${vagaId}/${candidato.id}/chat`}
                            />
                        }
                    >
                        <MessagesSquare data-icon="inline-start" />
                        Ver chat
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
