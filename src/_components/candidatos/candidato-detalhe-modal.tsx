"use client";

import {
    Download,
    ExternalLink,
    FileText,
    Mail,
    MessagesSquare,
    Phone,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

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
import { baixarBlob, obterCurriculo, temCurriculo } from "@/lib/curriculos";
import { formatarCPF } from "@/lib/inscricao";
import { cn } from "@/lib/utils";
import { getCandidatoBadge } from "@/lib/vaga-status";
import type { Candidato } from "@/types";

function LinhaInscricao({
    icone: Icone,
    valor,
    href,
    onClick,
    sufixo,
}: {
    icone: typeof Mail;
    valor: string;
    href?: string;
    onClick?: () => void;
    sufixo?: ReactNode;
}) {
    // `items-start` porque o valor pode ocupar duas linhas; o ícone então
    // desce um fio (`mt-0.5`) para alinhar com a primeira delas.
    const CLASSES_LINHA = "flex min-w-0 items-start gap-2 text-sm";

    const conteudo = (
        <>
            <Icone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {/* `wrap-anywhere` (overflow-wrap: anywhere) e não `break-words`:
                apenas o `anywhere` reduz a largura mín-conteúdo do elemento.
                Sem isso, uma URL longa sem espaços mantém a caixa larga e ela
                vaza do dialog. A alternativa seria `min-w-0` em cada um dos
                cinco ancestrais flex/grid até aqui — e voltaria a quebrar no
                próximo wrapper que alguém adicionasse no meio. */}
            <span className="wrap-anywhere">{valor}</span>
            {sufixo}
        </>
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    CLASSES_LINHA,
                    "w-full cursor-pointer rounded-md text-left outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/30",
                )}
            >
                {conteudo}
            </button>
        );
    }

    if (!href) return <span className={CLASSES_LINHA}>{conteudo}</span>;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(CLASSES_LINHA, "hover:underline")}
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
    // Hooks antes do early return: `candidato` pode ser null, e declarar hook
    // depois de um `return` condicional quebraria a ordem entre renders.
    const [curriculoDisponivel, setCurriculoDisponivel] = useState(false);
    const candidatoId = candidato?.id;

    useEffect(() => {
        if (!candidatoId) return;

        // `curriculoNome` pode existir sem arquivo nenhum — candidatos do seed e
        // inscrições feitas antes de o upload passar a ser guardado. Por isso a
        // consulta: só oferece download quando há mesmo o que baixar.
        let atual = true;
        temCurriculo(candidatoId).then((existe) => {
            if (atual) setCurriculoDisponivel(existe);
        });

        // Evita aplicar a resposta de um candidato já trocado.
        return () => {
            atual = false;
        };
    }, [candidatoId]);

    if (!candidato) return null;

    const badge = getCandidatoBadge(candidato);
    const { inscricao } = candidato;

    async function baixarCurriculo() {
        const arquivo = await obterCurriculo(candidato!.id);
        if (!arquivo) {
            // Só cai aqui se o registro sumiu entre a checagem e o clique.
            setCurriculoDisponivel(false);
            toast.error("Currículo não disponível para download.");
            return;
        }
        baixarBlob(arquivo.blob, arquivo.nome);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* `sm:max-w-xl` e não `max-w-xl`: a base do DialogContent já define
                `sm:max-w-md`, e o tailwind-merge não deduplica entre variantes
                diferentes — os dois sobreviveriam e o `sm:` ganharia na cascata,
                travando o dialog em 448px. */}
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    {/* `pr-11` reserva a área do botão de fechar, que é
                        `absolute top-4 right-4` com 28px: 16 + 28 = 44px. Sem
                        isso o badge de status fica embaixo do X. */}
                    <div className="flex items-center gap-3 pr-11">
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
                                            // Sem arquivo guardado a linha fica
                                            // texto puro: um botão que não baixa
                                            // nada é pior do que não ter botão.
                                            onClick={
                                                curriculoDisponivel
                                                    ? baixarCurriculo
                                                    : undefined
                                            }
                                            sufixo={
                                                curriculoDisponivel ? (
                                                    <Download className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                                                ) : null
                                            }
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
