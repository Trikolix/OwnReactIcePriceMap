const chapters = [
  { id: 1, title: 'Startklar', reward: 50, tasks: [
    ['avatar', 'camera', 'Dein Profilbild', 'Zeige der Community, wer du bist.', 'Profil bearbeiten', 'settings'],
    ['installation', 'phone', 'Ice-App installieren', 'Deine Eis-Orte direkt auf dem Startbildschirm.', 'Installieren', 'install'],
    ['push', 'bell', 'Benachrichtigungen aktivieren', 'Erfahre von Kommentaren, Einladungen und Neuigkeiten.', 'Aktivieren', 'push'],
    ['checkin', 'ice', 'Dein erster Check-in', 'Halte deinen nächsten Eis-Moment fest.', 'Eis einchecken', 'checkin'],
    ['invitation', 'users', 'Freunde einladen', 'Teile deinen Einladungslink.', 'Einladen', 'invite'],
    ['social', 'social', 'Accounts verlinken', 'Verbinde Instagram oder Strava mit deinem Profil.', 'Accounts verlinken', 'settings'],
  ] },
  { id: 2, title: 'Ice-App Experte', reward: 100, tasks: [
    ['shop', 'store', 'Eine Eisdiele entdecken', 'Trage eine Eisdiele ein, bei der mindestens ein Check-in entsteht.', 'Eisdiele hinzufügen', 'shop'],
    ['review', 'review', 'Eine Eisdiele bewerten', 'Teile deine Erfahrung mit der Community.', 'Eisdiele auswählen', 'review'],
    ['checkins', 'ice', 'Fünf Eis-Momente', '', 'Eis einchecken', 'checkin'],
    ['challenge', 'target', 'Eine Challenge meistern', 'Schließe deine erste Challenge ab.', 'Challenges entdecken', 'challenge'],
    ['route', 'route', 'Eine Route einreichen', 'Plane eine Tour zu deinen Eis-Orten.', 'Routen öffnen', 'route'],
    ['likes', 'heart', 'Zehn Likes vergeben', '', 'Aktivitäten entdecken', 'activities'],
  ] },
];

export function onboardingQuest(progress) {
  if (!progress) return null;
  return { id: 'onboarding', title: 'Dein Ice-App Einstieg', chapters: chapters.map(chapter => ({
    ...chapter, awarded: progress.awarded_levels.includes(chapter.id), tasks: chapter.tasks.map(([id, icon, title, description, actionLabel, action]) => ({
      id, icon, title, actionLabel, action, complete: Boolean(progress.stages[chapter.id][id]),
      description: id === 'checkins' ? `${progress.stats.checkins || 0} von 5 Check-ins gesammelt.`
        : id === 'likes' ? `${Math.min(progress.stats.foreign_likes || 0, 10)} von 10 Likes auf Beiträge anderer Nutzer.` : description,
    })),
  })) };
}
