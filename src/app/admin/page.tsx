"use client";

import { Building2, FlaskConical, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { NovaEmpresaDialog } from "@/_components/admin/nova-empresa-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/_components/ui/alert";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import { Card, CardContent } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Skeleton } from "@/_components/ui/skeleton";
import { useDadosEmCache } from "@/lib/cache-swr";
import { listarEmpresas } from "@/lib/empresas";
import { STATUS_EMPRESA_LABEL, type Empresa } from "@/types";

const SEM_EMPRESAS: Empresa[] = [];

function Indicador({ label, valor }: { label: string; valor: string }) {
    return (
        <Card size="sm">
            <CardContent className="flex flex-col gap-1 p-4">
                <span className="font-heading text-2xl font-semibold tracking-tight">
                    {valor}
                </span>
                <span className="text-xs text-muted-foreground">{label}</span>
            </CardContent>
        </Card>
    );
}

function LinhaEmpresa({ empresa }: { empresa: Empresa }) {
    return (
        <Card>
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary/10 text-sidebar-primary">
                    <Building2 className="size-5" />
                </span>

                <div className="flex min-w-48 flex-1 flex-col">
                    <span className="font-medium">{empresa.nome}</span>
                    <span className="text-xs text-muted-foreground">
                        {/* CNPJ formatado só na exibição: o backend guarda e
                            devolve só dígitos, como já faz em recrutador.cnpj. */}
                        {empresa.cnpj
                            ? formatarCnpj(empresa.cnpj)
                            : "CNPJ não informado"}
                    </span>
                </div>

                <div className="flex items-center gap-6 text-sm">
                    <div className="flex flex-col items-end">
                        <span className="font-medium">
                            {empresa.totalUsuarios}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            usuários
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="font-medium">{empresa.totalVagas}</span>
                        <span className="text-xs text-muted-foreground">
                            vagas
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="font-medium">
                            {empresa.totalCandidaturas}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            candidaturas
                        </span>
                    </div>
                </div>

                <Badge
                    variant={
                        empresa.status === "ativa" ? "default" : "destructive"
                    }
                >
                    {STATUS_EMPRESA_LABEL[empresa.status]}
                </Badge>
            </CardContent>
        </Card>
    );
}

function formatarCnpj(cnpj: string) {
    if (cnpj.length !== 14) return cnpj;
    return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5",
    );
}

export default function AdminPage() {
    const { dados, carregando, recarregar } = useDadosEmCache(
        "admin:empresas",
        listarEmpresas,
    );
    const [busca, setBusca] = useState("");
    const [novaOpen, setNovaOpen] = useState(false);

    const empresas = dados?.empresas ?? SEM_EMPRESAS;
    const demonstracao = dados?.demonstracao ?? false;

    const visiveis = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return empresas;
        return empresas.filter(
            (e) =>
                e.nome.toLowerCase().includes(termo) ||
                (e.cnpj ?? "").includes(termo.replace(/\D/g, "")),
        );
    }, [empresas, busca]);

    const resumo = useMemo(
        () => ({
            total: empresas.length,
            ativas: empresas.filter((e) => e.status === "ativa").length,
            vagas: empresas.reduce((soma, e) => soma + e.totalVagas, 0),
        }),
        [empresas],
    );

    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">
                        Empresas
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Administração da plataforma: cadastre e acompanhe as
                        empresas que usam o VoiceMatch.
                    </p>
                </div>

                <Button onClick={() => setNovaOpen(true)}>
                    <Plus />
                    Cadastrar empresa
                </Button>
            </header>

            {/* Aviso permanente, e não um toast: enquanto o backend não tiver
                as rotas, tudo nesta tela é exemplo. Some sozinho quando
                `GET /empresas` deixar de responder 404. */}
            {demonstracao && (
                <Alert>
                    <FlaskConical />
                    <AlertTitle>Modo de demonstração</AlertTitle>
                    <AlertDescription>
                        O servidor ainda não expõe o cadastro de empresas, então
                        os dados abaixo são fictícios e nada aqui é salvo. O que
                        falta no backend está em{" "}
                        <code>docs/multi-tenant-contrato-backend.md</code>.
                    </AlertDescription>
                </Alert>
            )}

            {carregando ? (
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-20 rounded-2xl" />
                    <Skeleton className="h-20 rounded-2xl" />
                    <Skeleton className="h-20 rounded-2xl" />
                </div>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Indicador
                            label="Empresas cadastradas"
                            valor={String(resumo.total)}
                        />
                        <Indicador
                            label="Ativas"
                            valor={String(resumo.ativas)}
                        />
                        <Indicador
                            label="Vagas na plataforma"
                            valor={String(resumo.vagas)}
                        />
                    </div>

                    <div className="relative">
                        <Search className="absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground" />
                        <Input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar por nome ou CNPJ"
                            className="h-11 rounded-xl pl-9"
                        />
                    </div>

                    {visiveis.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border py-16 text-center">
                            <p className="text-sm text-muted-foreground">
                                {empresas.length === 0
                                    ? "Nenhuma empresa cadastrada ainda."
                                    : "Nenhuma empresa com esses critérios."}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {visiveis.map((empresa) => (
                                <LinhaEmpresa
                                    key={empresa.id}
                                    empresa={empresa}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            <NovaEmpresaDialog
                open={novaOpen}
                onOpenChange={setNovaOpen}
                onEmpresaCriada={recarregar}
            />
        </div>
    );
}
