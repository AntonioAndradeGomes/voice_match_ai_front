"use client";

import { Briefcase, CheckCircle2, MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";

import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/_components/ui/card";
import { ScrollArea } from "@/_components/ui/scroll-area";
import { getCandidatos, getCandidatosByVaga, getVagas } from "@/lib/storage";
import { getResumoVagaBadge } from "@/lib/vaga-status";
import type { Candidato, Vaga } from "@/types";

const VAGAS_RECENTES = 5;

interface DadosDashboard {
    vagas: Vaga[];
    candidatos: Candidato[];
    candidatosPorVaga: Record<string, Candidato[]>;
}

async function carregarDashboard(): Promise<DadosDashboard> {
    const vagas = await getVagas();
    const candidatosEntries = await Promise.all(
        vagas.map(async (vaga) => [vaga.id, await getCandidatosByVaga(vaga.id)] as const)
    );
    const candidatos = await getCandidatos();
    return {
        vagas,
        candidatos,
        candidatosPorVaga: Object.fromEntries(candidatosEntries),
    };
}

function Metrica({
    icone: Icone,
    label,
    valor,
}: {
    icone: ComponentType<{ className?: string }>;
    label: string;
    valor: number;
}) {
    return (
        <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icone className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-heading">{valor}</div>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const [dados, setDados] = useState<DadosDashboard | null>(null);

    useEffect(() => {
        carregarDashboard().then(setDados);
    }, []);

    // `null` enquanto não montou: evita renderizar o estado vazio antes de saber
    // se existem vagas salvas.
    const carregando = dados === null;
    const { vagas, candidatos, candidatosPorVaga } = dados ?? {
        vagas: [],
        candidatos: [],
        candidatosPorVaga: {},
    };

    const emEntrevista = candidatos.filter(
        (candidato) => candidato.status === "em_entrevista",
    ).length;
    const finalizados = candidatos.filter(
        (candidato) => candidato.status === "finalizado",
    ).length;

    return (
        <ScrollArea className="h-full">
            <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
                <header className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Dashboard
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Visão geral das vagas abertas e das entrevistas em
                            andamento.
                        </p>
                    </div>

                    <Button
                        nativeButton={false}
                        render={<Link href="/vagas" />}
                    >
                        <Briefcase data-icon="inline-start" />
                        Ver vagas
                    </Button>
                </header>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Metrica
                        icone={Briefcase}
                        label="Vagas abertas"
                        valor={vagas.length}
                    />
                    <Metrica
                        icone={Users}
                        label="Candidatos"
                        valor={candidatos.length}
                    />
                    <Metrica
                        icone={MessageSquare}
                        label="Em entrevista"
                        valor={emEntrevista}
                    />
                    <Metrica
                        icone={CheckCircle2}
                        label="Entrevistas concluídas"
                        valor={finalizados}
                    />
                </div>

                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="font-heading text-lg font-medium">
                            Vagas recentes
                        </h2>
                        {vagas.length > VAGAS_RECENTES && (
                            <Button
                                variant="ghost"
                                size="sm"
                                nativeButton={false}
                                render={<Link href="/vagas" />}
                            >
                                Ver todas
                            </Button>
                        )}
                    </div>

                    {carregando ? null : vagas.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border py-16 text-center">
                            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <Briefcase className="size-5" />
                            </span>
                            <div className="flex flex-col gap-1">
                                <p className="font-heading text-lg font-medium">
                                    Nenhuma vaga criada ainda
                                </p>
                                <p className="max-w-sm text-sm text-muted-foreground">
                                    Crie sua primeira vaga para começar a
                                    receber e avaliar candidatos.
                                </p>
                            </div>
                            <Button
                                nativeButton={false}
                                render={<Link href="/vagas" />}
                            >
                                Ir para vagas
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {vagas.slice(0, VAGAS_RECENTES).map((vaga) => {
                                const daVaga = candidatosPorVaga[vaga.id] ?? [];
                                const badge = getResumoVagaBadge(daVaga);

                                return (
                                    <Link
                                        key={vaga.id}
                                        href={`/vagas/${vaga.id}`}
                                        className="block rounded-[min(var(--radius-4xl),24px)] outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/30"
                                    >
                                        <Card
                                            size="sm"
                                            className="transition-shadow hover:shadow-md"
                                        >
                                            <CardHeader className="grid-cols-[1fr_auto] items-center">
                                                <div className="flex flex-col gap-1">
                                                    <CardTitle>
                                                        {vaga.titulo}
                                                    </CardTitle>
                                                    <CardDescription className="line-clamp-1">
                                                        {vaga.descricao ||
                                                            "Sem descrição"}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant={badge.variant}>
                                                    {badge.label}
                                                </Badge>
                                            </CardHeader>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </ScrollArea>
    );
}
