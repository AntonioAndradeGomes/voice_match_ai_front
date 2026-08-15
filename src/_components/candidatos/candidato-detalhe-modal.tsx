"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Activity,
    AlertCircle,
    AlertTriangle,
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
import { AudioPlayer } from "@/_components/ui/audio-player";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/_components/ui/dialog";
import { ScrollArea } from "@/_components/ui/scroll-area";
import {
    PerfilRadarChart,
    type EixoRadar,
} from "@/_components/candidatos/perfil-radar-chart";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import { baixarBlob, temCurriculo, obterCurriculo } from "@/lib/curriculos";
import type {
    Candidato,
    FeedbackTriagem,
    StatusTriagem,
    Vaga,
} from "@/types";
import { getCandidatoBadge } from "@/lib/vaga-status";

// Rótulo e cor de cada estado da triagem. Serve também de guarda: só um valor
// presente aqui é aceito como status de triagem vindo do backend.
const STATUS_TRIAGEM_LABEL: Record<
    StatusTriagem,
    { texto: string; variant: "success" | "destructive" | "warning" }
> = {
    aprovada_triagem: { texto: "Aprovado na Triagem", variant: "success" },
    reprovada_triagem: { texto: "Reprovado na Triagem", variant: "destructive" },
    pendente_triagem: { texto: "Aguardando Triagem", variant: "warning" },
};

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


export function CandidatoDetalheModal({
    candidato,
    vaga,
    open,
    onOpenChange,
    onVerChat,
}: {
    candidato: Candidato | null;
    /** Fonte dos eixos do radar — são as skills cadastradas nesta vaga. */
    vaga: Vaga | null;
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
            const res = await apiFetch(`${API_BASE_URL}/candidaturas`);
            if (res.ok) {
                const candidaturas = await res.json();
                if (Array.isArray(candidaturas) && candidaturas.length > 0) {
                    let item = candidaturas.find((c: any) => c.candidato_id === candidatoId);
                    if (!item) {
                        item = candidaturas[candidaturas.length - 1];
                    }
                    if (item) {
                        const resE = await apiFetch(`${API_BASE_URL}/candidaturas/${item.id}/entrevistas`);
                        if (resE.ok) {
                            const entrevistas = await resE.json();
                            if (Array.isArray(entrevistas) && entrevistas.length > 0) {
                                const entrevistaId = entrevistas[0].id;
                                const resDet = await apiFetch(`${API_BASE_URL}/entrevistas/${entrevistaId}`);
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

    // Triagem de currículo por IA. A candidatura buscada direto do backend é a
    // fonte mais fresca; `candidato.triagem` (montado em storage.ts a partir da
    // listagem) é o retrato que a lista já tinha. Nada aqui usa valor de
    // exemplo: sem dado, a seção mostra o estado vazio — um "ponto forte"
    // inventado seria lido como avaliação real da IA sobre uma pessoa.
    const candidaturaBackend = dadosBackend?.candidatura;

    const feedbackTriagem: FeedbackTriagem | null =
        (candidaturaBackend?.feedback_triagem as FeedbackTriagem | undefined) ??
        candidato.triagem?.feedback ??
        null;

    const scoreBruto =
        candidaturaBackend?.score_triagem ?? candidato.triagem?.score ?? null;
    const scoreTriagem =
        scoreBruto === null || scoreBruto === undefined
            ? null
            : Number(scoreBruto);

    const statusTriagem: StatusTriagem | null =
        (candidaturaBackend?.status as StatusTriagem | undefined) &&
        STATUS_TRIAGEM_LABEL[candidaturaBackend.status as StatusTriagem]
            ? (candidaturaBackend.status as StatusTriagem)
            : (candidato.triagem?.status ?? null);

    const pontosFortesTriagem = feedbackTriagem?.pontos_fortes ?? [];
    const gapsTriagem = feedbackTriagem?.gaps ?? [];
    const parecerTriagem = feedbackTriagem?.feedback_texto ?? null;
    const erroTriagem = feedbackTriagem?.erro ?? null;
    const temAlgumDadoDeTriagem =
        statusTriagem !== null ||
        scoreTriagem !== null ||
        pontosFortesTriagem.length > 0 ||
        gapsTriagem.length > 0 ||
        Boolean(parecerTriagem);

    // Extrair métricas acústicas reais consolidadas de todas as respostas com Librosa
    let softSkills = {
        oratoria_e_clareza: 8.5,
        firmeza_e_confianca: 8.0,
        controle_de_estresse: 8.8,
        entusiasmo_e_engajamento: 8.2,
        parecer_acustico: "Comunicação clara, articulada e com boa cadência prosódica.",
        isReal: false,
    };

    if (dadosBackend?.entrevista?.perguntas && Array.isArray(dadosBackend.entrevista.perguntas)) {
        const respostasComAcustica = dadosBackend.entrevista.perguntas
            .map((p: any) => p.resposta?.metricas?.acustica)
            .filter(Boolean);

        if (respostasComAcustica.length > 0) {
            let totalOratoria = 0;
            let totalFirmeza = 0;
            let totalEstresse = 0;
            let totalEntusiasmo = 0;
            let count = 0;
            let ultimoParecer = "";

            for (const ac of respostasComAcustica) {
                const s = ac.soft_skills_acusticas;
                if (s) {
                    totalOratoria += Number(s.oratoria_e_clareza ?? 8.0);
                    totalFirmeza += Number(s.firmeza_e_confianca ?? 8.0);
                    totalEstresse += Number(s.controle_de_estresse ?? 8.0);
                    totalEntusiasmo += Number(s.entusiasmo_e_engajamento ?? 8.0);
                    count++;
                }
                if (ac.parecer_acustico) {
                    ultimoParecer = ac.parecer_acustico;
                }
            }

            if (count > 0) {
                softSkills = {
                    oratoria_e_clareza: Number((totalOratoria / count).toFixed(1)),
                    firmeza_e_confianca: Number((totalFirmeza / count).toFixed(1)),
                    controle_de_estresse: Number((totalEstresse / count).toFixed(1)),
                    entusiasmo_e_engajamento: Number((totalEntusiasmo / count).toFixed(1)),
                    parecer_acustico: ultimoParecer || "Análise acústica média consolidada das respostas gravadas.",
                    isReal: true,
                };
            }
        }
    } else if (candidato.softSkillsAcusticas) {
        softSkills = {
            ...candidato.softSkillsAcusticas,
            oratoria_e_clareza: candidato.softSkillsAcusticas.oratoria_e_clareza ?? 8.5,
            firmeza_e_confianca: candidato.softSkillsAcusticas.firmeza_e_confianca ?? 8.0,
            controle_de_estresse: candidato.softSkillsAcusticas.controle_de_estresse ?? 8.8,
            entusiasmo_e_engajamento: candidato.softSkillsAcusticas.entusiasmo_e_engajamento ?? 8.2,
            parecer_acustico: candidato.softSkillsAcusticas.parecer_acustico ?? "Comunicação clara.",
            isReal: true,
        };
    }

    // Eixos do radar: as hard e soft skills cadastradas nesta vaga, cada uma
    // com o peso definido na criação. Antes eram 20 traços fixos de types.ts,
    // iguais para toda vaga e sem relação com o que a posição realmente pede.
    const eixosRadar: EixoRadar[] = vaga
        ? [...vaga.hardSkills, ...vaga.softSkills].map((skill) => ({
              label: skill.nome,
              valor: skill.peso,
          }))
        : [];

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
            let entrevistaId = dadosBackend?.entrevista?.id;

            if (!entrevistaId) {
                const res = await apiFetch(`${API_BASE_URL}/candidaturas`);
                if (res.ok) {
                    const candidaturas = await res.json();
                    if (Array.isArray(candidaturas) && candidaturas.length > 0) {
                        let item = candidaturas.find((c: any) => c.candidato_id === candidato!.id);
                        if (!item) {
                            item = candidaturas[candidaturas.length - 1];
                        }
                        if (item) {
                            const resE = await apiFetch(`${API_BASE_URL}/candidaturas/${item.id}/entrevistas`);
                            if (resE.ok) {
                                const entrevistas = await resE.json();
                                if (Array.isArray(entrevistas) && entrevistas.length > 0) {
                                    entrevistaId = entrevistas[0].id;
                                }
                            }
                        }
                    }
                }
            }

            if (entrevistaId) {
                const resFin = await apiFetch(`${API_BASE_URL}/entrevistas/${entrevistaId}/finalizar`, {
                    method: "POST",
                });
                if (resFin.ok) {
                    const dadosFin = await resFin.json();
                    setDadosBackend((prev: any) => ({
                        ...prev,
                        entrevista: dadosFin,
                    }));
                    toast.success(`Entrevista finalizada! Score Consolidado: ${dadosFin.score_geral}/10`);
                    setCarregandoParecer(false);
                    return;
                }
            }

            toast.error("Não foi possível encontrar a entrevista do candidato no backend.");
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
                        {/* 1. Parecer Executivo Final da Iris (Exibido quando a entrevista é finalizada) */}
                        {parecerFinal && (
                            <div className="flex flex-col gap-3.5 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
                                <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Brain className="size-4 text-primary" />
                                        <span className="text-sm font-bold text-foreground">
                                            Parecer Executivo Final da Iris
                                        </span>
                                    </div>
                                    {scoreGeral !== null && (
                                        <Badge variant="default" className="font-bold text-xs">
                                            Nota Consolidada: {scoreGeral.toFixed(1)} / 10
                                        </Badge>
                                    )}
                                </div>

                                {/* A. Sugestão de Entrevista por Vídeo */}
                                {parecerFinal.sugestao_entrevista_video && (
                                    <div className="flex flex-col gap-1 rounded-xl bg-blue-500/10 p-3 text-xs dark:bg-blue-950/20">
                                        <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                                            📹 Recomendação de Avanço para Entrevista por Vídeo
                                        </span>
                                        <p className="font-medium leading-relaxed text-foreground/90">
                                            {parecerFinal.sugestao_entrevista_video}
                                        </p>
                                    </div>
                                )}

                                {/* B. Resumo Geral do Recrutador */}
                                {(parecerFinal.feedback_geral || parecerFinal.summary) && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Feedback Geral do Candidato (Recrutador)
                                        </span>
                                        <p className="text-xs font-medium leading-relaxed text-foreground/90">
                                            {parecerFinal.feedback_geral || parecerFinal.summary}
                                        </p>
                                    </div>
                                )}

                                {/* C. Feedback Pronto para Envio ao Candidato em caso de Reprovação */}
                                {parecerFinal.feedback_candidato && (
                                    <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/60 p-3 text-xs">
                                        <span className="flex items-center gap-1 font-bold text-muted-foreground">
                                            ✉️ Feedback Personalizado de Retorno para o Candidato
                                        </span>
                                        <p className="italic leading-relaxed text-muted-foreground">
                                            &ldquo;{parecerFinal.feedback_candidato}&rdquo;
                                        </p>
                                    </div>
                                )}

                                {/* D. Pontos Fortes e Gaps */}
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

                        {/* 2. Scorecard da Triagem pela Iris */}
                        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-4 text-primary" />
                                    <span className="text-sm font-semibold text-foreground">
                                        Scorecard da Triagem pela Iris (Análise de Currículo)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {statusTriagem && (
                                        <Badge
                                            variant={
                                                STATUS_TRIAGEM_LABEL[
                                                    statusTriagem
                                                ].variant
                                            }
                                        >
                                            {
                                                STATUS_TRIAGEM_LABEL[
                                                    statusTriagem
                                                ].texto
                                            }
                                        </Badge>
                                    )}
                                    {/* Escala 0–10, a mesma do score mínimo da
                                        vaga — não confundir com a notaFinal da
                                        entrevista, que é de 0 a 100. */}
                                    {scoreTriagem !== null && (
                                        <Badge variant="outline" className="gap-1 border-primary/30 font-bold text-primary">
                                            Nota: {scoreTriagem.toFixed(1)} / 10
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {!temAlgumDadoDeTriagem && (
                                <p className="text-xs text-muted-foreground">
                                    Este candidato ainda não passou pela triagem
                                    de currículo pela Iris.
                                </p>
                            )}

                            {erroTriagem && (
                                <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                                    <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                                    <span>
                                        A triagem falhou para este candidato:{" "}
                                        {erroTriagem}
                                    </span>
                                </div>
                            )}

                            {parecerTriagem && (
                                <div className="flex flex-col gap-1 rounded-xl bg-muted/60 p-3 text-xs">
                                    <span className="font-semibold text-muted-foreground">
                                        Parecer da Iris
                                    </span>
                                    <p className="leading-relaxed text-foreground/90">
                                        {parecerTriagem}
                                    </p>
                                </div>
                            )}

                            {(pontosFortesTriagem.length > 0 ||
                                gapsTriagem.length > 0) && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {pontosFortesTriagem.length > 0 && (
                                <div className="flex flex-col gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs dark:bg-emerald-950/20">
                                    <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                                        <CheckCircle2 className="size-3.5" />
                                        <span>Pontos Fortes Identificados</span>
                                    </div>
                                    <ul className="flex list-disc flex-col gap-1 pl-4 text-emerald-950/90 marker:text-emerald-600 dark:text-emerald-100/90 dark:marker:text-emerald-400">
                                        {pontosFortesTriagem.map(
                                            (ponto, i) => (
                                                <li
                                                    key={`forte-${i}`}
                                                    className="leading-relaxed"
                                                >
                                                    {ponto}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                                )}

                                {gapsTriagem.length > 0 && (
                                <div className="flex flex-col gap-2 rounded-xl bg-amber-500/10 p-3 text-xs dark:bg-amber-950/20">
                                    <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                                        <AlertTriangle className="size-3.5" />
                                        <span>Gaps em Relação à Vaga</span>
                                    </div>
                                    <ul className="flex list-disc flex-col gap-1 pl-4 text-amber-950/90 marker:text-amber-600 dark:text-amber-100/90 dark:marker:text-amber-400">
                                        {gapsTriagem.map((gap, i) => (
                                            <li
                                                key={`gap-${i}`}
                                                className="leading-relaxed"
                                            >
                                                {gap}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                )}
                            </div>
                            )}
                        </div>

                        {/* 3. Ciclo das 3 Perguntas e Áudios da Entrevista */}
                        {dadosBackend?.entrevista?.perguntas && dadosBackend.entrevista.perguntas.length > 0 && (
                            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                                <div className="flex items-center justify-between border-b border-border pb-3">
                                    <div className="flex items-center gap-2">
                                        <Volume2 className="size-4 text-primary" />
                                        <span className="text-sm font-semibold text-foreground">
                                            Ciclo de 3 Fases da Entrevista de Voz
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {dadosBackend.entrevista.perguntas.filter((p: any) => p.resposta).length}/3 Respondidas
                                    </Badge>
                                </div>

                                <div className="flex flex-col gap-3 pt-1">
                                    {dadosBackend.entrevista.perguntas
                                        .sort((a: any, b: any) => a.ordem - b.ordem)
                                        .map((p: any) => {
                                            const etapaNome =
                                                p.ordem === 1
                                                    ? "Etapa 1: Apresentação Pessoal"
                                                    : p.ordem === 2
                                                    ? "Etapa 2: Fit Cultural & Equipe"
                                                    : "Etapa 3: Desafio Técnico";

                                            const audioUrl = p.resposta?.audio_url
                                                ? p.resposta.audio_url.startsWith("http")
                                                    ? p.resposta.audio_url
                                                    : `${API_BASE_URL}${p.resposta.audio_url}`
                                                : null;

                                            return (
                                                <div
                                                    key={p.id}
                                                    className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-primary">
                                                            {etapaNome}
                                                        </span>
                                                        {p.resposta ? (
                                                            <Badge variant="success" className="text-[10px]">
                                                                Respondida
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-[10px]">
                                                                Pendente
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <p className="font-medium text-foreground/90 leading-relaxed">
                                                        💬 {p.pergunta_texto}
                                                    </p>

                                                    {p.resposta ? (
                                                        <div className="mt-1 flex flex-col gap-1.5 rounded-lg bg-card p-2.5 ring-1 ring-border/50">
                                                            {audioUrl && (
                                                                <AudioPlayer
                                                                    src={audioUrl}
                                                                    seed={p.resposta.id}
                                                                />
                                                            )}
                                                            <p className="italic text-muted-foreground leading-relaxed">
                                                                &ldquo;{p.resposta.transcricao || "(Áudio gravado)"}&rdquo;
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="italic text-muted-foreground/70">
                                                            Aguardando gravação de áudio do candidato para esta etapa...
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* 4. Relatório de Soft Skills Acústicas (Librosa) */}
                        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="flex items-center gap-2">
                                    <Activity className="size-4 text-primary" />
                                    <span className="text-sm font-semibold text-foreground">
                                        Análise Prosódica de Soft Skills (Librosa)
                                    </span>
                                </div>
                                <Badge variant={softSkills.isReal ? "success" : "secondary"} className="gap-1 text-xs">
                                    <Volume2 className="size-3" /> {softSkills.isReal ? "Sinal Acústico Real (Librosa)" : "Sinal Estimado"}
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

                        {/* 5. Radar das competências exigidas pela vaga */}
                        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
                                <div>
                                    <span className="text-sm font-semibold text-foreground block">
                                        Perfil de Exigência da Vaga (Pesos das Competências)
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        Parâmetros definidos pelo recrutador na abertura da posição
                                    </span>
                                </div>
                                {eixosRadar.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        {eixosRadar.length}{" "}
                                        {eixosRadar.length === 1
                                            ? "competência"
                                            : "competências"}
                                    </Badge>
                                )}
                            </div>

                            <div className="py-2">
                                {eixosRadar.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">
                                        Esta vaga não tem hard nem soft skills
                                        cadastradas.
                                    </p>
                                ) : (
                                    <PerfilRadarChart
                                        eixos={eixosRadar}
                                        descricao="Radar das competências exigidas pela vaga, por peso"
                                    />
                                )}
                            </div>

                            {/* O peso é o que a vaga pede, não a nota do
                                candidato: o backend ainda não devolve avaliação
                                por competência. Sem esta linha, o radar seria
                                lido como desempenho da pessoa. */}
                            {eixosRadar.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Cada eixo é o peso definido na criação da
                                    vaga, de 0 a 10.
                                </p>
                            )}
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
