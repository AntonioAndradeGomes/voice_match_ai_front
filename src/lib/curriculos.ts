// Armazenamento do arquivo de currículo.
//
// Fica em IndexedDB, e não no localStorage como o resto dos dados, por um motivo
// concreto: localStorage só guarda string, então o PDF teria que virar base64 —
// o que infla o tamanho em ~33% e é medido contra uma cota de ~5 MB para a
// origem toda. Um currículo de 5 MB (o limite que o formulário aceita) viraria
// ~6,7 MB e estouraria a cota sozinho. IndexedDB guarda o Blob como está.
//
// Quando existir backend, estas funções passam a subir/baixar do storage remoto
// mantendo as assinaturas — nenhuma tela precisa mudar.

const BANCO = "voicematch";
const VERSAO = 1;
const LOJA = "curriculos";

export interface CurriculoArmazenado {
    nome: string;
    tipo: string;
    blob: Blob;
}

function indisponivel() {
    // SSR e navegadores com IndexedDB bloqueado (aba privada em alguns casos).
    return typeof indexedDB === "undefined";
}

function abrirBanco(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const pedido = indexedDB.open(BANCO, VERSAO);

        pedido.onupgradeneeded = () => {
            const banco = pedido.result;
            if (!banco.objectStoreNames.contains(LOJA)) {
                banco.createObjectStore(LOJA);
            }
        };

        pedido.onsuccess = () => resolve(pedido.result);
        pedido.onerror = () => reject(pedido.error);
    });
}

function executar<T>(
    modo: IDBTransactionMode,
    operacao: (loja: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
    return abrirBanco().then(
        (banco) =>
            new Promise<T>((resolve, reject) => {
                const transacao = banco.transaction(LOJA, modo);
                const pedido = operacao(transacao.objectStore(LOJA));

                pedido.onsuccess = () => resolve(pedido.result);
                pedido.onerror = () => reject(pedido.error);
                // Fechar o banco evita travar um `onupgradeneeded` futuro.
                transacao.oncomplete = () => banco.close();
            }),
    );
}

/** Guarda o PDF sob o id do candidato. Lança se a cota estourar. */
export async function salvarCurriculo(
    candidatoId: string,
    arquivo: File,
): Promise<void> {
    if (indisponivel()) return;

    await executar("readwrite", (loja) =>
        loja.put(
            {
                nome: arquivo.name,
                tipo: arquivo.type,
                blob: arquivo,
            } satisfies CurriculoArmazenado,
            candidatoId,
        ),
    );
}

export async function obterCurriculo(
    candidatoId: string,
): Promise<CurriculoArmazenado | null> {
    if (indisponivel()) return null;

    try {
        const registro = await executar<CurriculoArmazenado | undefined>(
            "readonly",
            (loja) => loja.get(candidatoId),
        );
        return registro ?? null;
    } catch {
        return null;
    }
}

/**
 * Se existe arquivo guardado para este candidato. Necessário porque
 * `inscricao.curriculoNome` pode existir sem arquivo nenhum — é o caso dos
 * candidatos vindos do `seed.ts` e de qualquer inscrição feita antes desta
 * funcionalidade.
 */
export async function temCurriculo(candidatoId: string): Promise<boolean> {
    return (await obterCurriculo(candidatoId)) !== null;
}

/** Dispara o download no navegador a partir do Blob guardado. */
export function baixarBlob(blob: Blob, nomeArquivo: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Revogar na próxima volta do event loop: revogar de imediato cancela o
    // download em alguns navegadores, porque a URL morre antes de ser lida.
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
