"use client";

import { useEffect, useState } from "react";

// O lucide 1.x removeu os ícones de marca, então os três vêm como SVG inline.
// `currentColor` não serve aqui: a cor faz parte da identidade de cada rede.
const REDES = [
    {
        nome: "Facebook",
        cor: "#1877F2",
        href: (url: string) =>
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        caminho:
            "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z",
    },
    {
        nome: "LinkedIn",
        cor: "#0A66C2",
        href: (url: string) =>
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        caminho:
            "M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14Zm1.78 13.02H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z",
    },
    {
        nome: "WhatsApp",
        cor: "#25D366",
        href: (url: string, titulo: string) =>
            `https://wa.me/?text=${encodeURIComponent(`${titulo} — ${url}`)}`,
        caminho:
            "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.82 9.82 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.9 6.99c0 5.45-4.44 9.88-9.9 9.88M20.5 3.49A11.82 11.82 0 0 0 12.05 0C5.5 0 .17 5.33.17 11.88c0 2.09.55 4.14 1.59 5.94L.07 24l6.33-1.66a11.87 11.87 0 0 0 5.65 1.44h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.24-6.15-3.48-8.4",
    },
];

export function CompartilharVaga({ titulo }: { titulo: string }) {
    // A URL só existe no cliente, e precisa ser a da própria página.
    const [url, setUrl] = useState("");

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUrl(window.location.href);
    }, []);

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
                Compartilhar vaga:
            </span>

            <ul className="flex items-center gap-2">
                {REDES.map((rede) => (
                    <li key={rede.nome}>
                        <a
                            href={url ? rede.href(url, titulo) : undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Compartilhar no ${rede.nome}`}
                            className="flex size-8 items-center justify-center rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/30 aria-disabled:pointer-events-none aria-disabled:opacity-50"
                            aria-disabled={url === ""}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                className="size-6"
                                fill={rede.cor}
                                aria-hidden
                            >
                                <path d={rede.caminho} />
                            </svg>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
