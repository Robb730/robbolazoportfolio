// Lightweight universal STT capability detection + MediaRecorder helpers.
// Web Speech (SpeechRecognition) works on desktop Chrome/Edge + Safari iOS 14.5+,
// but iOS Chrome/Firefox (WKWebView) never exposes it. MediaRecorder is available
// almost everywhere for capture, but requires a server for transcription.
// This module keeps detection centralized so UI shows a single coherent banner.

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isSecureContext() {
  if (typeof window === "undefined") return false;
  return Boolean(window.isSecureContext);
}

export function hasWebSpeech() {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function hasGetUserMedia() {
  if (typeof navigator === "undefined") return false;
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

export function hasMediaRecorder() {
  if (typeof window === "undefined") return false;
  return Boolean(window.MediaRecorder);
}

export function getSupportedAudioMime() {
  if (typeof window === "undefined" || !window.MediaRecorder) return null;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
    "audio/ogg;codecs=opus",
  ];
  for (const t of candidates) {
    try { if (MediaRecorder.isTypeSupported(t)) return t; } catch {}
  }
  return "";
}

export function getSttSupport({ hasVoiceKey }) {
  const secure = isSecureContext();
  const ios = isIOS();
  const webSpeech = hasWebSpeech();
  // On iOS, getUserMedia requires secure context. On desktop, it works on localhost.
  const canGetUserMedia = hasGetUserMedia() && secure;
  const mediaRecorder = hasMediaRecorder() && canGetUserMedia;
  // TTS (voice replies) only needs ElevenLabs key.
  const ttsSupported = Boolean(hasVoiceKey);
  // STT is available if either Web Speech or capture is available.
  const sttSupported = webSpeech || mediaRecorder;
  const sttMode = webSpeech ? "webspeech" : mediaRecorder ? "mediarecorder" : "none";
  return { webSpeech, mediaRecorder, ttsSupported, sttSupported, sttMode, ios, secure, canGetUserMedia };
}
