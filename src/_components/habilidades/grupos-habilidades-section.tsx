"use client";

import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { GrupoHabilidadesDialog } from "@/_components/habilidades/grupo-habilidades-dialog";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import { Card, CardContent } from "@/_components/ui/card";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/_components/ui/dialog";
import {
    getGrupos,
    removerGrupo,
    totalSkills,
    type GrupoHabilidades,
} from "@/lib/grupos-habilidades";
import type { SkillComPeso } from "@/types";

/** Quantas skills aparecem no cartão antes de virar "+N". */
const CHIPS_VISIVEIS = 6;

function ChipsSkills({
    titulo,
    skills,
}: {
    titulo: string;
    skills: SkillComPeso[];
}) {
    if (skills.length === 0) return null;

    const visiveis = skills.slice(0, CHIPS_VISIVEIS);
    const restantes = skills.length - visiveis.length;

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{titulo}</span>
            {visiveis.map((skill) => (
                <Badge key={skill.nome} variant="outline">
                    {skill.nome}
                    <span className="ml-1 text-muted-foreground tabular-nums">
                        {skill.peso}
                    </span>
                </Badge>
            ))}
            {restantes > 0 && (
                <span className="text-xs text-muted-foreground">
                    +{restantes}
                </span>
            )}
        </div>
    );
}

export function GruposHabilidadesSection() {
    // `null` = ainda não li o storage. A leitura sai do primeiro render de
    // propósito: no servidor não há localStorage, e devolver a lista cheia já
    // na montagem faria o HTML do servidor divergir do cliente.
    const [grupos, setGrupos] = useState<GrupoHabilidades[] | null>(null);
    const [editando, setEditando] = useState<GrupoHabilidades | null>(null);
    const [dialogAberto, setDialogAberto] = useState(false);
    const [paraExcluir, setParaExcluir] = useState<GrupoHabilidades | null>(
        null,
    );

    useEffect(() => {
        Promise.resolve(getGrupos()).then(setGrupos);
    }, []);

    function abrirNovo() {
        setEditando(null);
        setDialogAberto(true);
    }

    function abrirEdicao(grupo: GrupoHabilidades) {
        setEditando(grupo);
        setDialogAberto(true);
    }

    function confirmarExclusao() {
        if (!paraExcluir) return;
        setGrupos(removerGrupo(paraExcluir.id));
        toast.success(`Grupo "${paraExcluir.nome}" excluído.`);
        setParaExcluir(null);
    }

    const lista = grupos ?? [];

    return (
        <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="font-heading text-lg font-medium">
                        Grupos de habilidades
                    </h2>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        Templates de perfil com as competências e os pesos já
                        definidos. Na criação de vaga, escolher um grupo
                        preenche hard e soft skills de uma vez — menos cliques e
                        requisitos padronizados entre vagas parecidas.
                    </p>
                </div>

                <Button
                    size="lg"
                    className="h-10 shrink-0 rounded-xl"
                    onClick={abrirNovo}
                >
                    <Plus data-icon="inline-start" />
                    Novo grupo
                </Button>
            </div>

            {grupos !== null && lista.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                        <Layers className="size-8 text-muted-foreground" />
                        <span className="font-medium">
                            Nenhum grupo criado ainda
                        </span>
                        <span className="max-w-md text-sm text-muted-foreground">
                            Monte o primeiro a partir de uma vaga que você
                            costuma repetir — por exemplo &ldquo;Analista de
                            dados&rdquo; ou &ldquo;Atendimento&rdquo;.
                        </span>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {lista.map((grupo) => (
                        <Card key={grupo.id} size="sm">
                            <CardContent className="flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 flex-col gap-0.5">
                                        <span className="truncate font-medium">
                                            {grupo.nome}
                                        </span>
                                        {grupo.descricao && (
                                            <span className="text-xs text-muted-foreground">
                                                {grupo.descricao}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                        <Badge variant="secondary">
                                            {totalSkills(grupo)}{" "}
                                            {totalSkills(grupo) === 1
                                                ? "skill"
                                                : "skills"}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label={`Editar ${grupo.nome}`}
                                            onClick={() => abrirEdicao(grupo)}
                                        >
                                            <Pencil />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label={`Excluir ${grupo.nome}`}
                                            onClick={() =>
                                                setParaExcluir(grupo)
                                            }
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <ChipsSkills
                                        titulo="Hard"
                                        skills={grupo.hardSkills}
                                    />
                                    <ChipsSkills
                                        titulo="Soft"
                                        skills={grupo.softSkills}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* `key` no alvo da edição: remonta o diálogo ao trocar de grupo,
                que é o que deixa o estado dele nascer das props sem efeito de
                sincronização. */}
            <GrupoHabilidadesDialog
                key={editando?.id ?? "novo"}
                open={dialogAberto}
                onOpenChange={setDialogAberto}
                grupo={editando}
                onSalvo={() => setGrupos(getGrupos())}
            />

            <Dialog
                open={paraExcluir !== null}
                onOpenChange={(aberto) => {
                    if (!aberto) setParaExcluir(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir grupo</DialogTitle>
                        <DialogDescription>
                            &ldquo;{paraExcluir?.nome}&rdquo; será removido.
                            Vagas já criadas com ele não mudam — o grupo só
                            serve para preencher o formulário.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose render={<Button variant="outline" />}>
                            Cancelar
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={confirmarExclusao}
                        >
                            <Trash2 data-icon="inline-start" />
                            Excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}
