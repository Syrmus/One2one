// Text-to-speech via the browser's Web Speech API — no backend, uses the
// device's installed voices. Must be triggered by a user gesture (a tap) to
// satisfy mobile autoplay rules; the word popover's speaker button does that.

const LANG_BCP47: Record<string, string> = {
  de: "de-DE",
  nl: "nl-NL",
  es: "es-ES",
  en: "en-US",
  ru: "ru-RU",
};

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Voices load asynchronously; touch getVoices() early so the cache is warm by
// the time the user taps.
if (isSpeechSupported()) {
  window.speechSynthesis.getVoices();
}

export function speak(text: string, lang: string): void {
  if (!isSpeechSupported() || !text.trim()) return;
  const synth = window.speechSynthesis;
  synth.cancel(); // interrupt anything currently playing
  const bcp = LANG_BCP47[lang] ?? lang;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = bcp;
  utter.rate = 0.95;
  const voices = synth.getVoices();
  const voice =
    voices.find((v) => v.lang === bcp) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
  if (voice) utter.voice = voice;
  synth.speak(utter);
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
