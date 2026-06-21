import { useState } from 'react';
import type { ArmyList } from '../lib/types';
import { Modal } from './Modal';

// Configured at build time (CI sets it from the FEEDBACK_URL repo variable). When unset,
// the button is hidden, so the app works fine before the Worker is deployed.
const FEEDBACK_URL = import.meta.env.VITE_FEEDBACK_URL as string | undefined;

export function FeedbackButton({
  context,
  getList,
}: {
  context?: string;
  getList?: () => ArmyList | null;
}) {
  const [open, setOpen] = useState(false);
  if (!FEEDBACK_URL) return null;
  return (
    <>
      <button
        className="ghost iconbtn"
        aria-label="Report a bug"
        title="Report a bug"
        onClick={() => setOpen(true)}
      >
        🐞
      </button>
      {open && (
        <FeedbackModal
          context={context}
          getList={getList}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function FeedbackModal({
  context,
  getList,
  onClose,
}: {
  context?: string;
  getList?: () => ArmyList | null;
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
      const list = getList?.() ?? null;
      const res = await fetch(FEEDBACK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: `${context ?? ''} · ${navigator.userAgent}`.slice(0, 500),
          // current list attached so bugs can be reproduced from the exact roster
          list: list ? JSON.stringify(list, null, 2) : '',
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
      title="Report a bug"
      onClose={onClose}
      footer={
        state === 'done' ? (
          <button className="primary" style={{ width: '100%' }} onClick={onClose}>
            Close
          </button>
        ) : (
          <div className="row">
            <button className="ghost" onClick={onClose}>
              Cancel
            </button>
            <div className="spacer" />
            <button
              className="primary"
              disabled={!text.trim() || state === 'sending'}
              onClick={submit}
            >
              {state === 'sending' ? 'Sending…' : 'Send'}
            </button>
          </div>
        )
      }
    >
      {state === 'done' ? (
        <div className="banner ok">Thanks — your feedback was recorded.</div>
      ) : (
        <>
          <p className="muted small">
            Describe the bug or suggestion. It's appended to <code>FEEDBACK.md</code>{' '}
            in the repository.
          </p>
          <textarea
            className="fb-text"
            placeholder="What went wrong? What were you doing?"
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
            <div className="banner bad mt">Couldn't send. Try again shortly.</div>
          )}
        </>
      )}
    </Modal>
  );
}
