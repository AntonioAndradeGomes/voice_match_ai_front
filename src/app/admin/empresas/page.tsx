"use client";

import {
    Building2,
    ChevronRight,
    FlaskConical,
    Plus,
    Search,
} from "lucide-react";
import Link from "next/link";
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
import {
    STATUS_EMPRESA_LABEL,
    type Empresa,
    type StatusEmpresa,
} from "@/types";

type Filtro = "todas" | StatusEmpresa;

const FILTROS: { valor: Filtro; rotulo: string }[] = [
    { valor: "todas", rotulo: "Todas" },
    { valor: "ativa", rotulo: "Ativas" },
    { valor: "suspensa", rotulo: "Suspensas" },
];

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
        <Link
            href={`/admin/empresas/${empresa.id}`}
            className="rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
            <Card className="transition-colors hover:border-sidebar-primary/40">
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
                            <span className="font-medium">
                                {empresa.totalVagas}
                            </span>
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
                            empresa.status === "ativa"
                                ? "default"
                                : "destructive"
                        }
                    >
                        {STATUS_EMPRESA_LABEL[empresa.status]}
                    </Badge>

                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
            </Card>
        </Link>
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
    const [filtro, setFiltro] = useState<Filtro>("todas");
    const [novaOpen, setNovaOpen] = useState(false);

    const empresas = dados?.empresas ?? SEM_EMPRESAS;
    const demonstracao = dados?.demonstracao ?? false;

    const visiveis = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return (
            empresas
                .filter((e) => filtro === "todas" || e.status === filtro)
                .filter(
                    (e) =>
                        !termo ||
                        e.nome.toLowerCase().includes(termo) ||
                        (e.cnpj ?? "").includes(termo.replace(/\D/g, "")),
                )
                // Maiores primeiro: num painel de operação, a empresa com mais
                // candidaturas é a que dá trabalho e a que não pode cair.
                .sort((a, b) => b.totalCandidaturas - a.totalCandidaturas)
        );
    }, [empresas, busca, filtro]);

    const resumo = useMemo(
        () => ({
            total: empresas.length,
            ativas: empresas.filter((e) => e.status === "ativa").length,
            usuarios: empresas.reduce((soma, e) => soma + e.totalUsuarios, 0),
            vagas: empresas.reduce((soma, e) => soma + e.totalVagas, 0),
            candidaturas: empresas.reduce(
                (soma, e) => soma + e.totalCandidaturas,
                0,
            ),
            semAcesso: empresas.filter((e) => e.totalUsuarios === 0).length,
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
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Indicador
                            label="Empresas ativas"
                            valor={`${resumo.ativas}/${resumo.total}`}
                        />
                        <Indicador
                            label="Usuários na plataforma"
                            valor={String(resumo.usuarios)}
                        />
                        <Indicador label="Vagas" valor={String(resumo.vagas)} />
                        <Indicador
                            label="Candidaturas"
                            valor={String(resumo.candidaturas)}
                        />
                    </div>

                    {/* Empresa cadastrada sem nenhum usuário é cliente que
                        pagou e não consegue entrar — é o problema mais urgente
                        que este painel pode mostrar, então vem antes da lista. */}
                    {resumo.semAcesso > 0 && (
                        <Alert>
                            <Building2 />
                            <AlertTitle>
                                {resumo.semAcesso === 1
                                    ? "1 empresa sem acesso liberado"
                                    : `${resumo.semAcesso} empresas sem acesso liberado`}
                            </AlertTitle>
                            <AlertDescription>
                                Estão cadastradas, mas ninguém consegue entrar
                                nelas. Abra cada uma e cadastre o administrador.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                        {FILTROS.map(({ valor, rotulo }) => (
                            <Button
                                key={valor}
                                variant={
                                    filtro === valor ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setFiltro(valor)}
                            >
                                {rotulo}
                            </Button>
                        ))}
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
