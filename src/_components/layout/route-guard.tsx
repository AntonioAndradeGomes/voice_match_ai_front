"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import {
    rotaEhAdminSistema,
    rotaPublica,
} from "@/_components/layout/rotas";
import { useAuth } from "@/context/auth-provider";
import { ehAdminSistema } from "@/lib/usuarios";

// Guarda client-side: o token vive em localStorage (não em cookie), então só
// dá pra decidir isso no cliente — não existe checagem possível em Server
// Component/proxy.ts aqui. Enquanto a sessão carrega ou um redirect está
// pendente, não renderiza `children` pra não piscar dashboard protegido nem
// formulário de login pra quem já tá logado.
export function RouteGuard({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { autenticado, carregando, usuario } = useAuth();

    const publica = rotaPublica(pathname);
    const telaDeAuth = pathname === "/login" || pathname === "/cadastro";
    // A área do admin do sistema é a única com restrição por papel. A guarda
    // aqui é de navegação, não de segurança: quem decide o que pode ser lido é
    // o backend, que responde 403 para quem não é admin do sistema. Isto evita
    // que a pessoa veja uma tela que não é dela, não protege o dado.
    const adminNegado =
        rotaEhAdminSistema(pathname) && autenticado && !ehAdminSistema(usuario);

    useEffect(() => {
        if (carregando) return;

        if (!autenticado && !publica) {
            router.replace("/login");
        } else if (autenticado && telaDeAuth) {
            router.replace("/");
        } else if (adminNegado) {
            router.replace("/");
        }
    }, [carregando, autenticado, publica, telaDeAuth, adminNegado, router]);

    if (carregando) return null;
    if (!autenticado && !publica) return null;
    if (autenticado && telaDeAuth) return null;
    if (adminNegado) return null;

    return <>{children}</>;
}
