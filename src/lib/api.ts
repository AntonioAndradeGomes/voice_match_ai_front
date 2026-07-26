// URL base da API do backend.
// Em desenvolvimento local, aponta para localhost:8000.
// Na Vercel (produção/hackathon), configure a variável de ambiente
// NEXT_PUBLIC_API_URL com a URL pública do backend (ex: ngrok).
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
