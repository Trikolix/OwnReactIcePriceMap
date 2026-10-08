import React from 'react';
import { createPortal } from 'react-dom';
import { Pin, PinOff } from 'lucide-react';
import { Button, ChallengeDialog } from '../../components/ChallengeUI';
import OnboardingChecklist from '../../components/OnboardingChecklist';
import FloatingQuestButton from '../quests/FloatingQuestButton';
import QuestProgressNotice from '../quests/QuestProgressNotice';
import { useOnboarding } from './OnboardingContext';

export default function OnboardingDock() {
  const state = useOnboarding();
  if (!state?.isLoggedIn || !state.quest || !state.progress.visible) return null;
  const PinIcon = state.pinned ? PinOff : Pin;
  return <>
    {createPortal(<>
      {state.pinned && <FloatingQuestButton quest={state.quest} userId={state.userId} unread={state.feedback.unread} onOpen={state.openChapter} />}
      <QuestProgressNotice notification={state.feedback.notification} onDismiss={state.feedback.dismiss} onOpen={state.openChapter} />
    </>, document.body)}
    <ChallengeDialog compact open={state.chapterOpen} onClose={state.closeChapter} title={state.quest.title}
      footer={<Button type="button" $secondary onClick={() => state.pin(!state.pinned)}><PinIcon size={18} aria-hidden="true" />{state.pinned ? 'Vom Bildschirmrand lösen' : 'Am Bildschirmrand anpinnen'}</Button>}>
      {state.chapterOpen && <OnboardingChecklist presentation="dialog" />}
    </ChallengeDialog>
  </>;
}
