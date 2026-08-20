const TAMANHO = 520;
const CENTRO = TAMANHO / 2;
const RAIO = 150;
const NIVEIS = 5;

/** Um eixo do radar. `valor` é de 0 a 10, mesma escala do peso das skills. */
export interface EixoRadar {
    label: string;
    valor: number;
}

// Abaixo de três eixos não existe polígono: dois viram uma linha e um vira um
// ponto. A tela chama isso de "poucas skills" em vez de desenhar algo torto.
const EIXOS_MINIMOS = 3;

function pontoEixo(indice: number, total: number, raio: number) {
    const angulo = (Math.PI * 2 * indice) / total - Math.PI / 2;
    return {
        x: CENTRO + raio * Math.cos(angulo),
        y: CENTRO + raio * Math.sin(angulo),
    };
}

function pontosPoligono(total: number, raio: number) {
    return Array.from({ length: total }, (_, indice) =>
        pontoEixo(indice, total, raio),
    )
        .map((ponto) => `${ponto.x},${ponto.y}`)
        .join(" ");
}

/**
 * Radar somente leitura. Os eixos vêm de quem chama — hoje são as hard e soft
 * skills da vaga, com o peso de cada uma —, e não uma lista fixa: assim o
 * gráfico reflete o que aquela vaga exige, em vez de dimensões genéricas que
 * podem nem se aplicar à posição.
 */
export function PerfilRadarChart({
    eixos,
    descricao = "Radar de competências da vaga",
}: {
    eixos: EixoRadar[];
    descricao?: string;
}) {
    if (eixos.length < EIXOS_MINIMOS) {
        return (
            <p className="py-6 text-center text-sm text-muted-foreground">
                O radar precisa de ao menos {EIXOS_MINIMOS} competências para
                ser desenhado. Esta vaga tem {eixos.length}.
            </p>
        );
    }

    const total = eixos.length;
    const pontosDado = eixos.map((eixo, indice) =>
        // Prende de 0 a 10 para um peso fora da faixa não estourar o desenho.
        pontoEixo(indice, total, (RAIO * Math.min(Math.max(eixo.valor, 0), 10)) / 10),
    );

    return (
        <svg
            viewBox={`0 0 ${TAMANHO} ${TAMANHO}`}
            className="mx-auto h-auto w-full max-w-[500px]"
            role="img"
            aria-label={descricao}
        >
            {Array.from({ length: NIVEIS }, (_, nivel) => (
                <polygon
                    key={nivel}
                    points={pontosPoligono(total, (RAIO * (nivel + 1)) / NIVEIS)}
                    fill="none"
                    className="stroke-border"
                />
            ))}

            {eixos.map((eixo, indice) => {
                const ponta = pontoEixo(indice, total, RAIO);
                return (
                    <line
                        key={eixo.label}
                        x1={CENTRO}
                        y1={CENTRO}
                        x2={ponta.x}
                        y2={ponta.y}
                        className="stroke-border"
                    />
                );
            })}

            {eixos.map((eixo, indice) => {
                const ponto = pontoEixo(indice, total, RAIO + 20);
                const angulo = (Math.PI * 2 * indice) / total - Math.PI / 2;
                const cos = Math.cos(angulo);
                const ancora =
                    cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";

                return (
                    <text
                        key={eixo.label}
                        x={ponto.x}
                        y={ponto.y}
                        textAnchor={ancora}
                        dominantBaseline="middle"
                        className="fill-muted-foreground text-[11px]"
                    >
                        {eixo.label}
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
                    key={eixos[indice].label}
                    cx={ponto.x}
                    cy={ponto.y}
                    r={3}
                    className="fill-primary"
                />
            ))}
        </svg>
    );
}
