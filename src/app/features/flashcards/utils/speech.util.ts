/**
 * Lettura ad alta voce via Web Speech API: nessun backend, nessun costo.
 * Serve per ripassare a mani libere (in metro, camminando).
 */
const LANG = 'it-IT';

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Voce italiana se disponibile, altrimenti lascia scegliere al sistema. */
function italianVoice(): SpeechSynthesisVoice | undefined {
  return speechSynthesis.getVoices().find((voice) => voice.lang.startsWith('it'));
}

export function speak(text: string, onEnd?: () => void): void {
  if (!isSpeechSupported() || !text.trim()) {
    onEnd?.();
    return;
  }

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG;
  utterance.rate = 1;
  const voice = italianVoice();
  if (voice) {
    utterance.voice = voice;
  }
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) {
    speechSynthesis.cancel();
  }
}
