"use client";

import { Briefcase, ChartColumn, MessagesSquare } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";

const DESTAQUES = [
    {
        icone: MessagesSquare,
        texto: "Entrevistas conduzidas por IA, direto pelo chat",
    },
    {
        icone: Briefcase,
        texto: "Match automático de perfil comportamental por vaga",
    },
    {
        icone: ChartColumn,
        texto: "Funil de candidatos e notas em tempo real",
    },
];

// Alturas fixas (não aleatórias) para a onda decorativa — só um floreio
// visual, não representa áudio de verdade.
const ONDA = [30, 55, 40, 75, 50, 90, 45, 65, 35, 80, 50, 60, 30, 70, 40];

/**
 * Linhas que atravessam o painel na diagonal. Valores fixos, e não sorteados:
 * um Math.random() aqui geraria posições diferentes no servidor e no cliente,
 * e a hidratação acusaria a divergência.
 *
 * As durações são propositalmente distintas e sem divisor comum — assim as
 * linhas nunca se realinham em um padrão perceptível.
 */
const LINHAS = [
    { topo: "8%", largura: "70%", duracao: 19, atraso: 0, opacidade: 0.10 },
    { topo: "26%", largura: "45%", duracao: 23, atraso: 2.5, opacidade: 0.07 },
    { topo: "44%", largura: "85%", duracao: 17, atraso: 1.2, opacidade: 0.12 },
    { topo: "63%", largura: "55%", duracao: 27, atraso: 4, opacidade: 0.08 },
    { topo: "81%", largura: "65%", duracao: 21, atraso: 0.8, opacidade: 0.09 },
];

/**
 * Camada decorativa do fundo. Fica atrás do conteúdo e não é anunciada para
 * leitores de tela.
 *
 * O movimento é só de `x`, de propósito: transform é composto na GPU, então a
 * animação não força recálculo de layout a cada quadro numa tela que fica
 * aberta enquanto a pessoa digita.
 */
function LinhasAnimadas() {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {LINHAS.map((linha, indice) => (
                <motion.span
                    key={indice}
                    initial={{ x: "-120%" }}
                    animate={{ x: "120%" }}
                    transition={{
                        duration: linha.duracao,
                        delay: linha.atraso,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{
                        top: linha.topo,
                        width: linha.largura,
                        opacity: linha.opacidade,
                    }}
                    // Gradiente nas pontas para a linha surgir e sumir em vez
                    // de aparecer cortada na borda do painel.
                    className="absolute h-px -rotate-12 bg-linear-to-r from-transparent via-white to-transparent"
                />
            ))}

            {/* Dois halos parados: dão profundidade ao gradiente do fundo e
                impedem que a área fique uma chapada de azul. */}
            <div className="absolute -top-24 -left-16 size-80 rounded-full bg-sky-400/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 size-96 rounded-full bg-blue-500/10 blur-3xl" />
        </div>
    );
}

// Painel de marca das telas de autenticação (login, cadastro, ...). Some em
// telas pequenas — o cabeçalho compacto de cada página cobre o mobile.
export function AuthBrandPanel({ headline }: { headline: string }) {
    return (
        // Gradiente em azul-marinho no lugar do `bg-sidebar-primary` chapado:
        // o painel ficava claro demais para a marca branca e para as linhas
        // decorativas, que precisam de contraste para aparecer.
        //
        // Cores da paleta, e não oklch() arbitrário: o Tailwind não gerou as
        // regras para `from-[oklch(...)]` — a classe ia para o HTML sem CSS
        // correspondente, e o fundo ficava sem gradiente nenhum.
        <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-slate-950 via-blue-950 to-blue-900 px-12 py-12 text-white lg:flex">
            <LinhasAnimadas />

            {/* Todo o conteúdo sobe para z-10: as linhas são `absolute inset-0`
                e cobririam o texto sem isso. */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 flex items-center gap-2"
            >
                {/* Versão sem fundo, e sem o badge branco que existia antes: a
                    marca é branca e azul, e o painel já é azul escuro — ela se
                    apoia no próprio fundo do hero, sem precisar de moldura. */}
                <Image
                    src="/logo/icone-nobg.png"
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 shrink-0"
                />
                <span className="font-heading text-lg font-semibold tracking-tight">
                    VoiceMatch
                    {/* O ponto acompanha o "Ai" no mesmo tom da arte da logo,
                        onde ".Ai" é azul e "VoiceMatch" é branco. */}
                    <span className="text-sky-400">
                        .Ai
                    </span>
                </span>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative z-10 flex max-w-sm flex-col gap-8"
            >
                <h2 className="font-heading text-3xl leading-tight font-semibold tracking-tight">
                    {headline}
                </h2>

                <ul className="flex flex-col gap-4">
                    {DESTAQUES.map(({ icone: Icone, texto }) => (
                        <li
                            key={texto}
                            className="flex items-center gap-3 text-sm text-white/80"
                        >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
                                <Icone className="size-4" />
                            </span>
                            {texto}
                        </li>
                    ))}
                </ul>
            </motion.div>

            <div aria-hidden className="relative z-10 flex h-10 items-end gap-1 opacity-40">
                {ONDA.map((altura, index) => (
                    <motion.span
                        key={index}
                        initial={{ height: "10%" }}
                        animate={{ height: `${altura}%` }}
                        transition={{
                            duration: 1.4,
                            repeat: Infinity,
                            repeatType: "reverse",
                            delay: index * 0.06,
                            ease: "easeInOut",
                        }}
                        className="w-1 rounded-full bg-white"
                    />
                ))}
            </div>
        </div>
    );
}
