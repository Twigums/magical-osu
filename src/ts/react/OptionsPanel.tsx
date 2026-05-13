import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  AR_MIN, AR_MAX, arToMs, VOLUME_MIN, VOLUME_MAX, VOLUME_STEP,
  CURSOR_SIZE_MIN, CURSOR_SIZE_MAX,
  TRAIL_FADE_MIN, TRAIL_FADE_MAX,
} from "../core/settings";
import { useApproachRate, useVolume, useHitsoundVolume, useHiddenMod, useCursorSize, useCursorR, useCursorG, useCursorB, useTrailFadeSpeed } from "./hooks/useSettings";
import { ApproachPreview } from "./ApproachPreview";
import { CursorPreview } from "./CursorPreview";
import { ColorPicker } from "./ColorPicker";
import { useLang } from "./hooks/useLang";

interface Props {
  isSongPage?: boolean;
}

const sliderFill = (val: number, min: number, max: number): CSSProperties =>
  ({ '--fill': `${((val - min) / (max - min)) * 100}%` } as CSSProperties);

export function OptionsPanel({ isSongPage = false }: Props) {
  const [open, setOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setExiting(true);
    exitTimer.current = setTimeout(() => {
      setOpen(false);
      setExiting(false);
    }, 240);
  }, []);

  useEffect(() => () => {
    if (exitTimer.current !== null) clearTimeout(exitTimer.current);
  }, []);

  const [ar, setAr] = useApproachRate();
  const [vol, setVol] = useVolume();
  const [hsVol, setHsVol] = useHitsoundVolume();
  const [hidden, setHidden] = useHiddenMod();
  const [cursorSize, setCursorSize]         = useCursorSize();
  const [cursorR, setCursorR]               = useCursorR();
  const [cursorG, setCursorG]               = useCursorG();
  const [cursorB, setCursorB]               = useCursorB();
  const [trailFadeSpeed, setTrailFadeSpeed] = useTrailFadeSpeed();
  const lang = useLang();

  useEffect(() => {
    const btn = document.getElementById("settings-btn");
    const handleOpen = () => setOpen(true);
    btn?.addEventListener("click", handleOpen);
    return () => btn?.removeEventListener("click", handleOpen);
  }, []);

  const handleColorChange = useCallback((r: number, g: number, b: number): void => {
    setCursorR(r);
    setCursorG(g);
    setCursorB(b);
  }, [setCursorR, setCursorG, setCursorB]);

  const [modsOpen, setModsOpen]       = useState(() => localStorage.getItem("modsAccordionOpen") === "true");
  const [notesOpen, setNotesOpen]     = useState(() => localStorage.getItem("notesAccordionOpen") !== "false");
  const [cursorOpen, setCursorOpen]   = useState(() => localStorage.getItem("cursorAccordionOpen") !== "false");

  if (!open) return null;

  const ms   = Math.round(arToMs(ar));
  const isJp = lang === "jp";

  return (
    <div className={`options-backdrop${exiting ? " exiting" : ""}`} onClick={close}>
      <div className={`options-panel${exiting ? " exiting" : ""}`} onClick={e => e.stopPropagation()}>

        <button
          className="options-close"
          onClick={close}
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
            style={sliderFill(vol, VOLUME_MIN, VOLUME_MAX)}
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
            style={sliderFill(hsVol, VOLUME_MIN, VOLUME_MAX)}
            onChange={e => setHsVol(Number(e.target.value))}
          />
        </div>

        <div className={`options-accordion${modsOpen ? " options-accordion--open" : ""}`}>
          <button
            className="options-accordion-summary"
            onClick={() => {
              const v = !modsOpen;
              setModsOpen(v);
              localStorage.setItem("modsAccordionOpen", String(v));
            }}
          >
            <span>{isJp ? "MOD" : "Mods"}</span>
            <span className="options-accordion-chevron">▾</span>
          </button>
          <div className="options-accordion-body">
            <div className="options-accordion-body-inner">
              <div className="options-row options-row--mod">
                <label className="options-mod-label">
                  <input
                    type="checkbox"
                    className="options-mod-checkbox"
                    checked={hidden}
                    onChange={e => setHidden(e.target.checked)}
                  />
                  <span>{isJp ? "ヒドゥン" : "Hidden"}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className={`options-accordion${notesOpen ? " options-accordion--open" : ""}`}>
          <button
            className="options-accordion-summary"
            onClick={() => {
              const v = !notesOpen;
              setNotesOpen(v);
              localStorage.setItem("notesAccordionOpen", String(v));
            }}
          >
            <span>{isJp ? "ノーツ" : "Notes"}</span>
            <span className="options-accordion-chevron">▾</span>
          </button>
          <div className="options-accordion-body">
            <div className="options-accordion-body-inner">

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
                  style={sliderFill(ar, AR_MIN, AR_MAX)}
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
                <ApproachPreview ar={ar} hidden={hidden} />
              </div>

            </div>
          </div>
        </div>

        <div className={`options-accordion${cursorOpen ? " options-accordion--open" : ""}`}>
          <button
            className="options-accordion-summary"
            onClick={() => {
              const v = !cursorOpen;
              setCursorOpen(v);
              localStorage.setItem("cursorAccordionOpen", String(v));
            }}
          >
            <span>{isJp ? "カーソル" : "Cursor"}</span>
            <span className="options-accordion-chevron">▾</span>
          </button>
          <div className="options-accordion-body">
            <div className="options-accordion-body-inner">

              <div className="options-row">
                <label className="options-label">
                  <span>{isJp ? "カーソルサイズ" : "Cursor Size"}</span>
                  <span className="options-setting-value">{cursorSize}</span>
                </label>
                <input
                  type="range"
                  className="options-slider"
                  min={CURSOR_SIZE_MIN}
                  max={CURSOR_SIZE_MAX}
                  step={1}
                  value={cursorSize}
                  style={sliderFill(cursorSize, CURSOR_SIZE_MIN, CURSOR_SIZE_MAX)}
                  onChange={e => setCursorSize(Number(e.target.value))}
                />
              </div>

              <div className="options-row">
                <label className="options-label">
                  <span>{isJp ? "カーソルカラー" : "Cursor Color"}</span>
                </label>
                <ColorPicker r={cursorR} g={cursorG} b={cursorB} onChange={handleColorChange} />
              </div>

              <div className="options-row">
                <label className="options-label">
                  <span>{isJp ? "トレイルフェード" : "Trail Fade Speed"}</span>
                  <span className="options-setting-value">{trailFadeSpeed}</span>
                </label>
                <input
                  type="range"
                  className="options-slider"
                  min={TRAIL_FADE_MIN}
                  max={TRAIL_FADE_MAX}
                  step={1}
                  value={trailFadeSpeed}
                  style={sliderFill(trailFadeSpeed, TRAIL_FADE_MIN, TRAIL_FADE_MAX)}
                  onChange={e => setTrailFadeSpeed(Number(e.target.value))}
                />
              </div>

              <p className="options-preview-label">
                {isJp ? "プレビュー" : "Preview"}
              </p>
              <div className="options-preview-wrap">
                <CursorPreview r={cursorR} g={cursorG} b={cursorB} cursorSize={cursorSize} trailFadeSpeed={trailFadeSpeed} />
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
