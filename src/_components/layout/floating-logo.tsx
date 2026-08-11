"use client";

import { Mic } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { rotaEhChat } from "@/_components/layout/rotas";

// No chat (sem sidebar) não sobra nenhuma marca na tela — login, cadastro e
// 404 já têm a própria (painel de marca / logo central), então esse ícone
// flutuante só aparece no chat, no mesmo estilo do badge usado na sidebar.
export function FloatingLogo() {
    const pathname = usePathname();

    if (!rotaEhChat(pathname)) return null;

    return (
        <Link
            href="/"
            className="fixed top-4 left-4 z-50 flex size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"
        >
            <Mic className="size-4" />
            <span className="sr-only">VoiceMatchAi</span>
        </Link>
    );
}
