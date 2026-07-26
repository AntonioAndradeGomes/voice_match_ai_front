"use client";

import { useEffect, useState } from "react";

import {
    IconeMarca,
    MARCAS,
    type NomeMarca,
} from "@/_components/icones/marcas";

const REDES: {
    marca: NomeMarca;
    href: (url: string, titulo: string) => string;
}[] = [
    {
        marca: "linkedin",
        href: (url) =>
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
        marca: "whatsapp",
        href: (url, titulo) =>
            `https://wa.me/?text=${encodeURIComponent(`${titulo} — ${url}`)}`,
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
                    <li key={rede.marca}>
                        <a
                            href={url ? rede.href(url, titulo) : undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Compartilhar no ${MARCAS[rede.marca].nome}`}
                            className="flex size-8 items-center justify-center rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/30 aria-disabled:pointer-events-none aria-disabled:opacity-50"
                            aria-disabled={url === ""}
                        >
                            <IconeMarca marca={rede.marca} />
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
