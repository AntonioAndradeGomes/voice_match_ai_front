"use client";

import { motion } from "motion/react";
import Image from "next/image";

import { BotaoLiquido } from "@/_components/layout/botao-liquido";

const DIGITS = "404".split("");

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
                    src="/logo/icone.png"
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

            <BotaoLiquido href="/">Voltar para o Dashboard</BotaoLiquido>
        </div>
    );
}
