"use client";

import { MessagesSquare } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { MensagemBubble } from "@/_components/chat/mensagem-bubble";
import { Avatar, AvatarFallback, AvatarImage } from "@/_components/ui/avatar";
import { Badge } from "@/_components/ui/badge";
import { ScrollArea } from "@/_components/ui/scroll-area";
import { MOCK_CANDIDATO, MOCK_MENSAGENS, MOCK_VAGA } from "@/lib/chat-mock";
import {
    getCandidatos,
    getMensagensByCandidato,
    getVagas,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import { getCandidatoStatusBadge } from "@/lib/vaga-status";
import type { Candidato, MensagemChat, Vaga } from "@/types";

interface Conversa {
    candidato: Candidato;
    vaga: Vaga | null;
    mensagens: MensagemChat[];
}

function previewMensagem(mensagem?: MensagemChat) {
    if (!mensagem) return "Nenhuma mensagem ainda";
    return mensagem.tipo === "audio" ? "Mensagem de áudio" : mensagem.conteudo;
}

// Só entra na lista quem já teve a entrevista iniciada — "aguardando" ainda
// não gerou nenhuma mensagem.
function carregarConversasReais(): Conversa[] {
    const vagasPorId = new Map(getVagas().map((vaga) => [vaga.id, vaga]));

    return getCandidatos()
        .filter((candidato) => candidato.status !== "aguardando")
        .map((candidato) => ({
            candidato,
            vaga: vagasPorId.get(candidato.vagaId) ?? null,
            mensagens: getMensagensByCandidato(candidato.id),
        }))
        .sort((a, b) => {
            const ultimoA =
                a.mensagens.at(-1)?.timestamp ?? a.candidato.createdAt;
            const ultimoB =
                b.mensagens.at(-1)?.timestamp ?? b.candidato.createdAt;
            return new Date(ultimoB).getTime() - new Date(ultimoA).getTime();
        });
}

function carregarConversas(): Conversa[] {
    const reais = carregarConversasReais();
    if (reais.length > 0) return reais;

    // MOCK: sem entrevistas reais no storage ainda, mostra a conversa de
    // demonstração só para visualizar o layout (ver src/lib/chat-mock.ts).
    return [
        {
            candidato: MOCK_CANDIDATO,
            vaga: MOCK_VAGA,
            mensagens: MOCK_MENSAGENS,
        },
    ];
}

export default function ChatPage() {
    const [conversas, setConversas] = useState<Conversa[] | null>(null);
    const [selecionadoId, setSelecionadoId] = useState<string | null>(null);

    useEffect(() => {
        // localStorage não existe no SSR; a leitura real só é possível depois do
        // mount no cliente, por isso o estado inicial é preenchido aqui.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setConversas(carregarConversas());
    }, []);

    const carregando = conversas === null;
    const lista = conversas ?? [];
    const selecionada =
        lista.find((conversa) => conversa.candidato.id === selecionadoId) ??
        lista[0] ??
        null;

    return (
        <div className="flex h-full flex-col">
            <header className="border-b border-border px-6 py-5">
                <h1 className="text-2xl font-semibold tracking-tight">Chat</h1>
                <p className="text-sm text-muted-foreground">
                    Acompanhe as conversas de entrevista entre a IA e os
                    candidatos.
                </p>
            </header>

            {carregando ? null : lista.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <MessagesSquare className="size-5" />
                    </span>
                    <div className="flex flex-col gap-1">
                        <p className="font-heading text-lg font-medium">
                            Nenhuma conversa ainda
                        </p>
                        <p className="max-w-sm text-sm text-muted-foreground">
                            As conversas aparecem aqui assim que uma entrevista
                            começa.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex min-h-0 flex-1 overflow-hidden">
                    <aside className="w-72 shrink-0 border-r border-border">
                        <ScrollArea className="h-full">
                            <nav className="flex flex-col gap-1 p-3">
                                {lista.map(({ candidato, mensagens }) => {
                                    const ativo =
                                        candidato.id ===
                                        selecionada?.candidato.id;

                                    return (
                                        <button
                                            key={candidato.id}
                                            type="button"
                                            onClick={() =>
                                                setSelecionadoId(candidato.id)
                                            }
                                            className={cn(
                                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted",
                                                ativo && "bg-muted",
                                            )}
                                        >
                                            <Avatar>
                                                {candidato.avatarUrl && (
                                                    <AvatarImage
                                                        src={
                                                            candidato.avatarUrl
                                                        }
                                                        alt={candidato.nome}
                                                    />
                                                )}
                                                <AvatarFallback>
                                                    {candidato.nome
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                <span className="truncate text-sm font-medium">
                                                    {candidato.nome}
                                                </span>
                                                <span className="truncate text-xs text-muted-foreground">
                                                    {previewMensagem(
                                                        mensagens.at(-1),
                                                    )}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </nav>
                        </ScrollArea>
                    </aside>

                    <AnimatePresence mode="wait">
                        {selecionada && (
                            <motion.div
                                key={selecionada.candidato.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex min-h-0 flex-1 flex-col overflow-hidden"
                            >
                                <div className="flex items-center gap-3 border-b border-border px-6 py-4">
                                    <Avatar>
                                        {selecionada.candidato.avatarUrl && (
                                            <AvatarImage
                                                src={
                                                    selecionada.candidato
                                                        .avatarUrl
                                                }
                                                alt={selecionada.candidato.nome}
                                            />
                                        )}
                                        <AvatarFallback>
                                            {selecionada.candidato.nome
                                                .charAt(0)
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {selecionada.candidato.nome}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Entrevista para{" "}
                                            {selecionada.vaga?.titulo ??
                                                "vaga removida"}
                                        </span>
                                    </div>

                                    <Badge
                                        variant={
                                            getCandidatoStatusBadge(
                                                selecionada.candidato,
                                            ).variant
                                        }
                                        className="ml-auto"
                                    >
                                        {
                                            getCandidatoStatusBadge(
                                                selecionada.candidato,
                                            ).label
                                        }
                                    </Badge>
                                </div>

                                <ScrollArea className="min-h-0 flex-1">
                                    <div className="flex flex-col gap-3 px-6 py-6">
                                        {selecionada.mensagens.length === 0 ? (
                                            <p className="text-center text-sm text-muted-foreground">
                                                Essa entrevista ainda não tem
                                                mensagens.
                                            </p>
                                        ) : (
                                            selecionada.mensagens.map(
                                                (mensagem, index) => (
                                                    <MensagemBubble
                                                        key={mensagem.id}
                                                        mensagem={mensagem}
                                                        index={index}
                                                    />
                                                ),
                                            )
                                        )}
                                    </div>
                                </ScrollArea>

                                {selecionada.candidato.status ===
                                    "finalizado" && (
                                    <div className="border-t border-border px-6 py-3 text-center text-sm text-muted-foreground">
                                        Entrevista finalizada — veja o scorecard
                                        na página da vaga.
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
