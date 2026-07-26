"use client";

import {
    Briefcase,
    ChartColumn,
    LayoutDashboard,
    Menu,
    Mic,
    PanelLeftClose,
    PanelLeftOpen,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/_components/layout/theme-toggle";
import { Button } from "@/_components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/_components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/_components/ui/tooltip";
import { cn } from "@/lib/utils";

const NAV = [
    { href: "/", label: "Dashboard", icone: LayoutDashboard },
    { href: "/vagas", label: "Vagas", icone: Briefcase },
    { href: "/relatorios", label: "Relatórios", icone: ChartColumn },
];

// Rotas fora do app: renderizam sem navegação. Cada entrada cobre a própria
// rota e tudo abaixo dela — /candidatura é pública e tem id na URL, então
// comparar por igualdade não bastaria.
const ROUTES_WITHOUT_NAV = ["/login", "/candidatura"];

function estaAtivo(pathname: string, href: string) {
    // "/" só casa exato; as demais também cobrem as rotas filhas
    // (ex.: /vagas/[id] mantém "Vagas" ativo).
    return href === "/"
        ? pathname === "/"
        : pathname === href || pathname.startsWith(`${href}/`);
}

interface NavLinkProps {
    href: string;
    label: string;
    icone: LucideIcon;
    ativo: boolean;
    colapsado?: boolean;
    onNavigate?: () => void;
}

function NavLink({
    href,
    label,
    icone: Icone,
    ativo,
    colapsado = false,
    onNavigate,
}: NavLinkProps) {
    const link = (
        <Link
            href={href}
            aria-current={ativo ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                // Ativo: o azul do app diluído. No hover a opacidade cai,
                // então a cor clareia em vez de escurecer.
                ativo
                    ? "bg-sidebar-primary/20 text-sidebar-primary hover:bg-sidebar-primary/10 hover:text-sidebar-primary"
                    : "text-sidebar-foreground",
                colapsado && "justify-center px-0",
            )}
        >
            <Icone className="size-4 shrink-0" />
            {!colapsado && label}
        </Link>
    );

    if (!colapsado) return link;

    return (
        <Tooltip>
            <TooltipTrigger render={link} />
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    );
}

export function Sidebar() {
    const pathname = usePathname();
    const [colapsado, setColapsado] = useState(false);
    const [menuAberto, setMenuAberto] = useState(false);

    const rotaSemNav = ROUTES_WITHOUT_NAV.some(
        (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
    );
    if (rotaSemNav) return null;

    return (
        <>
            {/* Mobile: barra superior com hambúrguer, sidebar vira um drawer */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground lg:hidden">
                <Link href="/" className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                        <Mic className="size-3.5" />
                    </span>
                    <span className="font-heading text-base font-semibold tracking-tight">
                        VoiceMatch
                        <span className="text-sidebar-primary">Ai</span>
                    </span>
                </Link>

                <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
                    <SheetTrigger
                        render={<Button variant="ghost" size="icon-sm" />}
                    >
                        <Menu />
                        <span className="sr-only">Abrir menu</span>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="gap-0 bg-sidebar text-sidebar-foreground data-[side=left]:w-72"
                    >
                        <SheetHeader className="border-b border-sidebar-border">
                            <SheetTitle>
                                VoiceMatch
                                <span className="text-sidebar-primary">
                                    Ai
                                </span>
                            </SheetTitle>
                        </SheetHeader>

                        <nav className="flex flex-col gap-1 p-4">
                            {NAV.map(({ href, label, icone }) => (
                                <NavLink
                                    key={href}
                                    href={href}
                                    label={label}
                                    icone={icone}
                                    ativo={estaAtivo(pathname, href)}
                                    onNavigate={() => setMenuAberto(false)}
                                />
                            ))}
                        </nav>

                        <div className="mt-auto flex items-center justify-between p-4">
                            <span className="text-xs text-muted-foreground">
                                Tema
                            </span>
                            <ThemeToggle />
                        </div>
                    </SheetContent>
                </Sheet>
            </header>

            {/* Desktop: sidebar fixa com opção de recolher para ícones */}
            <aside
                className={cn(
                    "hidden shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar py-5 text-sidebar-foreground transition-[width] duration-200 lg:flex",
                    colapsado ? "w-16 px-2" : "w-60 px-4",
                )}
            >
                <div className="flex flex-col gap-6">
                    <div
                        className={cn(
                            "flex items-center gap-2",
                            colapsado
                                ? "flex-col"
                                : "justify-between px-1",
                        )}
                    >
                        <Link
                            href="/"
                            className="flex items-center gap-2 overflow-hidden"
                        >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                                <Mic className="size-4" />
                            </span>
                            {!colapsado && (
                                <span className="font-heading text-lg font-semibold tracking-tight whitespace-nowrap">
                                    VoiceMatch
                                    <span className="text-sidebar-primary">
                                        Ai
                                    </span>
                                </span>
                            )}
                        </Link>

                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setColapsado((prev) => !prev)}
                            aria-label={
                                colapsado ? "Expandir menu" : "Recolher menu"
                            }
                        >
                            {colapsado ? (
                                <PanelLeftOpen />
                            ) : (
                                <PanelLeftClose />
                            )}
                        </Button>
                    </div>

                    <nav className="flex flex-col gap-1">
                        {NAV.map(({ href, label, icone }) => (
                            <NavLink
                                key={href}
                                href={href}
                                label={label}
                                icone={icone}
                                ativo={estaAtivo(pathname, href)}
                                colapsado={colapsado}
                            />
                        ))}
                    </nav>
                </div>

                <div
                    className={cn(
                        "flex items-center px-1",
                        colapsado ? "justify-center" : "justify-between",
                    )}
                >
                    {!colapsado && (
                        <span className="text-xs text-muted-foreground">
                            Tema
                        </span>
                    )}
                    <ThemeToggle />
                </div>
            </aside>
        </>
    );
}
