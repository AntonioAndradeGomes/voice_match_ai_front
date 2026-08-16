"use client";

import { Plus, RotateCcw, Sparkles, Wrench, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { ScrollArea } from "@/_components/ui/scroll-area";
import {
    adicionarHabilidade,
    fetchCatalogoAPI,
    getCatalogo,
    removerHabilidade,
    restaurarPadrao,
    type CatalogoHabilidades,
    type TipoHabilidade,
} from "@/lib/habilidades";

function ListaHabilidades({
    tipo,
    titulo,
    descricao,
    icone,
    itens,
    onAdicionar,
    onRemover,
}: {
    tipo: TipoHabilidade;
    titulo: string;
    descricao: string;
    icone: React.ReactNode;
    itens: string[];
    onAdicionar: (tipo: TipoHabilidade, nome: string) => void;
    onRemover: (tipo: TipoHabilidade, nome: string) => void;
}) {
    const [novo, setNovo] = useState("");

    function submeter(evento: React.FormEvent) {
        evento.preventDefault();
        onAdicionar(tipo, novo);
        setNovo("");
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {icone}
                    {titulo}
                    <Badge variant="secondary" className="ml-auto">
                        {itens.length}
                    </Badge>
                </CardTitle>
                <CardDescription>{descricao}</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                {/* `form` de verdade, e não só um onClick no botão: assim o
                    Enter dentro do campo também adiciona, que é como se espera
                    digitar vários itens em sequência. */}
                <form onSubmit={submeter} className="flex gap-2">
                    <Input
                        value={novo}
                        onChange={(evento) => setNovo(evento.target.value)}
                        placeholder={`Nova ${titulo.toLowerCase()}`}
                        aria-label={`Adicionar ${titulo.toLowerCase()}`}
                        className="h-10 rounded-xl"
                    />
                    <Button
                        type="submit"
                        size="lg"
                        className="h-10 shrink-0 rounded-xl"
                        disabled={novo.trim().length === 0}
                    >
                        <Plus data-icon="inline-start" />
                        Adicionar
                    </Button>
                </form>

                {itens.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nenhuma habilidade nesta lista. As vagas novas vão ficar
                        sem sugestões deste tipo.
                    </p>
                ) : (
                    <ul className="flex flex-wrap gap-2">
                        {itens.map((item) => (
                            <li key={item}>
                                <span className="inline-flex items-center gap-1 rounded-2xl border border-border py-1 pr-1 pl-3 text-sm">
                                    {item}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-xs"
                                        aria-label={`Remover ${item}`}
                                        onClick={() => onRemover(tipo, item)}
                                        className="text-muted-foreground"
                                    >
                                        <X />
                                    </Button>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

export default function ConfiguracoesPage() {
    const [catalogo, setCatalogo] = useState<CatalogoHabilidades>(getCatalogo);

    useEffect(() => {
        fetchCatalogoAPI().then((cat) => {
            if (cat) setCatalogo(cat);
        });
    }, []);

    function handleAdicionar(tipo: TipoHabilidade, nome: string) {
        const atualizado = adicionarHabilidade(tipo, nome);
        if (!atualizado) {
            toast.error("Essa habilidade já está na lista.");
            return;
        }
        setCatalogo(atualizado);
        toast.success(`"${nome.trim()}" adicionada.`);
    }

    function handleRemover(tipo: TipoHabilidade, nome: string) {
        setCatalogo(removerHabilidade(tipo, nome));
        toast.success(`"${nome}" removida.`);
    }

    function handleRestaurar() {
        setCatalogo(restaurarPadrao());
        toast.success("Listas restauradas para o padrão.");
    }

    return (
        <ScrollArea className="h-full">
            <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Configurações
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Ajuste o comportamento do VoiceMatchAi para a sua
                            operação.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        size="lg"
                        className="h-10 rounded-xl"
                        onClick={handleRestaurar}
                    >
                        <RotateCcw data-icon="inline-start" />
                        Restaurar padrão
                    </Button>
                </header>

                <section className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="font-heading text-lg font-medium">
                            Gestão de habilidades
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Estas listas alimentam as sugestões de hard e soft
                            skills na criação de vaga. Vagas já criadas guardam
                            o nome da habilidade, então remover uma daqui não
                            altera nenhuma vaga existente.
                        </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <ListaHabilidades
                            tipo="hard"
                            titulo="Hard skills"
                            descricao="Competências técnicas, verificáveis por prova ou experiência."
                            icone={<Wrench className="size-4 text-primary" />}
                            itens={catalogo.hard}
                            onAdicionar={handleAdicionar}
                            onRemover={handleRemover}
                        />

                        <ListaHabilidades
                            tipo="soft"
                            titulo="Soft skills"
                            descricao="Competências comportamentais, avaliadas pela Iris na entrevista."
                            icone={<Sparkles className="size-4 text-primary" />}
                            itens={catalogo.soft}
                            onAdicionar={handleAdicionar}
                            onRemover={handleRemover}
                        />
                    </div>
                </section>
            </div>
        </ScrollArea>
    );
}
