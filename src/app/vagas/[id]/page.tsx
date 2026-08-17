"use client";

import {
    ArrowLeft,
    Award,
    CheckCircle2,
    Crown,
    ExternalLink,
    LayoutGrid,
    List,
    MapPin,
    Medal,
    MessagesSquare,
    Sparkles,
    Star,
    Trophy,
} from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import { CandidatoDetalheModal } from "@/_components/candidatos/candidato-detalhe-modal";
import { CandidatoChatDialog } from "@/_components/chat/candidato-chat-dialog";
import { Avatar, AvatarFallback } from "@/_components/ui/avatar";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import { Card, CardContent } from "@/_components/ui/card";
import { DivulgarVaga } from "@/_components/vagas/divulgar-vaga";
import { getCandidatosByVaga, getVagaById } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { VagaDetalheSkeleton } from "@/_components/layout/skeletons";
import { getCandidatoBadge } from "@/lib/vaga-status";
import {
    MODALIDADE_LABEL,
    type Candidato,
    type SkillComPeso,
    type Vaga,
} from "@/types";

type ModoVisualizacao = "grade" | "lista";

const CORES_AVATAR = [
    "bg-chart-1",
    "bg-chart-2",
    "bg-chart-3",
    "bg-chart-4",
    "bg-chart-5",
];

function corAvatar(id: string) {
    let hash = 0;
    for (let indice = 0; indice < id.length; indice += 1) {
        hash = (hash * 31 + id.charCodeAt(indice)) >>> 0;
    }
    return CORES_AVATAR[hash % CORES_AVATAR.length];
}

function corPeso(peso: number) {
    if (peso >= 8) return "bg-chart-4";
    if (peso >= 5) return "bg-chart-2";
    return "bg-chart-1";
}

function ordenarPorRanking(candidatos: Candidato[]): Candidato[] {
    return [...candidatos].sort((a, b) => {
        // 1. Nota final consolidada da entrevista (0 a 10)
        const notaA = a.notaFinal !== null && a.notaFinal !== undefined ? Number(a.notaFinal) : null;
        const notaB = b.notaFinal !== null && b.notaFinal !== undefined ? Number(b.notaFinal) : null;

        if (notaA !== null && notaB !== null) {
            if (notaA !== notaB) return notaB - notaA;
            // Desempate 1: Nota da triagem de currículo
            const triagemA = a.triagem?.score !== null && a.triagem?.score !== undefined ? Number(a.triagem.score) : 0;
            const triagemB = b.triagem?.score !== null && b.triagem?.score !== undefined ? Number(b.triagem.score) : 0;
            if (triagemA !== triagemB) return triagemB - triagemA;
            // Desempate 2: Quem concluiu a entrevista primeiro (data mais antiga)
            if (a.dataConclusaoEntrevista && b.dataConclusaoEntrevista) {
                const timeA = new Date(a.dataConclusaoEntrevista).getTime();
                const timeB = new Date(b.dataConclusaoEntrevista).getTime();
                if (timeA !== timeB) return timeA - timeB;
            }
            // Desempate 3: Inscrição mais antiga
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (notaA !== null) return -1;
        if (notaB !== null) return 1;

        // 2. Score da triagem de currículo (para quem ainda não concluiu a entrevista)
        const triagemA = a.triagem?.score !== null && a.triagem?.score !== undefined ? Number(a.triagem.score) : null;
        const triagemB = b.triagem?.score !== null && b.triagem?.score !== undefined ? Number(b.triagem.score) : null;

        if (triagemA !== null && triagemB !== null) {
            if (triagemA !== triagemB) return triagemB - triagemA;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (triagemA !== null) return -1;
        if (triagemB !== null) return 1;

        // 3. Status (em_entrevista > aguardando)
        if (a.status === "em_entrevista" && b.status !== "em_entrevista") return -1;
        if (b.status === "em_entrevista" && a.status !== "em_entrevista") return 1;

        // 4. Inscrição mais antiga
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}

function PontoPodioBadge({ posicao }: { posicao: number }) {
    if (posicao === 1) {
        return (
            <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/15 px-2.5 py-1 text-xs font-black text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 shadow-xs">
                <Crown className="size-3.5 fill-amber-500 text-amber-500" /> #1 Líder
            </span>
        );
    }
    if (posicao === 2) {
        return (
            <span className="inline-flex items-center gap-1 rounded-xl bg-slate-500/15 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 ring-1 ring-slate-400/30">
                <Medal className="size-3.5 text-slate-400" /> #2 Lugar
            </span>
        );
    }
    if (posicao === 3) {
        return (
            <span className="inline-flex items-center gap-1 rounded-xl bg-amber-700/15 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 ring-1 ring-amber-700/30">
                <Award className="size-3.5 text-amber-700 dark:text-amber-500" /> #3 Lugar
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-xl bg-muted px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            #{posicao}
        </span>
    );
}

function SkillPill({ skill }: { skill: SkillComPeso }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-2xl border border-border py-0.5 pr-1 pl-2.5 text-xs">
            {skill.nome}
            <span
                className={cn(
                    "flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-white",
                    corPeso(skill.peso),
                )}
            >
                {skill.peso}
            </span>
        </span>
    );
}

function CandidatoCardRanking({
    candidato,
    posicao,
    onSelecionar,
}: {
    candidato: Candidato;
    posicao: number;
    onSelecionar: (candidato: Candidato) => void;
}) {
    const badge = getCandidatoBadge(candidato);
    const temNotaFinal = candidato.notaFinal !== null && candidato.notaFinal !== undefined;
    const nota = temNotaFinal ? Number(candidato.notaFinal) : null;
    const triagemScore = candidato.triagem?.score !== null && candidato.triagem?.score !== undefined ? Number(candidato.triagem.score) : null;

    return (
        <button
            type="button"
            onClick={() => onSelecionar(candidato)}
            className={cn(
                "group block w-full text-left outline-none transition-all duration-200 focus-visible:ring-3 focus-visible:ring-ring/30",
            )}
        >
            <Card
                size="sm"
                interactive
                className={cn(
                    "relative",
                    posicao === 1 && "border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-card to-card ring-1 ring-amber-500/20",
                    posicao === 2 && "border-slate-400/30 bg-card",
                    posicao === 3 && "border-amber-700/20 bg-card"
                )}
            >
                <div className="flex flex-col gap-3.5 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <PontoPodioBadge posicao={posicao} />
                            <Avatar className="size-9 ring-2 ring-background">
                                <AvatarFallback
                                    className={cn(
                                        corAvatar(candidato.id),
                                        "text-white font-bold text-xs",
                                    )}
                                >
                                    {candidato.nome.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <span className="block truncate font-heading text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {candidato.nome}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                    {candidato.inscricao?.email || "Candidato registrado"}
                                </span>
                            </div>
                        </div>

                        <Badge variant={badge.variant} className="shrink-0 text-[11px]">
                            {badge.label}
                        </Badge>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs">
                        <div className="flex items-center gap-2">
                            {temNotaFinal ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/25">
                                    <Star className="size-3.5 fill-emerald-500 text-emerald-500" /> Nota Iris: {nota?.toFixed(1)} / 10
                                </span>
                            ) : triagemScore !== null ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 font-semibold text-primary ring-1 ring-primary/20">
                                    Triagem: {triagemScore.toFixed(1)} / 10
                                </span>
                            ) : (
                                <span className="text-muted-foreground">
                                    Aguardando avaliação
                                </span>
                            )}
                        </div>

                        <span className="text-[11px] text-muted-foreground">
                            {temNotaFinal ? "Entrevista Concluída" : candidato.status === "em_entrevista" ? "Em andamento" : "Triagem Realizada"}
                        </span>
                    </div>
                </div>
            </Card>
        </button>
    );
}

function CandidatoLinhaRanking({
    candidato,
    posicao,
    onSelecionar,
}: {
    candidato: Candidato;
    posicao: number;
    onSelecionar: (candidato: Candidato) => void;
}) {
    const badge = getCandidatoBadge(candidato);
    const temNotaFinal = candidato.notaFinal !== null && candidato.notaFinal !== undefined;
    const nota = temNotaFinal ? Number(candidato.notaFinal) : null;
    const triagemScore = candidato.triagem?.score !== null && candidato.triagem?.score !== undefined ? Number(candidato.triagem.score) : null;

    return (
        <button
            type="button"
            onClick={() => onSelecionar(candidato)}
            className="group block w-full text-left outline-none transition-all duration-200 focus-visible:ring-3 focus-visible:ring-ring/30"
        >
            <div
                className={cn(
                    // Mesma resposta do `interactive` do Card — esta linha é um
                    // cartão desenhado à mão, e não o componente, mas quem usa
                    // a tela não sabe disso: as duas listas da mesma página
                    // precisam levantar e afundar igual. `transition` no lugar
                    // de `transition-all` para não animar também as
                    // propriedades de layout no meio do caminho.
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-md group-active:translate-y-0 group-active:shadow-sm group-active:duration-75",
                    posicao === 1 && "border-amber-500/40 bg-gradient-to-r from-amber-500/5 via-card to-card ring-1 ring-amber-500/20"
                )}
            >
                <div className="flex items-center gap-3.5 min-w-0">
                    <PontoPodioBadge posicao={posicao} />
                    <Avatar className="size-10 shrink-0 ring-2 ring-background">
                        <AvatarFallback
                            className={cn(
                                corAvatar(candidato.id),
                                "text-white font-bold text-xs",
                            )}
                        >
                            {candidato.nome.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <span className="block truncate font-heading text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            {candidato.nome}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                            {candidato.inscricao?.email || "Candidato registrado"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    {triagemScore !== null && (
                        <div className="hidden md:flex flex-col items-end text-xs">
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">Triagem</span>
                            <span className="font-semibold text-foreground">{triagemScore.toFixed(1)} / 10</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {temNotaFinal ? (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 px-3 py-1.5 font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/25 text-xs">
                                <Star className="size-3.5 fill-emerald-500 text-emerald-500" /> {nota?.toFixed(1)} / 10
                            </span>
                        ) : (
                            <span className="inline-flex items-center rounded-xl bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                                Nota Pendente
                            </span>
                        )}
                    </div>

                    <Badge variant={badge.variant} className="text-xs">
                        {badge.label}
                    </Badge>
                </div>
            </div>
        </button>
    );
}

export default function VagaDetalhePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    const [estado, setEstado] = useState<{
        vaga: Vaga | null;
        candidatos: Candidato[];
        carregado: boolean;
    }>({ vaga: null, candidatos: [], carregado: false });
    const [modoVisualizacao, setModoVisualizacao] =
        useState<ModoVisualizacao>("grade");
    const [candidatoSelecionado, setCandidatoSelecionado] =
        useState<Candidato | null>(null);
    const [candidatoNoChat, setCandidatoNoChat] = useState<Candidato | null>(
        null,
    );

    useEffect(() => {
        Promise.all([getVagaById(id), getCandidatosByVaga(id)]).then(
            ([vaga, candidatos]) => {
                setEstado({
                    vaga,
                    candidatos,
                    carregado: true,
                });
            },
        );
    }, [id]);

    const candidatosOrdenados = useMemo(
        () => ordenarPorRanking(estado.candidatos),
        [estado.candidatos],
    );

    const topCandidato = useMemo(() => {
        if (candidatosOrdenados.length === 0) return null;
        const primeiro = candidatosOrdenados[0];
        return primeiro.notaFinal !== null ? primeiro : null;
    }, [candidatosOrdenados]);

    const totalAvaliados = useMemo(
        () => estado.candidatos.filter((c) => c.notaFinal !== null).length,
        [estado.candidatos]
    );

    const mediaVaga = useMemo(() => {
        const notas = estado.candidatos
            .map((c) => c.notaFinal)
            .filter((n): n is number => n !== null && n !== undefined);
        if (notas.length === 0) return null;
        return (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1);
    }, [estado.candidatos]);

    if (estado.carregado && !estado.vaga) {
        return (
            <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-20 text-center">
                <p className="text-sm text-muted-foreground">
                    Vaga não encontrada.
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/vagas" />}
                >
                    Voltar para vagas
                </Button>
            </div>
        );
    }

    if (!estado.vaga) return <VagaDetalheSkeleton />;

    const { vaga, candidatos } = estado;

    return (
        <>
            <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-fit"
                        nativeButton={false}
                        render={<Link href="/vagas" />}
                    >
                        <ArrowLeft data-icon="inline-start" />
                        Voltar para vagas
                    </Button>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={
                                <Link
                                    href={`/candidatura/${vaga.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                />
                            }
                        >
                            <ExternalLink data-icon="inline-start" />
                            Ver vaga
                        </Button>
                        <DivulgarVaga vagaId={vaga.id} titulo={vaga.titulo} />
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-wrap gap-2">
                            {vaga.experienciaPrevia && (
                                <Badge variant="secondary" className="w-fit">
                                    {vaga.experienciaPrevia}
                                </Badge>
                            )}
                            <Badge variant="secondary" className="w-fit">
                                {MODALIDADE_LABEL[vaga.modalidade]}
                            </Badge>
                            {vaga.localizacao && (
                                <Badge
                                    variant="outline"
                                    className="w-fit gap-1"
                                >
                                    <MapPin className="size-3" />
                                    {vaga.localizacao}
                                </Badge>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                {vaga.titulo}
                            </h1>
                            {vaga.descricao && (
                                <p className="text-muted-foreground">
                                    {vaga.descricao}
                                </p>
                            )}
                        </div>

                        {vaga.hardSkills.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Hard skills
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {vaga.hardSkills.map((skill) => (
                                        <SkillPill
                                            key={skill.nome}
                                            skill={skill}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {vaga.softSkills.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Soft skills
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {vaga.softSkills.map((skill) => (
                                        <SkillPill
                                            key={skill.nome}
                                            skill={skill}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Card className="h-fit bg-primary/5 ring-primary/15">
                        <CardContent className="flex items-center gap-2">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                                <Sparkles className="size-3.5" />
                            </span>
                            <span className="font-heading text-base font-medium">
                                Iris · Entrevistadora Virtual
                            </span>
                        </CardContent>
                        <CardContent className="text-sm text-muted-foreground">
                            A Iris conduz entrevistas dinâmicas por voz em 3
                            fases com os candidatos e gera o parecer consolidado
                            para o ranking do Recrutador.
                        </CardContent>
                    </Card>
                </div>

                {/* Seção de Ranking de Candidatos */}
                <div className="flex flex-col gap-5 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Trophy className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                                    Ranking de Candidatos
                                    <Badge variant="secondary" className="text-xs font-semibold">
                                        {candidatos.length} inscritos
                                    </Badge>
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Classificação ordenada pela Nota Consolidada da Iris (Currículo + Entrevista de Voz)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {mediaVaga !== null && (
                                <div className="hidden sm:flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
                                    <span>Média da Vaga:</span>
                                    <span className="font-bold text-foreground">{mediaVaga} / 10</span>
                                </div>
                            )}

                            {candidatos.length > 0 && (
                                <div className="flex items-center gap-1 rounded-2xl border border-border p-1 bg-card">
                                    <Button
                                        type="button"
                                        size="icon-sm"
                                        variant={
                                            modoVisualizacao === "grade"
                                                ? "secondary"
                                                : "ghost"
                                        }
                                        onClick={() => setModoVisualizacao("grade")}
                                        aria-label="Ver em grade"
                                    >
                                        <LayoutGrid />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon-sm"
                                        variant={
                                            modoVisualizacao === "lista"
                                                ? "secondary"
                                                : "ghost"
                                        }
                                        onClick={() => setModoVisualizacao("lista")}
                                        aria-label="Ver em lista"
                                    >
                                        <List />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Destaque para o Líder do Ranking (Top 1) */}
                    {topCandidato && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 shadow-xs">
                            <div className="flex items-center gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                                    <Crown className="size-6 fill-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                                            Top Match da Vaga (1º Lugar)
                                        </span>
                                        <Badge variant="success" className="text-[10px] gap-1">
                                            <CheckCircle2 className="size-3" /> Avaliado
                                        </Badge>
                                    </div>
                                    <h3 className="font-heading text-lg font-bold text-foreground">
                                        {topCandidato.nome}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Maior pontuação consolidada da seleção com nota {Number(topCandidato.notaFinal).toFixed(1)} / 10
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={() => setCandidatoSelecionado(topCandidato)}
                                className="w-full sm:w-fit shrink-0 gap-2 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
                            >
                                <Sparkles className="size-4" /> Ver Avaliação do Líder
                            </Button>
                        </div>
                    )}

                    {candidatos.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border py-16 text-center">
                            <p className="text-sm text-muted-foreground">
                                Nenhum candidato cadastrado nesta vaga ainda.
                            </p>
                        </div>
                    ) : modoVisualizacao === "grade" ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {candidatosOrdenados.map((candidato, index) => (
                                <CandidatoCardRanking
                                    key={candidato.id}
                                    candidato={candidato}
                                    posicao={index + 1}
                                    onSelecionar={setCandidatoSelecionado}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {candidatosOrdenados.map((candidato, index) => (
                                <CandidatoLinhaRanking
                                    key={candidato.id}
                                    candidato={candidato}
                                    posicao={index + 1}
                                    onSelecionar={setCandidatoSelecionado}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CandidatoDetalheModal
                candidato={candidatoSelecionado}
                vaga={vaga}
                open={candidatoSelecionado !== null}
                onOpenChange={(open) => {
                    if (!open) setCandidatoSelecionado(null);
                }}
                onVerChat={() => {
                    setCandidatoNoChat(candidatoSelecionado);
                    setCandidatoSelecionado(null);
                }}
            />

            <CandidatoChatDialog
                vagaId={vaga.id}
                candidatoId={candidatoNoChat?.id ?? null}
                open={candidatoNoChat !== null}
                onOpenChange={(open) => {
                    if (!open) setCandidatoNoChat(null);
                }}
            />
        </>
    );
}
