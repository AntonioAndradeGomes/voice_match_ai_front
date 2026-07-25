import type { Candidato } from "@/types";

export interface ResumoVagaBadge {
    label: string;
    variant: "default" | "secondary" | "outline";
}

// Deriva o badge de status da vaga a partir dos status reais dos candidatos —
// nunca um valor fixo.
export function getResumoVagaBadge(candidatos: Candidato[]): ResumoVagaBadge {
    if (candidatos.length === 0) {
        return { label: "Sem candidatos", variant: "outline" };
    }

    const emEntrevista = candidatos.filter(
        (candidato) => candidato.status === "em_entrevista",
    ).length;
    if (emEntrevista > 0) {
        return {
            label: `${emEntrevista} em entrevista`,
            variant: "default",
        };
    }

    const aguardando = candidatos.filter(
        (candidato) => candidato.status === "aguardando",
    ).length;
    if (aguardando > 0) {
        return {
            label: `${aguardando} aguardando triagem`,
            variant: "secondary",
        };
    }

    return { label: "Entrevistas concluídas", variant: "outline" };
}

// Badge por candidato individual (usado na página de detalhe da vaga). A nota
// só existe quando `finalizado`, então ela é o que mais se destaca (variant
// "default"); os demais estados são só informativos.
export function getCandidatoBadge(candidato: Candidato): ResumoVagaBadge {
    if (candidato.status === "finalizado") {
        return candidato.notaFinal !== null
            ? { label: `Nota ${candidato.notaFinal}/100`, variant: "default" }
            : { label: "Finalizado", variant: "outline" };
    }

    if (candidato.status === "em_entrevista") {
        return { label: "Em entrevista", variant: "secondary" };
    }

    return { label: "Aguardando", variant: "outline" };
}
