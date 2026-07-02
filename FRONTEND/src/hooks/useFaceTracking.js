import { useRef, useEffect, useState, useCallback } from "react";

/* ─── Configuration ───────────────────────────────────── */
const TARGET_FPS = 15;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
const LOOK_AWAY_WARNING_MS = 3000;   // warn after 3 s of looking away
const FACE_GONE_WARNING_MS = 3000;   // warn after 3 s of face missing
const GAZE_H_THRESHOLD = 0.17;       // normalised horizontal deviation
const GAZE_V_DOWN_THRESHOLD = 0.18;  // normalised downward deviation

const WARNING_MSGS = [
  "⚠️ Please maintain eye contact with the screen.",
  "⚠️ You are repeatedly looking away. Please focus on the interview.",
  "🚨 Final Warning. Continued distraction may affect your interview evaluation.",
];

/* ─── Helper: dynamic <script> loader ─────────────────── */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.crossOrigin = "anonymous";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ─── Main Hook ───────────────────────────────────────── */
/**
 * useFaceTracking
 *
 * @param {object} opts
 * @param {React.RefObject} opts.videoRef  — <video> element showing the candidate
 * @param {boolean}         opts.isActive  — start/stop the tracking loop
 *
 * @returns {{
 *   faceDetected: boolean,
 *   gazeDirection: string,        // 'center' | 'left' | 'right' | 'down' | 'none'
 *   warningCount: number,
 *   warningMessage: string,
 *   attentionStats: object,
 *   isTrackerReady: boolean,
 *   getAttentionReport: () => object
 * }}
 */
export function useFaceTracking({ videoRef, isActive }) {
  const [faceDetected, setFaceDetected]     = useState(true);
  const [gazeDirection, setGazeDirection]   = useState("center");
  const [warningCount, setWarningCount]     = useState(0);
  const [warningMessage, setWarningMessage] = useState("");
  const [isTrackerReady, setIsTrackerReady] = useState(false);
  const [attentionStats, setAttentionStats] = useState({
    eyeContactScore: 100,
    faceVisibilityPct: 100,
    attentionScore: 100,
    totalWarnings: 0,
    lookAwayDurationMs: 0,
  });

  /* ── Internal refs (no re-render needed) ── */
  const faceMeshRef         = useRef(null);
  const rafRef              = useRef(null);
  const lastFrameRef        = useRef(0);
  const warningCountRef     = useRef(0);
  const cooldownRef         = useRef(false);   // prevents warning spam
  const lookAwayStartRef    = useRef(null);    // timestamp: started looking away
  const faceGoneStartRef    = useRef(null);    // timestamp: face disappeared
  const startTimeRef        = useRef(null);

  const metricsRef = useRef({
    totalFrames: 0,
    faceVisibleFrames: 0,
    onScreenFrames: 0,
    lookAwayMs: 0,
  });

  /* ── Warning emitter ───────────────────────────────── */
  const emitWarning = useCallback((msg) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;

    const next = Math.min(warningCountRef.current + 1, 3);
    warningCountRef.current = next;
    setWarningCount(next);
    setWarningMessage(msg);
    setAttentionStats((p) => ({ ...p, totalWarnings: next }));

    // Auto-dismiss after 5 s, then 4 s cooldown before next warning
    setTimeout(() => {
      setWarningMessage("");
      setTimeout(() => { cooldownRef.current = false; }, 4000);
    }, 5000);
  }, []);

  /* ── Frame result processor ────────────────────────── */
  const handleResults = useCallback(
    (results) => {
      const m = metricsRef.current;
      m.totalFrames++;

      /* No face detected ──────────────────────────── */
      if (!results.multiFaceLandmarks?.length) {
        setFaceDetected(false);
        setGazeDirection("none");
        lookAwayStartRef.current = null; // reset look-away timer

        if (!faceGoneStartRef.current) faceGoneStartRef.current = Date.now();
        if (Date.now() - faceGoneStartRef.current >= FACE_GONE_WARNING_MS) {
          emitWarning("📵 Camera lost. Please return to the camera.");
          faceGoneStartRef.current = null;
        }
        return;
      }

      /* Face present ──────────────────────────────── */
      setFaceDetected(true);
      faceGoneStartRef.current = null;
      m.faceVisibleFrames++;

      const lm = results.multiFaceLandmarks[0];

      // Key landmark indices (MediaPipe Face Mesh 468-point model)
      const noseTip    = lm[1];
      const leftCheek  = lm[234];
      const rightCheek = lm[454];
      const forehead   = lm[10];
      const chin       = lm[152];

      const faceW = Math.abs(rightCheek.x - leftCheek.x);
      const faceH = Math.abs(chin.y - forehead.y);
      if (faceW < 0.04) { return; } // face is too small / at edge

      const centerX = (leftCheek.x + rightCheek.x) / 2;
      const centerY = (forehead.y + chin.y) / 2;

      const noseOffsetX = (noseTip.x - centerX) / faceW;
      const noseOffsetY = (noseTip.y - centerY) / faceH;

      let dir = "center";
      if (noseOffsetX > GAZE_H_THRESHOLD) dir = "right";
      else if (noseOffsetX < -GAZE_H_THRESHOLD) dir = "left";
      else if (noseOffsetY > GAZE_V_DOWN_THRESHOLD) dir = "down";

      setGazeDirection(dir);

      /* On-screen ───────────────────────────────── */
      if (dir === "center") {
        m.onScreenFrames++;
        if (lookAwayStartRef.current) {
          // Record look-away duration
          m.lookAwayMs += Date.now() - lookAwayStartRef.current;
          lookAwayStartRef.current = null;
        }
      } else {
        /* Looking away ──────────────────────────── */
        if (!lookAwayStartRef.current) lookAwayStartRef.current = Date.now();
        const elapsed = Date.now() - lookAwayStartRef.current;
        if (elapsed >= LOOK_AWAY_WARNING_MS && !cooldownRef.current) {
          const idx = Math.min(warningCountRef.current, WARNING_MSGS.length - 1);
          emitWarning(WARNING_MSGS[idx]);
          m.lookAwayMs += elapsed;
          lookAwayStartRef.current = null;
        }
      }

      /* Update attention stats every 15 frames ── */
      if (m.totalFrames % 15 === 0 && m.totalFrames > 0) {
        const fvPct = Math.round((m.faceVisibleFrames / m.totalFrames) * 100);
        const ecPct = Math.round((m.onScreenFrames / Math.max(m.faceVisibleFrames, 1)) * 100);
        setAttentionStats((p) => ({
          ...p,
          faceVisibilityPct: fvPct,
          eyeContactScore: ecPct,
          attentionScore: Math.round((fvPct + ecPct) / 2),
          lookAwayDurationMs: m.lookAwayMs,
        }));
      }
    },
    [emitWarning]
  );

  /* ── MediaPipe initialisation & detection loop ─── */
  useEffect(() => {
    if (typeof window === "undefined" || !isActive) return;

    let alive = true;

    const init = async () => {
      try {
        await loadScript(
          "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js"
        );
        if (!alive || !window.FaceMesh) return;

        const fm = new window.FaceMesh({
          locateFile: (f) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${f}`,
        });

        fm.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false,
          minDetectionConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });
        fm.onResults(handleResults);
        await fm.initialize();

        faceMeshRef.current = fm;
        startTimeRef.current = Date.now();
        setIsTrackerReady(true);

        /* RAF loop at TARGET_FPS ──────────────── */
        const loop = async (ts) => {
          if (!alive) return;
          if (
            ts - lastFrameRef.current >= FRAME_INTERVAL_MS &&
            videoRef.current?.readyState >= 2
          ) {
            lastFrameRef.current = ts;
            try {
              await faceMeshRef.current?.send({ image: videoRef.current });
            } catch {
              /* silent — frame dropped */
            }
          }
          if (alive) rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        // Face tracking is optional — interview continues without it
        console.warn("[useFaceTracking] Init failed (non-critical):", err?.message);
      }
    };

    init();

    return () => {
      alive = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      faceMeshRef.current?.close?.();
      faceMeshRef.current = null;
    };
  }, [isActive, handleResults, videoRef]);

  /* ── Report generator (called on call-end) ──────── */
  const getAttentionReport = useCallback(() => {
    const { totalFrames, faceVisibleFrames, onScreenFrames, lookAwayMs } =
      metricsRef.current;

    const fvPct = totalFrames > 0
      ? Math.round((faceVisibleFrames / totalFrames) * 100)
      : 100;
    const ecPct = faceVisibleFrames > 0
      ? Math.round((onScreenFrames / faceVisibleFrames) * 100)
      : 100;
    const attScore = Math.round((fvPct + ecPct) / 2);
    const durationMin = startTimeRef.current
      ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000))
      : 0;

    return {
      eyeContactScore:       Math.round(ecPct / 10),   // 0–10
      faceVisibilityPct:     fvPct,                     // 0–100 %
      attentionScore:        Math.round(attScore / 10), // 0–10
      totalWarnings:         warningCountRef.current,
      lookAwayDurationSec:   Math.round(lookAwayMs / 1000),
      interviewDurationMin:  durationMin,
    };
  }, []);

  return {
    faceDetected,
    gazeDirection,
    warningCount,
    warningMessage,
    attentionStats,
    isTrackerReady,
    getAttentionReport,
  };
}
