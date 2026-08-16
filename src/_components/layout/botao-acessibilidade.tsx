"use client";

import {
    Accessibility,
    Contrast,
    Palette,
    Type,
    type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/_components/ui/popover";
import {
    aplicarPreferencias,
    lerPreferencias,
    salvarPreferencias,
    type PreferenciasAcessibilidade,
} from "@/lib/acessibilidade";

interface OpcaoProps {
    icone: LucideIcon;
    titulo: string;
    descricao: string;
    ligada: boolean;
    onAlternar: () => void;
}

// Botão com `aria-pressed` em vez do Checkbox do projeto: a linha inteira vira
// alvo de clique (área maior é o ponto do recurso) e o leitor de tela anuncia
// "ativado/desativado", que é o que a opção faz — não é um campo de formulário
// que será enviado.
function Opcao({
    icone: Icone,
    titulo,
    descricao,
    ligada,
    onAlternar,
}: OpcaoProps) {
    return (
        <button
            type="button"
            aria-pressed={ligada}
            onClick={onAlternar}
            className="group/opcao flex w-full items-center gap-3 rounded-2xl p-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30"
        >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                <Icone className="size-4" />
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-medium">{titulo}</span>
                <span className="text-xs text-muted-foreground">
                    {descricao}
                </span>
            </span>

            {/* Chavinha decorativa: quem carrega o estado é o `aria-pressed` do
                botão, então aqui é `aria-hidden` para o leitor de tela não
                anunciar a mesma coisa duas vezes. */}
            <span
                aria-hidden
                className="relative h-5 w-9 shrink-0 rounded-full bg-input transition-colors group-aria-pressed/opcao:bg-sky-600"
            >
                <span className="absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow-sm transition-transform group-aria-pressed/opcao:translate-x-4" />
            </span>
        </button>
    );
}

export function BotaoAcessibilidade() {
    // Inicializador preguiçoso lendo a mesma fonte do script do <head>: os dois
    // sempre concordam, então o estado do React já nasce igual às classes que
    // estão no <html>. Nada aqui depende do estado antes de o popover abrir, e
    // o popover só existe depois da montagem — não há divergência de hidratação.
    const [preferencias, setPreferencias] =
        useState<PreferenciasAcessibilidade>(lerPreferencias);

    function alternar(chave: keyof PreferenciasAcessibilidade) {
        const proximas = { ...preferencias, [chave]: !preferencias[chave] };
        setPreferencias(proximas);
        salvarPreferencias(proximas);
        aplicarPreferencias(proximas);
    }

    return (
        <Popover>
            {/* Meio da lateral direita, e não um dos cantos: em cima já mora o
                toggle de tema flutuante, e embaixo ficaria sobre o botão de
                gravar do chat da entrevista nas telas estreitas. */}
            <PopoverTrigger
                aria-label="Opções de acessibilidade"
                className="fixed top-1/2 right-4 z-50 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg ring-1 ring-sky-600/20 outline-none transition-colors hover:bg-sky-400 focus-visible:ring-3 focus-visible:ring-sky-500/50 aria-expanded:bg-sky-600"
            >
                <Accessibility className="size-6" />
            </PopoverTrigger>

            <PopoverContent
                side="left"
                sideOffset={12}
                className="w-80 max-w-[calc(100vw-2rem)] gap-3"
            >
                <PopoverHeader>
                    <PopoverTitle>Acessibilidade</PopoverTitle>
                    <PopoverDescription>
                        Ajustes para facilitar a leitura da tela. Ficam salvos
                        neste navegador.
                    </PopoverDescription>
                </PopoverHeader>

                <div className="flex flex-col">
                    <Opcao
                        icone={Contrast}
                        titulo="Alto contraste"
                        descricao="Cores mais fortes e bordas visíveis"
                        ligada={preferencias.altoContraste}
                        onAlternar={() => alternar("altoContraste")}
                    />
                    <Opcao
                        icone={Type}
                        titulo="Texto maior"
                        descricao="Aumenta o tamanho da letra em todo o site"
                        ligada={preferencias.textoMaior}
                        onAlternar={() => alternar("textoMaior")}
                    />
                    <Opcao
                        icone={Palette}
                        titulo="Modo daltonismo"
                        descricao="Troca o verde por azul nos status e gráficos"
                        ligada={preferencias.daltonismo}
                        onAlternar={() => alternar("daltonismo")}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}
