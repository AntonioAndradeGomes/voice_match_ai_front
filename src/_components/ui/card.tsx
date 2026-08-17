import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * `interactive` marca o cartão que leva a algum lugar — o de vaga na listagem,
 * o do pódio, o do dashboard. Não é decoração: é a diferença visível entre um
 * bloco de leitura e um alvo de clique, que até aqui cada tela resolvia por
 * conta própria com uma combinação diferente de `hover:shadow-*`.
 *
 * O movimento é de 2px e só acontece sob o ponteiro. Fica fora de
 * `motion-safe` de propósito: quem liga "reduzir movimento" está evitando
 * deslocamento espontâneo na tela, não a resposta ao próprio gesto — e a
 * sombra, o anel e o `active:` continuam valendo mesmo para quem desligou
 * todo o resto. Movimento que aparece sozinho (entrada de diálogo, pílula da
 * navegação) é que respeita a preferência.
 *
 * `has-[:focus-visible]` traz a mesma resposta para o teclado: nas telas onde
 * o link cobre o cartão em overlay, quem chega por Tab foca o link — sem isso
 * o cartão inteiro ficaria parado enquanto só o mouse tem retorno visual.
 *
 * O anel de contorno fica de fora de propósito. Ele é o canal que algumas
 * telas usam para identidade — o dourado do primeiro lugar no pódio das vagas
 * —, e um `hover:ring-*` genérico aqui apagaria essa cor justamente na hora em
 * que a pessoa aponta para ela.
 */
const CARD_INTERATIVO =
    "cursor-pointer transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md has-[:focus-visible]:shadow-md active:translate-y-0 active:shadow-sm active:duration-75";

function Card({
    className,
    size = "default",
    interactive = false,
    ...props
}: React.ComponentProps<"div"> & {
    size?: "default" | "sm";
    interactive?: boolean;
}) {
    return (
        <div
            data-slot="card"
            data-size={size}
            className={cn(
                "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-[min(var(--radius-4xl),24px)] bg-card py-(--card-spacing) text-sm text-card-foreground shadow-sm ring-1 ring-foreground/5 [--card-spacing:--spacing(5)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-[min(var(--radius-4xl),24px)] *:[img:last-child]:rounded-b-[min(var(--radius-4xl),24px)]",
                interactive && CARD_INTERATIVO,
                className,
            )}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-header"
            className={cn(
                "group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-[min(var(--radius-4xl),24px)] px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
                className,
            )}
            {...props}
        />
    );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-title"
            className={cn("font-heading text-base font-medium", className)}
            {...props}
        />
    );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-description"
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-action"
            className={cn(
                "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
                className,
            )}
            {...props}
        />
    );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-content"
            className={cn("px-(--card-spacing)", className)}
            {...props}
        />
    );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-footer"
            className={cn(
                "flex items-center rounded-b-[min(var(--radius-4xl),24px)] px-(--card-spacing) [.border-t]:pt-(--card-spacing)",
                className,
            )}
            {...props}
        />
    );
}

export {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardAction,
    CardDescription,
    CardContent,
};
