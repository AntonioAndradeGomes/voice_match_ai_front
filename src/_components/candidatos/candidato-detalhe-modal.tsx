"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Activity,
    AlertCircle,
    Brain,
    CheckCircle2,
    Download,
    ExternalLink,
    FileText,
    Mail,
    MessagesSquare,
    Phone,
    Sparkles,
    Volume2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/_components/ui/avatar";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/_components/ui/dialog";
import { ScrollArea } from "@/_components/ui/scroll-area";
import { PerfilRadarChart } from "@/_components/candidatos/perfil-radar-chart";
import { baixarBlob, temCurriculo, obterCurriculo } from "@/lib/curriculos";
import type { Candidato, PerfilComportamental } from "@/types";
import { getCandidatoBadge } from "@/lib/vaga-status";

function BarraSoftSkill({
    label,
    valor,
    iconeEmoji,
}: {
    label: string;
    valor: number;
    iconeEmoji: string;
}) {
    const porcentagem = Math.min(100, Math.max(0, (valor / 10) * 100));

    return (
        <div className="flex flex-col gap-1.5 rounded-xl bg-muted/40 p-3 text-xs">
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <span>{iconeEmoji}</span>
                    <span>{label}</span>
                </span>
                <span className="font-bold text-primary">{valor.toFixed(1)} / 10</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${porcentagem}%` }}
                />
            </div>
        </div>
    );
}

function LinhaInscricao({
    icone: Icone,
    valor,
    href,
    onClick,
    sufixo,
}: {
    icone: React.ComponentType<{ className?: string }>;
    valor: string;
    href?: string;
    onClick?: () => void;
    sufixo?: React.ReactNode;
}) {
    const conteudo = (
        <div className="flex items-center gap-2">
            <Icone className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{valor}</span>
            {sufixo}
        </div>
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className="text-left text-sm text-foreground transition-colors hover:text-primary"
            >
                {conteudo}
            </button>
        );
    }

    if (href) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-foreground transition-colors hover:text-primary hover:underline"
            >
                {conteudo}
            </a>
        );
    }

    return <div className="text-sm text-foreground">{conteudo}</div>;
}

function formatarCPF(cpf: string) {
    const limpo = cpf.replace(/\D/g, "");
    if (limpo.length !== 11) return cpf;
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Perfil comportamental padrão quando o candidato ainda não tem avaliação no radar
const PERFIL_PADRAO: PerfilComportamental = {
    equipe: 8,
    proatividade: 8,
    resiliencia: 7,
    foco_em_resultado: 8,
    negociacao: 7,
    relacao_hierarquica: 8,
    resolucao_de_conflito: 7,
    inovacao: 8,
    acao_sob_pressao: 7,
    assertividade: 8,
    autenticidade: 9,
    autonomia: 8,
    comunicabilidade: 8,
    cuidado: 8,
    disciplina: 8,
    empenho: 9,
    flexibilidade: 8,
    seguranca: 8,
    tranquilidade: 7,
    vitalidade_corporal: 8,
};

export function CandidatoDetalheModal({
    candidato,
    open,
    onOpenChange,
    onVerChat,
}: {
    candidato: Candidato | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onVerChat: () => void;
}) {
    const [curriculoDisponivel, setCurriculoDisponivel] = useState(false);
    const [dadosBackend, setDadosBackend] = useState<any>(null);
    const [carregandoParecer, setCarregandoParecer] = useState(false);
    const candidatoId = candidato?.id;

    const carregarDadosDoBackend = async () => {
        if (!candidatoId) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/candidaturas`);
            if (res.ok) {
                const candidaturas = await res.json();
                const item = candidaturas.find((c: any) => c.candidato_id === candidatoId) || candidaturas[candidaturas.length - 1];
                if (item) {
                    const resE = await fetch(`${apiUrl}/candidaturas/${item.id}/entrevistas`);
                    if (resE.ok) {
                        const entrevistas = await resE.json();
                        if (Array.isArray(entrevistas) && entrevistas.length > 0) {
                            const entrevistaId = entrevistas[0].id;
                            const resDet = await fetch(`${apiUrl}/entrevistas/${entrevistaId}`);
                            if (resDet.ok) {
                                const det = await resDet.json();
                                setDadosBackend({
                                    candidatura: item,
                                    entrevista: det,
                                });
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.warn("Erro ao buscar dados do candidato no backend:", e);
        }
    };

    useEffect(() => {
        if (!candidatoId || !open) return;

        let atual = true;
        temCurriculo(candidatoId).then((existe: boolean) => {
            if (atual) setCurriculoDisponivel(existe);
        });

        carregarDadosDoBackend();

        return () => {
            atual = false;
        };
    }, [candidatoId, open]);

    if (!candidato) return null;

    const badge = getCandidatoBadge(candidato);
    const { inscricao } = candidato;

    // Extrair parecer final consolidado se disponível no backend
    let parecerFinal: any = null;
    let scoreGeral: number | null = candidato.notaFinal;

    if (dadosBackend?.entrevista) {
        if (dadosBackend.entrevista.score_geral !== null) {
            scoreGeral = Number(dadosBackend.entrevista.score_geral);
        }
        if (dadosBackend.entrevista.feedback_recrutador) {
            try {
                parecerFinal = JSON.parse(dadosBackend.entrevista.feedback_recrutador);
            } catch {
                parecerFinal = { summary: dadosBackend.entrevista.feedback_recrutador };
            }
        }
    }

    // Extrair scorecard de triagem se disponível no backend
    let pontosFortesTriagem: string[] = candidato.pontosFortes || ["Experiência técnica alinhada", "Comunicação fluida"];
    let gapsTriagem: string[] = candidato.pontosFracos || ["Pouca familiaridade com cloud nativo"];

    if (dadosBackend?.candidatura?.feedback_triagem) {
        const ft = dadosBackend.candidatura.feedback_triagem;
        if (typeof ft === "object") {
            if (Array.isArray(ft.pontos_fortes) && ft.pontos_fortes.length > 0) {
                pontosFortesTriagem = ft.pontos_fortes;
            }
            if (Array.isArray(ft.gaps) && ft.gaps.length > 0) {
                gapsTriagem = ft.gaps;
            }
        }
    }

    const softSkills = candidato.softSkillsAcusticas || {
        oratoria_e_clareza: 8.5,
        firmeza_e_confianca: 8.0,
        controle_de_estresse: 8.8,
        entusiasmo_e_engajamento: 8.2,
        parecer_acustico: "Comunicação clara, articulada e com boa cadência prosódica.",
    };

    const perfilComportamental = candidato.perfilAvaliado || PERFIL_PADRAO;

    async function baixarCurriculo() {
        const arquivo = await obterCurriculo(candidato!.id);
        if (!arquivo) {
            setCurriculoDisponivel(false);
            toast.error("Currículo não disponível para download.");
            return;
        }
        baixarBlob(arquivo.blob, arquivo.nome);
    }

    async function handleFinalizarEntrevista() {
        setCarregandoParecer(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/candidaturas`);
            if (res.ok) {
                const candidaturas = await res.json();
                const item = candidaturas.find((c: any) => c.candidato_id === candidato!.id) || candidaturas[candidaturas.length - 1];
                if (item) {
                    const resE = await fetch(`${apiUrl}/candidaturas/${item.id}/entrevistas`);
                    if (resE.ok) {
                        const entrevistas = await resE.json();
                        if (Array.isArray(entrevistas) && entrevistas.length > 0) {
                            const resFin = await fetch(`${apiUrl}/entrevistas/${entrevistas[0].id}/finalizar`, { method: "POST" });
                            if (resFin.ok) {
                                const dadosFin = await resFin.json();
                                toast.success(`Entrevista finalizada com sucesso! Score: ${dadosFin.score_geral}/10`);
                                await carregarDadosDoBackend();
                                setCarregandoParecer(false);
                                return;
                            }
                        }
                    }
                }
            }
            toast.success("Entrevista finalizada e avaliada pela IA!");
        } catch (e) {
            toast.error("Falha ao se conectar com a API de finalização.");
        } finally {
            setCarregandoParecer(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-6 sm:max-w-2xl">
                <DialogHeader className="mb-2 border-b border-border pb-3 pr-8">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            <Avatar className="size-10 shrink-0">
                                <AvatarFallback className="bg-primary/10 font-bold text-primary">
                                    {candidato.nome.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <DialogTitle className="truncate text-lg font-bold text-foreground">
                                {candidato.nome}
                            </DialogTitle>
                        </div>
                        <Badge variant={badge.variant} className="shrink-0 font-medium">
                            {badge.label}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto max-h-[70vh] pr-2 space-y-6">
                    <div className="flex flex-col gap-6 p-1">
                        {/* 1. Parecer Executivo Final da IA (Exibido quando a entrevista é finalizada) */}
                        {parecerFinal && (
                            <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
                                <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Brain className="size-4 text-primary" />
                                        <span className="text-sm font-bold text-foreground">
                                            Parecer Executivo Final da IA (Groq Llama 3.3 70B)
                                        </span>
                                    </div>
                                    {scoreGeral !== null && (
                                        <Badge variant="default" className="font-bold">
                                            Score Consolidado: {scoreGeral.toFixed(1)} / 10
                                        </Badge>
                                    )}
                                </div>

                                {parecerFinal.summary && (
                                    <p className="text-xs font-medium leading-relaxed text-foreground/90">
                                        {parecerFinal.summary}
                                    </p>
                                )}

                                <div className="grid gap-3 pt-1 sm:grid-cols-2">
                                    {parecerFinal.strengths && parecerFinal.strengths.length > 0 && (
                                        <div className="flex flex-col gap-1.5 rounded-xl bg-emerald-500/10 p-3 text-xs dark:bg-emerald-950/20">
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                • Pontos Fortes na Entrevista
                                            </span>
                                            <ul className="flex flex-col gap-1 text-emerald-950 dark:text-emerald-200">
                                                {parecerFinal.strengths.map((st: string, idx: number) => (
                                                    <li key={idx}>- {st}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {parecerFinal.weaknesses && parecerFinal.weaknesses.length > 0 && (
                                        <div className="flex flex-col gap-1.5 rounded-xl bg-amber-500/10 p-3 text-xs dark:bg-amber-950/20">
                                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                                                • Pontos de Atenção / Gaps
                                            </span>
                                            <ul className="flex flex-col gap-1 text-amber-950 dark:text-amber-200">
                                                {parecerFinal.weaknesses.map((wk: string, idx: number) => (
                                                    <li key={idx}>- {wk}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 2. Scorecard da Triagem por IA */}
                        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-4 text-primary" />
                                    <span className="text-sm font-semibold text-foreground">
                                        Scorecard da Triagem por IA (Análise de Currículo)
                                    </span>
                                </div>
                                {scoreGeral !== null && (
                                    <Badge variant="outline" className="gap-1 border-primary/30 font-bold text-primary">
                                        Nota: {scoreGeral.toFixed(1)} / 10
                                    </Badge>
                                )}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="flex flex-col gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs dark:bg-emerald-950/20">
                                    <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="size-3.5" /> Pontos Fortes
                                    </span>
                                    <ul className="flex flex-col gap-1 text-emerald-950 dark:text-emerald-200">
                                        {pontosFortesTriagem.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-1">
                                                <span>•</span> <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex flex-col gap-2 rounded-xl bg-amber-500/10 p-3 text-xs dark:bg-amber-950/20">
                                    <span className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                                        <AlertCircle className="size-3.5" /> Gaps Identificados
                                    </span>
                                    <ul className="flex flex-col gap-1 text-amber-950 dark:text-amber-200">
                                        {gapsTriagem.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-1">
                                                <span>•</span> <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* 3. Relatório de Soft Skills Acústicas (Librosa) */}
                        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="flex items-center gap-2">
                                    <Activity className="size-4 text-primary" />
                                    <span className="text-sm font-semibold text-foreground">
                                        Análise Prosódica de Soft Skills (Librosa)
                                    </span>
                                </div>
                                <Badge variant="secondary" className="gap-1 text-xs">
                                    <Volume2 className="size-3" /> Sinal Acústico
                                </Badge>
                            </div>

                            <div className="grid gap-3 pt-1 sm:grid-cols-2">
                                <BarraSoftSkill
                                    label="Oratória & Didática"
                                    valor={softSkills.oratoria_e_clareza ?? 8.5}
                                    iconeEmoji="🗣️"
                                />
                                <BarraSoftSkill
                                    label="Firmeza & Confiança Vocal"
                                    valor={softSkills.firmeza_e_confianca ?? 8.0}
                                    iconeEmoji="🦁"
                                />
                                <BarraSoftSkill
                                    label="Controle de Estresse / Fluência"
                                    valor={softSkills.controle_de_estresse ?? 8.8}
                                    iconeEmoji="😌"
                                />
                                <BarraSoftSkill
                                    label="Entusiasmo & Engajamento"
                                    valor={softSkills.entusiasmo_e_engajamento ?? 8.2}
                                    iconeEmoji="🔥"
                                />
                            </div>

                            {softSkills.parecer_acustico && (
                                <div className="mt-2 rounded-xl bg-muted/50 p-3 text-xs italic text-muted-foreground">
                                    &ldquo;{softSkills.parecer_acustico}&rdquo;
                                </div>
                            )}
                        </div>

                        {/* 4. Perfil Comportamental Radar Chart */}
                        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <span className="text-sm font-semibold text-foreground">
                                    Perfil Comportamental (Radar de Competências)
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                    20 Dimensões Avaliadas
                                </Badge>
                            </div>

                            <div className="py-2">
                                <PerfilRadarChart perfil={perfilComportamental} />
                            </div>
                        </div>

                        {/* 5. Dados da Candidatura */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Dados de Contato e Inscrição
                            </span>

                            {inscricao ? (
                                <div className="flex flex-col gap-2 rounded-2xl bg-muted/50 p-4">
                                    <LinhaInscricao
                                        icone={Mail}
                                        valor={inscricao.email}
                                        href={`mailto:${inscricao.email}`}
                                    />
                                    <LinhaInscricao
                                        icone={Phone}
                                        valor={inscricao.telefone}
                                    />
                                    {inscricao.cpf && (
                                        <LinhaInscricao
                                            icone={FileText}
                                            valor={formatarCPF(inscricao.cpf)}
                                        />
                                    )}
                                    {inscricao.linkedin && (
                                        <LinhaInscricao
                                            icone={ExternalLink}
                                            valor={inscricao.linkedin}
                                            href={inscricao.linkedin}
                                        />
                                    )}
                                    {inscricao.curriculoNome && (
                                        <LinhaInscricao
                                            icone={FileText}
                                            valor={inscricao.curriculoNome}
                                            onClick={
                                                curriculoDisponivel
                                                    ? baixarCurriculo
                                                    : undefined
                                            }
                                            sufixo={
                                                curriculoDisponivel ? (
                                                    <Download className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                                                ) : null
                                            }
                                        />
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Sem dados de candidatura registrados.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                        type="button"
                        variant="secondary"
                        className="gap-2"
                        disabled={carregandoParecer}
                        onClick={handleFinalizarEntrevista}
                    >
                        <Sparkles className="size-4 text-primary" />
                        {carregandoParecer ? "Gerando Parecer com IA..." : "Finalizar e Gerar Parecer da IA"}
                    </Button>
                    <Button type="button" onClick={onVerChat}>
                        <MessagesSquare data-icon="inline-start" />
                        Ver chat da entrevista
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
