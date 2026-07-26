"use client";

import { Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { useForm } from "react-hook-form";

import { AuthBrandPanel } from "@/_components/auth/auth-brand-panel";
import { Button } from "@/_components/ui/button";
import { Card, CardContent } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";

interface CadastroFormValues {
    nome: string;
    email: string;
    password: string;
    confirmarSenha: string;
}

export default function CadastroPage() {
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<CadastroFormValues>({
        mode: "onBlur",
        defaultValues: {
            nome: "",
            email: "",
            password: "",
            confirmarSenha: "",
        },
    });

    async function onSubmit(values: CadastroFormValues) {
        // TODO: o backend ainda não expõe cadastro de recrutador com senha
        // (só existe a criação de vaga hoje). Ligar aqui quando existir.
        console.log("cadastro", values);
    }

    return (
        <div className="grid h-full lg:grid-cols-2">
            <AuthBrandPanel headline="Crie sua conta e comece a entrevistar candidatos em minutos." />

            <div className="flex items-center justify-center px-6 py-10">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex w-full max-w-md flex-col gap-6"
                >
                    <div className="flex flex-col items-center gap-3 text-center lg:hidden">
                        <Image
                            src="/logo/favicon.svg"
                            alt="VoiceMatchAi"
                            width={44}
                            height={44}
                            className="size-11 rounded-2xl"
                        />
                        <h1 className="font-heading text-2xl font-semibold tracking-tight">
                            Criar conta na VoiceMatch
                            <span className="text-sidebar-primary">Ai</span>
                        </h1>
                    </div>

                    <div className="hidden flex-col gap-1 lg:flex">
                        <h1 className="font-heading text-2xl font-semibold tracking-tight">
                            Criar conta
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Cadastre sua conta de recrutador para começar a usar
                            a VoiceMatchAi.
                        </p>
                    </div>

                    <Card
                        style={{ "--card-spacing": "1.75rem" } as CSSProperties}
                    >
                        <CardContent>
                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                noValidate
                                className="flex flex-col gap-6"
                            >
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="nome" className="text-base">
                                        Nome completo
                                    </Label>
                                    <Input
                                        id="nome"
                                        type="text"
                                        autoComplete="name"
                                        placeholder="Seu nome"
                                        className="h-12 px-4 text-base md:text-base"
                                        aria-invalid={
                                            errors.nome ? true : undefined
                                        }
                                        aria-describedby={
                                            errors.nome
                                                ? "nome-error"
                                                : undefined
                                        }
                                        {...register("nome", {
                                            required: "Informe seu nome.",
                                        })}
                                    />
                                    {errors.nome && (
                                        <p
                                            id="nome-error"
                                            role="alert"
                                            className="text-sm text-destructive"
                                        >
                                            {errors.nome.message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label
                                        htmlFor="email"
                                        className="text-base"
                                    >
                                        E-mail
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="voce@empresa.com"
                                        className="h-12 px-4 text-base md:text-base"
                                        aria-invalid={
                                            errors.email ? true : undefined
                                        }
                                        aria-describedby={
                                            errors.email
                                                ? "email-error"
                                                : undefined
                                        }
                                        {...register("email", {
                                            required: "Informe seu e-mail.",
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message: "E-mail inválido.",
                                            },
                                        })}
                                    />
                                    {errors.email && (
                                        <p
                                            id="email-error"
                                            role="alert"
                                            className="text-sm text-destructive"
                                        >
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label
                                        htmlFor="password"
                                        className="text-base"
                                    >
                                        Senha
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            autoComplete="new-password"
                                            placeholder="••••••••"
                                            className="h-12 px-4 pr-11 text-base md:text-base"
                                            aria-invalid={
                                                errors.password
                                                    ? true
                                                    : undefined
                                            }
                                            aria-describedby={
                                                errors.password
                                                    ? "password-error"
                                                    : undefined
                                            }
                                            {...register("password", {
                                                required: "Crie uma senha.",
                                                minLength: {
                                                    value: 8,
                                                    message:
                                                        "A senha deve ter ao menos 8 caracteres.",
                                                },
                                            })}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() =>
                                                setShowPassword(
                                                    (current) => !current,
                                                )
                                            }
                                            aria-label={
                                                showPassword
                                                    ? "Ocultar senha"
                                                    : "Mostrar senha"
                                            }
                                            className="absolute inset-y-0 right-1.5 my-auto text-muted-foreground"
                                        >
                                            {showPassword ? (
                                                <EyeOff />
                                            ) : (
                                                <Eye />
                                            )}
                                        </Button>
                                    </div>
                                    {errors.password && (
                                        <p
                                            id="password-error"
                                            role="alert"
                                            className="text-sm text-destructive"
                                        >
                                            {errors.password.message}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label
                                        htmlFor="confirmarSenha"
                                        className="text-base"
                                    >
                                        Confirmar senha
                                    </Label>
                                    <Input
                                        id="confirmarSenha"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        className="h-12 px-4 text-base md:text-base"
                                        aria-invalid={
                                            errors.confirmarSenha
                                                ? true
                                                : undefined
                                        }
                                        aria-describedby={
                                            errors.confirmarSenha
                                                ? "confirmar-senha-error"
                                                : undefined
                                        }
                                        {...register("confirmarSenha", {
                                            required: "Confirme sua senha.",
                                            validate: (value) =>
                                                value ===
                                                    getValues("password") ||
                                                "As senhas não coincidem.",
                                        })}
                                    />
                                    {errors.confirmarSenha && (
                                        <p
                                            id="confirmar-senha-error"
                                            role="alert"
                                            className="text-sm text-destructive"
                                        >
                                            {errors.confirmarSenha.message}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isSubmitting}
                                    className="h-12 text-base"
                                >
                                    {isSubmitting
                                        ? "Criando conta..."
                                        : "Criar conta"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <p className="text-center text-sm text-muted-foreground">
                        Já tem conta?{" "}
                        <Link
                            href="/login"
                            className="font-medium text-primary hover:underline"
                        >
                            Entrar
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
