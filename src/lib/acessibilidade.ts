// Preferências de acessibilidade de quem está olhando a tela — não do
// recrutador logado. Por isso ficam em localStorage e não no backend: o
// candidato que abre /candidatura ou /chat não tem conta, e a escolha precisa
// valer para ele também.
//
// As duas preferências viram classe no <html>, e o CSS (globals.css) faz o
// resto. Manter no elemento raiz é o que permite o alto contraste redefinir os
// tokens de cor e o texto maior escalar tudo que está em rem de uma vez.

export type PreferenciasAcessibilidade = {
    altoContraste: boolean;
    textoMaior: boolean;
    daltonismo: boolean;
};

export const CHAVE_ACESSIBILIDADE = "voicematch:acessibilidade";

export const CLASSE_ALTO_CONTRASTE = "alto-contraste";
export const CLASSE_TEXTO_MAIOR = "texto-maior";
export const CLASSE_DALTONISMO = "daltonismo";

export const PREFERENCIAS_PADRAO: PreferenciasAcessibilidade = {
    altoContraste: false,
    textoMaior: false,
    daltonismo: false,
};

export function lerPreferencias(): PreferenciasAcessibilidade {
    if (typeof window === "undefined") return PREFERENCIAS_PADRAO;

    try {
        const raw = window.localStorage.getItem(CHAVE_ACESSIBILIDADE);
        if (!raw) return PREFERENCIAS_PADRAO;

        const salvo = JSON.parse(raw) as Partial<PreferenciasAcessibilidade>;
        // Comparação explícita com `true` para um valor corrompido no storage
        // (string, número, null) não virar "ligado" por ser truthy.
        return {
            altoContraste: salvo.altoContraste === true,
            textoMaior: salvo.textoMaior === true,
            daltonismo: salvo.daltonismo === true,
        };
    } catch {
        return PREFERENCIAS_PADRAO;
    }
}

export function salvarPreferencias(preferencias: PreferenciasAcessibilidade) {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem(
            CHAVE_ACESSIBILIDADE,
            JSON.stringify(preferencias),
        );
    } catch {
        // Storage cheio ou bloqueado (aba anônima com cookies restritos): a
        // preferência ainda vale nesta sessão, só não sobrevive ao reload.
    }
}

export function aplicarPreferencias(preferencias: PreferenciasAcessibilidade) {
    if (typeof document === "undefined") return;

    const classes = document.documentElement.classList;
    classes.toggle(CLASSE_ALTO_CONTRASTE, preferencias.altoContraste);
    classes.toggle(CLASSE_TEXTO_MAIOR, preferencias.textoMaior);
    classes.toggle(CLASSE_DALTONISMO, preferencias.daltonismo);
}

// Roda no <head>, de forma síncrona, enquanto o browser ainda está lendo o
// HTML — antes da primeira pintura. Sem isto a página apareceria no visual
// padrão e só depois da hidratação mudaria, piscando na cara justamente de
// quem ligou alto contraste por não enxergar bem. Mesma técnica que o
// next-themes usa para o tema escuro.
export const SCRIPT_ACESSIBILIDADE = `(function(){try{var p=JSON.parse(localStorage.getItem("${CHAVE_ACESSIBILIDADE}")||"{}");var c=document.documentElement.classList;if(p.altoContraste===true)c.add("${CLASSE_ALTO_CONTRASTE}");if(p.textoMaior===true)c.add("${CLASSE_TEXTO_MAIOR}");if(p.daltonismo===true)c.add("${CLASSE_DALTONISMO}")}catch(e){}})()`;
