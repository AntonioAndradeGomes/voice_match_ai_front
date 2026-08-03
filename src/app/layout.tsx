import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/auth-provider";
import { ThemeProvider } from "@/context/theme-provider";
import { TooltipProvider } from "@/_components/ui/tooltip";
import { Toaster } from "@/_components/ui/sonner";
import { FloatingThemeToggle } from "@/_components/layout/floating-theme-toggle";
import { RouteGuard } from "@/_components/layout/route-guard";
import { Sidebar } from "@/_components/layout/sidebar";

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
    title: "VoiceMatchAi",
    description: "Entrevistas por chat com match de perfil comportamental",
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
            <body className="h-full font-sans" suppressHydrationWarning>
                <AuthProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <TooltipProvider>
                            <FloatingThemeToggle />
                            <RouteGuard>
                                <div className="flex h-svh flex-col lg:flex-row">
                                    <Sidebar />
                                    <main className="flex-1 overflow-hidden">
                                        {children}
                                    </main>
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
