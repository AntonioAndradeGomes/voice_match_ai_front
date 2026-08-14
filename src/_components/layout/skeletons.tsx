import {
    Card,
    CardContent,
    CardHeader,
} from "@/_components/ui/card";
import { Skeleton } from "@/_components/ui/skeleton";

/**
 * Esqueletos das telas internas. Ficam juntos porque as três compartilham o
 * mesmo esqueleto de topo (faixa de métricas) e mudam só no corpo — separar em
 * três arquivos duplicaria a faixa e abriria espaço para elas divergirem do
 * layout real com o tempo.
 *
 * Cada bloco imita a caixa que vai substituí-lo. Skeleton que não corresponde
 * ao conteúdo final causa salto de layout quando os dados chegam, que é pior
 * do que não ter skeleton nenhum.
 */

/** Faixa de 4 cartões numéricos, igual à do Dashboard e à dos Relatórios. */
function FaixaMetricas({ quantidade = 4 }: { quantidade?: number }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: quantidade }, (_, indice) => (
                <Card key={indice} className="flex-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="size-4 rounded-md" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-7 w-12" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/** Linha da lista de vagas recentes do Dashboard. */
function LinhaVaga() {
    return (
        <Card size="sm">
            <CardContent className="flex items-center gap-3 px-(--card-spacing)">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Skeleton className="h-4 w-48 max-w-full" />
                    <Skeleton className="h-3 w-28 max-w-full" />
                </div>
                <Skeleton className="h-5 w-20 shrink-0 rounded-2xl" />
            </CardContent>
        </Card>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-8">
            <FaixaMetricas />

            <section className="flex flex-col gap-4">
                <Skeleton className="h-6 w-40" />
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 3 }, (_, indice) => (
                        <LinhaVaga key={indice} />
                    ))}
                </div>
            </section>
        </div>
    );
}

export function VagasSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, indice) => (
                <Card key={indice} className="h-full">
                    <CardHeader className="flex flex-col gap-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-2">
                        <div className="flex -space-x-2">
                            {Array.from({ length: 3 }, (_, avatar) => (
                                <Skeleton
                                    key={avatar}
                                    className="size-8 rounded-full ring-2 ring-background"
                                />
                            ))}
                        </div>
                        <Skeleton className="h-5 w-24 rounded-2xl" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function RelatoriosSkeleton() {
    return (
        <div className="flex flex-col gap-8">
            <FaixaMetricas />

            {/* Os gráficos são altos e fixos; um bloco baixo aqui deixaria a
                página pular quando eles entrassem. */}
            <div className="grid gap-4 lg:grid-cols-2">
                {Array.from({ length: 2 }, (_, indice) => (
                    <CartaoGrafico key={indice} />
                ))}
            </div>

            {/* Distribuição de notas, que ocupa a largura inteira embaixo. */}
            <CartaoGrafico />
        </div>
    );
}

export function VagaDetalheSkeleton() {
    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Skeleton className="h-7 w-36" />
                <div className="flex items-center gap-3">
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-7 w-24" />
                </div>
            </div>

            {/* Mesmas colunas do conteúdo real: livre à esquerda, 320px fixos
                à direita para o cartão da Iris. */}
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-5 w-24 rounded-2xl" />
                        <Skeleton className="h-5 w-20 rounded-2xl" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-8 w-2/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>

                    {/* Hard e soft skills, cada bloco com rótulo e pílulas. */}
                    {Array.from({ length: 2 }, (_, bloco) => (
                        <div key={bloco} className="flex flex-col gap-2">
                            <Skeleton className="h-3 w-20" />
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: 4 }, (_, pilula) => (
                                    <Skeleton
                                        key={pilula}
                                        className="h-6 w-28 rounded-2xl"
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <Card className="h-fit">
                    <CardContent className="flex items-center gap-2">
                        <Skeleton className="size-7 shrink-0 rounded-full" />
                        <Skeleton className="h-5 w-40" />
                    </CardContent>
                    <CardContent className="flex flex-col gap-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col gap-4">
                <Skeleton className="h-6 w-44" />
                <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 4 }, (_, indice) => (
                        <Card key={indice} size="sm">
                            <CardContent className="flex items-center gap-3 px-(--card-spacing)">
                                <Skeleton className="size-8 shrink-0 rounded-full" />
                                <Skeleton className="h-4 flex-1" />
                                <Skeleton className="h-5 w-20 shrink-0 rounded-2xl" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

function CartaoGrafico() {
    return (
        <Card>
            <CardHeader className="flex flex-col gap-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3 w-56 max-w-full" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-56 w-full rounded-2xl" />
            </CardContent>
        </Card>
    );
}
