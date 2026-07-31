"use client";

import { XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/_components/ui/select";
import { Slider } from "@/_components/ui/slider";
import { Textarea } from "@/_components/ui/textarea";
import { saveVaga } from "@/lib/storage";
import {
    criarPerfilNeutro,
    MODALIDADE_LABEL,
    MODALIDADES,
    type Modalidade,
    type SkillComPeso,
    type Vaga,
} from "@/types";

const HARD_SKILLS_DISPONIVEIS = [
    "Excel avançado",
    "SQL",
    "Inglês avançado",
    "Gestão de projetos",
    "CRM (Salesforce/HubSpot)",
    "Copywriting",
    "SEO",
    "Análise de dados",
    "Programação (JavaScript/Python)",
    "Design gráfico",
    "Contabilidade",
    "Recrutamento e seleção",
    "Atendimento ao cliente",
    "Negociação comercial",
    "Edição de vídeo",
    "Marketing digital",
    "Gestão financeira",
    "Power BI",
    "Vendas B2B",
];

const SOFT_SKILLS_DISPONIVEIS = [
    "Comunicação",
    "Trabalho em equipe",
    "Proatividade",
    "Resiliência",
    "Liderança",
    "Adaptabilidade",
    "Pensamento crítico",
    "Organização",
    "Empatia",
    "Criatividade",
    "Autonomia",
    "Foco em resultado",
    "Inteligência emocional",
    "Gestão do tempo",
];

const NIVEIS_EXPERIENCIA = ["1 a 2 anos", "3 a 5 anos", "Mais de 5 anos"];

const PESO_INICIAL = 5;

const CAMPOS_INICIAIS = {
    titulo: "",
    descricao: "",
    hardSkills: [] as SkillComPeso[],
    softSkills: [] as SkillComPeso[],
    experienciaPrevia: "",
    modalidade: "" as Modalidade | "",
    localizacao: "",
};

interface NovaVagaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onVagaCriada: () => void;
}

interface SkillPickerProps {
    label: string;
    opcoes: string[];
    skills: SkillComPeso[];
    onChange: (skills: SkillComPeso[]) => void;
}

function SkillPicker({ label, opcoes, skills, onChange }: SkillPickerProps) {
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
                        Nenhuma skill selecionada.
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
                                            min={1}
                                            max={10}
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
                                        onClick={() =>
                                            removerSkill(skill.nome)
                                        }
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

export function NovaVagaDialog({
    open,
    onOpenChange,
    onVagaCriada,
}: NovaVagaDialogProps) {
    const [campos, setCampos] = useState(CAMPOS_INICIAIS);

    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen);
        if (!nextOpen) {
            setCampos(CAMPOS_INICIAIS);
        }
    }

    const valido = campos.titulo.trim() !== "" && campos.modalidade !== "";

    function handleSalvar() {
        (async () => {
            if (!valido) return;

            const vaga: Vaga = {
                id: crypto.randomUUID(),
                titulo: campos.titulo.trim(),
                descricao: campos.descricao.trim(),
                hardSkills: campos.hardSkills,
                softSkills: campos.softSkills,
                experienciaPrevia: campos.experienciaPrevia,
                modalidade: campos.modalidade as Modalidade,
                localizacao:
                    campos.modalidade === "remoto"
                        ? ""
                        : campos.localizacao.trim(),
                perfilIdeal: criarPerfilNeutro(),
                createdAt: new Date().toISOString(),
            };

            await saveVaga(vaga);
            toast.success("Vaga criada com sucesso", { description: vaga.titulo });
            handleOpenChange(false);
            onVagaCriada();
        })();
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[85vh] flex-col p-4 sm:max-w-6xl sm:p-6">
                <DialogHeader className="shrink-0">
                    <DialogTitle>Nova vaga</DialogTitle>
                    <DialogDescription>
                        Descreva a vaga, escolha as skills e o peso de cada
                        uma. A Iris usa isso para conduzir e avaliar as
                        entrevistas.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-1 pr-1">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="flex flex-col gap-2 sm:col-span-2">
                            <Label htmlFor="titulo">Título</Label>
                            <Input
                                id="titulo"
                                placeholder="Ex.: Desenvolvedor(a) Front-end Pleno"
                                value={campos.titulo}
                                onChange={(event) =>
                                    setCampos((prev) => ({
                                        ...prev,
                                        titulo: event.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="modalidade">Modalidade</Label>
                            <Select
                                value={campos.modalidade || undefined}
                                onValueChange={(value) =>
                                    setCampos((prev) => ({
                                        ...prev,
                                        modalidade: value as Modalidade,
                                        localizacao:
                                            value === "remoto"
                                                ? ""
                                                : prev.localizacao,
                                    }))
                                }
                            >
                                <SelectTrigger
                                    id="modalidade"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Selecione a modalidade" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MODALIDADES.map((modalidade) => (
                                        <SelectItem
                                            key={modalidade}
                                            value={modalidade}
                                        >
                                            {MODALIDADE_LABEL[modalidade]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="flex flex-col gap-2 sm:col-span-2">
                            <Label htmlFor="descricao">Descrição</Label>
                            <Textarea
                                id="descricao"
                                rows={3}
                                placeholder="Descreva o contexto da vaga, principais responsabilidades e o que se espera do candidato ideal."
                                value={campos.descricao}
                                onChange={(event) =>
                                    setCampos((prev) => ({
                                        ...prev,
                                        descricao: event.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="flex flex-col gap-4">
                            {campos.modalidade !== "remoto" && (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="localizacao">
                                        Localização
                                    </Label>
                                    <Input
                                        id="localizacao"
                                        placeholder="Ex.: São Paulo, SP"
                                        value={campos.localizacao}
                                        onChange={(event) =>
                                            setCampos((prev) => ({
                                                ...prev,
                                                localizacao:
                                                    event.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="experiencia">
                                    Experiência prévia
                                </Label>
                                <Select
                                    value={
                                        campos.experienciaPrevia || undefined
                                    }
                                    onValueChange={(value) =>
                                        setCampos((prev) => ({
                                            ...prev,
                                            experienciaPrevia: String(value),
                                        }))
                                    }
                                >
                                    <SelectTrigger
                                        id="experiencia"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Selecione o nível" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {NIVEIS_EXPERIENCIA.map((nivel) => (
                                            <SelectItem
                                                key={nivel}
                                                value={nivel}
                                            >
                                                {nivel}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <SkillPicker
                            label="Hard skills"
                            opcoes={HARD_SKILLS_DISPONIVEIS}
                            skills={campos.hardSkills}
                            onChange={(hardSkills) =>
                                setCampos((prev) => ({ ...prev, hardSkills }))
                            }
                        />

                        <SkillPicker
                            label="Soft skills"
                            opcoes={SOFT_SKILLS_DISPONIVEIS}
                            skills={campos.softSkills}
                            onChange={(softSkills) =>
                                setCampos((prev) => ({ ...prev, softSkills }))
                            }
                        />
                    </div>
                </div>

                <DialogFooter className="shrink-0">
                    <DialogClose render={<Button variant="outline" />}>
                        Cancelar
                    </DialogClose>
                    <Button onClick={handleSalvar} disabled={!valido}>
                        Criar vaga
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
