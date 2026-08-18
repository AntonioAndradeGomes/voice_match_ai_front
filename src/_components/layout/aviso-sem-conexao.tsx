"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

import { Button } from "@/_components/ui/button";
import {
    assinarConexao,
    lerServidorInacessivel,
    lerServidorInacessivelNoServidor,
} from "@/lib/conexao";

export function useServidorInacessivel() {
    return useSyncExternalStore(
        assinarConexao,
        lerServidorInacessivel,
        lerServidorInacessivelNoServidor,
    );
}

/**
 * Faixa de aviso para quando o backend está inacessível.
 *
 * O problema que ela resolve não é o usuário não saber que caiu — é ele não
 * desconfiar de nada: as vagas continuam na tela, vindas do cache que o
 * `getVagas()` grava no localStorage, enquanto a lista de candidatos aparece
 * vazia porque nunca houve cache dela. Sem aviso, "0 candidatos" se lê como um
 * fato sobre a vaga, e não como uma falha de conexão.
 *
 * Some sozinha: qualquer resposta do servidor derruba o sinal em lib/conexao.ts.
 */
export function AvisoSemConexao() {
    const inacessivel = useServidorInacessivel();
    const semMovimento = useReducedMotion();

    return (
        <AnimatePresence>
            {inacessivel && (
                <motion.div
                    // `height` junto com opacidade: a faixa empurra o conteúdo
                    // para baixo, e aparecer de repente daria um solavanco na
                    // página inteira.
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={
                        semMovimento
                            ? { duration: 0 }
                            : { duration: 0.2, ease: "easeOut" }
                    }
                    className="overflow-hidden"
                >
                    {/* `status`, e não `alert`: o leitor de tela anuncia quando
                        terminar a frase atual, em vez de interromper no meio. A
                        conexão caiu, não é uma emergência. */}
                    <div
                        role="status"
                        className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-900 dark:text-amber-200"
                    >
                        <WifiOff className="size-4 shrink-0" />
                        <p className="flex-1">
                            <span className="font-medium">
                                Sem conexão com o servidor.
                            </span>{" "}
                            As vagas abaixo vêm de uma cópia local e podem estar
                            desatualizadas; os candidatos não podem ser
                            carregados.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="shrink-0 border-amber-500/40 bg-transparent"
                        >
                            <RefreshCw />
                            Tentar de novo
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
