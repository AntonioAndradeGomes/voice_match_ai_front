"use client";

import { Briefcase, MapPin, Mic } from "lucide-react";
import { use, useEffect, useState } from "react";

import { CompartilharVaga } from "@/_components/candidatura/compartilhar-vaga";
import { FormularioCandidatura } from "@/_components/candidatura/formulario-candidatura";
import { Badge } from "@/_components/ui/badge";
import { getVagaById } from "@/lib/storage";
import { MODALIDADE_LABEL, type SkillComPeso, type Vaga } from "@/types";

function Secao({ titulo, children }: { titulo: string; children: string }) {
    return (
        <section className="flex flex-col gap-1.5">
            <h2 className="font-heading text-base font-semibold">{titulo}</h2>
            {/* `whitespace-pre-line` preserva as quebras que a pessoa digitou no
                textarea da criação da vaga. */}
            <p className="text-sm whitespace-pre-line text-muted-foreground">
                {children}
            </p>
        </section>
    );
}

function ListaDeSkills({
    titulo,
    skills,
}: {
    titulo: string;
    skills: SkillComPeso[];
}) {
    if (skills.length === 0) return null;

    return (
        <section className="flex flex-col gap-2.5">
            <h2 className="font-heading text-base font-semibold">{titulo}</h2>
            <ul className="flex flex-wrap gap-2">
                {/* Só o nome da skill. O `peso` é critério interno de avaliação
                    — mostrá-lo aqui entregaria ao candidato o gabarito de como
                    a vaga é pontuada. Ele fica na tela interna da vaga. */}
                {skills.map((skill) => (
                    <li key={skill.nome}>
                        <Badge variant="secondary">{skill.nome}</Badge>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default function CandidaturaPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [vaga, setVaga] = useState<Vaga | null>(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        getVagaById(id).then((vagaEncontrada) => {
            setVaga(vagaEncontrada);
            setCarregando(false);
        });
    }, [id]);

    return (
        <div className="h-full overflow-y-auto bg-muted/40">
            {/* Sem barra de navegação: a página é do candidato, e qualquer link
                daqui levaria para a área interna. Fica só a marca. */}
            <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 pt-8">
                <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Mic className="size-4" />
                </span>
                <span className="font-heading text-lg font-semibold tracking-tight">
                    VoiceMatch
                    <span className="text-primary">Ai</span>
                </span>
            </div>

            {carregando ? null : vaga === null ? (
                <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Briefcase className="size-5" />
                    </span>
                    <div className="flex flex-col gap-1">
                        <h1 className="font-heading text-lg font-medium">
                            Vaga não encontrada
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Esta vaga pode ter sido encerrada ou o link está
                            incorreto.
                        </p>
                    </div>
                </div>
            ) : (
                <main className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-12">
                    <div className="flex flex-col gap-8">
                        <CompartilharVaga titulo={vaga.titulo} />

                        <div className="flex flex-col gap-4">
                            <h1 className="font-heading text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
                                {vaga.titulo}
                            </h1>

                            <div className="flex w-fit items-center gap-3 rounded-2xl bg-card px-4 py-2.5 text-sm shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <MapPin className="size-4" />
                                    {MODALIDADE_LABEL[vaga.modalidade]}
                                </span>
                                {/* Vaga remota não tem localização: sem ela, o
                                    separador ficaria pendurado sozinho. */}
                                {vaga.localizacao.trim() !== "" && (
                                    <>
                                        <span
                                            aria-hidden
                                            className="h-4 w-px bg-border"
                                        />
                                        <span className="text-muted-foreground">
                                            {vaga.localizacao}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {vaga.descricao.trim() !== "" && (
                            <Secao titulo="Descrição do cargo">
                                {vaga.descricao}
                            </Secao>
                        )}

                        {vaga.experienciaPrevia.trim() !== "" && (
                            <Secao titulo="Experiência">
                                {vaga.experienciaPrevia}
                            </Secao>
                        )}

                        <ListaDeSkills
                            titulo="Habilidades técnicas"
                            skills={vaga.hardSkills}
                        />
                        <ListaDeSkills
                            titulo="Habilidades comportamentais"
                            skills={vaga.softSkills}
                        />
                    </div>

                    {/* O formulário acompanha a rolagem da descrição em telas
                        grandes; em telas pequenas ele simplesmente vem depois. */}
                    <div className="lg:sticky lg:top-20 lg:self-start">
                        <FormularioCandidatura vaga={vaga} />
                    </div>
                </main>
            )}
        </div>
    );
}
