"use client";

import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Botão de volta com preenchimento líquido no hover: o nível sobe do fundo e a
 * onda corre na superfície.
 *
 * Nasceu dentro da página 404 e saiu de lá quando a vaga não encontrada passou
 * a precisar do mesmo botão. São quarenta linhas de animação — copiá-las seria
 * garantir que as duas telas divergissem na primeira alteração.
 */
export function BotaoLiquido({
    href,
    children,
}: {
    href: string;
    children: ReactNode;
}) {
    return (
        <motion.div
            initial="vazio"
            whileHover="cheio"
            animate="vazio"
            className="group relative isolate inline-flex h-9 items-center justify-center overflow-hidden rounded-2xl border-2 border-border px-4"
        >
            <motion.div
                variants={{
                    vazio: { height: "0%" },
                    cheio: { height: "100%" },
                }}
                transition={{ type: "spring", stiffness: 220, damping: 26 }}
                className="absolute inset-x-0 bottom-0 overflow-hidden bg-primary"
            >
                <motion.svg
                    viewBox="0 0 200 16"
                    preserveAspectRatio="none"
                    className="absolute inset-x-0 -top-1.75 h-4 w-[200%] text-primary"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    <path
                        d="M0 8 Q 12.5 0 25 8 T 50 8 T 75 8 T 100 8 T 125 8 T 150 8 T 175 8 T 200 8 V16 H0 Z"
                        fill="currentColor"
                    />
                </motion.svg>
            </motion.div>

            <Link
                href={href}
                className="relative z-10 text-sm font-medium text-foreground transition-colors duration-300 group-hover:text-primary-foreground"
            >
                {children}
            </Link>
        </motion.div>
    );
}
