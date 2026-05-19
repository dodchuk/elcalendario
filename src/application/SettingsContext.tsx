import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Settings = { firstDay: number }; // 0=Sun, 1=Mon, 2=Tue, ... 6=Sat

const SettingsContext = createContext<{ settings: Settings; setFirstDay: (d: number) => void }>({
  settings: { firstDay: 0 },
  setFirstDay: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({ firstDay: 0 });

  useEffect(() => {
    AsyncStorage.getItem("firstDay").then(v => {
      if (v) setSettings({ firstDay: Number(v) });
    });
  }, []);

  const setFirstDay = (d: number) => {
    setSettings({ firstDay: d });
    AsyncStorage.setItem("firstDay", String(d));
  };

  return (
    <SettingsContext.Provider value={{ settings, setFirstDay }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
