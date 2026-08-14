"use client";

import { Search, X } from "lucide-react";

import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { cn } from "@/lib/utils";
import {
    MODALIDADE_LABEL,
    MODALIDADES,
    type Candidato,
    type Modalidade,
    type Vaga,
} from "@/types";

export type FiltroModalidade = Modalidade | "todas";
export type FiltroSituacao = "todas" | "com_candidatos" | "sem_candidatos";

export interface FiltrosVagas {
    busca: string;
    modalidade: FiltroModalidade;
    situacao: FiltroSituacao;
}

export const FILTROS_INICIAIS: FiltrosVagas = {
    busca: "",
    modalidade: "todas",
    situacao: "todas",
};

const SITUACAO_LABEL: Record<FiltroSituacao, string> = {
    todas: "Todas",
    com_candidatos: "Com candidatos",
    sem_candidatos: "Sem candidatos",
};

/** Ignora caixa e acento: buscar "grafico" precisa achar "Design Gráfico". */
function normalizar(texto: string) {
    return texto
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
}

export function filtrosAtivos(filtros: FiltrosVagas) {
    return (
        filtros.busca.trim() !== "" ||
        filtros.modalidade !== "todas" ||
        filtros.situacao !== "todas"
    );
}

/**
 * Filtragem pura, fora do componente para a página poder usá-la em useMemo e
 * para o comportamento ficar testável sem montar UI.
 *
 * A busca cobre título, descrição e o nome das skills — o recrutador tende a
 * procurar pela competência ("SQL") e não só pelo nome da vaga.
 */
export function filtrarVagas(
    vagas: Vaga[],
    candidatosPorVaga: Record<string, Candidato[]>,
    filtros: FiltrosVagas,
): Vaga[] {
    const termo = normalizar(filtros.busca.trim());

    return vagas.filter((vaga) => {
        if (filtros.modalidade !== "todas" && vaga.modalidade !== filtros.modalidade) {
            return false;
        }

        if (filtros.situacao !== "todas") {
            const total = (candidatosPorVaga[vaga.id] ?? []).length;
            if (filtros.situacao === "com_candidatos" && total === 0) return false;
            if (filtros.situacao === "sem_candidatos" && total > 0) return false;
        }

        if (termo === "") return true;

        const alvo = normalizar(
            [
                vaga.titulo,
                vaga.descricao,
                vaga.localizacao,
                vaga.experienciaPrevia,
                ...vaga.hardSkills.map((skill) => skill.nome),
                ...vaga.softSkills.map((skill) => skill.nome),
            ].join(" "),
        );

        return alvo.includes(termo);
    });
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

export function FiltrosVagasBarra({
    filtros,
    onChange,
    totalFiltrado,
    totalGeral,
}: {
    filtros: FiltrosVagas;
    onChange: (filtros: FiltrosVagas) => void;
    totalFiltrado: number;
    totalGeral: number;
}) {
    const temFiltro = filtrosAtivos(filtros);

    return (
        <div className="flex flex-col gap-3">
            <div className="relative">
                <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    value={filtros.busca}
                    onChange={(evento) =>
                        onChange({ ...filtros, busca: evento.target.value })
                    }
                    placeholder="Buscar por título, descrição ou habilidade..."
                    aria-label="Buscar vagas"
                    className="h-11 rounded-xl pr-4 pl-10"
                />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs text-muted-foreground">
                        Modalidade
                    </span>
                    <Chip
                        ativo={filtros.modalidade === "todas"}
                        onClick={() => onChange({ ...filtros, modalidade: "todas" })}
                    >
                        Todas
                    </Chip>
                    {MODALIDADES.map((modalidade) => (
                        <Chip
                            key={modalidade}
                            ativo={filtros.modalidade === modalidade}
                            onClick={() => onChange({ ...filtros, modalidade })}
                        >
                            {MODALIDADE_LABEL[modalidade]}
                        </Chip>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs text-muted-foreground">
                        Candidatos
                    </span>
                    {(
                        Object.keys(SITUACAO_LABEL) as FiltroSituacao[]
                    ).map((situacao) => (
                        <Chip
                            key={situacao}
                            ativo={filtros.situacao === situacao}
                            onClick={() => onChange({ ...filtros, situacao })}
                        >
                            {SITUACAO_LABEL[situacao]}
                        </Chip>
                    ))}
                </div>

                {/* Só aparece com filtro ativo: um "limpar" permanente vira
                    ruído numa tela que na maior parte do tempo está sem filtro. */}
                {temFiltro && (
                    <div className="ml-auto flex items-center gap-2">
                        <Badge variant="secondary">
                            {totalFiltrado} de {totalGeral}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onChange(FILTROS_INICIAIS)}
                        >
                            <X data-icon="inline-start" />
                            Limpar
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
