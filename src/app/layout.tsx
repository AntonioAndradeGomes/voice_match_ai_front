import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/auth-provider";
import { ThemeProvider } from "@/context/theme-provider";
import { TooltipProvider } from "@/_components/ui/tooltip";
import { Toaster } from "@/_components/ui/sonner";
import { BotaoAcessibilidade } from "@/_components/layout/botao-acessibilidade";
import { FloatingThemeToggle } from "@/_components/layout/floating-theme-toggle";
import { InlineScript } from "@/_components/layout/inline-script";
import { AvisoPapelSimulado } from "@/_components/layout/aviso-papel-simulado";
import { AvisoSemConexao } from "@/_components/layout/aviso-sem-conexao";
import { RouteGuard } from "@/_components/layout/route-guard";
import { Sidebar } from "@/_components/layout/sidebar";
import { SCRIPT_ACESSIBILIDADE } from "@/lib/acessibilidade";

// Família única do projeto. O token `--font-heading` continua existindo, mas
// aponta para esta mesma pilha em `globals.css` — assim as 29 ocorrências do
// utilitário `font-heading` seguem válidas sem precisar tocar nos componentes.
const inter = Inter({
    subsets: ["latin"],
    // Nome próprio, e não `--font-sans`: os tokens `--font-sans` e
    // `--font-heading` do Tailwind apontam para cá. Reaproveitar `--font-sans`
    // aqui criaria referência circular no `@theme` e o token seria descartado.
    variable: "--font-inter",
    // Inter é fonte variável: sem `weight`, vêm os pesos 100–900 num arquivo só.
    // `opsz` deixa o desenho se ajustar entre corpo de texto e os títulos
    // grandes (4xl/5xl da página de candidatura).
    axes: ["opsz"],
});

export const metadata: Metadata = {
    title: "VoiceMatch.Ai",
    description: "Entrevistas por voz com match de perfil comportamental",
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
        apple: "/logo/icone-nobg.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="pt-BR"
            className={cn("h-full", "antialiased", inter.variable)}
            suppressHydrationWarning
        >
            <head>
                {/* Aplica as preferências de acessibilidade enquanto o browser
                    ainda lê o HTML, antes da primeira pintura. Sem isso a
                    página apareceria no visual padrão e só mudaria depois da
                    hidratação — piscando na cara de quem ligou alto contraste
                    justamente por não enxergar bem. */}
                <InlineScript html={SCRIPT_ACESSIBILIDADE} />
            </head>
            <body className="h-full font-sans" suppressHydrationWarning>
                <AuthProvider>
                    <ThemeProvider
                        attribute="class"
                        // Claro por padrão, e `enableSystem` desligado: com
                        // "system" o app abria escuro para quem usa o Windows
                        // no tema escuro, ignorando o padrão do produto. Quem
                        // preferir escuro continua trocando pelo toggle da
                        // sidebar, e a escolha fica salva.
                        defaultTheme="light"
                        enableSystem={false}
                        disableTransitionOnChange
                    >
                        <TooltipProvider>
                            <FloatingThemeToggle />
                            {/* Fora do RouteGuard: vale em toda rota, inclusive
                                nas públicas (/candidatura e /chat), que é onde
                                está o candidato — quem mais precisa do recurso
                                e quem não tem conta para salvar preferência. */}
                            <BotaoAcessibilidade />
                            <RouteGuard>
                                <div className="flex h-svh flex-col lg:flex-row">
                                    <Sidebar />
                                    {/* Coluna própria para o aviso ficar fixo
                                        acima do conteúdo: dentro do <main> ele
                                        rolaria junto e sumiria de vista logo no
                                        primeiro scroll. */}
                                    <div className="flex min-h-0 flex-1 flex-col">
                                        <AvisoPapelSimulado />
                                        <AvisoSemConexao />
                                        <main className="min-h-0 flex-1 overflow-y-auto">
                                            {children}
                                        </main>
                                    </div>
                                </div>
                            </RouteGuard>
                            <Toaster />
                        </TooltipProvider>
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
