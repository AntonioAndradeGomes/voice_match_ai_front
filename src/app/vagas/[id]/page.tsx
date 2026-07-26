"use client";

import { ArrowLeft, ExternalLink, LayoutGrid, List, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import { CandidatoDetalheModal } from "@/_components/candidatos/candidato-detalhe-modal";
import { Avatar, AvatarFallback } from "@/_components/ui/avatar";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import { Card, CardContent } from "@/_components/ui/card";
import { DivulgarVaga } from "@/_components/vagas/divulgar-vaga";
import { getCandidatosByVaga, getVagaById } from "@/lib/storage";
import { cn } from "@/lib/utils";
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

function ordenarPorNota(candidatos: Candidato[]): Candidato[] {
    return [...candidatos].sort((a, b) => {
        if (a.notaFinal === null && b.notaFinal === null) return 0;
        if (a.notaFinal === null) return 1;
        if (b.notaFinal === null) return -1;
        return b.notaFinal - a.notaFinal;
    });
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

function CandidatoCard({
    candidato,
    onSelecionar,
}: {
    candidato: Candidato;
    onSelecionar: (candidato: Candidato) => void;
}) {
    const badge = getCandidatoBadge(candidato);

    return (
        <button
            type="button"
            onClick={() => onSelecionar(candidato)}
            className="block w-full text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
            <Card size="sm" className="transition-shadow hover:shadow-md">
                <div className="flex items-center gap-3 px-(--card-spacing)">
                    <Avatar>
                        <AvatarFallback
                            className={cn(
                                corAvatar(candidato.id),
                                "text-white",
                            )}
                        >
                            {candidato.nome.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate font-heading text-base font-medium">
                        {candidato.nome}
                    </span>
                    <Badge variant={badge.variant} className="shrink-0">
                        {badge.label}
                    </Badge>
                </div>
            </Card>
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
        () => ordenarPorNota(estado.candidatos),
        [estado.candidatos],
    );

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

    if (!estado.vaga) return null;

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
                                Iris · IA entrevistadora
                            </span>
                        </CardContent>
                        <CardContent className="text-sm text-muted-foreground">
                            A Iris é uma IA que entrevista candidatos por áudio,
                            por meio de um agente, e devolve um relatório pra
                            todo mundo: Recrutador e Candidato.
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold tracking-tight">
                            Candidatos ({candidatos.length})
                        </h2>

                        {candidatos.length > 0 && (
                            <div className="flex items-center gap-1 rounded-2xl border border-border p-1">
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

                    {candidatos.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border py-16 text-center">
                            <p className="text-sm text-muted-foreground">
                                Nenhum candidato nesta vaga ainda.
                            </p>
                        </div>
                    ) : modoVisualizacao === "grade" ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {candidatosOrdenados.map((candidato) => (
                                <CandidatoCard
                                    key={candidato.id}
                                    candidato={candidato}
                                    onSelecionar={setCandidatoSelecionado}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {candidatosOrdenados.map((candidato) => (
                                <CandidatoCard
                                    key={candidato.id}
                                    candidato={candidato}
                                    onSelecionar={setCandidatoSelecionado}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CandidatoDetalheModal
                candidato={candidatoSelecionado}
                vagaId={vaga.id}
                open={candidatoSelecionado !== null}
                onOpenChange={(open) => {
                    if (!open) setCandidatoSelecionado(null);
                }}
            />
        </>
    );
}
