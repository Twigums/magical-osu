import { useEffect, useState } from "react";
import { AR_MIN, AR_MAX, arToMs, VOLUME_MIN, VOLUME_MAX, VOLUME_STEP } from "../settings";
import { useApproachRate } from "./useApproachRate";
import { useVolume } from "./useVolume";
import { useHitsoundVolume } from "./useHitsoundVolume";
import { ApproachPreview } from "./ApproachPreview";
import { useLang } from "./useLang";
import { useTransitionState } from "./useTransitionState";

const isSongPage = document.body.classList.contains("song-page");

export function OptionsPanel() {
  const [open, setOpen] = useState(false);
  const { state }       = useTransitionState(open, 240);
  const [ar, setAr]         = useApproachRate();
  const [vol, setVol]       = useVolume();
  const [hsVol, setHsVol]   = useHitsoundVolume();
  const lang                = useLang();

  useEffect(() => {
    const btn = document.getElementById("settings-btn");
    const handleOpen = () => setOpen(true);
    btn?.addEventListener("click", handleOpen);
    return () => btn?.removeEventListener("click", handleOpen);
  }, []);

  if (state === "exited") return null;

  const ms   = Math.round(arToMs(ar));
  const isJp = lang === "jp";

  return (
    <div className="options-backdrop" data-state={state} onClick={() => setOpen(false)}>
      <div className="options-panel" data-state={state} onClick={e => e.stopPropagation()}>

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
            <span>{isJp ? "音楽音量" : "Music Volume"}</span>
            <span className="options-setting-value">{vol}%</span>
          </label>
          <input
            type="range"
            className="options-slider"
            min={VOLUME_MIN}
            max={VOLUME_MAX}
            step={VOLUME_STEP}
            value={vol}
            onChange={e => setVol(Number(e.target.value))}
          />
        </div>

        <div className="options-row">
          <label className="options-label">
            <span>{isJp ? "ヒット音量" : "Hitsound Volume"}</span>
            <span className="options-setting-value">{hsVol}%</span>
          </label>
          <input
            type="range"
            className="options-slider"
            min={VOLUME_MIN}
            max={VOLUME_MAX}
            step={VOLUME_STEP}
            value={hsVol}
            onChange={e => setHsVol(Number(e.target.value))}
          />
        </div>

        <div className="options-row">
          <label className="options-label">
            <span>{isJp ? "アプローチレート" : "Approach Rate"}</span>
            <span className="options-setting-value">AR {ar}</span>
          </label>
          <input
            type="range"
            className="options-slider"
            min={AR_MIN}
            max={AR_MAX}
            step={1}
            value={ar}
            disabled={isSongPage}
            onChange={e => setAr(Number(e.target.value))}
          />
          <span className="options-ms-label">{ms}ms</span>
          {isSongPage && (
            <p className="options-note">
              {isJp
                ? "ARはホームページでのみ変更できます。"
                : "Approach rate can only be changed from the home page."}
            </p>
          )}
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
