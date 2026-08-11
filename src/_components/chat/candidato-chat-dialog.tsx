"use client";

import { ChatConversa } from "@/_components/chat/chat-conversa";
import { Dialog, DialogContent } from "@/_components/ui/dialog";

// Aberto a partir de "Ver chat" no CandidatoDetalheModal. Sobrescreve o
// tamanho/padding padrão do DialogContent porque o ChatConversa já vem com
// seu próprio header/scroll/footer (px/py próprios) — um p-6 extra em volta
// duplicaria o respiro e cortaria a altura disponível pras mensagens.
export function CandidatoChatDialog({
    vagaId,
    candidatoId,
    open,
    onOpenChange,
}: {
    vagaId: string;
    candidatoId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="h-[85vh] w-full max-w-3xl gap-0 overflow-hidden p-0 sm:max-w-3xl">
                {candidatoId && (
                    <ChatConversa vagaId={vagaId} candidatoId={candidatoId} />
                )}
            </DialogContent>
        </Dialog>
    );
}
