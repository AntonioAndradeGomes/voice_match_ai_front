"use client";

import { use } from "react";

import { ChatConversa } from "@/_components/chat/chat-conversa";

export default function ChatPage({
    params,
}: {
    params: Promise<{ vagaId: string; candidatoId: string }>;
}) {
    const { vagaId, candidatoId } = use(params);

    return <ChatConversa vagaId={vagaId} candidatoId={candidatoId} />;
}
