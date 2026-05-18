import { useState, useEffect } from "react";

export function useLang(): string {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") ?? "en");
  useEffect(() => {
    const toggle = document.getElementById("lang-toggle");
    const handler = () => setLang(localStorage.getItem("lang") ?? "en");
    toggle?.addEventListener("click", handler);
    return () => toggle?.removeEventListener("click", handler);
  }, []);
  return lang;
}