import React from 'react';
import { ActivityCard as Card, ActivityHeader, ActivityMetaRow as CardMetaRow, ActivityDate as DateText, ActivityLink as CleanLink, ActivityAvatarRow } from '../styles/ShopUi';
import { parseActivityDate, formatActivityDate } from '../utils/activityFeed';
import UserAvatar from './UserAvatar';
import ActivityCarousel from './ActivityCarousel';
import AwardCard from './AwardCard';

const AwardWaveCard = ({ wave, focusAwardId = null, focusCommentId = null }) => {
  const awards = Array.isArray(wave?.recipients) ? wave.recipients : [];
  if (!awards.length) return null;
  const focusedIndex = awards.findIndex(award => String(award.id) === String(focusAwardId));
  const date = parseActivityDate(wave.datum);
  const users = [...new Map(awards.map(award => [award.user_id, award])).values()];
  return <Card>
    <ActivityHeader>
      <div data-activity-identity>
        <ActivityAvatarRow>{users.map(user => <UserAvatar key={user.user_id} userId={user.user_id} name={user.user_name} avatarUrl={user.avatar_url} />)}</ActivityAvatarRow>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          {awards.map((award, index) => <React.Fragment key={award.id}>
            {index > 0 && (index === awards.length - 1 ? ' und ' : ', ')}
            <strong><CleanLink to={`/user/${award.user_id}`}>{award.user_name}</CleanLink></strong>
          </React.Fragment>)} haben kurz nacheinander den Award <strong>{wave.title_de}</strong> erhalten.
        </p>
      </div>
      <CardMetaRow><DateText dateTime={date?.toISOString()}>{formatActivityDate(date)}</DateText></CardMetaRow>
    </ActivityHeader>
    <ActivityCarousel label="Award-Empfänger" entryLabel="Award" initialIndex={Math.max(0, focusedIndex)}>
      {awards.map(award => <AwardCard key={award.id} award={award}
        showComments={String(award.id) === String(focusAwardId)} focusCommentId={String(award.id) === String(focusAwardId) ? focusCommentId : null} />)}
    </ActivityCarousel>
  </Card>;
};
export default AwardWaveCard;
