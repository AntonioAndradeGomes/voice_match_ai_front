"use client";

import { LogOut, UserRoundCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/_components/ui/button";
import { useAuth } from "@/context/auth-provider";

/**
 * Faixa fixa enquanto o admin do sistema está atuando dentro da conta de um
 * cliente.
 *
 * É o aviso mais forte da aplicação, de propósito. Quem está impersonando vê
 * exatamente a tela que o cliente vê — mesmas vagas, mesmos candidatos, mesmos
 * botões — e, sem um lembrete permanente, é questão de tempo até alguém achar
 * que está na própria conta e alterar dado de cliente sem perceber.
 */
export function AvisoImpersonation() {
    const { estaImpersonando, usuario, desimpersonar } = useAuth();
    const router = useRouter();
    const [voltando, setVoltando] = useState(false);

    if (!estaImpersonando) return null;

    async function voltar() {
        setVoltando(true);
        try {
            await desimpersonar();
            router.replace("/admin/empresas");
        } catch (erro) {
            // A sessão do cliente continua ativa se a volta falhar, então a
            // pessoa não fica sem acesso nenhum — mas precisa saber que
            // continua dentro da conta do cliente.
            toast.error(
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível voltar para a sua conta.",
            );
            setVoltando(false);
        }
    }

    return (
        <div
            role="status"
            className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-destructive/40 bg-destructive/15 px-4 py-2.5 text-sm text-destructive"
        >
            <UserRoundCog className="size-4 shrink-0" />
            <p className="flex-1">
                <span className="font-medium">
                    Você está na conta de um cliente
                    {usuario?.recrutador?.empresa
                        ? `: ${usuario.recrutador.empresa}`
                        : ""}
                    .
                </span>{" "}
                Tudo o que fizer aqui vale como se fosse ele.
            </p>
            <Button
                variant="outline"
                size="sm"
                onClick={voltar}
                disabled={voltando}
                className="shrink-0 border-destructive/40 bg-transparent"
            >
                <LogOut />
                {voltando ? "Voltando..." : "Voltar para Admin"}
            </Button>
        </div>
    );
}
