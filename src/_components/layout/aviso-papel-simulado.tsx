"use client";

import { UserCog } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/_components/ui/button";
import { lerPapelSimulado, limparPapelSimulado } from "@/lib/papel-simulado";

const ROTULO: Record<string, string> = {
    recrutador: "Recrutador",
    admin_empresa: "Admin da empresa",
    admin_sistema: "Admin do sistema",
};

// Sem inscrição: o valor só muda por recarga de página, e o botão abaixo
// recarrega. O React chama `lerPapelSimulado` a cada render, então login e
// logout já refletem sozinhos.
const semInscricao = () => () => {};

/**
 * Faixa de aviso enquanto um papel está sendo simulado (ver
 * lib/papel-simulado.ts). Existe só fora de produção, junto com a simulação.
 *
 * É deliberadamente chamativa: alguém pode abrir a tela do admin do sistema
 * numa apresentação e concluir que a permissão já funciona de verdade. Ela não
 * funciona — o backend nem conhece esse papel ainda.
 */
export function AvisoPapelSimulado() {
    // `useSyncExternalStore` em vez de ler num efeito: `sessionStorage` não
    // existe no servidor, e o snapshot fixo `null` para o SSR evita a
    // divergência de hidratação sem precisar de `setState` dentro de efeito.
    const papel = useSyncExternalStore(
        semInscricao,
        lerPapelSimulado,
        () => null,
    );

    if (!papel) return null;

    return (
        <div
            role="status"
            className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm text-purple-900 dark:text-purple-200"
        >
            <UserCog className="size-4 shrink-0" />
            <p className="flex-1">
                <span className="font-medium">
                    Papel simulado: {ROTULO[papel] ?? papel}.
                </span>{" "}
                Só para percorrer as telas — o servidor ainda não conhece este
                papel, e nenhuma permissão real está em vigor.
            </p>
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    limparPapelSimulado();
                    // Recarrega em vez de só limpar o estado: a sidebar e a
                    // guarda de rota decidem na montagem, então metade da tela
                    // continuaria desenhada como admin.
                    window.location.assign("/");
                }}
                className="shrink-0 border-purple-500/40 bg-transparent"
            >
                Voltar ao normal
            </Button>
        </div>
    );
}
