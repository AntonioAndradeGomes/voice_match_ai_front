"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import {
    buscarUsuarioLogado,
    entrar as autenticar,
    sair as encerrarSessao,
    type UsuarioAutenticado,
} from "@/lib/usuarios";
import {
    aplicarPapelDaUrl,
    lerPapelSimulado,
} from "@/lib/papel-simulado";

interface AuthContextValue {
    usuario: UsuarioAutenticado | null;
    carregando: boolean;
    autenticado: boolean;
    entrar: (
        email: string,
        senha: string,
        lembrar: boolean,
    ) => Promise<UsuarioAutenticado>;
    sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        // Fora de produção, `?papel=` permite percorrer as telas do admin do
        // sistema antes de o backend ter papéis. Some da URL depois de lido:
        // um endereço com `?papel=admin_sistema` convida a ser compartilhado
        // como se fosse rota de verdade. Ver lib/papel-simulado.ts.
        if (aplicarPapelDaUrl()) {
            const limpa = new URL(window.location.href);
            limpa.searchParams.delete("papel");
            window.history.replaceState(null, "", limpa.toString());
        }

        // Confirma a sessão salva contra o backend antes de liberar qualquer
        // rota — o RouteGuard segura `children` enquanto `carregando` for
        // true, então não há necessidade (nem como, sem mismatch de
        // hidratação) de adiantar `usuario` com o valor de localStorage aqui.
        buscarUsuarioLogado().then((atual) => {
            const papel = lerPapelSimulado();
            setUsuario(
                atual && papel ? { ...atual, tipo_usuario: papel } : atual,
            );
            setCarregando(false);
        });
    }, []);

    async function entrar(email: string, senha: string, lembrar: boolean) {
        const usuarioLogado = await autenticar(email, senha, lembrar);
        const papel = lerPapelSimulado();
        const comPapel = papel
            ? { ...usuarioLogado, tipo_usuario: papel }
            : usuarioLogado;
        setUsuario(comPapel);
        return comPapel;
    }

    function sair() {
        encerrarSessao();
        setUsuario(null);
    }

    return (
        <AuthContext.Provider
            value={{
                usuario,
                carregando,
                autenticado: usuario !== null,
                entrar,
                sair,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth precisa ser usado dentro de <AuthProvider>.");
    }
    return context;
}
