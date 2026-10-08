import React from 'react';
import { ActivityCard as Card, ActivityHeader, ActivityMetaRow as CardMetaRow, ActivityDate as DateText, ActivityUserHeader, ActivityHeaderText, ActivityLink as CleanLink } from '../styles/ShopUi';
import { parseActivityDate, formatActivityDate } from '../utils/activityFeed';
import UserAvatar from './UserAvatar';
import ActivityCarousel from './ActivityCarousel';
import AwardCard from './AwardCard';

const AwardBundleCard = ({ awards = [], userName, date, focusAwardId = null, focusCommentId = null }) => {
  if (!awards.length) return null;
  const sortedAwards = awards.slice().sort((a, b) => (b.ep ?? 0) - (a.ep ?? 0));
  const focusedIndex = sortedAwards.findIndex(award => String(award.id) === String(focusAwardId));
  const user = awards[awards.length - 1];
  const userId = user.user_id ?? user.nutzer_id ?? awards[0].user_id ?? awards[0].nutzer_id;
  const parsedDate = parseActivityDate(date);
  return <Card>
    <ActivityHeader>
      <ActivityUserHeader>
        {userId && <UserAvatar userId={userId} name={userName} avatarUrl={user.avatar_url} />}
        <ActivityHeaderText><strong>{userId ? <CleanLink to={`/user/${userId}`}>{userName}</CleanLink> : userName}</strong> hat <strong>{awards.length}</strong> Awards erhalten.</ActivityHeaderText>
      </ActivityUserHeader>
      <CardMetaRow><DateText dateTime={parsedDate?.toISOString()}>{formatActivityDate(parsedDate)}</DateText></CardMetaRow>
    </ActivityHeader>
    <ActivityCarousel label="Gesammelte Awards" entryLabel="Award" initialIndex={Math.max(0, focusedIndex)}>
      {sortedAwards.map(award => <AwardCard key={award.id} award={award}
        showComments={String(award.id) === String(focusAwardId)} focusCommentId={String(award.id) === String(focusAwardId) ? focusCommentId : null} />)}
    </ActivityCarousel>
  </Card>;
};
export default AwardBundleCard;
