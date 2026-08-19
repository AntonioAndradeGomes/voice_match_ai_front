"use client";

import { FlaskConical, ShieldAlert, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";

import { NovoAdminSistemaDialog } from "@/_components/admin/novo-admin-sistema-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/_components/ui/alert";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import { Card, CardContent } from "@/_components/ui/card";
import { Skeleton } from "@/_components/ui/skeleton";
import { useDadosEmCache } from "@/lib/cache-swr";
import { listarAdminsDoSistema } from "@/lib/empresas";
import type { UsuarioDaEmpresa } from "@/types";

const SEM_ADMINS: UsuarioDaEmpresa[] = [];

function formatarData(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function AdministradoresPage() {
    const { dados, carregando, recarregar } = useDadosEmCache(
        "admin:administradores",
        listarAdminsDoSistema,
    );
    const [novoOpen, setNovoOpen] = useState(false);

    const admins = dados?.admins ?? SEM_ADMINS;
    const demonstracao = dados?.demonstracao ?? false;

    return (
        <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">
                        Administradores do sistema
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Quem opera a plataforma. Não confundir com os
                        administradores das empresas clientes.
                    </p>
                </div>

                <Button onClick={() => setNovoOpen(true)}>
                    <UserPlus />
                    Novo administrador
                </Button>
            </header>

            {demonstracao && (
                <Alert>
                    <FlaskConical />
                    <AlertTitle>Modo de demonstração</AlertTitle>
                    <AlertDescription>
                        O servidor ainda não expõe administradores do sistema —
                        a lista abaixo é fictícia e nada aqui é salvo.
                    </AlertDescription>
                </Alert>
            )}

            {/* Este papel enxerga e mexe em todas as empresas clientes. Vale
                dizer isso na tela: é o tipo de conta que se cria sem pensar e
                depois ninguém lembra por que existe. */}
            <Alert>
                <ShieldAlert />
                <AlertTitle>Acesso amplo</AlertTitle>
                <AlertDescription>
                    Um administrador do sistema cadastra, suspende e enxerga
                    todas as empresas da plataforma. Crie apenas para quem
                    realmente opera o VoiceMatch.
                </AlertDescription>
            </Alert>

            {carregando ? (
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-20 rounded-2xl" />
                    <Skeleton className="h-20 rounded-2xl" />
                </div>
            ) : admins.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border py-16 text-center">
                    <p className="text-sm text-muted-foreground">
                        Nenhum administrador do sistema cadastrado.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNovoOpen(true)}
                    >
                        <UserPlus />
                        Cadastrar o primeiro
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {admins.map((admin) => (
                        <Card key={admin.id}>
                            <CardContent className="flex flex-wrap items-center gap-4 p-4">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary/10 text-sidebar-primary">
                                    <ShieldCheck className="size-5" />
                                </span>
                                <div className="flex min-w-48 flex-1 flex-col">
                                    <span className="font-medium">
                                        {admin.nomeCompleto}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {admin.email}
                                    </span>
                                </div>
                                <Badge variant="outline">
                                    Admin do sistema
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    desde {formatarData(admin.dataCriacao)}
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <NovoAdminSistemaDialog
                open={novoOpen}
                onOpenChange={setNovoOpen}
                onAdminCriado={recarregar}
            />
        </div>
    );
}
