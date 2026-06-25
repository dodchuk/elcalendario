import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getDeviceId } from "../infrastructure/deviceIdentity";
import { getProfile, saveProfile } from "../infrastructure/database";

type User = { deviceId: string; nickname?: string } | null;

type AuthContextType = {
  user: User;
  ready: boolean;
  setNickname: (name: string) => void;
  signOut: () => void;
};

const AuthCtx = createContext<AuthContextType>({ user: null, ready: false, setNickname: () => {}, signOut: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const deviceId = await getDeviceId();
      const nickname = await getProfile("nickname");
      setUser({ deviceId, nickname: nickname ?? undefined });
      setReady(true);
    })();
  }, []);

  const setNickname = (name: string) => {
    setUser(u => u ? { ...u, nickname: name } : u);
    saveProfile("nickname", name);
  };

  const signOut = () => setUser(null);

  return <AuthCtx.Provider value={{ user, ready, setNickname, signOut }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
