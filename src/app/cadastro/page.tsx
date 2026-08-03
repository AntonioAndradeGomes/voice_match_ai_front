"use client";

import { Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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

// Campos da primeira etapa — validados antes de deixar avançar.
const CAMPOS_ETAPA_1 = ["nome", "email", "cargo"] as const;
const TOTAL_ETAPAS = 2;

// A etapa entra pelo lado para onde o usuário está indo e sai pelo oposto:
// avançando, entra pela direita e sai pela esquerda; voltando, o inverso.
// `custom` (a direção) é o que inverte o sinal — por isso entrada e saída são
// funções, e não objetos fixos.
const VARIANTES_ETAPA = {
    entrada: (direcao: number) => ({ opacity: 0, x: direcao * 32 }),
    centro: { opacity: 1, x: 0 },
    saida: (direcao: number) => ({ opacity: 0, x: direcao * -32 }),
};

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
            <Label htmlFor={id}>{label}</Label>

            <div className={adorno ? "relative" : undefined}>
                <Input
                    id={id}
                    className={cn(
                        "h-11 rounded-xl px-4",
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
                <p id={idErro} role="alert" className="text-sm text-destructive">
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

/**
 * Indicador das duas etapas. Nada além de "Etapa X de Y" + uma barrinha —
 * um stepper com números e checkmarks seria peso visual maior do que duas
 * etapas justificam.
 */
function Stepper({ etapaAtual }: { etapaAtual: number }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
                Etapa {etapaAtual} de {TOTAL_ETAPAS}
            </span>
            <div className="flex gap-1.5">
                {Array.from({ length: TOTAL_ETAPAS }, (_, indice) => (
                    <div
                        key={indice}
                        className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
                    >
                        {/* A barra preenche por scaleX em vez de trocar a cor
                            de fundo: assim o avanço tem o mesmo movimento da
                            transição entre etapas, em vez de piscar. */}
                        <motion.div
                            className="h-full w-full origin-left rounded-full bg-primary"
                            initial={false}
                            animate={{
                                scaleX: indice < etapaAtual ? 1 : 0,
                            }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function CadastroPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [etapa, setEtapa] = useState<1 | 2>(1);
    const [direcao, setDirecao] = useState<1 | -1>(1);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        getValues,
        trigger,
        formState: { errors, isSubmitting },
    } = useForm<CadastroFormValues>({
        mode: "onBlur",
        // A etapa fora de tela é desmontada (é o que permite animar a troca),
        // e sem isto o react-hook-form descartaria os valores dela junto — o
        // submit na etapa 2 enviaria nome, e-mail e cargo vazios.
        shouldUnregister: false,
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

    // Só avança se a etapa 1 estiver válida — senão daria pra chegar na etapa
    // 2 com nome, e-mail ou cargo em branco e só descobrir no submit.
    async function avancar() {
        const valido = await trigger(CAMPOS_ETAPA_1);
        if (!valido) return;
        setDirecao(1);
        setEtapa(2);
    }

    function voltar() {
        setDirecao(-1);
        setEtapa(1);
    }

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
                        <CardContent className="flex flex-col gap-5">
                            <Stepper etapaAtual={etapa} />

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
                                    className="flex min-w-0 flex-col"
                                >
                                    {/* `mode="wait"` para a etapa que sai
                                        terminar antes de a próxima entrar: sem
                                        isso as duas coexistem e, como não estão
                                        posicionadas de forma absoluta, o cartão
                                        dobraria de altura no meio da transição.
                                        `initial={false}` evita animar a etapa 1
                                        na carga inicial da página. */}
                                    <AnimatePresence
                                        mode="wait"
                                        custom={direcao}
                                        initial={false}
                                    >
                                        <motion.div
                                            key={etapa}
                                            custom={direcao}
                                            variants={VARIANTES_ETAPA}
                                            initial="entrada"
                                            animate="centro"
                                            exit="saida"
                                            transition={{
                                                duration: 0.18,
                                                ease: "easeOut",
                                            }}
                                            className="flex flex-col gap-5"
                                        >
                                            {etapa === 1 ? (
                                                <>
                                                    <Secao titulo="Seus dados">
                                                        <CampoTexto
                                                            id="nome"
                                                            label="Nome completo"
                                                            type="text"
                                                            autoComplete="name"
                                                            placeholder="Seu nome"
                                                            erro={
                                                                errors.nome
                                                                    ?.message
                                                            }
                                                            {...register(
                                                                "nome",
                                                                {
                                                                    required:
                                                                        "Informe seu nome.",
                                                                },
                                                            )}
                                                        />

                                                        <CampoTexto
                                                            id="email"
                                                            label="E-mail"
                                                            type="email"
                                                            autoComplete="email"
                                                            placeholder="voce@empresa.com"
                                                            erro={
                                                                errors.email
                                                                    ?.message
                                                            }
                                                            {...register(
                                                                "email",
                                                                {
                                                                    required:
                                                                        "Informe seu e-mail.",
                                                                    pattern: {
                                                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                                        message:
                                                                            "E-mail inválido.",
                                                                    },
                                                                },
                                                            )}
                                                        />

                                                        <CampoTexto
                                                            id="cargo"
                                                            label="Seu cargo"
                                                            type="text"
                                                            // Token padrão do HTML para
                                                            // cargo: deixa o navegador
                                                            // preencher sozinho.
                                                            autoComplete="organization-title"
                                                            placeholder="Analista de RH"
                                                            erro={
                                                                errors.cargo
                                                                    ?.message
                                                            }
                                                            {...register(
                                                                "cargo",
                                                                {
                                                                    required:
                                                                        "Informe seu cargo.",
                                                                },
                                                            )}
                                                        />
                                                    </Secao>

                                                    <Button
                                                        type="button"
                                                        size="lg"
                                                        className="mt-1 h-11 rounded-xl"
                                                        onClick={avancar}
                                                    >
                                                        Continuar
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Secao titulo="Empresa">
                                                        <CampoTexto
                                                            id="empresa"
                                                            label="Nome da empresa"
                                                            type="text"
                                                            autoComplete="organization"
                                                            placeholder="Nome da sua empresa"
                                                            erro={
                                                                errors.empresa
                                                                    ?.message
                                                            }
                                                            {...register(
                                                                "empresa",
                                                                {
                                                                    required:
                                                                        "Informe o nome da empresa.",
                                                                },
                                                            )}
                                                        />

                                                        <CampoTexto
                                                            id="cnpj"
                                                            label="CNPJ"
                                                            type="text"
                                                            inputMode="numeric"
                                                            placeholder="00.000.000/0000-00"
                                                            erro={
                                                                errors.cnpj
                                                                    ?.message
                                                            }
                                                            {...registroCnpj}
                                                            onChange={(
                                                                evento,
                                                            ) => {
                                                                evento.target.value =
                                                                    formatarCNPJ(
                                                                        evento
                                                                            .target
                                                                            .value,
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
                                                            erro={
                                                                errors.password
                                                                    ?.message
                                                            }
                                                            adorno={
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    onClick={() =>
                                                                        setShowPassword(
                                                                            (
                                                                                current,
                                                                            ) =>
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
                                                            {...register(
                                                                "password",
                                                                {
                                                                    required:
                                                                        "Crie uma senha.",
                                                                    minLength: {
                                                                        value: 8,
                                                                        message:
                                                                            "A senha deve ter ao menos 8 caracteres.",
                                                                    },
                                                                },
                                                            )}
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
                                                                errors
                                                                    .confirmarSenha
                                                                    ?.message
                                                            }
                                                            {...register(
                                                                "confirmarSenha",
                                                                {
                                                                    required:
                                                                        "Confirme sua senha.",
                                                                    validate: (
                                                                        value,
                                                                    ) =>
                                                                        value ===
                                                                            getValues(
                                                                                "password",
                                                                            ) ||
                                                                        "As senhas não coincidem.",
                                                                },
                                                            )}
                                                        />
                                                    </Secao>

                                                    <div className="mt-1 flex gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="lg"
                                                            className="h-11 rounded-xl"
                                                            onClick={voltar}
                                                        >
                                                            Voltar
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            size="lg"
                                                            className="h-11 flex-1 rounded-xl"
                                                        >
                                                            {isSubmitting
                                                                ? "Criando conta..."
                                                                : "Criar conta"}
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
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
