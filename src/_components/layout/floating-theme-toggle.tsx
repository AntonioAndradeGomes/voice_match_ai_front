"use client";

import { usePathname } from "next/navigation";

import { rotaTemNav } from "@/_components/layout/rotas";
import { ThemeToggle } from "@/_components/layout/theme-toggle";

// Nas rotas sem sidebar (chat, login, cadastro, 404) não há onde encaixar o
// toggle de tema — ele flutua no canto superior direito. Nas rotas com
// sidebar o toggle já mora lá (ver Sidebar), então some daqui.
export function FloatingThemeToggle() {
    const pathname = usePathname();

    if (rotaTemNav(pathname)) return null;

    return (
        <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
        </div>
    );
}
