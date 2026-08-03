"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/_components/ui/avatar";
import { Button } from "@/_components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/_components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-provider";
import { cn } from "@/lib/utils";

function iniciais(nome: string) {
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    const primeira = partes[0]?.charAt(0) ?? "";
    const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : "";
    return (primeira + ultima).toUpperCase() || "?";
}

export function UserMenu({ colapsado = false }: { colapsado?: boolean }) {
    const { usuario, sair } = useAuth();
    const router = useRouter();

    // Só aparece com sessão confirmada — nas rotas onde a sidebar existe,
    // isso já é garantido pelo RouteGuard, mas o componente não deve assumir.
    if (!usuario) return null;

    function handleSair() {
        sair();
        router.push("/login");
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        className={cn(
                            "h-auto justify-start gap-2 px-1.5 py-1.5",
                            colapsado && "justify-center px-0",
                        )}
                    />
                }
            >
                <Avatar size="sm">
                    <AvatarFallback>
                        {iniciais(usuario.nome_completo)}
                    </AvatarFallback>
                </Avatar>
                {!colapsado && (
                    <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-sidebar-foreground">
                        {usuario.nome_completo}
                    </span>
                )}
            </DropdownMenuTrigger>

            {/* `min-w-56` porque o DropdownMenuContent usa `w-(--anchor-width)`:
                sem um piso, com a sidebar recolhida o menu herdaria a largura do
                botão de ícone e o e-mail ficaria ilegível. */}
            <DropdownMenuContent align="start" side="top" className="min-w-56">
                {/* O Group não é decorativo: o GroupLabel do Base UI exige um
                    Group ancestral (é dele que vem o MenuGroupContext) e é o
                    que liga o rótulo aos itens via aria-labelledby. */}
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="truncate">
                        {usuario.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        variant="destructive"
                        onClick={handleSair}
                    >
                        <LogOut />
                        Sair
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
