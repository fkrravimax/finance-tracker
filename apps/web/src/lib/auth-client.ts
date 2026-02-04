import { createAuthClient } from "better-auth/react"

const apiUrl = import.meta.env.VITE_API_URL;
console.log("DEBUG: VITE_API_URL is:", apiUrl);

export const authClient = createAuthClient({
    baseURL: apiUrl || "http://localhost:3000"
})
