// Script que precisa rodar de forma síncrona, antes da primeira pintura —
// enquanto o browser ainda está lendo o HTML, sem esperar a hidratação.
//
// O `type` alternado é o que evita o aviso "Encountered a script tag while
// rendering React component" no dev: no servidor sai como script de verdade e
// o browser executa durante o parse; no cliente sai como `text/plain`, que o
// React aceita renderizar sem reclamar e o browser ignora. O
// `suppressHydrationWarning` cobre justamente essa diferença de `type` entre
// os dois lados. Padrão recomendado pelo Next em "Preventing Flash Before
// Hydration".
export function InlineScript({ html }: { html: string }) {
    return (
        <script
            type={
                typeof window === "undefined" ? "text/javascript" : "text/plain"
            }
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
