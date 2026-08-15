"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            className={cn(
                // `group/checkbox` para a camada de preenchimento reagir ao
                // `data-checked` daqui, e `overflow-hidden` para ela respeitar
                // o canto arredondado ao subir.
                //
                // O `data-checked:bg-primary` saiu: quem pinta o fundo agora é
                // a camada animada abaixo. Mantê-lo faria a cor aparecer de
                // uma vez, e a animação não teria o que revelar.
                "group/checkbox peer relative flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-transparent bg-input/90 transition-shadow outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary",
                className,
            )}
            {...props}
        >
            {/* O "líquido": sobe do fundo ao marcar e escorre de volta ao
                desmarcar. A curva tem overshoot (o 1.7 no terceiro ponto),
                então o nível passa um pouco do topo e assenta — é isso que dá
                a impressão de líquido em vez de uma barra de progresso.
                `scaleY` em vez de `height` para animar só transform, que é
                composto na GPU e não refaz layout a cada quadro. */}
            <span
                aria-hidden
                className="absolute inset-0 origin-bottom scale-y-0 bg-primary transition-transform duration-300 ease-[cubic-bezier(0.34,1.7,0.64,1)] group-data-checked/checkbox:scale-y-100"
            />

            <CheckboxPrimitive.Indicator
                data-slot="checkbox-indicator"
                // z-10 porque o líquido é `absolute inset-0` e cobriria o
                // ícone. O atraso deixa o traço aparecer depois de o nível
                // encher, e não junto.
                className="relative z-10 grid place-content-center text-primary-foreground opacity-0 transition-opacity delay-150 duration-150 group-data-checked/checkbox:opacity-100 [&>svg]:size-3.5"
            >
                <CheckIcon />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

export { Checkbox };
