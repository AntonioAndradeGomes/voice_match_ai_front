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
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { OndaSonora } from "@/_components/layout/onda-sonora";
import { rotaCasa, rotaTemNav } from "@/_components/layout/rotas";
import { ThemeToggle } from "@/_components/layout/theme-toggle";
import { UserMenu } from "@/_components/layout/user-menu";
import { Button } from "@/_components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/_components/ui/sheet";
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

interface NavLinkProps {
    href: string;
    label: string;
    icone: LucideIcon;
    ativo: boolean;
    colapsado?: boolean;
    onNavigate?: () => void;
    /**
     * Isola o indicador deslizante por contexto. O drawer mobile e a sidebar
     * desktop ficam os dois montados ao mesmo tempo (um escondido por
     * breakpoint), e dois elementos com o mesmo `layoutId` vivos disputariam a
     * mesma animação, fazendo a pílula saltar entre eles.
     */
    grupo: string;
}

function NavLink({
    href,
    label,
    icone: Icone,
    ativo,
    colapsado = false,
    onNavigate,
    grupo,
}: NavLinkProps) {
    const semMovimento = useReducedMotion();

    const link = (
        <Link
            href={href}
            aria-current={ativo ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
                "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                // Ativo: o azul do app diluído. O fundo agora é a pílula
                // animada abaixo, então aqui fica só a cor do texto.
                ativo
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                colapsado && "justify-center px-0",
            )}
        >
            {ativo && (
                <motion.span
                    // Mesmo layoutId nos três links do grupo: ao trocar de
                    // página, o motion entende que é o mesmo elemento mudando
                    // de lugar e desliza em vez de sumir e reaparecer.
                    layoutId={`nav-indicador-${grupo}`}
                    className="absolute inset-0 rounded-lg bg-sidebar-primary/20"
                    // Mola mais lenta e macia que o padrão: a troca acontece
                    // junto com a do conteúdo da página, e a 420 de stiffness
                    // o deslize terminava em ~200ms, passando despercebido.
                    transition={
                        semMovimento
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 220, damping: 26 }
                    }
                />
            )}
            {/* z-10 e relative para o conteúdo ficar sobre a pílula, que é
                absolute e viria por cima do ícone e do texto. */}
            <span className="relative z-10 flex items-center gap-2">
                <Icone className="size-4 shrink-0" />
                {!colapsado && label}
            </span>
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

    if (!rotaTemNav(pathname)) return null;

    return (
        <>
            {/* Mobile: barra superior com hambúrguer, sidebar vira um drawer */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground lg:hidden">
                <Link href="/" className="group flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                        <Mic className="size-3.5" />
                    </span>
                    <span className="font-heading text-base font-semibold tracking-tight">
                        VoiceMatch
                        <span className="text-sidebar-primary">Ai</span>
                    </span>
                    <OndaSonora className="ml-0.5" />
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
                            {/* `group` aqui e não no SheetTitle: no toque não
                                existe hover, então a onda fica estática no
                                mobile — é decoração de marca, não affordance. */}
                            <SheetTitle className="group flex items-center gap-2">
                                <span>
                                    VoiceMatch
                                    <span className="text-sidebar-primary">
                                        Ai
                                    </span>
                                </span>
                                <OndaSonora />
                            </SheetTitle>
                        </SheetHeader>

                        <nav className="flex flex-col gap-1 p-4">
                            {NAV.map(({ href, label, icone }, indice) => (
                                <motion.div
                                    key={href}
                                    // Só opacidade: qualquer transform aqui
                                    // vira um ancestral transformado entre as
                                    // duas pílulas de `layoutId`, e a projeção
                                    // do motion passa a calcular a posição
                                    // errada — o indicador para de deslizar.
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{
                                        duration: 0.25,
                                        delay: indice * 0.05,
                                        ease: "easeOut",
                                    }}
                                >
                                    <NavLink
                                        href={href}
                                        label={label}
                                        icone={icone}
                                        ativo={rotaCasa(pathname, href)}
                                        onNavigate={() => setMenuAberto(false)}
                                        grupo="mobile"
                                    />
                                </motion.div>
                            ))}
                        </nav>

                        <div className="mt-auto flex flex-col gap-3 p-4">
                            <UserMenu />
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    Tema
                                </span>
                                <ThemeToggle />
                            </div>
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
                            colapsado ? "flex-col" : "justify-between px-1",
                        )}
                    >
                        {/* Sem `overflow-hidden`: a linha tem ~164px úteis e o
                            ícone mais o nome já ocupam quase tudo. Com o corte
                            ligado, qualquer coisa depois do nome era descartada
                            silenciosamente — foi o que sumiu com a onda quando
                            ela ficava em linha. Agora ela vai embaixo do nome,
                            onde a largura não é disputada. */}
                        <Link
                            href="/"
                            className="group flex min-w-0 items-center gap-2"
                        >
                            <motion.span
                                whileHover={{ scale: 1.08, rotate: -6 }}
                                whileTap={{ scale: 0.94 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 18,
                                }}
                                className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"
                            >
                                <Mic className="size-4" />
                            </motion.span>
                            {/* Recolhida, a sidebar tem 64px e só cabe o ícone;
                                a onda entraria espremida contra a borda. */}
                            {!colapsado && (
                                <span className="flex min-w-0 flex-col">
                                    <span className="font-heading text-lg leading-tight font-semibold tracking-tight whitespace-nowrap">
                                        VoiceMatch
                                        <span className="text-sidebar-primary">
                                            Ai
                                        </span>
                                    </span>
                                    <OndaSonora className="mt-1" />
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
                            {colapsado ? <PanelLeftOpen /> : <PanelLeftClose />}
                        </Button>
                    </div>

                    <nav className="flex flex-col gap-1">
                        {NAV.map(({ href, label, icone }, indice) => (
                            <motion.div
                                key={href}
                                // Só opacidade: qualquer transform aqui vira um
                                // ancestral transformado entre as duas pílulas
                                // de `layoutId`, e a projeção do motion passa a
                                // calcular a posição errada — o indicador para
                                // de deslizar.
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{
                                    duration: 0.25,
                                    delay: indice * 0.05,
                                    ease: "easeOut",
                                }}
                            >
                                <NavLink
                                    href={href}
                                    label={label}
                                    icone={icone}
                                    ativo={rotaCasa(pathname, href)}
                                    colapsado={colapsado}
                                    grupo="desktop"
                                />
                            </motion.div>
                        ))}
                    </nav>
                </div>

                <div className="flex flex-col gap-2">
                    <UserMenu colapsado={colapsado} />
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
                </div>
            </aside>
        </>
    );
}
