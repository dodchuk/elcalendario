import { createContext, useContext, useState, type ReactNode } from "react";

type User = { email: string; name?: string } | null;

type AuthContextType = {
  user: User;
  signIn: (email: string) => void;
  signOut: () => void;
};

const AuthCtx = createContext<AuthContextType>({ user: null, signIn: () => {}, signOut: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);

  const signIn = (email: string) => setUser({ email });
  const signOut = () => setUser(null);

  return <AuthCtx.Provider value={{ user, signIn, signOut }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
