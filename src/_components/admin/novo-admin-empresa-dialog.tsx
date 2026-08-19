"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/_components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/_components/ui/dialog";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { criarAdminDaEmpresa } from "@/lib/empresas";

interface NovoAdminEmpresaDialogProps {
    empresaId: string;
    empresaNome: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdminCriado: () => void;
}

// O backend aceita senha a partir de 6 caracteres. O formulário de login exige
// 8 e por isso trava quem tem senha de 6 ou 7 — bug já conhecido. Aqui vale o
// mínimo real do backend, para não criar conta que depois não consegue entrar.
const MINIMO_SENHA = 6;

export function NovoAdminEmpresaDialog({
    empresaId,
    empresaNome,
    open,
    onOpenChange,
    onAdminCriado,
}: NovoAdminEmpresaDialogProps) {
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const senhaValida = senha.length >= MINIMO_SENHA;
    const valido = nome.trim().length >= 2 && emailValido && senhaValida;

    async function handleSalvar() {
        setSalvando(true);
        try {
            const criado = await criarAdminDaEmpresa(empresaId, {
                nome_completo: nome.trim(),
                email: email.trim(),
                senha,
            });
            toast.success(`${criado.nomeCompleto} agora administra a empresa.`);
            setNome("");
            setEmail("");
            setSenha("");
            onAdminCriado();
            onOpenChange(false);
        } catch (erro) {
            toast.error(
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível cadastrar o administrador.",
            );
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cadastrar administrador</DialogTitle>
                    <DialogDescription>
                        Libera o primeiro acesso de {empresaNome}. Esta pessoa
                        administra a conta da empresa — não confundir com o
                        administrador do sistema, que é quem opera a plataforma.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-5 py-2">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="admin-nome">Nome completo</Label>
                        <Input
                            id="admin-nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Maria Oliveira"
                            className="h-11 rounded-xl px-4"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="admin-email">E-mail</Label>
                        <Input
                            id="admin-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="maria@empresa.com"
                            aria-invalid={
                                email && !emailValido ? true : undefined
                            }
                            className="h-11 rounded-xl px-4"
                        />
                        {email && !emailValido && (
                            <p role="alert" className="text-sm text-destructive">
                                E-mail inválido.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="admin-senha">Senha provisória</Label>
                        <div className="relative">
                            <Input
                                id="admin-senha"
                                type={mostrarSenha ? "text" : "password"}
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                placeholder="••••••••"
                                aria-invalid={
                                    senha && !senhaValida ? true : undefined
                                }
                                className="h-11 rounded-xl px-4 pr-11"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setMostrarSenha((v) => !v)}
                                aria-label={
                                    mostrarSenha
                                        ? "Ocultar senha"
                                        : "Mostrar senha"
                                }
                                className="absolute inset-y-0 right-1.5 my-auto text-muted-foreground"
                            >
                                {mostrarSenha ? <EyeOff /> : <Eye />}
                            </Button>
                        </div>
                        {senha && !senhaValida && (
                            <p role="alert" className="text-sm text-destructive">
                                A senha precisa de ao menos {MINIMO_SENHA}{" "}
                                caracteres.
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Combine com a pessoa por um canal seguro. Ainda não
                            existe troca de senha no primeiro acesso.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                        Cancelar
                    </DialogClose>
                    <Button
                        onClick={handleSalvar}
                        disabled={!valido || salvando}
                    >
                        {salvando ? "Cadastrando..." : "Cadastrar administrador"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
