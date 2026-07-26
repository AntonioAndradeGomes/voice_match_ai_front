"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

const DIGITS = "404".split("");

function BotaoLiquido() {
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
                href="/"
                className="relative z-10 text-sm font-medium text-foreground transition-colors duration-300 group-hover:text-primary-foreground"
            >
                Voltar para o Dashboard
            </Link>
        </motion.div>
    );
}

export default function NotFound() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
            <motion.span
                animate={{ y: [0, -8, 0] }}
                transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="flex size-20 items-center justify-center rounded-3xl bg-muted"
            >
                <Image
                    src="/logo/favicon.svg"
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 grayscale opacity-50"
                />
            </motion.span>

            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-1 font-heading text-7xl font-semibold tracking-tight text-muted-foreground/60">
                    {DIGITS.map((digito, index) => (
                        <motion.span
                            key={index}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: 0.15 + index * 0.08,
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                            }}
                        >
                            {digito}
                        </motion.span>
                    ))}
                </div>

                <p className="max-w-sm text-sm text-muted-foreground">
                    Essa entrevista não foi encontrada. A página que você
                    procura foi cancelada, mudou de endereço ou nunca existiu.
                </p>
            </div>

            <BotaoLiquido />
        </div>
    );
}
