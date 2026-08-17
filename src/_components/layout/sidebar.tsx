"use client";

import {
    Briefcase,
    ChartColumn,
    LayoutDashboard,
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    UsersRound,
    type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
    LinhasAnimadas,
    type LinhaAnimada,
} from "@/_components/layout/linhas-animadas";
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

// Itens do dia a dia do recrutador, na ordem em que ele trabalha: abre a vaga,
// olha as pessoas, confere os números.
//
// "Talentos" e não "Banco de Talentos": o rótulo aparece na sidebar recolhida
// como tooltip e ao lado de itens de uma palavra só. O nome completo fica no
// <h1> da página.
const NAV_PRINCIPAL = [
    { href: "/", label: "Dashboard", icone: LayoutDashboard },
    { href: "/vagas", label: "Vagas", icone: Briefcase },
    { href: "/talentos", label: "Talentos", icone: UsersRound },
    { href: "/relatorios", label: "Relatórios", icone: ChartColumn },
];

// Configurações fica separada, e não no fim do array acima, para continuar
// sendo a última mesmo quando alguém acrescentar uma aba nova: é manutenção,
// não trabalho diário.
const NAV_FINAL = [
    { href: "/configuracoes", label: "Configurações", icone: Settings },
];

const NAV = [...NAV_PRINCIPAL, ...NAV_FINAL];

// Mesmas linhas diagonais do hero do login, em azul da marca, porém mais
// grossas (2px a 4px, contra o traço de 1px de lá) e em maior número.
//
// Três regras nortearam os números:
//
// 1. Opacidade cai conforme a linha engrossa. O que atrapalha a leitura de um
//    rótulo é a área coberta, não a espessura sozinha — um traço de 4px a 0.08
//    pesa o dobro de um de 2px na mesma opacidade. Por isso as de 4px ficam em
//    0.05 e as de 2px chegam a 0.08.
// 2. Espessura anda junto com a velocidade, como paralaxe: a linha grossa é a
//    "de perto" e atravessa rápido (17s a 19s), a fina é a "de longe" e demora
//    (29s a 33s). Sem isso as doze linhas andam todas no mesmo plano.
// 3. Inclinação varia entre -3 e -12 graus. Com todas no mesmo ângulo do hero,
//    numa faixa estreita como a sidebar o conjunto lê como pente.
//
// Durações sem divisor comum, para as linhas nunca se realinharem em um padrão
// perceptível.
//
// O `prettier-ignore` é para o array continuar sendo lido como tabela, uma
// linha por linha: formatado, cada objeto vira sete linhas e as doze entradas
// ocupam uma tela inteira, justamente onde se mexe para calibrar o efeito.
// prettier-ignore
const LINHAS_SIDEBAR: readonly LinhaAnimada[] = [
    { topo: "13%", largura: "80%", duracao: 23, atraso: 0,   opacidade: 0.07, espessura: 3, rotacao: "-rotate-12" },
    { topo: "21%", largura: "55%", duracao: 31, atraso: 3.1, opacidade: 0.08, espessura: 2, rotacao: "-rotate-6"  },
    { topo: "29%", largura: "95%", duracao: 18, atraso: 1.4, opacidade: 0.05, espessura: 4, rotacao: "-rotate-12" },
    { topo: "37%", largura: "65%", duracao: 29, atraso: 5.2, opacidade: 0.08, espessura: 2, rotacao: "-rotate-12" },
    { topo: "45%", largura: "85%", duracao: 25, atraso: 2.3, opacidade: 0.06, espessura: 3, rotacao: "-rotate-6"  },
    { topo: "53%", largura: "50%", duracao: 33, atraso: 6.7, opacidade: 0.08, espessura: 2, rotacao: "-rotate-12" },
    { topo: "61%", largura: "75%", duracao: 17, atraso: 0.9, opacidade: 0.05, espessura: 4, rotacao: "-rotate-6"  },
    { topo: "69%", largura: "60%", duracao: 22, atraso: 4.4, opacidade: 0.07, espessura: 3, rotacao: "-rotate-12" },
    { topo: "77%", largura: "90%", duracao: 26, atraso: 7.6, opacidade: 0.06, espessura: 3, rotacao: "-rotate-3"  },
    { topo: "85%", largura: "45%", duracao: 30, atraso: 2.8, opacidade: 0.08, espessura: 2, rotacao: "-rotate-12" },
    { topo: "93%", largura: "70%", duracao: 19, atraso: 5.9, opacidade: 0.05, espessura: 4, rotacao: "-rotate-6"  },
];

// Faixa limpa nas duas pontas da sidebar. Em cima é a logo: ela tem metade
// branca e traços finos, e qualquer linha cruzando o desenho já suja a leitura
// da marca — some por completo até 60px (a logo acaba em ~52px) e só volta ao
// cheio em 115px, antes do primeiro item do menu.
//
// Embaixo é o mesmo argumento aplicado ao avatar e ao seletor de tema. Não foi
// pedido, mas o resultado é melhor: com as pontas limpas as linhas viram uma
// faixa deliberada atrás da navegação, em vez de um padrão que corre por cima
// de tudo e para na borda.
//
// Medidas em px, e não em %, porque o que precisa ficar livre tem altura fixa —
// em % a máscara desalinharia da logo a cada altura de janela.
const MASCARA_SIDEBAR =
    "linear-gradient(to bottom, transparent 0px, transparent 60px, black 115px, black calc(100% - 105px), transparent calc(100% - 50px))";

// O header mobile tem 56px de altura, então cada linha come uma fatia bem maior
// da faixa: menos linhas, mais estreitas e mais apagadas que as da sidebar,
// senão a barra vira listra.
// prettier-ignore
const LINHAS_HEADER: readonly LinhaAnimada[] = [
    { topo: "16%", largura: "40%", duracao: 27, atraso: 0,   opacidade: 0.07, espessura: 2, rotacao: "-rotate-6"  },
    { topo: "38%", largura: "28%", duracao: 19, atraso: 2.4, opacidade: 0.05, espessura: 3, rotacao: "-rotate-3"  },
    { topo: "60%", largura: "35%", duracao: 31, atraso: 1.1, opacidade: 0.06, espessura: 2, rotacao: "-rotate-6"  },
    { topo: "82%", largura: "45%", duracao: 21, atraso: 3.8, opacidade: 0.05, espessura: 3, rotacao: "-rotate-3"  },
];

// Aqui a logo fica à esquerda, com o nome escrito ao lado: a faixa livre é
// horizontal e vai até ~175px, voltando ao cheio em 235px. Ângulos mais rasos
// que os da sidebar pelo mesmo motivo — em 56px de altura uma linha a -12 graus
// atravessa a barra inteira de canto a canto.
const MASCARA_HEADER =
    "linear-gradient(to right, transparent 0px, transparent 175px, black 235px)";

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
                    // Mola firme, resolvendo em torno de 200ms: rápida o
                    // bastante para a navegação não parecer arrastada, e o
                    // amortecimento alto evita que a pílula balance ao chegar.
                    transition={
                        semMovimento
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 500, damping: 36 }
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
            <header className="relative flex h-14 shrink-0 items-center justify-between overflow-hidden border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground lg:hidden">
                <LinhasAnimadas
                    linhas={LINHAS_HEADER}
                    cor="via-sidebar-primary"
                    mascara={MASCARA_HEADER}
                />

                {/* z-10 no conteúdo: as linhas são `absolute inset-0` e
                    passariam por cima da logo e do hambúrguer. */}
                <Link
                    href="/"
                    className="relative z-10 flex items-center gap-2"
                >
                    {/* Logo sem chip de fundo, direto na barra. A marca tem
                        metade branca, invisível na sidebar clara — por isso
                        existem duas versões trocadas por tema, como o sol/lua
                        do ThemeToggle: traço escuro no claro (o -escuro é
                        gerado do original recolorindo só os pixels claros) e
                        a original no escuro. */}
                    <span className="flex size-7 shrink-0 items-center justify-center">
                        <Image
                            src="/logo/icone-nobg-escuro.png"
                            alt="VoiceMatch.Ai"
                            width={28}
                            height={28}
                            className="size-full dark:hidden"
                        />
                        <Image
                            src="/logo/icone-nobg.png"
                            alt="VoiceMatch.Ai"
                            width={28}
                            height={28}
                            className="hidden size-full dark:block"
                        />
                    </span>
                    <span className="font-heading text-base font-semibold tracking-tight">
                        VoiceMatch
                        <span className="text-sidebar-primary">.Ai</span>
                    </span>
                </Link>

                <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
                    <SheetTrigger
                        render={
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="relative z-10"
                            />
                        }
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
                                    .Ai
                                </span>
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
                                        duration: 0.18,
                                        delay: indice * 0.03,
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
                    "relative hidden shrink-0 flex-col justify-between overflow-hidden border-r border-sidebar-border bg-sidebar py-5 text-sidebar-foreground transition-[width] duration-200 lg:flex",
                    colapsado ? "w-16 px-2" : "w-60 px-4",
                )}
            >
                <LinhasAnimadas
                    linhas={LINHAS_SIDEBAR}
                    cor="via-sidebar-primary"
                    mascara={MASCARA_SIDEBAR}
                />

                {/* Mesmo motivo do header: os dois blocos sobem para z-10
                    para ficarem acima da camada de linhas. */}
                <div className="relative z-10 flex flex-col gap-6">
                    <div
                        className={cn(
                            "flex items-center gap-2",
                            colapsado ? "flex-col" : "justify-between px-1",
                        )}
                    >
                        <Link
                            href="/"
                            className="flex items-center gap-2 overflow-hidden"
                        >
                            {/* A mola fica no wrapper, e não na <Image>: o
                                componente do Next repassa className mas não
                                props de motion, então animar a imagem direto
                                exigiria motion.create(Image) sem ganho nenhum. */}
                            <motion.span
                                whileHover={{ scale: 1.08, rotate: -6 }}
                                whileTap={{ scale: 0.94 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 18,
                                }}
                                className="flex size-8 shrink-0 items-center justify-center"
                            >
                                {/* Mesmo par de versões por tema do header
                                    mobile — ver comentário lá. */}
                                <Image
                                    src="/logo/icone-nobg-escuro.png"
                                    alt="VoiceMatch.Ai"
                                    width={32}
                                    height={32}
                                    className="size-full dark:hidden"
                                />
                                <Image
                                    src="/logo/icone-nobg.png"
                                    alt="VoiceMatch.Ai"
                                    width={32}
                                    height={32}
                                    className="hidden size-full dark:block"
                                />
                            </motion.span>
                            {!colapsado && (
                                <span className="font-heading text-lg font-semibold tracking-tight whitespace-nowrap">
                                    VoiceMatch
                                    <span className="text-sidebar-primary">
                                        .Ai
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
                                    duration: 0.18,
                                    delay: indice * 0.03,
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

                <div className="relative z-10 flex flex-col gap-2">
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
