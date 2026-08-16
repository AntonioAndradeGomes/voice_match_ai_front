"use client";

import { XIcon } from "lucide-react";

import { Label } from "@/_components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/_components/ui/select";
import { Slider } from "@/_components/ui/slider";
import { PESO_MAXIMO, PESO_MINIMO } from "@/lib/grupos-habilidades";
import type { SkillComPeso } from "@/types";

/** Peso de partida de uma skill recém-escolhida: o meio da faixa. */
export const PESO_INICIAL = 5;

interface SkillPickerProps {
    label: string;
    /** Nomes do catálogo (ver lib/habilidades.ts). Os já escolhidos somem. */
    opcoes: string[];
    skills: SkillComPeso[];
    onChange: (skills: SkillComPeso[]) => void;
    mensagemVazio?: string;
}

/**
 * Seleção de skills com peso. Nasceu dentro do diálogo de nova vaga e saiu de
 * lá quando os grupos de habilidades passaram a precisar do mesmo editor — o
 * grupo é, por definição, o mesmo conjunto de skills com peso, só que salvo
 * para reusar.
 */
export function SkillPicker({
    label,
    opcoes,
    skills,
    onChange,
    mensagemVazio = "Nenhuma skill selecionada.",
}: SkillPickerProps) {
    const opcoesDisponiveis = opcoes.filter(
        (opcao) => !skills.some((skill) => skill.nome === opcao),
    );

    function adicionarSkill(nome: string) {
        onChange([...skills, { nome, peso: PESO_INICIAL }]);
    }

    function removerSkill(nome: string) {
        onChange(skills.filter((skill) => skill.nome !== nome));
    }

    function atualizarPeso(nome: string, peso: number) {
        onChange(
            skills.map((skill) =>
                skill.nome === nome ? { ...skill, peso } : skill,
            ),
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <Label>{label}</Label>
            <div className="flex flex-col gap-3 rounded-2xl border border-border p-3">
                {skills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {mensagemVazio}
                    </p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {skills.map((skill) => (
                            <div
                                key={skill.nome}
                                className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
                            >
                                <span className="min-w-32 flex-1 truncate text-sm">
                                    {skill.nome}
                                </span>
                                <div className="flex shrink-0 items-center gap-2">
                                    <div className="w-20">
                                        <Slider
                                            min={PESO_MINIMO}
                                            max={PESO_MAXIMO}
                                            step={1}
                                            value={[skill.peso]}
                                            onValueChange={(value) =>
                                                atualizarPeso(
                                                    skill.nome,
                                                    Array.isArray(value)
                                                        ? value[0]
                                                        : value,
                                                )
                                            }
                                        />
                                    </div>
                                    <span className="w-5 shrink-0 text-right text-xs text-muted-foreground">
                                        {skill.peso}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removerSkill(skill.nome)}
                                        className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-foreground/10"
                                        aria-label={`Remover ${skill.nome}`}
                                    >
                                        <XIcon className="size-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Select
                    value={null}
                    onValueChange={(value) => {
                        if (value) adicionarSkill(String(value));
                    }}
                    disabled={opcoesDisponiveis.length === 0}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Adicionar skill..." />
                    </SelectTrigger>
                    <SelectContent>
                        {opcoesDisponiveis.map((opcao) => (
                            <SelectItem key={opcao} value={opcao}>
                                {opcao}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
