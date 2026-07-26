"use client";

import { CircleCheck, FileText, Info, Plus, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/_components/ui/button";
import { Checkbox } from "@/_components/ui/checkbox";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import {
    EXTENSAO_CURRICULO,
    formatarCPF,
    formatarTelefoneBR,
    normalizarLinkedin,
    validarCandidatura,
    type CamposCandidatura,
    type ErrosCandidatura,
} from "@/lib/inscricao";
import { salvarCurriculo } from "@/lib/curriculos";
import { saveCandidato } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Candidato, Vaga } from "@/types";

const CAMPOS_INICIAIS: CamposCandidatura = {
    nome: "",
    cpf: "",
    naoBrasileiro: false,
    email: "",
    telefone: "",
    linkedin: "",
    curriculo: null,
};

const PERFIL_LINKEDIN = "https://www.linkedin.com/in/";

function Campo({
    id,
    label,
    obrigatorio = true,
    dica,
    erro,
    children,
    abaixo,
}: {
    id: string;
    label: string;
    obrigatorio?: boolean;
    dica?: string;
    erro?: string;
    children: ReactNode;
    abaixo?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
                <Label htmlFor={id}>
                    {label}
                    {obrigatorio && (
                        <span className="text-primary" aria-hidden>
                            {" "}
                            *
                        </span>
                    )}
                </Label>
                {dica && (
                    <span
                        className="text-muted-foreground"
                        title={dica}
                        aria-label={dica}
                    >
                        <Info className="size-3.5" />
                    </span>
                )}
            </div>

            {children}
            {abaixo}

            {erro && (
                // `role="alert"` para o leitor de tela anunciar quando o erro
                // aparece depois da tentativa de envio.
                <p role="alert" className="text-xs text-destructive">
                    {erro}
                </p>
            )}
        </div>
    );
}

export function FormularioCandidatura({ vaga }: { vaga: Vaga }) {
    const [campos, setCampos] = useState<CamposCandidatura>(CAMPOS_INICIAIS);
    const [erros, setErros] = useState<ErrosCandidatura>({});
    // Erros só aparecem depois da primeira tentativa de envio — validar
    // enquanto a pessoa ainda está digitando o primeiro caractere é hostil.
    const [tentouEnviar, setTentouEnviar] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const inputArquivo = useRef<HTMLInputElement>(null);

    function alterar<C extends keyof CamposCandidatura>(
        campo: C,
        valor: CamposCandidatura[C],
    ) {
        const proximos = { ...campos, [campo]: valor };
        setCampos(proximos);
        if (tentouEnviar) setErros(validarCandidatura(proximos));
    }

    async function handleSubmit(evento: React.FormEvent) {
        evento.preventDefault();
        setTentouEnviar(true);

        const encontrados = validarCandidatura(campos);
        setErros(encontrados);
        if (Object.keys(encontrados).length > 0) {
            toast.error("Confira os campos destacados antes de enviar.");
            return;
        }

        const candidato: Candidato = {
            id: crypto.randomUUID(),
            vagaId: vaga.id,
            nome: campos.nome.trim(),
            avatarUrl: null,
            status: "aguardando",
            perfilAvaliado: null,
            notaFinal: null,
            pontosFortes: null,
            pontosFracos: null,
            melhorias: null,
            createdAt: new Date().toISOString(),
            inscricao: {
                email: campos.email.trim(),
                cpf: campos.naoBrasileiro
                    ? null
                    : campos.cpf.replace(/\D/g, ""),
                telefone: campos.telefone.trim(),
                linkedin: normalizarLinkedin(campos.linkedin),
                curriculoNome: campos.curriculo?.name ?? "",
            },
        };

        saveCandidato(candidato);

        // O arquivo vai depois do candidato, e a falha aqui não derruba a
        // inscrição: perder a candidatura inteira porque a cota de storage
        // estourou seria pior do que ficar sem o anexo. O recrutador vê o nome
        // do arquivo de qualquer forma; só o download fica indisponível.
        if (campos.curriculo) {
            try {
                await salvarCurriculo(candidato.id, campos.curriculo);
            } catch {
                toast.warning(
                    "Sua candidatura foi enviada, mas não conseguimos guardar o currículo. O recrutador pode pedir o arquivo por email.",
                );
            }
        }

        setEnviado(true);
    }

    if (enviado) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-3xl bg-card p-8 text-center shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CircleCheck className="size-6" />
                </span>
                <div className="flex flex-col gap-1">
                    <h2 className="font-heading text-lg font-medium">
                        Candidatura enviada!
                    </h2>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        Recebemos sua inscrição para{" "}
                        <strong className="font-medium text-foreground">
                            {vaga.titulo}
                        </strong>
                        . Você receberá o convite para a entrevista no email{" "}
                        {campos.email.trim()}.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5 sm:p-8 dark:ring-foreground/10"
        >
            <Campo id="nome" label="Nome completo" erro={erros.nome}>
                <Input
                    id="nome"
                    value={campos.nome}
                    onChange={(e) => alterar("nome", e.target.value)}
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    aria-invalid={Boolean(erros.nome)}
                    className="h-11 rounded-xl"
                />
            </Campo>

            {!campos.naoBrasileiro && (
                <Campo
                    id="cpf"
                    label="CPF"
                    dica="Usamos o CPF apenas para identificar sua candidatura."
                    erro={erros.cpf}
                >
                    <Input
                        id="cpf"
                        value={campos.cpf}
                        onChange={(e) =>
                            alterar("cpf", formatarCPF(e.target.value))
                        }
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                        aria-invalid={Boolean(erros.cpf)}
                        className="h-11 rounded-xl"
                    />
                </Campo>
            )}

            <div className="flex items-center gap-2.5">
                <Checkbox
                    id="naoBrasileiro"
                    checked={campos.naoBrasileiro}
                    onCheckedChange={(marcado) => {
                        // Trocar de origem invalida o telefone já digitado:
                        // as regras de formato são diferentes.
                        const proximos = {
                            ...campos,
                            naoBrasileiro: marcado === true,
                            cpf: "",
                            telefone: "",
                        };
                        setCampos(proximos);
                        if (tentouEnviar)
                            setErros(validarCandidatura(proximos));
                    }}
                />
                <Label htmlFor="naoBrasileiro" className="font-normal">
                    Não sou brasileiro
                </Label>
            </div>

            <Campo id="email" label="Seu melhor email" erro={erros.email}>
                <Input
                    id="email"
                    type="email"
                    value={campos.email}
                    onChange={(e) => alterar("email", e.target.value)}
                    placeholder="Seu melhor email"
                    autoComplete="email"
                    aria-invalid={Boolean(erros.email)}
                    className="h-11 rounded-xl"
                />
            </Campo>

            <Campo
                id="telefone"
                label={
                    campos.naoBrasileiro
                        ? "Celular com código do país"
                        : "Celular com DDD"
                }
                erro={erros.telefone}
            >
                {campos.naoBrasileiro ? (
                    <Input
                        id="telefone"
                        value={campos.telefone}
                        onChange={(e) => alterar("telefone", e.target.value)}
                        placeholder="+1 555 000 0000"
                        inputMode="tel"
                        autoComplete="tel"
                        aria-invalid={Boolean(erros.telefone)}
                        className="h-11 rounded-xl"
                    />
                ) : (
                    <div
                        className={cn(
                            "flex h-11 items-center rounded-xl bg-input/50 ring-1 ring-transparent transition-shadow focus-within:ring-3 focus-within:ring-ring/30",
                            erros.telefone && "ring-3 ring-destructive/20",
                        )}
                    >
                        <span className="shrink-0 border-r border-border px-3 text-sm text-muted-foreground">
                            +55
                        </span>
                        <Input
                            id="telefone"
                            value={campos.telefone}
                            onChange={(e) =>
                                alterar(
                                    "telefone",
                                    formatarTelefoneBR(e.target.value),
                                )
                            }
                            placeholder="(00) 00000-0000"
                            inputMode="tel"
                            autoComplete="tel-national"
                            aria-invalid={Boolean(erros.telefone)}
                            className="h-full border-0 bg-transparent focus-visible:ring-0"
                        />
                    </div>
                )}
            </Campo>

            <Campo
                id="linkedin"
                label="Linkedin"
                erro={erros.linkedin}
                abaixo={
                    <div className="flex flex-col gap-0.5">
                        <a
                            href={PERFIL_LINKEDIN}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-fit text-sm text-primary underline underline-offset-4"
                        >
                            Obtenha o link do seu perfil do linkedin
                        </a>
                        <span className="text-xs text-muted-foreground">
                            (Copie o link do seu perfil do Linkedin e cole no
                            campo acima)
                        </span>
                    </div>
                }
            >
                <Input
                    id="linkedin"
                    value={campos.linkedin}
                    onChange={(e) => alterar("linkedin", e.target.value)}
                    placeholder="https://linkedin.com/in/seu-perfil"
                    inputMode="url"
                    aria-invalid={Boolean(erros.linkedin)}
                    className="h-11 rounded-xl"
                />
            </Campo>

            <Campo
                id="curriculo"
                label="Currículo"
                dica="Somente PDF, até 5 MB."
                erro={erros.curriculo}
            >
                {/* O input real fica fora de vista, mas continua sendo ele que
                    recebe o clique e o foco — o botão só o aciona. */}
                <input
                    ref={inputArquivo}
                    id="curriculo"
                    type="file"
                    accept={EXTENSAO_CURRICULO}
                    className="sr-only"
                    onChange={(e) =>
                        alterar("curriculo", e.target.files?.[0] ?? null)
                    }
                />

                {campos.curriculo ? (
                    <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm">
                            {campos.curriculo.name}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Remover currículo"
                            onClick={() => {
                                // Zerar o input também: sem isso, reanexar o
                                // mesmo arquivo não dispara `change`.
                                if (inputArquivo.current) {
                                    inputArquivo.current.value = "";
                                }
                                alterar("curriculo", null);
                            }}
                        >
                            <X />
                        </Button>
                    </div>
                ) : (
                    <Button
                        type="button"
                        variant="secondary"
                        className="h-11 w-full rounded-xl bg-primary/10 text-primary hover:bg-primary/15"
                        onClick={() => inputArquivo.current?.click()}
                    >
                        <Plus data-icon="inline-start" />
                        Anexar currículo
                    </Button>
                )}
            </Campo>

            <Button type="submit" size="lg" className="h-11 rounded-xl">
                Enviar candidatura
            </Button>
        </form>
    );
}
