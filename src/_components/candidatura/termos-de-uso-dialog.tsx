"use client";

import { ArrowDown, Check } from "lucide-react";
import { useCallback, useState } from "react";

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
import {
    SECOES_TERMOS,
    TERMOS_ATUALIZADO_EM,
    TERMOS_VERSAO,
} from "@/lib/termos-de-uso";

/**
 * Folga em pixels para considerar que a leitura chegou ao fim.
 *
 * Zero não serve: com zoom do navegador, densidade de tela fracionária ou
 * rolagem por trackpad, `scrollTop + clientHeight` costuma parar um ou dois
 * pixels antes de `scrollHeight`, e o aceite nunca liberaria.
 */
const TOLERANCIA_FIM = 24;

interface TermosDeUsoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Chamado quando a pessoa leu até o fim e confirmou o aceite. */
    onAceitar: () => void;
}

export function TermosDeUsoDialog({
    open,
    onOpenChange,
    onAceitar,
}: TermosDeUsoDialogProps) {
    const [chegouAoFim, setChegouAoFim] = useState(false);

    function noFim(elemento: HTMLElement) {
        return (
            elemento.scrollHeight - elemento.scrollTop - elemento.clientHeight <=
            TOLERANCIA_FIM
        );
    }

    // Ref callback, e não efeito: numa tela alta ou com zoom reduzido o texto
    // inteiro cabe sem barra de rolagem, e aí o evento de scroll nunca dispara
    // — sem esta medição na montagem, o aceite ficaria travado para sempre com
    // o documento todo à vista.
    const medirNaAbertura = useCallback((node: HTMLDivElement | null) => {
        if (node && noFim(node)) setChegouAoFim(true);
    }, []);

    function handleAceitar() {
        onAceitar();
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[85vh] flex-col p-4 sm:max-w-2xl sm:p-6">
                <DialogHeader className="shrink-0">
                    <DialogTitle>Termos de Uso</DialogTitle>
                    <DialogDescription>
                        Versão {TERMOS_VERSAO} · atualizada em{" "}
                        {TERMOS_ATUALIZADO_EM}. Leia o documento inteiro para
                        liberar o aceite.
                    </DialogDescription>
                </DialogHeader>

                {/* `tabIndex` para quem navega por teclado conseguir focar a
                    área e rolar com as setas — sem isso o único caminho até o
                    fim do texto seria o mouse, e o aceite ficaria inalcançável. */}
                <div
                    ref={medirNaAbertura}
                    onScroll={(evento) => {
                        if (noFim(evento.currentTarget)) setChegouAoFim(true);
                    }}
                    tabIndex={0}
                    role="region"
                    aria-label="Texto dos termos de uso"
                    className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-muted/20 p-4 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                    {SECOES_TERMOS.map((secao) => (
                        <section key={secao.titulo} className="flex flex-col gap-1.5">
                            <h3 className="font-heading font-medium">
                                {secao.titulo}
                            </h3>
                            {secao.paragrafos.map((paragrafo) => (
                                <p
                                    key={paragrafo.slice(0, 40)}
                                    className="leading-relaxed text-muted-foreground"
                                >
                                    {paragrafo}
                                </p>
                            ))}
                        </section>
                    ))}

                    <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                        Fim do documento.
                    </p>
                </div>

                <DialogFooter className="shrink-0 sm:items-center sm:justify-between">
                    {/* O aviso substitui a explicação que faltaria num botão
                        desabilitado sem motivo aparente. */}
                    <span
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        aria-live="polite"
                    >
                        {chegouAoFim ? (
                            <>
                                <Check className="size-3.5" />
                                Leitura concluída.
                            </>
                        ) : (
                            <>
                                {/* A seta continua: ela indica que há texto
                                    abaixo, o que ajuda de verdade. Quem some é
                                    a instrução para rolar — o pedido é ler. */}
                                <ArrowDown className="size-3.5" />
                                Continue a leitura para liberar o aceite.
                            </>
                        )}
                    </span>

                    <div className="flex gap-2">
                        <DialogClose render={<Button variant="outline" />}>
                            Fechar
                        </DialogClose>
                        <Button onClick={handleAceitar} disabled={!chegouAoFim}>
                            Li e aceito
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
