import { cn } from "@/lib/utils";

// Alturas fixas, não aleatórias: é a silhueta de uma onda de voz, não áudio
// real. Fixas também porque valor sorteado no render sairia diferente no
// servidor e no cliente, e a hidratação acusaria a divergência.
const BARRAS = [
    { altura: "h-1.5", atraso: "0ms" },
    { altura: "h-3", atraso: "120ms" },
    { altura: "h-2", atraso: "240ms" },
    { altura: "h-3.5", atraso: "60ms" },
    { altura: "h-2", atraso: "180ms" },
];

/**
 * Ondinha sonora ao lado do logo — o mesmo motivo do painel de marca das telas
 * de login e cadastro, trazido para o cromo do app para as duas metades do
 * produto terem a mesma cara.
 *
 * Fica parada e só anima quando o mouse passa pelo logo (`group-hover`), com
 * `motion-safe` para sumir de vez com o movimento em quem pediu menos animação
 * no sistema. Pausada, ainda lê como onda: a identidade não depende do hover.
 */
export function OndaSonora({ className }: { className?: string }) {
    return (
        <span
            aria-hidden
            className={cn("flex items-end gap-[3px]", className)}
        >
            {BARRAS.map(({ altura, atraso }, indice) => (
                <span
                    key={indice}
                    style={{ animationDelay: atraso }}
                    className={cn(
                        "w-[3px] origin-bottom rounded-full bg-sidebar-primary/70 transition-colors",
                        "group-hover:bg-sidebar-primary",
                        "motion-safe:group-hover:animate-[onda-sonora_1s_ease-in-out_infinite]",
                        altura,
                    )}
                />
            ))}
        </span>
    );
}
