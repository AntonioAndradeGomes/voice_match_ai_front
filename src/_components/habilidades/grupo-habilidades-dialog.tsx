"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SkillPicker } from "@/_components/habilidades/skill-picker";
import { Button } from "@/_components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/_components/ui/dialog";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { Textarea } from "@/_components/ui/textarea";
import { getCatalogo } from "@/lib/habilidades";
import {
    salvarGrupo,
    type GrupoHabilidades,
} from "@/lib/grupos-habilidades";
import type { SkillComPeso } from "@/types";

interface GrupoHabilidadesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** `null` cria um grupo novo; preenchido, edita o existente. */
    grupo: GrupoHabilidades | null;
    onSalvo: () => void;
}

/**
 * Criação e edição de um grupo.
 *
 * O estado nasce das props no inicializador do useState, sem efeito de
 * sincronização: quem garante que ele corresponde ao grupo certo é o `key` que
 * a página passa, remontando o componente quando o alvo da edição muda.
 */
export function GrupoHabilidadesDialog({
    open,
    onOpenChange,
    grupo,
    onSalvo,
}: GrupoHabilidadesDialogProps) {
    const [nome, setNome] = useState(grupo?.nome ?? "");
    const [descricao, setDescricao] = useState(grupo?.descricao ?? "");
    const [hardSkills, setHardSkills] = useState<SkillComPeso[]>(
        grupo?.hardSkills ?? [],
    );
    const [softSkills, setSoftSkills] = useState<SkillComPeso[]>(
        grupo?.softSkills ?? [],
    );

    // Relê o catálogo a cada abertura, como o diálogo de nova vaga: editar as
    // listas logo acima nesta mesma página reflete aqui sem recarregar.
    const catalogo = useMemo(
        () => (open ? getCatalogo() : { hard: [], soft: [] }),
        [open],
    );

    const temSkill = hardSkills.length + softSkills.length > 0;
    const valido = nome.trim() !== "" && temSkill;

    function handleSalvar() {
        const salvo = salvarGrupo({
            id: grupo?.id,
            nome,
            descricao,
            hardSkills,
            softSkills,
        });

        if (!salvo) {
            toast.error("Já existe um grupo com esse nome.");
            return;
        }

        toast.success(
            grupo ? "Grupo atualizado." : `Grupo "${salvo.nome}" criado.`,
        );
        onOpenChange(false);
        onSalvo();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] flex-col p-4 sm:max-w-3xl sm:p-6">
                <DialogHeader className="shrink-0">
                    <DialogTitle>
                        {grupo ? "Editar grupo" : "Novo grupo de habilidades"}
                    </DialogTitle>
                    <DialogDescription>
                        Monte um perfil de competências com os pesos já
                        definidos. Na criação de vaga ele preenche tudo de uma
                        vez.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-1 pr-1">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="grupo-nome">Nome do grupo</Label>
                        <Input
                            id="grupo-nome"
                            placeholder="Ex.: Desenvolvedor(a) Back-end Pleno"
                            value={nome}
                            onChange={(evento) => setNome(evento.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="grupo-descricao">
                            Descrição{" "}
                            <span className="font-normal text-muted-foreground">
                                (opcional)
                            </span>
                        </Label>
                        <Textarea
                            id="grupo-descricao"
                            rows={2}
                            placeholder="Para que tipo de vaga este perfil serve."
                            value={descricao}
                            onChange={(evento) =>
                                setDescricao(evento.target.value)
                            }
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <SkillPicker
                            label="Hard skills"
                            opcoes={catalogo.hard}
                            skills={hardSkills}
                            onChange={setHardSkills}
                        />
                        <SkillPicker
                            label="Soft skills"
                            opcoes={catalogo.soft}
                            skills={softSkills}
                            onChange={setSoftSkills}
                        />
                    </div>

                    {!temSkill && (
                        <p className="text-xs text-muted-foreground">
                            Escolha ao menos uma habilidade — um grupo vazio não
                            preencheria nada na criação de vaga.
                        </p>
                    )}
                </div>

                <DialogFooter className="shrink-0">
                    <DialogClose render={<Button variant="outline" />}>
                        Cancelar
                    </DialogClose>
                    <Button onClick={handleSalvar} disabled={!valido}>
                        {grupo ? "Salvar alterações" : "Criar grupo"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
