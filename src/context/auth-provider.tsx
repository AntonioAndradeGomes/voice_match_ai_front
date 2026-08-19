"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import {
    buscarUsuarioLogado,
    entrar as autenticar,
    desimpersonar as apiDesimpersonar,
    estaImpersonando as lerEstaImpersonando,
    impersonar as apiImpersonar,
    sair as encerrarSessao,
    type UsuarioAutenticado,
} from "@/lib/usuarios";
import { aplicarPapelDaUrl, lerPapelSimulado } from "@/lib/papel-simulado";

interface AuthContextValue {
    usuario: UsuarioAutenticado | null;
    carregando: boolean;
    autenticado: boolean;
    entrar: (
        email: string,
        senha: string,
        lembrar: boolean,
    ) => Promise<UsuarioAutenticado>;
    impersonar: (empresaId: string) => Promise<UsuarioAutenticado>;
    /** Volta para a conta do admin do sistema, sem novo login. */
    desimpersonar: () => Promise<void>;
    /** Estado, e não função: os componentes precisam re-renderizar quando muda. */
    estaImpersonando: boolean;
    sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
    const [carregando, setCarregando] = useState(true);
    // Começa `false` e é confirmado depois da montagem: `localStorage` não
    // existe no servidor, e ler no primeiro render acusaria divergência de
    // hidratação.
    const [estaImpersonando, setEstaImpersonando] = useState(false);

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
            setEstaImpersonando(lerEstaImpersonando());
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

    async function impersonar(empresaId: string) {
        const usuarioLogado = await apiImpersonar(empresaId);
        setUsuario(usuarioLogado);
        setEstaImpersonando(true);
        return usuarioLogado;
    }

    async function desimpersonar() {
        const admin = await apiDesimpersonar();
        setUsuario(admin);
        // Depois da chamada, e a partir do storage: se o backup não existia,
        // nada mudou e o estado não pode dizer que mudou.
        setEstaImpersonando(lerEstaImpersonando());
    }

    function sair() {
        encerrarSessao();
        setUsuario(null);
        setEstaImpersonando(false);
    }

    return (
        <AuthContext.Provider
            value={{
                usuario,
                carregando,
                autenticado: usuario !== null,
                entrar,
                impersonar,
                desimpersonar,
                estaImpersonando,
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
