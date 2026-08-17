"use client";

import {
    CircleCheck,
    CircleX,
    Clock3,
    Mail,
    MicVocal,
    Phone,
    Search,
    TriangleAlert,
    UsersRound,
    X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import { Card, CardContent } from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { ScrollArea } from "@/_components/ui/scroll-area";
import { Skeleton } from "@/_components/ui/skeleton";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import { getCandidatos, getVagas } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Candidato, Vaga } from "@/types";

// ---------------------------------------------------------------------------
// Status
//
// A tabela cobre os dois vocabulários que chegam aqui: o enum completo do
// backend (via GET /candidaturas) e o StatusCandidato do front, usado nos
// candidatos locais que não têm candidatura no servidor. Cada status carrega
// ícone além de cor — regra da casa desde o modo daltonismo: cor nunca é o
// único canal.
// ---------------------------------------------------------------------------

type CategoriaFiltro =
    | "todos"
    | "aprovados"
    | "processo"
    | "pendentes"
    | "reprovados";

interface StatusInfo {
    rotulo: string;
    variant: "success" | "warning" | "destructive" | "secondary" | "default";
    icone: typeof CircleCheck;
    categoria: Exclude<CategoriaFiltro, "todos">;
}

const STATUS_INFO: Record<string, StatusInfo> = {
    // Enum do backend
    aprovada_triagem: {
        rotulo: "Triagem aprovada",
        variant: "success",
        icone: CircleCheck,
        categoria: "aprovados",
    },
    pendente_triagem: {
        rotulo: "Triagem pendente",
        variant: "warning",
        icone: Clock3,
        categoria: "pendentes",
    },
    reprovada_triagem: {
        rotulo: "Triagem reprovada",
        variant: "destructive",
        icone: CircleX,
        categoria: "reprovados",
    },
    em_entrevista: {
        rotulo: "Em entrevista",
        variant: "default",
        icone: MicVocal,
        categoria: "processo",
    },
    avaliada: {
        rotulo: "Entrevista avaliada",
        variant: "secondary",
        icone: CircleCheck,
        categoria: "processo",
    },
    aprovada: {
        rotulo: "Aprovado",
        variant: "success",
        icone: CircleCheck,
        categoria: "aprovados",
    },
    rejeitada: {
        rotulo: "Reprovado",
        variant: "destructive",
        icone: CircleX,
        categoria: "reprovados",
    },
    // StatusCandidato do front (candidatos locais, sem candidatura no backend)
    aguardando: {
        rotulo: "Aguardando",
        variant: "warning",
        icone: Clock3,
        categoria: "pendentes",
    },
    finalizado: {
        rotulo: "Finalizado",
        variant: "secondary",
        icone: CircleCheck,
        categoria: "processo",
    },
};

// A triagem que estourou erro fica registrada como pendente com um campo
// `erro` no feedback — visualmente idêntica a "ainda processando". Aqui ela
// ganha cara própria: ninguém deve esperar por um resultado que não vem.
const STATUS_ERRO_TRIAGEM: StatusInfo = {
    rotulo: "Revisar triagem",
    variant: "warning",
    icone: TriangleAlert,
    categoria: "pendentes",
};

const FILTROS: { chave: CategoriaFiltro; rotulo: string }[] = [
    { chave: "todos", rotulo: "Todos" },
    { chave: "aprovados", rotulo: "Aprovados" },
    { chave: "processo", rotulo: "Em processo" },
    { chave: "pendentes", rotulo: "Pendentes" },
    { chave: "reprovados", rotulo: "Reprovados" },
];

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------

/** Uma linha de "participou da vaga X" no cartão da pessoa. */
interface Participacao {
    id: string;
    vagaId: string | null;
    vagaTitulo: string | null;
    info: StatusInfo;
    /** Score da triagem por IA (0–10) ou nota final da entrevista. */
    score: number | null;
    scoreRotulo: "triagem" | "entrevista" | null;
    data: string | null;
    /** Mensagem do campo `erro` do feedback, quando a triagem falhou. */
    erro: string | null;
}

interface Talento {
    candidato: Candidato;
    participacoes: Participacao[];
    /** Data mais recente entre cadastro e candidaturas, para ordenação. */
    ultimaAtividade: number;
}

interface CandidaturaApi {
    id: string;
    vaga_id: string;
    candidato_id: string;
    status: string;
    score_triagem: number | string | null;
    feedback_triagem?: { erro?: string } | null;
    data_candidatura?: string | null;
}

function numeroOuNull(valor: number | string | null | undefined): number | null {
    if (valor === null || valor === undefined) return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}

async function carregarCandidaturas(): Promise<CandidaturaApi[]> {
    try {
        const response = await apiFetch(`${API_BASE_URL}/candidaturas`);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch {
        // Backend fora do ar: a página segue com o que os candidatos locais
        // carregam em si (status e vagaId), só sem o detalhe da triagem.
        return [];
    }
}

function montarTalentos(
    candidatos: Candidato[],
    vagas: Vaga[],
    candidaturas: CandidaturaApi[],
): Talento[] {
    const tituloPorVaga = new Map(vagas.map((vaga) => [vaga.id, vaga.titulo]));

    const porCandidato = new Map<string, CandidaturaApi[]>();
    for (const cand of candidaturas) {
        const lista = porCandidato.get(cand.candidato_id) ?? [];
        lista.push(cand);
        porCandidato.set(cand.candidato_id, lista);
    }

    return candidatos.map((candidato) => {
        const doBackend = porCandidato.get(candidato.id) ?? [];

        let participacoes: Participacao[] = doBackend.map((cand) => {
            const erro = cand.feedback_triagem?.erro ?? null;
            const info =
                cand.status === "pendente_triagem" && erro
                    ? STATUS_ERRO_TRIAGEM
                    : (STATUS_INFO[cand.status] ?? STATUS_INFO.aguardando);
            return {
                id: cand.id,
                vagaId: cand.vaga_id,
                vagaTitulo: tituloPorVaga.get(cand.vaga_id) ?? null,
                info,
                score: numeroOuNull(cand.score_triagem),
                scoreRotulo: cand.score_triagem !== null ? "triagem" : null,
                data: cand.data_candidatura ?? null,
                erro,
            };
        });

        // Candidato local sem candidatura no servidor (seed ou backend fora):
        // sintetiza a participação a partir do que ele carrega em si, para o
        // cartão não sair vazio.
        if (participacoes.length === 0 && candidato.vagaId) {
            participacoes = [
                {
                    id: `local-${candidato.id}`,
                    vagaId: candidato.vagaId,
                    vagaTitulo: tituloPorVaga.get(candidato.vagaId) ?? null,
                    info:
                        STATUS_INFO[candidato.status] ?? STATUS_INFO.aguardando,
                    score: candidato.notaFinal,
                    scoreRotulo:
                        candidato.notaFinal !== null ? "entrevista" : null,
                    data: candidato.createdAt,
                    erro: null,
                },
            ];
        }

        const ultimaAtividade = Math.max(
            new Date(candidato.createdAt).getTime() || 0,
            ...participacoes.map((p) =>
                p.data ? new Date(p.data).getTime() || 0 : 0,
            ),
        );

        return { candidato, participacoes, ultimaAtividade };
    });
}

/** Ignora caixa e acento, como a busca de vagas: "jose" precisa achar "José". */
function normalizar(texto: string) {
    return texto
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
}

function formatarData(iso: string | null) {
    if (!iso) return null;
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return null;
    return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

function LinhaParticipacao({ participacao }: { participacao: Participacao }) {
    const { info } = participacao;
    const Icone = info.icone;
    const data = formatarData(participacao.data);

    const titulo = participacao.vagaTitulo ?? "Vaga não encontrada";

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-muted/50 px-3 py-2">
            {participacao.vagaId && participacao.vagaTitulo ? (
                <Link
                    href={`/vagas/${participacao.vagaId}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium hover:text-primary hover:underline"
                >
                    {titulo}
                </Link>
            ) : (
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                    {titulo}
                </span>
            )}

            {participacao.score !== null && (
                <Badge variant="outline" className="tabular-nums">
                    {participacao.scoreRotulo === "entrevista"
                        ? "Nota"
                        : "Score"}{" "}
                    {participacao.score.toFixed(1)}
                </Badge>
            )}

            <Badge
                variant={info.variant}
                // A mensagem completa do erro só no title: no cartão ela
                // viraria um parágrafo; quem precisa do detalhe passa o mouse.
                title={participacao.erro ?? undefined}
            >
                <Icone data-icon="inline-start" />
                {info.rotulo}
            </Badge>

            {data && (
                <span className="text-xs text-muted-foreground tabular-nums">
                    {data}
                </span>
            )}
        </div>
    );
}

function CartaoTalento({ talento }: { talento: Talento }) {
    const { candidato, participacoes } = talento;
    const email = candidato.inscricao?.email;
    const telefone = candidato.inscricao?.telefone;

    // Iniciais como avatar: o backend não guarda foto, e um bloco vazio no
    // lugar deixaria a lista com cara de conteúdo que falhou ao carregar.
    const iniciais = candidato.nome
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0]?.toLocaleUpperCase("pt-BR") ?? "")
        .join("");

    return (
        <Card size="sm">
            <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                        {iniciais}
                    </span>

                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate font-medium">
                            {candidato.nome}
                        </span>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                            {email && (
                                <a
                                    href={`mailto:${email}`}
                                    className="flex min-w-0 items-center gap-1.5 hover:text-foreground"
                                >
                                    <Mail className="size-3 shrink-0" />
                                    <span className="truncate">{email}</span>
                                </a>
                            )}
                            {telefone && (
                                <span className="flex items-center gap-1.5">
                                    <Phone className="size-3 shrink-0" />
                                    {telefone}
                                </span>
                            )}
                        </div>
                    </div>

                    <Badge variant="secondary" className="shrink-0">
                        {participacoes.length === 1
                            ? "1 vaga"
                            : `${participacoes.length} vagas`}
                    </Badge>
                </div>

                {participacoes.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                        {participacoes.map((participacao) => (
                            <LinhaParticipacao
                                key={participacao.id}
                                participacao={participacao}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                        Cadastro sem candidatura registrada.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function Chip({
    ativo,
    onClick,
    children,
}: {
    ativo: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={ativo}
            className={cn(
                "rounded-2xl border px-3 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                ativo
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
        >
            {children}
        </button>
    );
}

function TalentosSkeleton() {
    return (
        <div className="flex flex-col gap-3" aria-busy>
            <span className="sr-only">Carregando talentos…</span>
            {Array.from({ length: 4 }).map((_, indice) => (
                <Skeleton key={indice} className="h-28 rounded-3xl" />
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

/**
 * Filtro inicial vindo da URL (`/talentos?filtro=pendentes`) — é o que permite
 * ao painel de atenção do Dashboard entregar a lista já recortada.
 *
 * Lê `window.location` num inicializador preguiçoso em vez de useSearchParams:
 * no servidor devolve "todos", e a divergência nunca chega ao DOM porque o
 * primeiro render é o skeleton, que não depende do filtro.
 */
function filtroInicial(): CategoriaFiltro {
    if (typeof window === "undefined") return "todos";
    const bruto = new URLSearchParams(window.location.search).get("filtro");
    return FILTROS.some(({ chave }) => chave === bruto)
        ? (bruto as CategoriaFiltro)
        : "todos";
}

export default function TalentosPage() {
    const [talentos, setTalentos] = useState<Talento[] | null>(null);
    const [busca, setBusca] = useState("");
    const [filtro, setFiltro] = useState<CategoriaFiltro>(filtroInicial);

    useEffect(() => {
        Promise.all([
            getCandidatos(),
            getVagas(),
            carregarCandidaturas(),
        ]).then(([candidatos, vagas, candidaturas]) => {
            setTalentos(
                montarTalentos(candidatos, vagas, candidaturas).sort(
                    (a, b) => b.ultimaAtividade - a.ultimaAtividade,
                ),
            );
        });
    }, []);

    const carregando = talentos === null;
    // `useMemo` e não `talentos ?? []` direto: o array novo a cada render
    // invalidaria os memos de contagem e filtro abaixo sem necessidade.
    const lista = useMemo(() => talentos ?? [], [talentos]);

    const contagem = useMemo(() => {
        const total: Record<CategoriaFiltro, number> = {
            todos: lista.length,
            aprovados: 0,
            processo: 0,
            pendentes: 0,
            reprovados: 0,
        };
        for (const talento of lista) {
            const categorias = new Set(
                talento.participacoes.map((p) => p.info.categoria),
            );
            for (const categoria of categorias) total[categoria] += 1;
        }
        return total;
    }, [lista]);

    const filtrados = useMemo(() => {
        const termo = normalizar(busca.trim());

        return lista.filter((talento) => {
            if (
                filtro !== "todos" &&
                !talento.participacoes.some(
                    (p) => p.info.categoria === filtro,
                )
            ) {
                return false;
            }

            if (termo === "") return true;

            // A busca cobre também o título das vagas: "backend" deve achar
            // quem se candidatou à vaga de backend, não só quem se chama assim.
            return normalizar(
                [
                    talento.candidato.nome,
                    talento.candidato.inscricao?.email ?? "",
                    ...talento.participacoes.map((p) => p.vagaTitulo ?? ""),
                ].join(" "),
            ).includes(termo);
        });
    }, [lista, busca, filtro]);

    const temFiltro = busca.trim() !== "" || filtro !== "todos";

    return (
        <ScrollArea className="h-full">
            <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
                <header className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Banco de Talentos
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Todo mundo que já se candidatou, junto e independente da
                        vaga — inclusive quem não avançou daquela vez.
                    </p>
                </header>

                {carregando ? (
                    <TalentosSkeleton />
                ) : lista.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                            <UsersRound className="size-8 text-muted-foreground" />
                            <span className="font-medium">
                                Nenhum candidato ainda
                            </span>
                            <span className="max-w-sm text-sm text-muted-foreground">
                                Assim que alguém se inscrever por uma vaga
                                publicada, aparece aqui.
                            </span>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                value={busca}
                                onChange={(evento) =>
                                    setBusca(evento.target.value)
                                }
                                placeholder="Buscar por nome, e-mail ou vaga..."
                                aria-label="Buscar talentos"
                                className="h-11 rounded-xl pr-4 pl-10"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                                {FILTROS.map(({ chave, rotulo }) => (
                                    <Chip
                                        key={chave}
                                        ativo={filtro === chave}
                                        onClick={() => setFiltro(chave)}
                                    >
                                        {rotulo}
                                        {contagem[chave] > 0 &&
                                            ` · ${contagem[chave]}`}
                                    </Chip>
                                ))}
                            </div>

                            {temFiltro && (
                                <div className="ml-auto flex items-center gap-2">
                                    <Badge variant="secondary">
                                        {filtrados.length} de {lista.length}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setBusca("");
                                            setFiltro("todos");
                                        }}
                                    >
                                        <X data-icon="inline-start" />
                                        Limpar
                                    </Button>
                                </div>
                            )}
                        </div>

                        {filtrados.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                    Nenhum talento com esses critérios.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {filtrados.map((talento) => (
                                    <CartaoTalento
                                        key={talento.candidato.id}
                                        talento={talento}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}
