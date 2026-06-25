import { createContext, useContext, useState, type ReactNode } from "react";

type BubblePortalData = {
  visible: boolean;
  bubbles: { id: string; emoji: string; active: boolean; time?: string }[];
  screenPos: { x: number; y: number };
  ringR: number;
  col: number;
  row: number;
  onToggle: (id: string) => void;
} | null;

const Ctx = createContext<{
  portal: BubblePortalData;
  showPortal: (data: BubblePortalData) => void;
  hidePortal: () => void;
}>({ portal: null, showPortal: () => {}, hidePortal: () => {} });

export function BubblePortalProvider({ children }: { children: ReactNode }) {
  const [portal, setPortal] = useState<BubblePortalData>(null);
  return (
    <Ctx.Provider value={{ portal, showPortal: setPortal, hidePortal: () => setPortal(null) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useBubblePortal = () => useContext(Ctx);
