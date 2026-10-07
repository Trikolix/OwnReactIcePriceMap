import React from 'react';
import { ActivityCard as Card, ActivityHeader, ActivityMetaRow as CardMetaRow, ActivityDate as DateText, ActivityLink as CleanLink, ActivityAvatarRow } from '../styles/ShopUi';
import { parseActivityDate, formatActivityDate } from '../utils/activityFeed';
import UserAvatar from './UserAvatar';
import ActivityCarousel from './ActivityCarousel';
import CheckinCard from './CheckinCard';

const GroupCheckinCard = ({ checkins = [], onSuccess }) => {
  const first = checkins[0];
  if (!first) return null;
  const hasPublicPlace = Boolean(first.eisdiele_id) && first.context_type !== 'no_public_place';
  const date = parseActivityDate(first.datum);
  const users = [...new Map(checkins.map(checkin => [checkin.nutzer_id, checkin])).values()];
  return <Card>
    <ActivityHeader>
      <div data-activity-identity>
        <ActivityAvatarRow>{users.map(user => <UserAvatar key={user.nutzer_id} userId={user.nutzer_id} name={user.nutzer_name} avatarUrl={user.avatar_url} />)}</ActivityAvatarRow>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          {checkins.map((checkin, index) => <React.Fragment key={checkin.id}>
            {index > 0 && (index === checkins.length - 1 ? ' und ' : ', ')}
            <strong><CleanLink to={`/user/${checkin.nutzer_id}`}>{checkin.nutzer_name}</CleanLink></strong>
          </React.Fragment>)} waren gemeinsam {hasPublicPlace ? <>bei <strong><CleanLink to={`/map/activeShop/${first.eisdiele_id}`}>{first.eisdiele_name}</CleanLink></strong></> : 'Eis essen'}.
        </p>
      </div>
      <CardMetaRow><DateText dateTime={date?.toISOString()}>{formatActivityDate(date)}</DateText></CardMetaRow>
    </ActivityHeader>
    <ActivityCarousel label="Gemeinsame Check-ins" entryLabel="Check-in">
      {checkins.map(checkin => <CheckinCard key={checkin.id} checkin={checkin} onSuccess={onSuccess} showComments={false} />)}
    </ActivityCarousel>
  </Card>;
};
export default GroupCheckinCard;
