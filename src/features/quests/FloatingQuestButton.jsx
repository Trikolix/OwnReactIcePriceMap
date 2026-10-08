import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Check, Trophy } from 'lucide-react';
import { clampQuestPosition, currentQuestChapter } from './progress.mjs';

const viewport = () => ({ width: window.visualViewport?.width || window.innerWidth, height: window.visualViewport?.height || window.innerHeight });
const readPosition = key => {
  try { return clampQuestPosition(JSON.parse(localStorage.getItem(key)), viewport()); }
  catch { return clampQuestPosition(null, viewport()); }
};

export default function FloatingQuestButton({ quest, userId, unread, onOpen }) {
  const storageKey = `iceapp:quest-position:${userId}:${quest.id}`;
  const [position, setPosition] = useState(() => readPosition(storageKey));
  const [dragging, setDragging] = useState(false);
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  useEffect(() => { setPosition(readPosition(storageKey)); }, [storageKey]);
  useEffect(() => () => gesture.current?.cleanup(), []);
  useEffect(() => {
    const resize = () => setPosition(previous => clampQuestPosition(previous, viewport()));
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); window.visualViewport?.removeEventListener('resize', resize); };
  }, []);
  const save = value => { try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* Keep dragging available. */ } };
  const chapter = currentQuestChapter(quest);
  const done = chapter.tasks.filter(task => task.complete).length;
  const complete = quest.chapters.every(item => item.awarded);
  const finish = (event, cancelled = false) => {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    start.cleanup();
    gesture.current = null; setDragging(false);
    suppressClick.current = start.moved || cancelled;
    if (cancelled) { setPosition(start.position); return; }
    if (start.moved) {
      const next = clampQuestPosition({ x: start.position.x + event.clientX - start.x, y: start.position.y + event.clientY - start.y }, viewport());
      setPosition(next); save(next);
    }
  };
  return <>
    <Launcher type="button" data-testid="floating-quest" $dragging={dragging} style={{ left: position.x, top: position.y, '--quest-progress': `${done / chapter.tasks.length * 360}deg` }}
      aria-label={`${quest.title} öffnen – ${chapter.title}, ${done} von ${chapter.tasks.length} Aufgaben${unread ? ', neuer Fortschritt' : ''}`}
      aria-haspopup="dialog" aria-describedby="quest-drag-help" title="Kapitel öffnen · zum Verschieben ziehen"
      onPointerDown={event => {
        if (event.button !== 0 || gesture.current) return;
        suppressClick.current = false;
        const start = { id: event.pointerId, x: event.clientX, y: event.clientY, position, moved: false };
        const move = pointer => {
          if (pointer.pointerId !== start.id) return;
          const dx = pointer.clientX - start.x, dy = pointer.clientY - start.y;
          if (!start.moved && Math.hypot(dx, dy) < 6) return;
          start.moved = true; setDragging(true);
          setPosition(clampQuestPosition({ x: start.position.x + dx, y: start.position.y + dy }, viewport()));
        };
        const end = pointer => finish(pointer);
        const cancel = pointer => finish(pointer, true);
        const blur = () => finish({ pointerId: start.id }, true);
        start.cleanup = () => {
          window.removeEventListener('pointermove', move, true); window.removeEventListener('pointerup', end, true);
          window.removeEventListener('pointercancel', cancel, true); window.removeEventListener('blur', blur);
        };
        gesture.current = start;
        // Track the whole gesture even if the browser does not retain pointer capture.
        window.addEventListener('pointermove', move, true); window.addEventListener('pointerup', end, true);
        window.addEventListener('pointercancel', cancel, true); window.addEventListener('blur', blur);
        try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Window listeners cover this gesture. */ }
      }}
      onLostPointerCapture={event => { if (gesture.current) finish(event, true); }}
      onClick={event => {
        if (event.detail !== 0 && suppressClick.current) { suppressClick.current = false; return; }
        onOpen();
      }}
      onKeyDown={event => {
        const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (event.key === 'Home') { event.preventDefault(); const next = clampQuestPosition(null, viewport()); setPosition(next); save(next); }
        if (!directions[event.key]) return;
        event.preventDefault();
        const [dx, dy] = directions[event.key], distance = event.shiftKey ? 40 : 10;
        const next = clampQuestPosition({ x: position.x + dx * distance, y: position.y + dy * distance }, viewport());
        setPosition(next); save(next);
      }}>
      <Disc>{complete ? <Check size={27} aria-hidden="true" /> : <Trophy size={27} aria-hidden="true" />}</Disc>
      <Count aria-hidden="true">{done}/{chapter.tasks.length}</Count>{unread && <Unread aria-hidden="true" />}
    </Launcher>
    <Hidden id="quest-drag-help">Zum Verschieben ziehen oder die Pfeiltasten verwenden. Mit Umschalt schneller verschieben, mit Pos1 zurücksetzen. Mit Enter das Kapitel öffnen.</Hidden>
  </>;
}
const Launcher = styled.button`position: fixed; z-index: 1500; width: 64px; height: 64px; padding: 4px; border: 0; border-radius: 50%; background: conic-gradient(#b77a10 var(--quest-progress), #eadfc9 0); box-shadow: 0 5px 22px #402a0038; color: #5a3b09; cursor: ${p => p.$dragging ? 'grabbing' : 'grab'}; touch-action: none; user-select: none; -webkit-user-select: none; font: inherit; &:focus-visible { outline: 3px solid #835500; outline-offset: 4px; }`;
const Disc = styled.span`display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #fff1c5; border-radius: 50%; padding-bottom: 7px;`;
const Count = styled.span`position: absolute; bottom: 6px; left: 0; right: 0; font-size: 11px; font-weight: 800; pointer-events: none;`;
const Unread = styled.span`position: absolute; top: 0; right: 0; width: 14px; height: 14px; border: 3px solid #fffdf8; border-radius: 50%; background: #b44725;`;
const Hidden = styled.span`position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;`;
