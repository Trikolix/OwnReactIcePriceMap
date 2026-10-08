export function currentQuestChapter(quest) {
  return quest?.chapters.find(chapter => !chapter.awarded) || quest?.chapters.at(-1) || null;
}

export function questMilestones(quest) {
  return (quest?.chapters || []).flatMap(chapter => [
    ...chapter.tasks.filter(task => task.complete).map(task => ({ id: `${chapter.id}:task:${task.id}`, title: task.title, chapterId: chapter.id })),
    ...(chapter.awarded ? [{ id: `${chapter.id}:complete`, title: `${chapter.title} abgeschlossen · +${chapter.reward} EP`, chapterId: chapter.id, chapterComplete: true }] : []),
  ]);
}

export function questProgressMessage(milestones) {
  const completed = milestones.filter(item => item.chapterComplete).at(-1);
  if (completed) return completed.title;
  return milestones.length === 1 ? `${milestones[0].title} erledigt!` : `${milestones.length} weitere Aufgaben erledigt!`;
}

export function clampQuestPosition(position, viewport, size = 64, inset = 12) {
  const maxX = Math.max(inset, viewport.width - size - inset);
  const maxY = Math.max(inset, viewport.height - size - inset);
  return {
    x: Math.min(maxX, Math.max(inset, Number.isFinite(position?.x) ? position.x : maxX)),
    y: Math.min(maxY, Math.max(inset, Number.isFinite(position?.y) ? position.y : maxY - 110)),
  };
}

export function isQuestProgressMutation(url, method = 'GET') {
  if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) return false;
  try {
    const file = new URL(url, 'https://ice-app.invalid').pathname.split('/').at(-1);
    return /(?:checkin|bewertung|eisdiele|likes|route|challenge|profile|avatar)/i.test(file);
  } catch { return false; }
}
