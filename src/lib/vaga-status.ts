import type { Candidato } from "@/types";

export interface ResumoVagaBadge {
    label: string;
    variant:
        | "default"
        | "secondary"
        | "outline"
        | "success"
        | "warning"
        | "destructive";
}

// A nota da triagem vem de 0 a 10 (mesma escala do `score_minimo_triagem` da
// vaga), diferente da `notaFinal` da entrevista, que é de 0 a 100.
function formatarScoreTriagem(score: number) {
    return score.toFixed(1);
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
            ? { label: `Nota ${Number(candidato.notaFinal).toFixed(1)} / 10`, variant: "default" }
            : { label: "Finalizado", variant: "outline" };
    }

    if (candidato.status === "em_entrevista") {
        return { label: "Em entrevista", variant: "secondary" };
    }

    // Antes da entrevista, o que importa é a triagem de currículo. Só entra
    // aqui quem ainda não avançou, então o badge não compete com os estados
    // acima. Reprovado tem prioridade sobre pendente na leitura do recrutador:
    // é o caso que exige ação.
    const triagem = candidato.triagem;
    if (triagem) {
        const nota =
            triagem.score !== null && triagem.score !== undefined
                ? ` — Nota ${formatarScoreTriagem(triagem.score)}`
                : "";

        if (triagem.status === "aprovada_triagem") {
            return {
                label: `Aprovado na Triagem${nota}`,
                variant: "success",
            };
        }
        if (triagem.status === "reprovada_triagem") {
            return {
                label: `Reprovado na Triagem${nota}`,
                variant: "destructive",
            };
        }
        return { label: "Aguardando Triagem", variant: "warning" };
    }

    return { label: "Aguardando", variant: "outline" };
}
