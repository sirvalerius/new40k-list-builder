import { useState } from 'react';
import { Modal } from './Modal';

// Configured at build time (CI sets it from the FEEDBACK_URL repo variable). When unset,
// the button is hidden, so the app works fine before the Worker is deployed.
const FEEDBACK_URL = import.meta.env.VITE_FEEDBACK_URL as string | undefined;

export function FeedbackButton({ context }: { context?: string }) {
  const [open, setOpen] = useState(false);
  if (!FEEDBACK_URL) return null;
  return (
    <>
      <button
        className="ghost iconbtn"
        aria-label="Segnala un bug"
        title="Segnala un bug"
        onClick={() => setOpen(true)}
      >
        🐞
      </button>
      {open && <FeedbackModal context={context} onClose={() => setOpen(false)} />}
    </>
  );
}

function FeedbackModal({
  context,
  onClose,
}: {
  context?: string;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [hp, setHp] = useState(''); // honeypot
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function submit() {
    const message = text.trim();
    if (!message || state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch(FEEDBACK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: `${context ?? ''} · ${navigator.userAgent}`.slice(0, 500),
          website: hp,
        }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <Modal
      title="Segnala un bug"
      onClose={onClose}
      footer={
        state === 'done' ? (
          <button className="primary" style={{ width: '100%' }} onClick={onClose}>
            Chiudi
          </button>
        ) : (
          <div className="row">
            <button className="ghost" onClick={onClose}>
              Annulla
            </button>
            <div className="spacer" />
            <button
              className="primary"
              disabled={!text.trim() || state === 'sending'}
              onClick={submit}
            >
              {state === 'sending' ? 'Invio…' : 'Invia'}
            </button>
          </div>
        )
      }
    >
      {state === 'done' ? (
        <div className="banner ok">Grazie! Il feedback è stato registrato.</div>
      ) : (
        <>
          <p className="muted small">
            Descrivi il bug o il suggerimento. Verrà aggiunto a <code>FEEDBACK.md</code>{' '}
            nella repository.
          </p>
          <textarea
            className="fb-text"
            placeholder="Cosa è andato storto? Cosa stavi facendo?"
            value={text}
            maxLength={4000}
            onChange={(e) => setText(e.target.value)}
          />
          {/* honeypot: hidden from humans, bots tend to fill it */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
            aria-hidden
          />
          {state === 'error' && (
            <div className="banner bad mt">Invio fallito. Riprova tra poco.</div>
          )}
        </>
      )}
    </Modal>
  );
}
