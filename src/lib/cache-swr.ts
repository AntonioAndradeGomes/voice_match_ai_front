"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cache stale-while-revalidate para as telas que buscam dados no cliente.
 *
 * O problema: as páginas guardam o resultado em `useState` e buscam num
 * `useEffect`. Sair da tela desmonta o componente e o estado morre; voltar
 * monta de novo com `null` e refaz tudo — em `/vagas` isso são ~104
 * requisições (1 de vagas, 1 por vaga para as candidaturas, 2 por candidatura
 * para candidato e entrevistas), com skeleton na cara do usuário toda vez.
 *
 * Aqui o resultado sobrevive à desmontagem. A volta desenha na hora com o que
 * já se sabe e a busca acontece em segundo plano.
 *
 * Em memória, e não no localStorage, de propósito: o ganho que se quer é na
 * navegação dentro da sessão, e currículo e nota de entrevista são dado pessoal
 * — não têm por que ficar em texto claro no navegador depois que a aba fecha.
 */
const cache = new Map<string, unknown>();

/**
 * Buscas em andamento, por chave. Sem isso, duas telas que pedem a mesma chave
 * ao mesmo tempo disparam duas cascatas inteiras de requisição.
 */
const emVoo = new Map<string, Promise<unknown>>();

function buscar<T>(
    chave: string,
    carregar: () => Promise<T>,
    forcar = false,
): Promise<T> {
    if (!forcar) {
        const existente = emVoo.get(chave);
        if (existente) return existente as Promise<T>;
    }

    const promessa = carregar()
        .then((dados) => {
            cache.set(chave, dados);
            return dados;
        })
        .finally(() => {
            // Só limpa se ainda for a promessa desta chamada: um `recarregar`
            // forçado por cima de uma busca em voo não pode apagar o registro
            // da que ficou por último.
            if (emVoo.get(chave) === promessa) emVoo.delete(chave);
        });

    emVoo.set(chave, promessa);
    return promessa;
}

/** Descarta o que está guardado. Sem chave, descarta tudo. */
export function invalidarCache(chave?: string) {
    if (chave === undefined) cache.clear();
    else cache.delete(chave);
}

interface EstadoCache<T> {
    chave: string;
    dados: T | null;
    revalidando: boolean;
    erro: unknown;
}

export function useDadosEmCache<T>(chave: string, carregar: () => Promise<T>) {
    const [estado, setEstado] = useState<EstadoCache<T>>(() => ({
        chave,
        dados: (cache.get(chave) as T) ?? null,
        revalidando: true,
        erro: null,
    }));

    // A identidade de `carregar` muda a cada render quando o chamador passa uma
    // arrow inline. Guardar numa ref mantém o efeito preso só à chave — do
    // contrário ele redispararia a cascata inteira a cada render.
    const carregarRef = useRef(carregar);
    carregarRef.current = carregar;

    // Ajuste em tempo de render, e não num efeito: é o padrão que o React
    // documenta para estado derivado de prop, e evita o quadro intermediário em
    // que a tela mostraria os dados da chave antiga. Um `setEstado` síncrono
    // dentro de efeito também acusaria no lint de renders em cascata.
    if (estado.chave !== chave) {
        setEstado({
            chave,
            dados: (cache.get(chave) as T) ?? null,
            revalidando: true,
            erro: null,
        });
    }

    useEffect(() => {
        let ativo = true;

        buscar<T>(chave, () => carregarRef.current())
            .then((dados) => {
                if (ativo)
                    setEstado({ chave, dados, revalidando: false, erro: null });
            })
            .catch((erro) => {
                // Mantém na tela o que já havia: com o servidor fora, dado em
                // cache é melhor que tela vazia — e o aviso global de conexão
                // já explica que a informação pode estar velha.
                if (ativo)
                    setEstado((atual) => ({
                        ...atual,
                        revalidando: false,
                        erro,
                    }));
            });

        return () => {
            ativo = false;
        };
    }, [chave]);

    const recarregar = useCallback(async () => {
        // Força, ignorando a busca em voo: depois de criar ou editar algo, uma
        // requisição que partiu antes da mudança devolveria o estado anterior.
        try {
            const dados = await buscar<T>(
                chave,
                () => carregarRef.current(),
                true,
            );
            setEstado({ chave, dados, revalidando: false, erro: null });
        } catch (erro) {
            setEstado((atual) => ({ ...atual, revalidando: false, erro }));
        }
    }, [chave]);

    return {
        dados: estado.dados,
        /** Só na primeira visita: com algo em cache, não há o que esperar. */
        carregando: estado.dados === null && estado.revalidando,
        /** Buscando em segundo plano, com dado antigo já na tela. */
        revalidando: estado.revalidando,
        erro: estado.erro,
        recarregar,
    };
}
