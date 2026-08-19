"use client";

import {
    ArrowLeft,
    Ban,
    Building2,
    CircleCheck,
    FlaskConical,
    UserPlus,
    UsersRound,
} from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { toast } from "sonner";

import { NovoAdminEmpresaDialog } from "@/_components/admin/novo-admin-empresa-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/_components/ui/alert";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import { Card, CardContent } from "@/_components/ui/card";
import { Skeleton } from "@/_components/ui/skeleton";
import { useDadosEmCache } from "@/lib/cache-swr";
import { alterarStatusEmpresa, buscarEmpresa } from "@/lib/empresas";
import {
    STATUS_EMPRESA_LABEL,
    TIPO_USUARIO_LABEL,
    type UsuarioDaEmpresa,
} from "@/types";

const SEM_USUARIOS: UsuarioDaEmpresa[] = [];

function formatarData(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

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

export default function EmpresaDetalhePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { dados, carregando, recarregar } = useDadosEmCache(
        `admin:empresa:${id}`,
        () => buscarEmpresa(id),
    );
    const [novoAdminOpen, setNovoAdminOpen] = useState(false);
    const [alterandoStatus, setAlterandoStatus] = useState(false);

    const empresa = dados?.empresa ?? null;
    const usuarios = dados?.usuarios ?? SEM_USUARIOS;
    const demonstracao = dados?.demonstracao ?? false;

    async function alternarStatus() {
        if (!empresa) return;
        const novo = empresa.status === "ativa" ? "suspensa" : "ativa";
        setAlterandoStatus(true);
        try {
            await alterarStatusEmpresa(empresa.id, novo);
            toast.success(
                novo === "suspensa"
                    ? "Empresa suspensa. Os usuários dela perdem o acesso."
                    : "Empresa reativada.",
            );
            recarregar();
        } catch (erro) {
            toast.error(
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível alterar o status.",
            );
        } finally {
            setAlterandoStatus(false);
        }
    }

    if (carregando) {
        return (
            <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
            </div>
        );
    }

    if (!empresa) {
        return (
            <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 py-20 text-center">
                <p className="text-sm text-muted-foreground">
                    Empresa não encontrada.
                </p>
                <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/admin" />}
                >
                    <ArrowLeft />
                    Voltar para empresas
                </Button>
            </div>
        );
    }

    // O admin da empresa é o primeiro acesso do cliente: sem ele, a empresa
    // está cadastrada e ninguém consegue entrar. Vale destaque na tela, não
    // só uma linha a menos na lista.
    const temAdmin = usuarios.some((u) => u.tipoUsuario === "admin_empresa");

    return (
        <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
            <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/admin" />}
                className="self-start text-muted-foreground"
            >
                <ArrowLeft />
                Empresas
            </Button>

            {demonstracao && (
                <Alert>
                    <FlaskConical />
                    <AlertTitle>Modo de demonstração</AlertTitle>
                    <AlertDescription>
                        O servidor ainda não expõe empresas — os dados desta
                        página são fictícios e nenhuma ação aqui é salva.
                    </AlertDescription>
                </Alert>
            )}

            <header className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary/10 text-sidebar-primary">
                        <Building2 className="size-6" />
                    </span>
                    <div className="flex flex-col gap-1">
                        <h1 className="font-heading text-2xl font-semibold tracking-tight">
                            {empresa.nome}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Badge
                                variant={
                                    empresa.status === "ativa"
                                        ? "default"
                                        : "destructive"
                                }
                            >
                                {STATUS_EMPRESA_LABEL[empresa.status]}
                            </Badge>
                            <span>
                                Cliente desde {formatarData(empresa.dataCriacao)}
                            </span>
                        </div>
                    </div>
                </div>

                <Button
                    variant={
                        empresa.status === "ativa" ? "outline" : "default"
                    }
                    onClick={alternarStatus}
                    disabled={alterandoStatus}
                >
                    {empresa.status === "ativa" ? <Ban /> : <CircleCheck />}
                    {empresa.status === "ativa"
                        ? "Suspender empresa"
                        : "Reativar empresa"}
                </Button>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
                <Indicador
                    label="Usuários"
                    valor={String(empresa.totalUsuarios)}
                />
                <Indicador label="Vagas" valor={String(empresa.totalVagas)} />
                <Indicador
                    label="Candidaturas"
                    valor={String(empresa.totalCandidaturas)}
                />
            </div>

            {/* Suspender corta acesso, não apaga dado. Deixar isso explícito na
                tela evita que alguém use suspensão achando que está excluindo
                o cliente — e vice-versa. */}
            {empresa.status === "suspensa" && (
                <Alert variant="destructive">
                    <Ban />
                    <AlertTitle>Empresa suspensa</AlertTitle>
                    <AlertDescription>
                        Os usuários dela não conseguem entrar. Nenhum dado foi
                        apagado — reativar devolve o acesso como estava.
                    </AlertDescription>
                </Alert>
            )}

            <section className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-heading text-lg font-medium">
                        Usuários
                    </h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNovoAdminOpen(true)}
                    >
                        <UserPlus />
                        Cadastrar administrador
                    </Button>
                </div>

                {!temAdmin && (
                    <Alert>
                        <UsersRound />
                        <AlertTitle>Sem administrador</AlertTitle>
                        <AlertDescription>
                            Esta empresa está cadastrada, mas ninguém consegue
                            entrar nela ainda. Cadastre o administrador para
                            liberar o primeiro acesso.
                        </AlertDescription>
                    </Alert>
                )}

                {usuarios.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border py-12 text-center">
                        <p className="text-sm text-muted-foreground">
                            Nenhum usuário nesta empresa.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {usuarios.map((usuario) => (
                            <Card key={usuario.id}>
                                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                                    <div className="flex min-w-48 flex-1 flex-col">
                                        <span className="font-medium">
                                            {usuario.nomeCompleto}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {usuario.email}
                                        </span>
                                    </div>
                                    <Badge variant="outline">
                                        {TIPO_USUARIO_LABEL[usuario.tipoUsuario]}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        desde {formatarData(usuario.dataCriacao)}
                                    </span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            <NovoAdminEmpresaDialog
                empresaId={empresa.id}
                empresaNome={empresa.nome}
                open={novoAdminOpen}
                onOpenChange={setNovoAdminOpen}
                onAdminCriado={recarregar}
            />
        </div>
    );
}
