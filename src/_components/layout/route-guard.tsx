"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { rotaPublica } from "@/_components/layout/rotas";
import { useAuth } from "@/context/auth-provider";

// Guarda client-side: o token vive em localStorage (não em cookie), então só
// dá pra decidir isso no cliente — não existe checagem possível em Server
// Component/proxy.ts aqui. Enquanto a sessão carrega ou um redirect está
// pendente, não renderiza `children` pra não piscar dashboard protegido nem
// formulário de login pra quem já tá logado.
export function RouteGuard({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { autenticado, carregando } = useAuth();

    const publica = rotaPublica(pathname);
    const telaDeAuth = pathname === "/login" || pathname === "/cadastro";

    useEffect(() => {
        if (carregando) return;

        if (!autenticado && !publica) {
            router.replace("/login");
        } else if (autenticado && telaDeAuth) {
            router.replace("/");
        }
    }, [carregando, autenticado, publica, telaDeAuth, router]);

    if (carregando) return null;
    if (!autenticado && !publica) return null;
    if (autenticado && telaDeAuth) return null;

    return <>{children}</>;
}
