import { MensagemBubble } from "@/_components/chat/mensagem-bubble";
import { ScrollArea } from "@/_components/ui/scroll-area";
import type { MensagemChat } from "@/types";

export function ChatMensagens({ mensagens }: { mensagens: MensagemChat[] }) {
    return (
        <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-3 px-6 py-6">
                {mensagens.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">
                        Essa entrevista ainda não tem mensagens.
                    </p>
                ) : (
                    mensagens.map((mensagem, index) => (
                        <MensagemBubble
                            key={mensagem.id}
                            mensagem={mensagem}
                            index={index}
                        />
                    ))
                )}
            </div>
        </ScrollArea>
    );
}
