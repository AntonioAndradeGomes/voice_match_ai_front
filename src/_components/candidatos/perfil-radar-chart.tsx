import { TRAITS, type PerfilComportamental, type Trait } from "@/types";

const TRAIT_LABEL: Record<Trait, string> = {
    equipe: "Equipe",
    proatividade: "Proatividade",
    resiliencia: "Resiliência",
    foco_em_resultado: "Foco em Resultado",
    negociacao: "Negociação",
    relacao_hierarquica: "Relação Hierárquica",
    resolucao_de_conflito: "Resolução de Conflitos",
    inovacao: "Inovação",
    acao_sob_pressao: "Ação sob Pressão",
    assertividade: "Assertividade",
    autenticidade: "Autenticidade",
    autonomia: "Autonomia",
    comunicabilidade: "Comunicabilidade",
    cuidado: "Cuidado",
    disciplina: "Disciplina",
    empenho: "Empenho",
    flexibilidade: "Flexibilidade",
    seguranca: "Segurança",
    tranquilidade: "Tranquilidade",
    vitalidade_corporal: "Vitalidade Corporal",
};

const TAMANHO = 520;
const CENTRO = TAMANHO / 2;
const RAIO = 150;
const NIVEIS = 5;

function pontoEixo(indice: number, raio: number) {
    const angulo = (Math.PI * 2 * indice) / TRAITS.length - Math.PI / 2;
    return {
        x: CENTRO + raio * Math.cos(angulo),
        y: CENTRO + raio * Math.sin(angulo),
    };
}

function pontosPoligono(raio: number) {
    return TRAITS.map((_, indice) => pontoEixo(indice, raio))
        .map((ponto) => `${ponto.x},${ponto.y}`)
        .join(" ");
}

// Radar somente leitura do perfil comportamental (candidato avaliado ou o
// ideal da vaga) — os 20 traços de types.ts, um por eixo. Não tem edição por
// arraste; isso é só visualização.
export function PerfilRadarChart({ perfil }: { perfil: PerfilComportamental }) {
    const pontosDado = TRAITS.map((trait, indice) =>
        pontoEixo(indice, (RAIO * perfil[trait]) / 10),
    );

    return (
        <svg
            viewBox={`0 0 ${TAMANHO} ${TAMANHO}`}
            className="mx-auto w-full max-w-115"
            role="img"
            aria-label="Radar do perfil comportamental"
        >
            {Array.from({ length: NIVEIS }, (_, nivel) => (
                <polygon
                    key={nivel}
                    points={pontosPoligono((RAIO * (nivel + 1)) / NIVEIS)}
                    fill="none"
                    className="stroke-border"
                />
            ))}

            {TRAITS.map((trait, indice) => {
                const ponta = pontoEixo(indice, RAIO);
                return (
                    <line
                        key={trait}
                        x1={CENTRO}
                        y1={CENTRO}
                        x2={ponta.x}
                        y2={ponta.y}
                        className="stroke-border"
                    />
                );
            })}

            {TRAITS.map((trait, indice) => {
                const ponto = pontoEixo(indice, RAIO + 16);
                const angulo =
                    (Math.PI * 2 * indice) / TRAITS.length - Math.PI / 2;
                const cos = Math.cos(angulo);
                const ancora =
                    cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";

                return (
                    <text
                        key={trait}
                        x={ponto.x}
                        y={ponto.y}
                        textAnchor={ancora}
                        dominantBaseline="middle"
                        className="fill-muted-foreground text-[9px]"
                    >
                        {TRAIT_LABEL[trait]}
                    </text>
                );
            })}

            <polygon
                points={pontosDado.map((p) => `${p.x},${p.y}`).join(" ")}
                className="fill-primary/20 stroke-primary"
                strokeWidth={2}
                strokeLinejoin="round"
            />
            {pontosDado.map((ponto, indice) => (
                <circle
                    key={TRAITS[indice]}
                    cx={ponto.x}
                    cy={ponto.y}
                    r={3}
                    className="fill-primary"
                />
            ))}
        </svg>
    );
}
