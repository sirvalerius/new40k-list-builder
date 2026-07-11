import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArmyList, FactionIndexEntry, Rules } from './lib/types';
import { loadIndex, loadRules } from './lib/data';
import { emptyList } from './lib/helpers';
import { getList, saveList } from './lib/db';
import { Home } from './screens/Home';
import { NewListWizard } from './screens/NewListWizard';
import { Builder } from './screens/Builder';
import { Dispositions } from './screens/Dispositions';
import { Missions } from './screens/Missions';
import { FeedbackButton } from './components/FeedbackButton';

// Injected at build time by CI (minor = commit count on main); 'dev' locally.
const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'dev';
const BUILD_DATE = import.meta.env.VITE_BUILD_DATE as string | undefined;

type View =
  | { kind: 'home' }
  | { kind: 'wizard' }
  | { kind: 'builder'; list: ArmyList }
  | { kind: 'dispositions' }
  | { kind: 'missions'; disposition?: string };

export default function App() {
  const [rules, setRules] = useState<Rules | null>(null);
  const [factions, setFactions] = useState<FactionIndexEntry[] | null>(null);
  const [view, setView] = useState<View>({ kind: 'home' });
  const [error, setError] = useState<string | null>(null);

  // Autosave debounce timer.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest edited list, so a bug report can attach the current list as context.
  const currentList = useRef<ArmyList | null>(null);

  // Keep fixed contextual controls (FAB, summary bar) pinned to the VISUAL viewport during
  // pinch-zoom on mobile, so they stay reachable and constant-size instead of drifting/scaling
  // with the zoom. No-op (identity transform) at normal zoom and where visualViewport is absent.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const update = () => {
      // Only counteract the viewport while actually pinch-zoomed; at normal zoom keep an exact
      // identity transform so the fixed bars don't drift/overflow from sub-pixel width diffs.
      const zoomed = vv.scale > 1.01;
      root.style.setProperty('--vv-dx', zoomed ? `${vv.offsetLeft + vv.width - window.innerWidth}px` : '0px');
      root.style.setProperty('--vv-dy', zoomed ? `${vv.offsetTop + vv.height - window.innerHeight}px` : '0px');
      root.style.setProperty('--vv-scale', zoomed ? `${1 / vv.scale}` : '1');
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  useEffect(() => {
    Promise.all([loadRules(), loadIndex()])
      .then(([r, idx]) => {
        setRules(r);
        setFactions(idx.factions);
      })
      .catch((e) => setError(String(e)));
  }, []);

  const factionName = useCallback(
    (id: string) => factions?.find((f) => f.id === id)?.name ?? id,
    [factions],
  );

  const onListChange = useCallback((l: ArmyList) => {
    currentList.current = l;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveList(l).catch(() => {});
    }, 400);
  }, []);

  async function openList(id: string) {
    const l = await getList(id);
    if (l) {
      currentList.current = l;
      setView({ kind: 'builder', list: l });
    }
  }

  function createList(factionId: string, battleSizeId: string, name: string) {
    const l = emptyList(factionId, battleSizeId, name);
    currentList.current = l;
    saveList(l).catch(() => {});
    setView({ kind: 'builder', list: l });
  }

  if (error) {
    return (
      <div className="app">
        <div className="content">
          <div className="banner bad">Failed to load data: {error}</div>
        </div>
      </div>
    );
  }

  if (!rules || !factions) {
    return (
      <div className="app">
        <div className="content">
          <div className="spin" />
          <div className="center muted">Consulting the archives…</div>
        </div>
      </div>
    );
  }

  const title =
    view.kind === 'builder'
      ? view.list.name
      : view.kind === 'wizard'
      ? 'New list'
      : view.kind === 'dispositions'
      ? 'Detachments & Dispositions'
      : view.kind === 'missions'
      ? 'Missions'
      : 'New40k List Builder';
  const subtitle =
    view.kind === 'builder'
      ? `${factionName(view.list.factionId)} · ${
          rules.battle_sizes.find((b) => b.id === view.list.battleSizeId)?.name ??
          ''
        }`
      : '11th edition · #new40k';

  return (
    <div className="app">
      <header className="topbar no-print">
        {view.kind !== 'home' && (
          <button
            className="ghost iconbtn"
            aria-label="Back"
            onClick={() => {
              currentList.current = null;
              // missions opened from the dispositions table goes back there, not home
              setView(
                view.kind === 'missions' && view.disposition
                  ? { kind: 'dispositions' }
                  : { kind: 'home' },
              );
            }}
          >
            ←
          </button>
        )}
        <span className="aquila" aria-hidden>
          ✠
        </span>
        <div className="title">
          {title}
          <small>{subtitle}</small>
        </div>
        <FeedbackButton
          context={`${title} — ${subtitle}`}
          getList={() => currentList.current}
        />
      </header>

      <main className="content">
        {view.kind === 'home' && (
          <Home
            rules={rules}
            factionName={factionName}
            onNew={() => setView({ kind: 'wizard' })}
            onOpen={openList}
            onDispositions={() => setView({ kind: 'dispositions' })}
            onMissions={() => setView({ kind: 'missions' })}
          />
        )}
        {view.kind === 'dispositions' && (
          <Dispositions
            factions={factions}
            onOpenMissions={(disposition) => setView({ kind: 'missions', disposition })}
          />
        )}
        {view.kind === 'missions' && <Missions rules={rules} initial={view.disposition} />}
        {view.kind === 'wizard' && (
          <NewListWizard
            rules={rules}
            factions={factions}
            onCreate={createList}
            onCancel={() => setView({ kind: 'home' })}
          />
        )}
        {view.kind === 'builder' && (
          <Builder
            key={view.list.id}
            initial={view.list}
            rules={rules}
            onChange={onListChange}
          />
        )}

        {view.kind !== 'builder' && (
          <footer className="footer">
            <div className="credit">
              Designed &amp; built by{' '}
              <a href="https://alhazred.sh" target="_blank" rel="noopener noreferrer">
                Alhazred.sh
              </a>
            </div>
            <div>
              <b>Powered by Wahapedia.</b>
            </div>
            <div>
              Unofficial, fan-made tool. Not affiliated with or endorsed by Games
              Workshop. Warhammer 40,000 and all associated names are trademarks
              of Games Workshop Ltd.
            </div>
            <div>{rules.attribution}</div>
            <div className="version">
              {APP_VERSION}
              {BUILD_DATE ? ` · updated ${BUILD_DATE}` : ''}
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}
