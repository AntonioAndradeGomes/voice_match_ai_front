import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Bloco cinza que ocupa o lugar de um conteúdo enquanto ele carrega.
 *
 * A pulsação é de opacidade, não de movimento, então fica fora do
 * `motion-safe` que o resto do app usa: quem ativa "reduzir movimento" está
 * evitando deslocamento na tela, e sem a pulsação o bloco viraria uma caixa
 * cinza parada, indistinguível de conteúdo que falhou ao carregar.
 *
 * `aria-hidden` porque o texto de espera fica no contêiner que usa o
 * skeleton — o leitor de tela deve ouvir "carregando", não uma sequência de
 * retângulos vazios.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="skeleton"
            aria-hidden
            className={cn("animate-pulse rounded-xl bg-muted", className)}
            {...props}
        />
    );
}

export { Skeleton };
