"use client";

import { Briefcase, ChartColumn, LayoutDashboard } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/_components/ui/tooltip";
import { cn } from "@/lib/utils";

const NAV = [
    { href: "/", label: "Dashboard", icone: LayoutDashboard },
    { href: "/vagas", label: "Vagas", icone: Briefcase },
    { href: "/relatorios", label: "Relatórios", icone: ChartColumn },
];

// Rotas fora do app: renderizam sem navegação.
const ROUTES_WITHOUT_NAV = ["/login", "/cadastro"];

// Prefixos de rotas que realmente existem no app. Qualquer pathname fora
// dessa lista é uma 404 (ou uma rota futura ainda não cadastrada aqui) —
// nesse caso a sidebar some, para não ficar ao lado da página de erro.
// "/chat" não tem item na nav, mas é uma rota válida (acessada por link
// direto vaga/candidato), então mantém a sidebar.
const ROUTE_PREFIXES = [
    "/",
    "/vagas",
    "/relatorios",
    "/chat",
    "/login",
    "/cadastro",
];

// Rotas onde a sidebar comprime pra só ícone — a tela de chat precisa da
// largura extra pra conversa.
const ROUTE_PREFIXES_COMPRIMIDOS = ["/chat"];

function rotaCasa(pathname: string, prefixo: string) {
    return prefixo === "/"
        ? pathname === "/"
        : pathname === prefixo || pathname.startsWith(`${prefixo}/`);
}

function rotaExiste(pathname: string) {
    return ROUTE_PREFIXES.some((prefixo) => rotaCasa(pathname, prefixo));
}

export function Sidebar() {
    const pathname = usePathname();

    if (ROUTES_WITHOUT_NAV.includes(pathname) || !rotaExiste(pathname)) {
        return null;
    }

    const comprimida = ROUTE_PREFIXES_COMPRIMIDOS.some((prefixo) =>
        rotaCasa(pathname, prefixo),
    );

    return (
        <aside
            className={cn(
                "flex h-svh shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar py-5 text-sidebar-foreground transition-[width] duration-300",
                comprimida ? "w-18 px-2" : "w-60 px-4",
            )}
        >
            <div className="flex flex-col gap-6">
                <Link
                    href="/"
                    className={cn(
                        "flex items-center gap-2 px-1",
                        comprimida && "justify-center px-0",
                    )}
                >
                    <Image
                        src="/logo/favicon.svg"
                        alt="VoiceMatchAi"
                        width={32}
                        height={32}
                        className="size-8 shrink-0 rounded-xl"
                    />
                    {!comprimida && (
                        <span className="font-heading text-lg font-semibold tracking-tight">
                            VoiceMatch
                            <span className="text-sidebar-primary">Ai</span>
                        </span>
                    )}
                </Link>

                <nav className="flex flex-col gap-1">
                    {NAV.map(({ href, label, icone: Icone }) => {
                        // "/" só casa exato; as demais também cobrem as rotas filhas
                        // (ex.: /vagas/[id] mantém "Vagas" ativo).
                        const ativo = rotaCasa(pathname, href);

                        const className = cn(
                            "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                            comprimida && "justify-center px-0",
                            // Ativo: o azul do app diluído (o pill animado cobre o fundo).
                            // No hover a opacidade cai, então a cor clareia em vez de escurecer.
                            ativo
                                ? "text-sidebar-primary hover:text-sidebar-primary"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        );

                        const conteudo = (
                            <>
                                {ativo && (
                                    <motion.span
                                        layoutId="sidebar-active-pill"
                                        className="absolute inset-0 rounded-lg bg-sidebar-primary/20"
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 35,
                                        }}
                                    />
                                )}
                                <Icone className="relative z-10 size-4" />
                                {!comprimida && (
                                    <span className="relative z-10">
                                        {label}
                                    </span>
                                )}
                            </>
                        );

                        if (!comprimida) {
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    aria-current={ativo ? "page" : undefined}
                                    className={className}
                                >
                                    {conteudo}
                                </Link>
                            );
                        }

                        return (
                            <Tooltip key={href}>
                                <TooltipTrigger
                                    render={
                                        <Link
                                            href={href}
                                            aria-current={
                                                ativo ? "page" : undefined
                                            }
                                            className={className}
                                        />
                                    }
                                >
                                    {conteudo}
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    {label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
