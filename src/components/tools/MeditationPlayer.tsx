import { useEffect, useState } from 'preact/hooks';
import { primary, secondary, note } from './ui';

interface Practice {
  id: string;
  folder: string;
  folderSummary: string;
  title: string;
  minutes: string;
  lines: string[];
}

interface Props {
  practices: Practice[];
  noVoiceText: string;
}

/** Practice folders; a practice opens as text, and can be read aloud where Hebrew speech exists. */
export default function MeditationPlayer({ practices, noVoiceText }: Props) {
  const folders = [...new Map(practices.map((p) => [p.folder, p.folderSummary])).entries()];
  const [openId, setOpenId] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [noVoice, setNoVoice] = useState(false);
  const current = practices.find((p) => p.id === openId);

  // Voices load asynchronously (Chrome/Android return [] at first): keep the list fresh.
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const refresh = () => setVoices(synth.getVoices());
    refresh();
    synth.addEventListener('voiceschanged', refresh);
    return () => {
      synth.removeEventListener('voiceschanged', refresh);
      setNoVoice(false);
    synth.cancel();
    };
  }, []);

  function speak() {
    const synth = window.speechSynthesis;
    const all = voices.length ? voices : (synth?.getVoices() ?? []);
    const voice = all.find((v) => v.lang.toLowerCase().startsWith('he'));
    if (!synth || !current || !voice) {
      setNoVoice(true);
      return;
    }
    setNoVoice(false);
    synth.cancel();
    const u = new SpeechSynthesisUtterance(current.lines.join('\n'));
    u.lang = 'he-IL';
    u.voice = voice;
    u.rate = 0.85;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  }
  function stop() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }
  function close() {
    stop();
    setOpenId(null);
    setNoVoice(false);
  }

  if (current) {
    return (
      <div class="mt-4 rounded-card bg-sky p-4">
        <button type="button" class={secondary} onClick={close}>חזרה לתרגולים</button>
        <h4 class="mt-4 font-display text-card font-medium">{current.title}</h4>
        <p class="text-small text-ink-2">{current.minutes}</p>
        <div class="mt-3 flex flex-wrap gap-2">
          {!speaking ? <button type="button" class={primary} onClick={speak}>השמעה בקול</button> : <button type="button" class={primary} onClick={stop}>עצירה</button>}
        </div>
        {noVoice && <p class={note} role="status">{noVoiceText}</p>}
        <div class="mt-4 grid gap-2.5 text-lead">
          {current.lines.map((l, i) => <p key={i}>{l}</p>)}
        </div>
      </div>
    );
  }
  return (
    <div class="mt-4 grid gap-5">
      {folders.map(([folder, summary]) => (
        <section key={folder}>
          {folder && <h4 class="font-display text-card font-medium">{folder}</h4>}
          {summary && <p class="text-small text-ink-2">{summary}</p>}
          <ul class="mt-2 border-t border-line">
            {practices.filter((p) => p.folder === folder).map((p) => (
              <li key={p.id} class="border-b border-line">
                <button type="button" onClick={() => setOpenId(p.id)} class="flex min-h-11 w-full items-center justify-between gap-3 py-2.5 text-start font-semibold hover:text-go">
                  <span>{p.title}</span>
                  <span class="text-small font-normal text-ink-2">{p.minutes}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
