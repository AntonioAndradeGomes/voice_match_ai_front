"use client";

import { Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AuthBrandPanel } from "@/_components/auth/auth-brand-panel";
import { Button } from "@/_components/ui/button";
import { Card, CardContent } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { useAuth } from "@/context/auth-provider";

interface LoginFormValues {
    email: string;
    password: string;
}

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { entrar } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        mode: "onBlur",
        defaultValues: { email: "", password: "" },
    });

    async function onSubmit(values: LoginFormValues) {
        try {
            const usuario = await entrar(values.email.trim(), values.password);

            toast.success(`Bem-vindo, ${usuario.nome_completo.split(" ")[0]}!`);
            router.push("/");
        } catch (erro) {
            // Credencial errada volta como mensagem do backend; só cai no texto
            // genérico quando a resposta não traz motivo (ex.: rede fora).
            toast.error(
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível entrar.",
            );
        }
    }

    return (
        <div className="grid h-full lg:grid-cols-2">
            <AuthBrandPanel headline="Entrevistas por chat com match de perfil comportamental." />

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
                            Entrar na VoiceMatch
                            <span className="text-sidebar-primary">Ai</span>
                        </h1>
                    </div>

                    <div className="hidden flex-col gap-1 lg:flex">
                        <h1 className="font-heading text-2xl font-semibold tracking-tight">
                            Bem-vindo de volta
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Entre com as credenciais da sua conta de recrutador.
                        </p>
                    </div>

                    <Card
                        style={{ "--card-spacing": "1.75rem" } as CSSProperties}
                    >
                        <CardContent>
                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                noValidate
                                className="flex flex-col gap-5"
                            >
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="voce@empresa.com"
                                        className="h-11 rounded-xl px-4"
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
                                    <Label htmlFor="password">Senha</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            className="h-11 rounded-xl px-4 pr-11"
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
                                                required: "Informe sua senha.",
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

                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isSubmitting}
                                    className="mt-1 h-11 rounded-xl"
                                >
                                    {isSubmitting ? "Entrando..." : "Entrar"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* TODO: /cadastro ainda não existe — criar quando o
                    backend expuser cadastro de recrutador. */}
                    <p className="text-center text-sm text-muted-foreground">
                        Não tem conta?{" "}
                        <Link
                            href="/cadastro"
                            className="font-medium text-primary hover:underline"
                        >
                            Criar conta
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
