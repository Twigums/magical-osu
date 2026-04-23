import type { Grade } from "./grade";

interface SharePayload {
  score: number;
  accuracy: string;
  grade: Grade;
  songName: string;
  lang: string;
}

export async function shareResult(payload: SharePayload): Promise<boolean> {
  const { score, grade, songName, lang } = payload;
  const url = window.location.href;
  const accuracyPct = payload.accuracy;
  const text = lang === "jp"
    ? `「${songName}」で ${accuracyPct} (${grade}) を獲得しました！\n${url}`
    : `I scored ${accuracyPct} (${grade}) on "${songName}" in mimi!\n${url}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: "mimi", text, url });
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return false;
    }
  }

  return copyToClipboard(text);
}

function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(() => true, () => execCommandCopy(text));
  }
  return Promise.resolve(execCommandCopy(text));
}

function execCommandCopy(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  return ok;
}
