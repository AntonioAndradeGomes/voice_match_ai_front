"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Square, Send, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/_components/ui/button";
import { enviarAudioResposta } from "@/lib/chat";
import type { StatusCandidato } from "@/types";

interface ChatFooterProps {
    status: StatusCandidato;
    perguntaAtualId?: string;
    onRespostaEnviada?: () => void;
}

export function ChatFooter({
    status,
    perguntaAtualId,
    onRespostaEnviada,
}: ChatFooterProps) {
    const [gravando, setGravando] = useState(false);
    const [tempoSegundos, setTempoSegundos] = useState(0);
    const [enviando, setEnviando] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    if (status === "finalizado") {
        return (
            <div className="border-t border-border px-6 py-3.5 text-center text-sm text-muted-foreground bg-muted/20">
                Entrevista finalizada — veja o scorecard na página da vaga.
            </div>
        );
    }

    async function iniciarGravacao() {
        try {
            audioChunksRef.current = [];
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, {
                    type: mediaRecorder.mimeType || "audio/webm",
                });
                setAudioBlob(blob);
            };

            mediaRecorder.start();
            setGravando(true);
            setTempoSegundos(0);

            timerRef.current = setInterval(() => {
                setTempoSegundos((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Erro ao acessar microfone:", err);
            toast.error("Permissão de microfone negada ou indisponível.");
        }
    }

    function pararGravacao() {
        if (mediaRecorderRef.current && gravando) {
            mediaRecorderRef.current.stop();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
            setGravando(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }

    function cancelarGravacao() {
        pararGravacao();
        setAudioBlob(null);
        setTempoSegundos(0);
    }

    async function handleEnviarAudio(blobParaEnviar?: Blob) {
        const targetBlob = blobParaEnviar || audioBlob;

        if (!perguntaAtualId) {
            toast.error("Nenhuma pergunta ativa aguardando resposta.");
            return;
        }

        if (!targetBlob) {
            toast.error("Nenhum áudio gravado para enviar.");
            return;
        }

        setEnviando(true);
        try {
            const ok = await enviarAudioResposta(perguntaAtualId, targetBlob);
            if (ok) {
                toast.success("Resposta por áudio enviada com sucesso!");
                setAudioBlob(null);
                setTempoSegundos(0);
                if (onRespostaEnviada) onRespostaEnviada();
            } else {
                toast.error("Falha ao enviar resposta por áudio.");
            }
        } finally {
            setEnviando(false);
        }
    }

    async function concluirEEnviar() {
        if (gravando && mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(audioChunksRef.current, {
                    type: mediaRecorderRef.current?.mimeType || "audio/webm",
                });
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                }
                setGravando(false);
                if (timerRef.current) clearInterval(timerRef.current);
                await handleEnviarAudio(blob);
            };
            mediaRecorderRef.current.stop();
        } else if (audioBlob) {
            await handleEnviarAudio();
        }
    }

    function formatarTempo(segundos: number): string {
        const min = Math.floor(segundos / 60);
        const seg = segundos % 60;
        return `${min.toString().padStart(2, "0")}:${seg.toString().padStart(2, "0")}`;
    }

    return (
        <div className="border-t border-border p-4 bg-background">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-2xl border border-border bg-card p-3 shadow-sm">
                {enviando ? (
                    <div className="flex w-full items-center justify-center gap-3 py-2 text-sm text-primary">
                        <Loader2 className="size-5 animate-spin" />
                        <span>Enviando áudio e analisando prosódia com IA...</span>
                    </div>
                ) : gravando ? (
                    <div className="flex w-full items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="relative flex size-3">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex size-3 rounded-full bg-red-500"></span>
                            </span>
                            <span className="font-mono text-sm font-semibold text-foreground">
                                Gravando {formatarTempo(tempoSegundos)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelarGravacao}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="mr-1.5 size-4" />
                                Cancelar
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={concluirEEnviar}
                                className="gap-1.5 bg-primary font-medium"
                            >
                                <Send className="size-4" />
                                Enviar Resposta
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex w-full items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mic className="size-4 text-primary" />
                            <span>Grave sua resposta por áudio para continuar a entrevista</span>
                        </div>

                        <Button
                            onClick={iniciarGravacao}
                            className="gap-2 font-medium"
                            size="default"
                        >
                            <Mic className="size-4" />
                            Iniciar Gravação
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
