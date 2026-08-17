"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Uma linha da camada decorativa. Os valores são fixos, e não sorteados: um
 * Math.random() aqui geraria posições diferentes no servidor e no cliente, e a
 * hidratação acusaria a divergência.
 */
export interface LinhaAnimada {
    topo: string;
    largura: string;
    duracao: number;
    atraso: number;
    opacidade: number;
    /** Espessura em px. Omitido, vira o traço de 1px do hero do login. */
    espessura?: number;
    /**
     * Classe de rotação (`-rotate-6`, ...). Padrão: `-rotate-12`, a inclinação
     * do hero. Vem como classe literal pelo mesmo motivo de `cor`.
     */
    rotacao?: string;
}

interface LinhasAnimadasProps {
    linhas: readonly LinhaAnimada[];
    /**
     * Classe de cor do meio do gradiente (`via-white`, `via-sidebar-primary`,
     * ...). Vem como classe literal do chamador de propósito — o Tailwind lê o
     * código-fonte para gerar o CSS e não enxergaria uma string montada.
     */
    cor: string;
    /**
     * Gradiente de máscara CSS, para as linhas sumirem antes de cruzar algo que
     * precisa ficar limpo — a logo, por exemplo. Vai como style inline, e não
     * como utilitário: gradiente arbitrário em classe é exatamente o caso que o
     * Tailwind não gera ao varrer o código-fonte.
     */
    mascara?: string;
    className?: string;
}

/**
 * Linhas que atravessam um painel na diagonal, atrás do conteúdo. Puramente
 * decorativa, então fica fora da árvore de acessibilidade.
 *
 * O movimento é só de `x`, de propósito: transform é composto na GPU, então a
 * animação não força recálculo de layout a cada quadro numa tela que fica
 * aberta o tempo todo.
 *
 * O `data-slot` é o gancho que o `globals.css` usa para sumir com as linhas no
 * modo de alto contraste — lá o fundo precisa ficar limpo.
 */
export function LinhasAnimadas({
    linhas,
    cor,
    mascara,
    className,
}: LinhasAnimadasProps) {
    return (
        <div
            aria-hidden
            data-slot="linhas-animadas"
            style={
                mascara
                    ? { maskImage: mascara, WebkitMaskImage: mascara }
                    : undefined
            }
            className={cn(
                "pointer-events-none absolute inset-0 overflow-hidden",
                className,
            )}
        >
            {linhas.map((linha, indice) => (
                <motion.span
                    key={indice}
                    initial={{ x: "-120%" }}
                    animate={{ x: "120%" }}
                    transition={{
                        duration: linha.duracao,
                        delay: linha.atraso,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{
                        top: linha.topo,
                        width: linha.largura,
                        opacity: linha.opacidade,
                        // Altura no style, e não em classe: `h-[3px]` seria
                        // uma classe montada em runtime, que o Tailwind não
                        // enxerga ao varrer o código-fonte e não geraria CSS.
                        height: linha.espessura ?? 1,
                    }}
                    // Gradiente nas pontas para a linha surgir e sumir em vez
                    // de aparecer cortada na borda do painel.
                    className={cn(
                        "absolute rounded-full bg-linear-to-r from-transparent to-transparent",
                        // Em Tailwind v4 a rotação sai na propriedade `rotate`,
                        // separada de `transform` — não briga com o translateX
                        // que o motion escreve a cada quadro.
                        linha.rotacao ?? "-rotate-12",
                        cor,
                    )}
                />
            ))}
        </div>
    );
}
