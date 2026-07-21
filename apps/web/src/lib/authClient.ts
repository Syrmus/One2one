import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    inferAdditionalFields({
      user: {
        nativeLanguage: { type: "string", required: false },
        targetLanguage: { type: "string", required: false },
      },
    }),
  ],
});

export const { signIn, signOut, useSession, updateUser } = authClient;
