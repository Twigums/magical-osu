import { useEffect, useState } from "react";
import { AR_MIN, AR_MAX, arToMs } from "../settings";
import { useApproachRate } from "./useApproachRate";
import { ApproachPreview } from "./ApproachPreview";
import { useLang } from "./useLang";

export function OptionsPanel() {
  const [open, setOpen] = useState(false);
  const [ar, setAr]     = useApproachRate();
  const lang            = useLang();

  // the settings button lives in home template
  useEffect(() => {
    const btn = document.getElementById("settings-btn");
    const handleOpen = () => setOpen(true);
    btn?.addEventListener("click", handleOpen);
    return () => btn?.removeEventListener("click", handleOpen);
  }, []);

  if (!open) return null;

  const ms = Math.round(arToMs(ar));
  const isJp = lang === "jp";

  return (
    <div className="options-backdrop" onClick={() => setOpen(false)}>
      <div className="options-panel" onClick={e => e.stopPropagation()}>

        <button
          className="options-close"
          onClick={() => setOpen(false)}
          aria-label={isJp ? "閉じる" : "Close"}
        >
          ×
        </button>

        <h2 className="options-title">
          {isJp ? "オプション" : "Options"}
        </h2>

        <div className="options-row">
          <label className="options-label">
            <span>{isJp ? "アプローチレート" : "Approach Rate"}</span>
            <span className="options-ar-value">AR {ar}</span>
          </label>
          <input
            type="range"
            className="options-slider"
            min={AR_MIN}
            max={AR_MAX}
            step={1}
            value={ar}
            onChange={e => setAr(Number(e.target.value))}
          />
          <span className="options-ms-label">{ms}ms</span>
        </div>

        <p className="options-preview-label">
          {isJp ? "プレビュー" : "Preview"}
        </p>
        <div className="options-preview-wrap">
          <ApproachPreview ar={ar} />
        </div>

      </div>
    </div>
  );
}