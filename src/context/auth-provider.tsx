"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import {
    buscarUsuarioLogado,
    entrar as autenticar,
    sair as encerrarSessao,
    type UsuarioAutenticado,
} from "@/lib/usuarios";

interface AuthContextValue {
    usuario: UsuarioAutenticado | null;
    carregando: boolean;
    autenticado: boolean;
    entrar: (email: string, senha: string) => Promise<UsuarioAutenticado>;
    sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        // Confirma a sessão salva contra o backend antes de liberar qualquer
        // rota — o RouteGuard segura `children` enquanto `carregando` for
        // true, então não há necessidade (nem como, sem mismatch de
        // hidratação) de adiantar `usuario` com o valor de localStorage aqui.
        buscarUsuarioLogado().then((atual) => {
            setUsuario(atual);
            setCarregando(false);
        });
    }, []);

    async function entrar(email: string, senha: string) {
        const usuarioLogado = await autenticar(email, senha);
        setUsuario(usuarioLogado);
        return usuarioLogado;
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
