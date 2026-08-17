"use client";

import { Briefcase, CheckCircle2, MessageSquare, Users } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";

import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/_components/ui/card";
import { ScrollArea } from "@/_components/ui/scroll-area";
import {
    ICONES_ATENCAO,
    PainelAtencao,
    type ItemAtencao,
} from "@/_components/dashboard/painel-atencao";
import {
    MelhoresCandidatos,
    type DestaqueCandidato,
} from "@/_components/dashboard/melhores-candidatos";
import { COR_BARRA } from "@/_components/relatorios/grafico-base";
import { getCandidatos, getCandidatosByVaga, getVagas } from "@/lib/storage";
import { DashboardSkeleton } from "@/_components/layout/skeletons";
import { useAuth } from "@/context/auth-provider";
import { getResumoVagaBadge } from "@/lib/vaga-status";
import { MODALIDADE_LABEL, type Candidato, type Vaga } from "@/types";

const VAGAS_RECENTES = 4;
const DESTAQUES = 5;

interface DadosDashboard {
    vagas: Vaga[];
    /** Pessoas distintas — quem está em três vagas conta uma vez. */
    totalPessoas: number;
    /** Todas as candidaturas, achatadas: é a unidade das contagens de etapa. */
    candidaturas: { vaga: Vaga; candidato: Candidato }[];
    candidatosPorVaga: Record<string, Candidato[]>;
}

async function carregarDashboard(): Promise<DadosDashboard> {
    const vagas = await getVagas();
    const entradas = await Promise.all(
        vagas.map(
            async (vaga) =>
                [vaga, await getCandidatosByVaga(vaga.id)] as const,
        ),
    );
    const pessoas = await getCandidatos();

    // As contagens de etapa saem daqui, e não de `getCandidatos()`: aquela
    // função devolve todo mundo como "aguardando", sem vaga e sem nota, então
    // "em entrevista" e "concluídas" ficavam cravadas em zero. Só a contagem de
    // pessoas continua vindo dela, que é o que ela sabe responder.
    const candidaturas = entradas.flatMap(([vaga, lista]) =>
        lista.map((candidato) => ({ vaga, candidato })),
    );

    return {
        vagas,
        totalPessoas: pessoas.length,
        candidaturas,
        candidatosPorVaga: Object.fromEntries(
            entradas.map(([vaga, lista]) => [vaga.id, lista]),
        ),
    };
}

function saudacao(hora: number) {
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
}

function dataDeHoje() {
    const frase = new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
    return frase.charAt(0).toUpperCase() + frase.slice(1);
}

/**
 * Entrada em cascata dos blocos da página.
 *
 * Só opacidade, sem deslocamento — mesmo critério da sidebar: transform some
 * para quem usa "Reduzir Movimento" no sistema, e um fade curto é perceptível
 * para todo mundo sem incomodar ninguém.
 */
function BlocoAnimado({
    ordem,
    children,
    className,
}: {
    ordem: number;
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: ordem * 0.07, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * Cartão numérico com uma medida de proporção embaixo.
 *
 * A barra não é enfeite: mostra a fatia daquele número sobre o total de
 * candidaturas, que é a informação que o número sozinho esconde — "3 em
 * entrevista" pesa diferente em 6 ou em 60.
 */
function Metrica({
    icone: Icone,
    label,
    valor,
    fracao,
    legenda,
}: {
    icone: ComponentType<{ className?: string }>;
    label: string;
    valor: number;
    fracao?: number;
    legenda?: string;
}) {
    return (
        <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                {/* Chip colorido no lugar do ícone cinza solto: mesma pastilha
                    do painel de atenção, para a faixa de métricas pertencer à
                    mesma família visual do resto da tela. */}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icone className="size-4" />
                </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                {/* Figuras proporcionais no número grande: `tabular-nums` só
                    onde números se alinham em coluna. */}
                <div className="font-heading text-2xl font-bold">{valor}</div>

                {/* A barra só existe quando o número é parte de um todo de
                    verdade; legenda sem barra é permitida — o inverso não. */}
                {fracao !== undefined && (
                    <span
                        aria-hidden
                        className="block h-1 w-full overflow-hidden rounded-full bg-muted"
                    >
                        <span
                            className="block h-full rounded-r-full"
                            style={{
                                width: `${Math.min(100, fracao * 100)}%`,
                                background: COR_BARRA,
                            }}
                        />
                    </span>
                )}
                {legenda && (
                    <span className="text-xs text-muted-foreground">
                        {legenda}
                    </span>
                )}
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const [dados, setDados] = useState<DadosDashboard | null>(null);
    const { usuario } = useAuth();

    useEffect(() => {
        carregarDashboard().then(setDados);
    }, []);

    // `null` enquanto não montou: evita renderizar o estado vazio antes de saber
    // se existem vagas salvas.
    const carregando = dados === null;
    const { vagas, totalPessoas, candidaturas, candidatosPorVaga } = dados ?? {
        vagas: [],
        totalPessoas: 0,
        candidaturas: [],
        candidatosPorVaga: {},
    };

    const total = candidaturas.length;
    // "Abertas" quer dizer abertas: pausada e encerrada ficam de fora da
    // contagem principal e viram legenda. Antes o campo `status` nem chegava ao
    // front — o cartão somava tudo e o rótulo mentia.
    const vagasAtivas = vagas.filter((vaga) => vaga.status === "ativa");
    const vagasInativas = vagas.length - vagasAtivas.length;
    const emEntrevista = candidaturas.filter(
        ({ candidato }) => candidato.status === "em_entrevista",
    ).length;
    const finalizados = candidaturas.filter(
        ({ candidato }) => candidato.status === "finalizado",
    ).length;

    const triagemPendente = candidaturas.filter(
        ({ candidato }) =>
            candidato.triagem?.status === "pendente_triagem" &&
            !candidato.triagem?.feedback?.erro,
    ).length;
    // Triagem que estourou erro fica registrada como pendente com um campo
    // `erro` — visualmente idêntica a "ainda processando" em toda tela que não
    // olha esse campo. Aqui ela aparece como o que é: trabalho manual parado.
    const triagemFalhou = candidaturas.filter(
        ({ candidato }) => Boolean(candidato.triagem?.feedback?.erro),
    ).length;
    // Só as ativas: vaga pausada ou encerrada sem candidatos não é pendência.
    const vagasSemCandidato = vagasAtivas.filter(
        (vaga) => (candidatosPorVaga[vaga.id] ?? []).length === 0,
    ).length;

    const itensAtencao: ItemAtencao[] = [
        {
            chave: "falhou",
            icone: ICONES_ATENCAO.triagemFalhou,
            titulo: "Triagens para revisar à mão",
            descricao: "A análise automática falhou nestas candidaturas",
            total: triagemFalhou,
            // O link entrega a lista já filtrada — largar a pessoa numa página
            // cheia com o filtro em "Todos" desfaz o valor do atalho.
            href: "/talentos?filtro=pendentes",
            alerta: true,
        },
        {
            chave: "pendente",
            icone: ICONES_ATENCAO.triagemPendente,
            titulo: "Triagens em andamento",
            descricao: "Aguardando a Iris concluir a análise do currículo",
            total: triagemPendente,
            href: "/talentos?filtro=pendentes",
        },
        {
            chave: "entrevista",
            icone: ICONES_ATENCAO.emEntrevista,
            titulo: "Entrevistas em curso",
            descricao: "Pessoas na sala de entrevista por voz agora",
            total: emEntrevista,
            href: "/talentos?filtro=processo",
        },
        {
            chave: "vazias",
            icone: ICONES_ATENCAO.vagaSemCandidato,
            titulo: "Vagas sem candidatos",
            descricao: "Publicadas, mas ainda sem nenhuma inscrição",
            total: vagasSemCandidato,
            href: "/vagas",
        },
    ];

    const destaques: DestaqueCandidato[] = candidaturas
        .filter(({ candidato }) => candidato.notaFinal !== null)
        .sort(
            (a, b) => (b.candidato.notaFinal ?? 0) - (a.candidato.notaFinal ?? 0),
        )
        .slice(0, DESTAQUES)
        .map(({ vaga, candidato }) => ({
            id: `${vaga.id}-${candidato.id}`,
            nome: candidato.nome,
            vagaId: vaga.id,
            vagaTitulo: vaga.titulo,
            nota: candidato.notaFinal ?? 0,
        }));

    const primeiroNome = usuario?.nome_completo?.split(" ")[0] ?? "";

    return (
        <ScrollArea className="h-full">
            {/* Mais largo que as outras telas de propósito (7xl, não 5xl): é a
                página principal, e numa tela de notebook o conteúdo ficava
                espremido no meio com margens enormes. O padding cresce por
                breakpoint para o mobile continuar respirando. */}
            <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        {/* A data muda com o fuso de quem abre; o servidor
                            pré-renderiza com o dele — o aviso de hidratação é
                            esperado e inofensivo aqui. */}
                        <span
                            suppressHydrationWarning
                            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                        >
                            {dataDeHoje()}
                        </span>
                        <h1 className="font-heading text-3xl font-semibold tracking-tight">
                            {saudacao(new Date().getHours())}
                            {primeiroNome && (
                                <>
                                    ,{" "}
                                    <span className="text-primary">
                                        {primeiroNome}
                                    </span>
                                </>
                            )}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {/* Enquanto carrega, não afirmar "nenhuma": zero e
                                "ainda não sei" são frases diferentes. */}
                            {carregando
                                ? "Carregando as suas candidaturas…"
                                : total === 0
                                  ? "Nenhuma candidatura em andamento no momento."
                                  : `Você tem ${total} ${total === 1 ? "candidatura" : "candidaturas"} em ${vagasAtivas.length} ${vagasAtivas.length === 1 ? "vaga aberta" : "vagas abertas"}.`}
                        </p>
                    </div>

                    <Button nativeButton={false} render={<Link href="/vagas" />}>
                        <Briefcase data-icon="inline-start" />
                        Ver vagas
                    </Button>
                </header>

                {carregando ? (
                    <DashboardSkeleton />
                ) : (
                    <>
                        <BlocoAnimado
                            ordem={0}
                            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                        >
                            <Metrica
                                icone={Briefcase}
                                label="Vagas abertas"
                                valor={vagasAtivas.length}
                                legenda={
                                    vagasInativas > 0
                                        ? `+ ${vagasInativas} ${vagasInativas === 1 ? "pausada ou encerrada" : "pausadas ou encerradas"}`
                                        : undefined
                                }
                            />
                            {/* Sem barra aqui de propósito: pessoas sobre
                                candidaturas não é parte-de-um-todo, e barra que
                                não mede nada ensina a ignorar as que medem. */}
                            <Metrica
                                icone={Users}
                                label="Candidatos"
                                valor={totalPessoas}
                                legenda={`${total} ${total === 1 ? "candidatura" : "candidaturas"} no total`}
                            />
                            <Metrica
                                icone={MessageSquare}
                                label="Em entrevista"
                                valor={emEntrevista}
                                fracao={total ? emEntrevista / total : 0}
                                legenda={
                                    total
                                        ? `${Math.round((emEntrevista / total) * 100)}% das candidaturas`
                                        : undefined
                                }
                            />
                            <Metrica
                                icone={CheckCircle2}
                                label="Entrevistas concluídas"
                                valor={finalizados}
                                fracao={total ? finalizados / total : 0}
                                legenda={
                                    total
                                        ? `${Math.round((finalizados / total) * 100)}% das candidaturas`
                                        : undefined
                                }
                            />
                        </BlocoAnimado>

                        {/* O que uma tela inicial deve responder: o que espera
                            por mim, e quem se destacou. A análise fica nos
                            Relatórios — repetir os gráficos de lá aqui só faria
                            duas páginas com a mesma cara. */}
                        <BlocoAnimado
                            ordem={1}
                            className="grid gap-4 lg:grid-cols-[3fr_2fr]"
                        >
                            <PainelAtencao itens={itensAtencao} />
                            <MelhoresCandidatos destaques={destaques} />
                        </BlocoAnimado>

                        <BlocoAnimado ordem={2}>
                        <section className="flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-4">
                                <h2 className="font-heading text-lg font-medium">
                                    Vagas recentes
                                </h2>
                                {vagas.length > VAGAS_RECENTES && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        nativeButton={false}
                                        render={<Link href="/vagas" />}
                                    >
                                        Ver todas
                                    </Button>
                                )}
                            </div>

                            {vagas.length === 0 ? (
                                <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border py-16 text-center">
                                    <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                        <Briefcase className="size-5" />
                                    </span>
                                    <div className="flex flex-col gap-1">
                                        <p className="font-heading text-lg font-medium">
                                            Nenhuma vaga criada ainda
                                        </p>
                                        <p className="max-w-sm text-sm text-muted-foreground">
                                            Crie sua primeira vaga para começar
                                            a receber e avaliar candidatos.
                                        </p>
                                    </div>
                                    <Button
                                        nativeButton={false}
                                        render={<Link href="/vagas" />}
                                    >
                                        Ir para vagas
                                    </Button>
                                </div>
                            ) : (
                                // Grade em vez de pilha: quatro cartões em 2×2
                                // ocupam a largura que a lista vertical
                                // desperdiçava. No mobile volta a ser coluna.
                                <div className="grid gap-3 md:grid-cols-2">
                                    {vagas
                                        .slice(0, VAGAS_RECENTES)
                                        .map((vaga) => {
                                            const daVaga =
                                                candidatosPorVaga[vaga.id] ??
                                                [];
                                            const badge =
                                                getResumoVagaBadge(daVaga);

                                            return (
                                                <Link
                                                    key={vaga.id}
                                                    href={`/vagas/${vaga.id}`}
                                                    // h-full nos dois: numa grade,
                                                    // descrições de tamanhos
                                                    // diferentes deixariam os
                                                    // cartões da mesma linha
                                                    // desalinhados no rodapé.
                                                    className="block h-full rounded-[min(var(--radius-4xl),24px)] outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/30"
                                                >
                                                    <Card
                                                        size="sm"
                                                        className="h-full transition-shadow hover:shadow-md"
                                                    >
                                                        <CardHeader className="grid-cols-[1fr_auto] items-center">
                                                            <div className="flex min-w-0 flex-col gap-1">
                                                                <CardTitle className="truncate">
                                                                    {vaga.titulo}
                                                                </CardTitle>
                                                                <CardDescription className="line-clamp-1">
                                                                    {vaga.descricao ||
                                                                        "Sem descrição"}
                                                                </CardDescription>
                                                                {/* Meta que decide o clique: onde é
                                                                    e quantos já chegaram. */}
                                                                <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                                                                    <span>
                                                                        {
                                                                            MODALIDADE_LABEL[
                                                                                vaga
                                                                                    .modalidade
                                                                            ]
                                                                        }
                                                                    </span>
                                                                    <span
                                                                        aria-hidden
                                                                    >
                                                                        ·
                                                                    </span>
                                                                    <span>
                                                                        {daVaga.length ===
                                                                        1
                                                                            ? "1 candidato"
                                                                            : `${daVaga.length} candidatos`}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                            <Badge
                                                                variant={
                                                                    badge.variant
                                                                }
                                                            >
                                                                {badge.label}
                                                            </Badge>
                                                        </CardHeader>
                                                    </Card>
                                                </Link>
                                            );
                                        })}
                                </div>
                            )}
                        </section>
                        </BlocoAnimado>
                    </>
                )}
            </div>
        </ScrollArea>
    );
}
