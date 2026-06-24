"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { joinWaitlist, type WaitlistState } from "./actions";

type Mode = "day" | "golden" | "night";

// Color tokens ported verbatim from the Wildhaven "DC" export.
const TOKENS: Record<Mode, Record<string, string>> = {
  day: {
    ink: "#2e3b2f", sub: "#39433a", accent: "#c8714a", kink: "#3f7a4f",
    kbg: "rgba(251,247,238,.82)", count: "#39433a", cardBg: "#ffffff",
    cardInk: "#3a261c", fieldBg: "#ffffff", fieldInk: "#2e3b2f",
    fieldBd: "#e6d3bd", btnInk: "#fbf7ee",
  },
  golden: {
    ink: "#3a261c", sub: "#4a3022", accent: "#d2613b", kink: "#9a4a23",
    kbg: "rgba(255,250,240,.78)", count: "#4a3022", cardBg: "rgba(255,250,240,.88)",
    cardInk: "#3a261c", fieldBg: "#ffffff", fieldInk: "#3a261c",
    fieldBd: "#e6d3bd", btnInk: "#fff6ec",
  },
  night: {
    ink: "#eef2f6", sub: "#c2cad6", accent: "#f0b46a", kink: "#dbe3ef",
    kbg: "rgba(20,28,42,.55)", count: "#c2cad6", cardBg: "rgba(18,26,40,.74)",
    cardInk: "#eef2f6", fieldBg: "rgba(255,255,255,.1)", fieldInk: "#eef2f6",
    fieldBd: "rgba(255,255,255,.22)", btnInk: "#1a2336",
  },
};

// ── Time → mode logic (ported from the export) ──────────────────────────────
function modeFromHour(h: number): Mode {
  if (h >= 8 && h < 17) return "day";
  if ((h >= 6 && h < 8) || (h >= 17 && h < 20)) return "golden";
  return "night";
}

function solarElevation(lat: number, _lon: number, date: Date): number {
  const rad = Math.PI / 180;
  const start = new Date(date.getFullYear(), 0, 0);
  const N = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const decl = 23.45 * Math.sin(rad * (360 / 365) * (284 + N));
  const lst = date.getHours() + date.getMinutes() / 60;
  const H = 15 * (lst - 12);
  return (
    Math.asin(
      Math.sin(rad * lat) * Math.sin(rad * decl) +
        Math.cos(rad * lat) * Math.cos(rad * decl) * Math.cos(rad * H)
    ) / rad
  );
}

function modeFromElev(e: number): Mode {
  if (e >= 8) return "day";
  if (e >= -2) return "golden";
  return "night";
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Deterministic pseudo-random so SSR and client agree (no hydration mismatch).
function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const STARS = (() => {
  const r = seeded(7);
  return Array.from({ length: 46 }, () => ({
    left: r() * 100,
    top: r() * 62,
    size: 1 + r() * 1.8,
    delay: r() * 4,
  }));
})();

// Front-meadow surface curve (matches the .ground ellipse) so trees and grass
// sit planted on the lifted disk instead of floating.
function meadow(x: number) {
  const f = (x - 50) / 58;
  const s = Math.sqrt(Math.max(0, 1 - f * f));
  return { crest: 72 - 22 * s, base: 72 + 22 * s };
}

// Crest of a given hill layer (matches the .hills ellipses) so trees sit on a
// hill's ridge rather than down on the front meadow.
function ridge(x: number, centerY: number, halfH: number) {
  const f = (x - 50) / 58;
  const s = Math.sqrt(Math.max(0, 1 - f * f));
  return centerY - halfH * s;
}

const TREES = (() => {
  const r = seeded(67);
  // A treeline along the back hill's ridge (the rear border of the terrain),
  // kept off the extreme edges so none sit too far out on the curve.
  return Array.from({ length: 12 }, () => {
    const left = 12 + r() * 76;
    const size = Math.round(20 + r() * 14);
    return {
      left,
      top: ridge(left, 61, 23) - size * 0.11,
      size,
      delay: r() * 3,
      dur: 6 + r() * 2,
      kind: r() > 0.62 ? "🌳" : "🌲",
    };
  }).sort((a, b) => a.top - b.top);
})();

// Cows + sheep scattered across the meadow in 2D — a fixed, wandering-looking
// arrangement that stays put when the scene changes.
function herd(
  n: number,
  seed: number,
  sizeMin: number,
  sizeRange: number,
  x0: number,
  x1: number
) {
  const r = seeded(seed);
  return Array.from({ length: n }, () => {
    const left = x0 + r() * (x1 - x0);
    const { crest, base } = meadow(left);
    return {
      left,
      top: crest + (0.15 + r() * 0.55) * (base - crest),
      size: Math.round(sizeMin + r() * sizeRange),
      delay: r() * 4,
    };
  });
}
const COWS = herd(3, 11, 28, 9, 40, 72);
const SHEEP = herd(10, 29, 17, 7, 8, 44);

export default function TimeOfDayHero({
  initialCount,
}: {
  initialCount: number | null;
}) {
  const [mode, setMode] = useState<Mode>("day");
  const [located, setLocated] = useState(false);
  const [timeLabel, setTimeLabel] = useState("");
  const [count, setCount] = useState<number | null>(initialCount);

  const [state, formAction] = useActionState(joinWaitlist, {
    status: "idle",
    message: "",
  } as WaitlistState);
  const joined = state.status === "success" || state.status === "already";

  // On mount: pick mode from the local clock.
  useEffect(() => {
    const now = new Date();
    setMode(modeFromHour(now.getHours()));
    setTimeLabel(fmtTime(now));
  }, []);

  // Optimistically bump the visible count once a signup actually lands.
  useEffect(() => {
    if (state.status === "success") setCount((c) => (c ?? 0) + 1);
  }, [state.status]);

  function pick(m: Mode) {
    setMode(m);
    setLocated(false);
  }

  function detect() {
    const now = new Date();
    const t = fmtTime(now);
    const finish = (m: Mode) => {
      setMode(m);
      setTimeLabel(t);
      setLocated(true);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          finish(
            modeFromElev(
              solarElevation(pos.coords.latitude, pos.coords.longitude, now)
            )
          ),
        () => finish(modeFromHour(now.getHours())),
        { timeout: 8000 }
      );
    } else {
      finish(modeFromHour(now.getHours()));
    }
  }

  const tk = TOKENS[mode];
  const word =
    mode === "day" ? "Daytime" : mode === "golden" ? "Golden hour" : "Night";
  const statusLabel = located
    ? `${word} · ${timeLabel}`
    : `${word} · preview`;

  const cssVars = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(tk).map(([k, v]) => [`--${k}`, v])
      ) as React.CSSProperties,
    [tk]
  );

  return (
    <div className="frame" style={cssVars}>
      <div className={`hero mode-${mode}`}>
        {/* ── Scenes (crossfade by opacity) ───────────────────────────── */}
        <div className="scene scene-day" aria-hidden>
          <div className="sky sky-day" />
          <div className="celestial sun-day" />
          <div className="cloud cloud-a" />
          <div className="cloud cloud-b" />
          <div className="bird" />
        </div>

        <div className="scene scene-golden" aria-hidden>
          <div className="sky sky-golden" />
          <div className="celestial sun-golden" />
          <div className="haze" />
        </div>

        <div className="scene scene-night" aria-hidden>
          <div className="sky sky-night" />
          <div className="stars">
            {STARS.map((s, i) => (
              <span
                key={i}
                className="star"
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: s.size,
                  height: s.size,
                  animationDelay: `${s.delay}s`,
                }}
              />
            ))}
          </div>
          <div className="celestial moon-night" />
        </div>

        {/* ── Shared foreground ───────────────────────────────────────── */}
        <div className="hills hills-back" aria-hidden />
        <div className="hills hills-mid" aria-hidden />
        <div className="ground" aria-hidden />

        {/* Trees scattered across the meadow */}
        <div className="trees" aria-hidden>
          {TREES.map((t, i) => (
            <span
              key={i}
              className="tree"
              style={{
                left: `${t.left}%`,
                top: `${t.top}%`,
                fontSize: t.size,
                animationDelay: `${t.delay}s`,
                animationDuration: `${t.dur}s`,
              }}
            >
              {t.kind}
            </span>
          ))}
        </div>

        {/* Cows + sheep — a fixed, scattered arrangement (they don't relocate) */}
        <div className="animals" aria-hidden>
          {COWS.map((c, i) => (
            <span
              key={`cow-${i}`}
              className="beast cow"
              style={{
                left: `${c.left}%`,
                top: `${c.top}%`,
                fontSize: c.size,
                animationDelay: `${c.delay}s`,
              }}
            >
              🐄
            </span>
          ))}
          {SHEEP.map((s, i) => (
            <span
              key={`sheep-${i}`}
              className="beast ewe"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                fontSize: s.size,
                animationDelay: `${s.delay}s`,
              }}
            >
              🐑
            </span>
          ))}
        </div>

        <div className="legibility" aria-hidden />

        {/* ── Control bar ─────────────────────────────────────────────── */}
        <div className="controlbar">
          <span className="status">{statusLabel}</span>
          <div className="controls">
            <div className="segmented" role="group" aria-label="Time of day">
              {(["day", "golden", "night"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`seg ${mode === m ? "seg-on" : ""}`}
                  aria-pressed={mode === m}
                  onClick={() => pick(m)}
                >
                  {m === "day" ? "Day" : m === "golden" ? "Dusk" : "Night"}
                </button>
              ))}
            </div>
            <button type="button" className="locate" onClick={detect}>
              Use my time
            </button>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <div className="content">
          <div className="kicker">Wildhaven · Sanctuary Simulator</div>
          <h1 className="headline">
            Build a refuge that wakes, glows, and sleeps with the world.
          </h1>
          <p className="subhead">
            Rescue animals, tend the land, and watch your sanctuary breathe
            through dawn, golden hour, and starlit nights. Be first through the
            gates.
          </p>

          <div className="card">
            {joined ? (
              <div className="confirm" role="status" aria-live="polite">
                <span className="confirm-emoji" aria-hidden>
                  🌿
                </span>
                <p>{state.message}</p>
              </div>
            ) : (
              <form action={formAction} className="form" noValidate>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  className="input"
                  aria-describedby="form-msg"
                />
                <SubmitButton />
              </form>
            )}
            {!joined && (
              <p
                id="form-msg"
                className={`msg ${
                  state.status === "error" ? "msg-error" : ""
                }`}
                role={state.status === "error" ? "alert" : undefined}
                aria-live="polite"
              >
                {state.status === "error"
                  ? state.message
                  : "No spam — just a note when the gates open."}
              </p>
            )}
          </div>

          {count ? (
            <div className="count">
              <strong>{count.toLocaleString("en-US")}</strong> sanctuary
              caretaker{count === 1 ? "" : "s"} already on the list
            </div>
          ) : null}

          <p className="foot">
            <span aria-hidden>🐾</span> Wildhaven — a cozy animal sanctuary sim.
          </p>
        </div>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="submit" disabled={pending}>
      {pending ? "Joining…" : "Join the waitlist"}
    </button>
  );
}
