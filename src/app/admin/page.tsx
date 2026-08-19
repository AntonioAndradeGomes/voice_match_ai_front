"use client";

import {
    ArrowRight,
    Briefcase,
    Building2,
    FlaskConical,
    Plus,
    ShieldCheck,
    TriangleAlert,
    UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { NovaEmpresaDialog } from "@/_components/admin/nova-empresa-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/_components/ui/alert";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import { Card, CardContent } from "@/_components/ui/card";
import { Skeleton } from "@/_components/ui/skeleton";
import { useDadosEmCache } from "@/lib/cache-swr";
import { listarEmpresas } from "@/lib/empresas";
import { STATUS_EMPRESA_LABEL, type Empresa } from "@/types";

const SEM_EMPRESAS: Empresa[] = [];

// Quantas empresas recentes cabem sem a lista virar um segundo painel. Acima
// disso, o lugar de olhar é /admin/empresas, que tem busca e filtro.
const RECENTES_NO_PAINEL = 5;

function Indicador({
    label,
    valor,
    icone: Icone,
}: {
    label: string;
    valor: string;
    icone: typeof Building2;
}) {
    return (
        <Card size="sm">
            <CardContent className="flex items-center gap-3 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary/10 text-sidebar-primary">
                    <Icone className="size-5" />
                </span>
                <div className="flex flex-col">
                    <span className="font-heading text-2xl font-semibold tracking-tight">
                        {valor}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {label}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminVisaoGeralPage() {
    const { dados, carregando, recarregar } = useDadosEmCache(
        "admin:empresas",
        listarEmpresas,
    );
    const [novaOpen, setNovaOpen] = useState(false);

    const empresas = dados?.empresas ?? SEM_EMPRESAS;
    const demonstracao = dados?.demonstracao ?? false;

    const resumo = useMemo(() => {
        const semAcesso = empresas.filter((e) => e.totalUsuarios === 0);
        const suspensas = empresas.filter((e) => e.status === "suspensa");
        return {
            total: empresas.length,
            ativas: empresas.length - suspensas.length,
            usuarios: empresas.reduce((s, e) => s + e.totalUsuarios, 0),
            vagas: empresas.reduce((s, e) => s + e.totalVagas, 0),
            candidaturas: empresas.reduce((s, e) => s + e.totalCandidaturas, 0),
            semAcesso,
            suspensas,
        };
    }, [empresas]);

    const recentes = useMemo(
        () =>
            [...empresas]
                .sort(
                    (a, b) =>
                        new Date(b.dataCriacao).getTime() -
                        new Date(a.dataCriacao).getTime(),
                )
                .slice(0, RECENTES_NO_PAINEL),
        [empresas],
    );

    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">
                        Visão geral
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Administração da plataforma VoiceMatch.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        nativeButton={false}
                        render={<Link href="/admin/empresas" />}
                    >
                        <Building2 />
                        Ver empresas
                    </Button>
                    <Button onClick={() => setNovaOpen(true)}>
                        <Plus />
                        Cadastrar empresa
                    </Button>
                </div>
            </header>

            {demonstracao && (
                <Alert>
                    <FlaskConical />
                    <AlertTitle>Modo de demonstração</AlertTitle>
                    <AlertDescription>
                        O servidor ainda não expõe empresas, então os números
                        abaixo são fictícios. O que falta no backend está em{" "}
                        <code>docs/multi-tenant-contrato-backend.md</code>.
                    </AlertDescription>
                </Alert>
            )}

            {carregando ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-20 rounded-2xl" />
                    <Skeleton className="h-20 rounded-2xl" />
                    <Skeleton className="h-20 rounded-2xl" />
                    <Skeleton className="h-20 rounded-2xl" />
                </div>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Indicador
                            icone={Building2}
                            label="Empresas ativas"
                            valor={`${resumo.ativas}/${resumo.total}`}
                        />
                        <Indicador
                            icone={UsersRound}
                            label="Usuários"
                            valor={String(resumo.usuarios)}
                        />
                        <Indicador
                            icone={Briefcase}
                            label="Vagas"
                            valor={String(resumo.vagas)}
                        />
                        <Indicador
                            icone={ShieldCheck}
                            label="Candidaturas"
                            valor={String(resumo.candidaturas)}
                        />
                    </div>

                    {/* O que exige ação vem antes do que é só informação. Uma
                        empresa sem usuário é cliente que não consegue entrar;
                        uma suspensa é acesso cortado que talvez ninguém tenha
                        revisto. */}
                    {(resumo.semAcesso.length > 0 ||
                        resumo.suspensas.length > 0) && (
                        <section className="flex flex-col gap-3">
                            <h2 className="font-heading text-lg font-medium">
                                Precisa de atenção
                            </h2>

                            {resumo.semAcesso.map((empresa) => (
                                <Alert key={empresa.id}>
                                    <TriangleAlert />
                                    <AlertTitle>
                                        {empresa.nome} está sem acesso liberado
                                    </AlertTitle>
                                    <AlertDescription className="flex flex-wrap items-center gap-3">
                                        <span>
                                            Cadastrada, mas ninguém consegue
                                            entrar. Falta o administrador.
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            nativeButton={false}
                                            render={
                                                <Link
                                                    href={`/admin/empresas/${empresa.id}`}
                                                />
                                            }
                                        >
                                            Resolver
                                            <ArrowRight />
                                        </Button>
                                    </AlertDescription>
                                </Alert>
                            ))}

                            {resumo.suspensas.map((empresa) => (
                                <Alert key={empresa.id} variant="destructive">
                                    <TriangleAlert />
                                    <AlertTitle>
                                        {empresa.nome} está suspensa
                                    </AlertTitle>
                                    <AlertDescription className="flex flex-wrap items-center gap-3">
                                        <span>
                                            Os usuários dela não conseguem
                                            entrar. Nenhum dado foi apagado.
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            nativeButton={false}
                                            render={
                                                <Link
                                                    href={`/admin/empresas/${empresa.id}`}
                                                />
                                            }
                                        >
                                            Revisar
                                            <ArrowRight />
                                        </Button>
                                    </AlertDescription>
                                </Alert>
                            ))}
                        </section>
                    )}

                    <section className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="font-heading text-lg font-medium">
                                Entraram por último
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                nativeButton={false}
                                render={<Link href="/admin/empresas" />}
                            >
                                Ver todas
                                <ArrowRight />
                            </Button>
                        </div>

                        {recentes.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border py-12 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Nenhuma empresa cadastrada ainda.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setNovaOpen(true)}
                                >
                                    <Plus />
                                    Cadastrar a primeira
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {recentes.map((empresa) => (
                                    <Link
                                        key={empresa.id}
                                        href={`/admin/empresas/${empresa.id}`}
                                        className="rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                    >
                                        <Card className="transition-colors hover:border-sidebar-primary/40">
                                            <CardContent className="flex flex-wrap items-center gap-4 p-4">
                                                <span className="flex-1 font-medium">
                                                    {empresa.nome}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {empresa.totalUsuarios}{" "}
                                                    usuários ·{" "}
                                                    {empresa.totalVagas} vagas
                                                </span>
                                                <Badge
                                                    variant={
                                                        empresa.status ===
                                                        "ativa"
                                                            ? "default"
                                                            : "destructive"
                                                    }
                                                >
                                                    {
                                                        STATUS_EMPRESA_LABEL[
                                                            empresa.status
                                                        ]
                                                    }
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            <NovaEmpresaDialog
                open={novaOpen}
                onOpenChange={setNovaOpen}
                // Painel e lista compartilham a chave "admin:empresas", então
                // isto atualiza os dois de uma vez.
                onEmpresaCriada={recarregar}
            />
        </div>
    );
}
