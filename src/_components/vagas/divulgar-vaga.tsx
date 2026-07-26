"use client";

import { useEffect, useState } from "react";

import { IconeMarca } from "@/_components/icones/marcas";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/_components/ui/tooltip";

/**
 * Formulário de criação de vaga do LinkedIn.
 *
 * PROVISÓRIO: por enquanto o botão só abre esta aba, sem levar os dados da vaga.
 * Exportar de verdade exige a Job Postings API do LinkedIn, que precisa de
 * backend, OAuth e aprovação como parceiro Talent Solutions — nada disso é
 * chamável do navegador.
 */
const LINKEDIN_PUBLICAR_VAGA = "https://www.linkedin.com/talent/post-a-job";

const ESTILO_BOTAO =
    "flex size-8 items-center justify-center rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/30 aria-disabled:pointer-events-none aria-disabled:opacity-50";

/**
 * Ações de divulgação na tela interna da vaga. Os dois botões têm a mesma
 * aparência da página pública, mas propósitos diferentes — por isso cada um
 * carrega tooltip e `aria-label` próprios:
 *
 *   WhatsApp → envia o link público da vaga para quem o recrutador quiser
 *   LinkedIn → abre o LinkedIn para o recrutador publicar a vaga lá
 */
export function DivulgarVaga({
    vagaId,
    titulo,
    // Nos cards da listagem só cabem os ícones; o rótulo "Divulgar vaga:" fica
    // para a tela de detalhe, onde há espaço. Os `aria-label` e os tooltips
    // continuam iguais nos dois casos, então nada de acessibilidade se perde.
    compacto = false,
}: {
    vagaId: string;
    titulo: string;
    compacto?: boolean;
}) {
    // A URL pública da vaga, não a da tela interna em que o recrutador está:
    // quem recebe o link tem que cair no formulário de candidatura, não na área
    // de administração. `window.origin` só existe no cliente.
    const [urlPublica, setUrlPublica] = useState("");

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUrlPublica(`${window.location.origin}/candidatura/${vagaId}`);
    }, [vagaId]);

    const linkWhatsapp = urlPublica
        ? `https://wa.me/?text=${encodeURIComponent(`${titulo} — ${urlPublica}`)}`
        : undefined;

    return (
        <div className="flex items-center gap-3">
            {!compacto && (
                <span className="text-sm text-muted-foreground">
                    Divulgar vaga:
                </span>
            )}

            <ul className="flex items-center gap-2">
                <li>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <a
                                    href={linkWhatsapp}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Enviar o link da vaga no WhatsApp"
                                    // Desabilitado até a URL existir (primeiro
                                    // render no cliente), senão o link abriria vazio.
                                    aria-disabled={urlPublica === ""}
                                    className={ESTILO_BOTAO}
                                >
                                    <IconeMarca marca="whatsapp" />
                                </a>
                            }
                        />
                        <TooltipContent>Enviar link no WhatsApp</TooltipContent>
                    </Tooltip>
                </li>

                <li>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <a
                                    href={LINKEDIN_PUBLICAR_VAGA}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Abrir o LinkedIn para publicar a vaga"
                                    className={ESTILO_BOTAO}
                                >
                                    <IconeMarca marca="linkedin" />
                                </a>
                            }
                        />
                        <TooltipContent>Publicar no LinkedIn</TooltipContent>
                    </Tooltip>
                </li>
            </ul>
        </div>
    );
}
