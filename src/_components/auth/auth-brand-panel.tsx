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

// Painel de marca das telas de autenticação (login, cadastro, ...). Some em
// telas pequenas — o cabeçalho compacto de cada página cobre o mobile.
export function AuthBrandPanel({ headline }: { headline: string }) {
    return (
        <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar-primary px-12 py-12 text-sidebar-primary-foreground lg:flex">
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2"
            >
                <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 p-1.5">
                    <Image
                        src="/logo/favicon.svg"
                        alt=""
                        width={24}
                        height={24}
                        className="size-6 rounded-md"
                    />
                </span>
                <span className="font-heading text-lg font-semibold tracking-tight">
                    VoiceMatchAi
                </span>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex max-w-sm flex-col gap-8"
            >
                <h2 className="font-heading text-3xl leading-tight font-semibold tracking-tight">
                    {headline}
                </h2>

                <ul className="flex flex-col gap-4">
                    {DESTAQUES.map(({ icone: Icone, texto }) => (
                        <li
                            key={texto}
                            className="flex items-center gap-3 text-sm text-sidebar-primary-foreground/90"
                        >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/15">
                                <Icone className="size-4" />
                            </span>
                            {texto}
                        </li>
                    ))}
                </ul>
            </motion.div>

            <div aria-hidden className="flex h-10 items-end gap-1 opacity-30">
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
