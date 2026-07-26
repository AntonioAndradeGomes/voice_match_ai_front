"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const TOTAL_BARRAS = 24;

function formatDuracao(segundos: number) {
    const minutos = Math.floor(segundos / 60);
    const resto = Math.floor(segundos % 60);
    return `${minutos}:${String(resto).padStart(2, "0")}`;
}

// Alturas da onda derivadas de uma seed (string) — precisam parecer
// aleatórias mas ficar estáveis entre renders (sem Math.random no render).
function alturasOnda(seedTexto: string) {
    let seed = 0;
    for (let i = 0; i < seedTexto.length; i++)
        seed = (seed * 31 + seedTexto.charCodeAt(i)) >>> 0;

    return Array.from({ length: TOTAL_BARRAS }, (_, i) => {
        seed = (seed * 1103515245 + 12345) >>> 0;
        return 20 + (seed % 100) * 0.8 * (i % 5 === 0 ? 0.5 : 1);
    });
}

export interface AudioPlayerProps {
    /** URL do arquivo de áudio — de onde vier (back-end, storage, CDN...). */
    src: string;
    /** Duração mostrada antes dos metadados do áudio carregarem. */
    duracaoInicial?: number;
    /** Seed pra forma da onda ficar estável entre renders (ex.: um id). Sem
     * isso, usa a própria `src`. */
    seed?: string;
    /** Estilo pra usar sobre um fundo colorido (ex.: uma bolha azul), em vez
     * do padrão neutro. */
    onColorido?: boolean;
    className?: string;
}

// Player de áudio reutilizável: play/pause de verdade, progresso real na
// onda e duração do arquivo. Não depende de chat nem de nenhum tipo do
// domínio — só de uma URL de áudio, pra poder tocar qualquer coisa que
// venha do back-end.
export function AudioPlayer({
    src,
    duracaoInicial = 0,
    seed,
    onColorido = false,
    className,
}: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [tocando, setTocando] = useState(false);
    const [progresso, setProgresso] = useState(0);
    const [duracao, setDuracao] = useState(duracaoInicial);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        function aoAtualizarTempo() {
            if (audio && audio.duration) {
                setProgresso(audio.currentTime / audio.duration);
            }
        }
        function aoCarregarMetadados() {
            if (audio && Number.isFinite(audio.duration)) {
                setDuracao(audio.duration);
            }
        }
        function aoComecarATocar() {
            setTocando(true);

            // Só um áudio toca por vez na página — pausa qualquer outro
            // <audio> que esteja rodando, não importa onde o AudioPlayer
            // dele esteja montado.
            document.querySelectorAll("audio").forEach((outro) => {
                if (outro !== audio && !outro.paused) {
                    outro.pause();
                }
            });
        }
        function aoPausar() {
            setTocando(false);
        }
        function aoTerminar() {
            setProgresso(0);
        }

        audio.addEventListener("timeupdate", aoAtualizarTempo);
        audio.addEventListener("loadedmetadata", aoCarregarMetadados);
        audio.addEventListener("play", aoComecarATocar);
        audio.addEventListener("pause", aoPausar);
        audio.addEventListener("ended", aoTerminar);
        return () => {
            audio.removeEventListener("timeupdate", aoAtualizarTempo);
            audio.removeEventListener("loadedmetadata", aoCarregarMetadados);
            audio.removeEventListener("play", aoComecarATocar);
            audio.removeEventListener("pause", aoPausar);
            audio.removeEventListener("ended", aoTerminar);
        };
    }, []);

    function alternarReproducao() {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
            void audio.play();
        } else {
            audio.pause();
        }
    }

    const alturas = alturasOnda(seed ?? src);

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                className="hidden"
            />

            <button
                type="button"
                onClick={alternarReproducao}
                aria-label={tocando ? "Pausar áudio" : "Tocar áudio"}
                className={cn(
                    "flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors",
                    onColorido ? "bg-primary-foreground/20" : "bg-muted",
                )}
            >
                {tocando ? (
                    <Pause className="size-3 fill-current" />
                ) : (
                    <Play className="size-3 fill-current" />
                )}
            </button>

            <div className="flex h-6 flex-1 items-center gap-0.5">
                {alturas.map((altura, i) => {
                    const marcaBarra = (i + 0.5) / TOTAL_BARRAS;
                    const jaTocada = marcaBarra <= progresso;

                    return (
                        <span
                            key={i}
                            className={cn(
                                "w-0.5 rounded-full transition-colors",
                                jaTocada
                                    ? onColorido
                                        ? "bg-primary-foreground"
                                        : "bg-primary"
                                    : onColorido
                                      ? "bg-primary-foreground/50"
                                      : "bg-foreground/20",
                            )}
                            style={{ height: `${altura}%` }}
                        />
                    );
                })}
            </div>

            <span className="shrink-0 text-xs tabular-nums opacity-80">
                {formatDuracao(duracao)}
            </span>
        </div>
    );
}
