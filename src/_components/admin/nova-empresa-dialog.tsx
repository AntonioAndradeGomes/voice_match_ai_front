"use client";

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
import { criarEmpresa } from "@/lib/empresas";

interface NovaEmpresaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEmpresaCriada: () => void;
}

/** Deixa só os dígitos: o backend guarda CNPJ assim, como já faz no cadastro
 *  de recrutador. A máscara é só para leitura, na hora de exibir. */
function apenasDigitos(valor: string) {
    return valor.replace(/\D/g, "");
}

export function NovaEmpresaDialog({
    open,
    onOpenChange,
    onEmpresaCriada,
}: NovaEmpresaDialogProps) {
    const [nome, setNome] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [salvando, setSalvando] = useState(false);

    const cnpjLimpo = apenasDigitos(cnpj);
    // CNPJ é opcional (o cadastro de recrutador já aceita vazio), mas se for
    // preenchido tem que estar completo — meio CNPJ no banco não serve para o
    // `unique` que impede empresa duplicada.
    const cnpjValido = cnpjLimpo.length === 0 || cnpjLimpo.length === 14;
    const valido = nome.trim().length >= 2 && cnpjValido;

    async function handleSalvar() {
        setSalvando(true);
        try {
            const empresa = await criarEmpresa({
                nome: nome.trim(),
                cnpj: cnpjLimpo || undefined,
            });
            toast.success(`Empresa "${empresa.nome}" cadastrada.`);
            setNome("");
            setCnpj("");
            onEmpresaCriada();
            onOpenChange(false);
        } catch (erro) {
            // A mensagem vem pronta de lib/empresas.ts, que distingue CNPJ
            // duplicado (409) de rota inexistente (404, o caso de hoje).
            toast.error(
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível cadastrar a empresa.",
            );
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cadastrar empresa</DialogTitle>
                    <DialogDescription>
                        A empresa passa a existir como cliente da plataforma.
                        Depois de criada, cadastre o administrador dela para
                        liberar o primeiro acesso.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-5 py-2">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="empresa-nome">Nome da empresa</Label>
                        <Input
                            id="empresa-nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Acme Recrutamento"
                            className="h-11 rounded-xl px-4"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="empresa-cnpj">
                            CNPJ{" "}
                            <span className="font-normal text-muted-foreground">
                                (opcional)
                            </span>
                        </Label>
                        <Input
                            id="empresa-cnpj"
                            value={cnpj}
                            onChange={(e) => setCnpj(e.target.value)}
                            placeholder="00.000.000/0000-00"
                            inputMode="numeric"
                            aria-invalid={!cnpjValido ? true : undefined}
                            className="h-11 rounded-xl px-4"
                        />
                        {!cnpjValido && (
                            <p role="alert" className="text-sm text-destructive">
                                O CNPJ precisa ter 14 dígitos.
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            É o que impede a mesma empresa de ser cadastrada
                            duas vezes com nomes escritos de formas diferentes.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                        Cancelar
                    </DialogClose>
                    <Button onClick={handleSalvar} disabled={!valido || salvando}>
                        {salvando ? "Cadastrando..." : "Cadastrar empresa"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
