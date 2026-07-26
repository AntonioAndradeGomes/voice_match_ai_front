"use client";

import { use } from "react";

import { ChatConversa } from "@/_components/chat/chat-conversa";

export default function VagaCandidatoChatPage({
    params,
}: {
    params: Promise<{ id: string; candidatoId: string }>;
}) {
    const { id, candidatoId } = use(params);

    return <ChatConversa vagaId={id} candidatoId={candidatoId} />;
}
