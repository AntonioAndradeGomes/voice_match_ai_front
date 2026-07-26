import type { StatusCandidato } from "@/types";

export function ChatFooter({ status }: { status: StatusCandidato }) {
    if (status !== "finalizado") return null;

    return (
        <div className="border-t border-border px-6 py-3 text-center text-sm text-muted-foreground">
            Entrevista finalizada — veja o scorecard na página da vaga.
        </div>
    );
}
