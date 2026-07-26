"use client";

import { Briefcase, ChartColumn, LayoutDashboard } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { rotaCasa, rotaTemNav } from "@/_components/layout/rotas";
import { ThemeToggle } from "@/_components/layout/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
    { href: "/", label: "Dashboard", icone: LayoutDashboard },
    { href: "/vagas", label: "Vagas", icone: Briefcase },
    { href: "/relatorios", label: "Relatórios", icone: ChartColumn },
];

export function Sidebar() {
    const pathname = usePathname();

    if (!rotaTemNav(pathname)) return null;

    return (
        <aside className="flex h-svh w-60 shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground">
            <div className="flex flex-col gap-6">
                <Link href="/" className="flex items-center gap-2 px-1">
                    <Image
                        src="/logo/favicon.svg"
                        alt="VoiceMatchAi"
                        width={32}
                        height={32}
                        className="size-8 shrink-0 rounded-xl"
                    />
                    <span className="font-heading text-lg font-semibold tracking-tight">
                        VoiceMatch
                        <span className="text-sidebar-primary">Ai</span>
                    </span>
                </Link>

                <nav className="flex flex-col gap-1">
                    {NAV.map(({ href, label, icone: Icone }) => {
                        // "/" só casa exato; as demais também cobrem as rotas filhas
                        // (ex.: /vagas/[id] mantém "Vagas" ativo).
                        const ativo = rotaCasa(pathname, href);

                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-current={ativo ? "page" : undefined}
                                className={cn(
                                    "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                                    // Ativo: o azul do app diluído (o pill animado cobre o fundo).
                                    // No hover a opacidade cai, então a cor clareia em vez de escurecer.
                                    ativo
                                        ? "text-sidebar-primary hover:text-sidebar-primary"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                )}
                            >
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
                                <span className="relative z-10">{label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground">Tema</span>
                <ThemeToggle />
            </div>
        </aside>
    );
}
