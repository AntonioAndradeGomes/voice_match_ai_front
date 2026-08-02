"use client";

import { Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    useState,
    type CSSProperties,
    type ComponentProps,
    type ReactNode,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AuthBrandPanel } from "@/_components/auth/auth-brand-panel";
import { Button } from "@/_components/ui/button";
import { Card, CardContent } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { cnpjValido, formatarCNPJ } from "@/lib/cnpj";
import { criarUsuario } from "@/lib/usuarios";
import { cn } from "@/lib/utils";

interface CadastroFormValues {
    nome: string;
    email: string;
    cargo: string;
    empresa: string;
    cnpj: string;
    password: string;
    confirmarSenha: string;
}

/**
 * Campo do formulário. Extraído porque cada um repetia label, input, mensagem
 * de erro e a ligação `aria-invalid`/`aria-describedby` — com sete campos, a
 * duplicação passaria de 200 linhas e cada correção teria que ser feita sete
 * vezes. `adorno` cobre o único caso especial: o botão de mostrar senha.
 */
function CampoTexto({
    id,
    label,
    erro,
    adorno,
    className,
    ...inputProps
}: {
    id: string;
    label: string;
    erro?: string;
    adorno?: ReactNode;
} & ComponentProps<typeof Input>) {
    const idErro = `${id}-error`;

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={id} className="text-base">
                {label}
            </Label>

            <div className={adorno ? "relative" : undefined}>
                <Input
                    id={id}
                    className={cn(
                        "h-12 px-4 text-base md:text-base",
                        adorno && "pr-11",
                        className,
                    )}
                    aria-invalid={erro ? true : undefined}
                    aria-describedby={erro ? idErro : undefined}
                    {...inputProps}
                />
                {adorno}
            </div>

            {erro && (
                <p
                    id={idErro}
                    role="alert"
                    className="text-sm text-destructive"
                >
                    {erro}
                </p>
            )}
        </div>
    );
}

/** Divide o formulário em blocos: sete campos seguidos viram um paredão. */
function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-4">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {titulo}
            </span>
            {children}
        </div>
    );
}

export default function CadastroPage() {
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

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
            cargo: "",
            empresa: "",
            cnpj: "",
            password: "",
            confirmarSenha: "",
        },
    });

    // A máscara é aplicada no próprio evento antes de repassar ao react-hook-form,
    // para o valor guardado e o exibido nunca divergirem.
    const registroCnpj = register("cnpj", {
        required: "Informe o CNPJ da empresa.",
        validate: (valor) =>
            cnpjValido(valor) || "CNPJ inválido — confira os dígitos.",
    });

    async function onSubmit(values: CadastroFormValues) {
        try {
            await criarUsuario({
                nome_completo: values.nome.trim(),
                email: values.email.trim(),
                senha: values.password,
                recrutador: {
                    empresa: values.empresa.trim(),
                    // O backend normaliza o CNPJ para só dígitos; enviamos com
                    // máscara porque é o formato do contrato documentado.
                    cnpj: values.cnpj,
                    cargo: values.cargo.trim(),
                },
            });

            toast.success("Conta criada com sucesso", {
                description: "Entre com seu e-mail e senha para começar.",
            });
            router.push("/login");
        } catch (erro) {
            // A mensagem vem do backend quando ele explica o motivo — o caso
            // mais comum é "este e-mail já está cadastrado".
            toast.error(
                erro instanceof Error
                    ? erro.message
                    : "Não foi possível criar a conta.",
            );
        }
    }

    return (
        <div className="grid h-full lg:grid-cols-2">
            <AuthBrandPanel headline="Crie sua conta e comece a entrevistar candidatos em minutos." />

            {/* A coluna do formulário rola sozinha: o <main> do layout raiz é
                `overflow-hidden` dentro de um contêiner `h-svh`, então sem isso
                o que passa da altura da tela é simplesmente cortado. */}
            <div className="flex justify-center overflow-y-auto px-6 py-10">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    // `my-auto` no filho em vez de `items-center` no pai: com
                    // centralização por `align-items`, o conteúdo que estoura
                    // transborda para os dois lados e o topo fica inalcançável
                    // pela rolagem. Margem automática só distribui espaço quando
                    // ele existe; havendo overflow, resolve para zero.
                    className="my-auto flex w-full max-w-md flex-col gap-6"
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
                            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                                {/* `fieldset disabled` bloqueia todos os
                                    controles descendentes de uma vez — é
                                    comportamento nativo do HTML, então não
                                    precisa repetir `disabled` nos sete campos
                                    nem no botão de mostrar senha. O seletor
                                    `:disabled` também casa por herança, então
                                    os estilos de desabilitado que o Input e o
                                    Button já têm valem sem nenhum ajuste.

                                    `min-w-0` porque o fieldset tem largura
                                    mínima intrínseca própria, que ignoraria o
                                    `max-w-md` do cartão. */}
                                <fieldset
                                    disabled={isSubmitting}
                                    className="flex min-w-0 flex-col gap-6"
                                >
                                    <Secao titulo="Seus dados">
                                        <CampoTexto
                                            id="nome"
                                            label="Nome completo"
                                            type="text"
                                            autoComplete="name"
                                            placeholder="Seu nome"
                                            erro={errors.nome?.message}
                                            {...register("nome", {
                                                required: "Informe seu nome.",
                                            })}
                                        />

                                        <CampoTexto
                                            id="email"
                                            label="E-mail"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="voce@empresa.com"
                                            erro={errors.email?.message}
                                            {...register("email", {
                                                required: "Informe seu e-mail.",
                                                pattern: {
                                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                    message: "E-mail inválido.",
                                                },
                                            })}
                                        />

                                        <CampoTexto
                                            id="cargo"
                                            label="Seu cargo"
                                            type="text"
                                            // Token padrão do HTML para cargo: deixa
                                            // o navegador preencher sozinho.
                                            autoComplete="organization-title"
                                            placeholder="Analista de RH"
                                            erro={errors.cargo?.message}
                                            {...register("cargo", {
                                                required: "Informe seu cargo.",
                                            })}
                                        />
                                    </Secao>

                                    <Secao titulo="Empresa">
                                        <CampoTexto
                                            id="empresa"
                                            label="Nome da empresa"
                                            type="text"
                                            autoComplete="organization"
                                            placeholder="Nome da sua empresa"
                                            erro={errors.empresa?.message}
                                            {...register("empresa", {
                                                required:
                                                    "Informe o nome da empresa.",
                                            })}
                                        />

                                        <CampoTexto
                                            id="cnpj"
                                            label="CNPJ"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="00.000.000/0000-00"
                                            erro={errors.cnpj?.message}
                                            {...registroCnpj}
                                            onChange={(evento) => {
                                                evento.target.value =
                                                    formatarCNPJ(
                                                        evento.target.value,
                                                    );
                                                return registroCnpj.onChange(
                                                    evento,
                                                );
                                            }}
                                        />
                                    </Secao>

                                    <Secao titulo="Acesso">
                                        <CampoTexto
                                            id="password"
                                            label="Senha"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            autoComplete="new-password"
                                            placeholder="••••••••"
                                            erro={errors.password?.message}
                                            adorno={
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            (current) =>
                                                                !current,
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

                                        <CampoTexto
                                            id="confirmarSenha"
                                            label="Confirmar senha"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            autoComplete="new-password"
                                            placeholder="••••••••"
                                            erro={
                                                errors.confirmarSenha?.message
                                            }
                                            {...register("confirmarSenha", {
                                                required: "Confirme sua senha.",
                                                validate: (value) =>
                                                    value ===
                                                        getValues("password") ||
                                                    "As senhas não coincidem.",
                                            })}
                                        />
                                    </Secao>

                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="h-12 text-base"
                                    >
                                        {isSubmitting
                                            ? "Criando conta..."
                                            : "Criar conta"}
                                    </Button>
                                </fieldset>
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
