import React, { useState, forwardRef, useEffect } from "react";
import { Bike, Car, Footprints, HelpCircle, MapPin, MessageCircle } from "lucide-react";
import styled from "styled-components";
import Rating from "./Rating";
import { useUser } from "../context/UserContext";
import CheckinForm from "../CheckinForm";
import ImageGalleryWithLightbox from './ImageGalleryWithLightbox';
import CommentSection from "./CommentSection";
import { Modal } from "./Modal";
import { ActivityCard as Card, ActivityHeader, ActivityLayout, ActivityText as LeftContent, ActivityMedia, ActivityChipLink, ActivityChip, ShopButton as SamllerSubmitButton, ActivityMetaRow as CardMetaRow, ActivityDate as DateText, ActivityUserHeader as UserHeader, ActivityHeaderText as HeaderText, ActivityLink as CleanLink, ActivitySocialActions as ActionRow, ActivityCommentButton as CommentToggle } from '../styles/ShopUi';
import { formatActivityDate } from '../utils/activityFeed';
import { flavorPath } from '../utils/shopOfferings.mjs';
import { shopAssetUrl, hasShopNumber } from '../utils/shopDetail';
import UserAvatar from "./UserAvatar";
import MentionFormatter from "./MentionFormatter";
import LikeButton from "./LikeButton";

const CheckinCard = forwardRef(({ checkin, onSuccess, showComments = false, focusCommentId = null }, ref) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const { userId } = useUser();
  const [areCommentsVisible, setAreCommentsVisible] = useState(showComments);
  const contextType = checkin.context_type || (checkin.eisdiele_id ? "ice_shop" : "no_public_place");
  const hasPublicPlace = contextType !== "no_public_place" && Boolean(checkin.eisdiele_id);

  useEffect(() => {
    if (showComments) {
      setAreCommentsVisible(true);
    }
  }, [showComments]);

  const anreiseIcons = {
    Fahrrad: <Bike size={18} style={{ marginRight: 4, verticalAlign: 'sub' }} />,
    Motorrad: <Bike size={18} style={{ marginRight: 4, verticalAlign: 'sub' }} />,
    "Zu Fuß": <Footprints size={18} style={{ marginRight: 4, verticalAlign: 'sub' }} />,
    Auto: <Car size={18} style={{ marginRight: 4, verticalAlign: 'sub' }} />,
    Sonstiges: <HelpCircle size={18} style={{ marginRight: 4, verticalAlign: 'sub' }} />
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };


  useEffect(() => {
    if (ref && ref.current) {
      const event = new Event('checkinCardResize', { bubbles: true });
      ref.current.dispatchEvent(event);
      // Swiper autoHeight fix
      const swiperEl = ref.current.closest('.swiper');
      if (swiperEl && swiperEl.swiper && typeof swiperEl.swiper.updateAutoHeight === 'function') {
        swiperEl.swiper.updateAutoHeight();
      }
    }
  }, [areCommentsVisible]);

  return (
    <>
      <Card ref={ref}>
        <ActivityHeader>
          <UserHeader>
            <UserAvatar
              userId={checkin.nutzer_id}
              name={checkin.nutzer_name}
              avatarUrl={checkin.avatar_url}
              size={48}
            />
            <HeaderText>
              <strong><CleanLink to={`/user/${checkin.nutzer_id}`}>{checkin.nutzer_name}</CleanLink></strong>{" "}
              {hasPublicPlace ? (
                <>hat bei <strong><CleanLink to={`/map/activeShop/${checkin.eisdiele_id}`}>{checkin.eisdiele_name}</CleanLink></strong> eingecheckt.</>
              ) : (
                <>hat Eis ohne öffentlichen Ort eingecheckt.</>
              )}{" "}<TypText>(Typ: {checkin.typ})</TypText>
            </HeaderText>
          </UserHeader>
          <CardMetaRow>
            <DateText dateTime={checkin.datum}>
              {formatActivityDate(checkin.datum)}
            </DateText>
          </CardMetaRow>
        </ActivityHeader>
        <StyledContentWrapper>
          <LeftContent>
            {checkin.eissorten && checkin.eissorten.length > 0 && (
              <AttributeSection>
                <strong>Sorten:</strong>
                {checkin.eissorten.map((sorte, index) => (
                  <AttributeBadge
                    key={index}
                    to={flavorPath(sorte.sortenname, checkin.typ || 'all')}
                    aria-label={`Sorten-Details für ${String(sorte.sortenname || '').trim()}`}
                  >
                    {sorte.sortenname} ({sorte.bewertung}&#9733;)
                  </AttributeBadge>
                ))}
              </AttributeSection>
            )}

            <Table>
              <tbody>
                {hasShopNumber(checkin.geschmackbewertung) && (<tr>
                  <th>Geschmack:</th>
                  <td>
                    <Rating stars={Number(checkin.geschmackbewertung)} />{" "}
                    <strong>{checkin.geschmackbewertung}</strong>
                  </td>
                </tr>)}
                {hasShopNumber(checkin.größenbewertung) && checkin.typ === "Kugel" && (<tr>
                  <th>Größe:</th>
                  <td>
                    <Rating stars={Number(checkin.größenbewertung)} />{" "}
                    <strong>{checkin.größenbewertung}</strong>
                  </td>
                </tr>)}
                {hasShopNumber(checkin.preisleistungsbewertung) && (<tr>
                  <th>Preis-Leistung:</th>
                  <td>
                    <Rating stars={Number(checkin.preisleistungsbewertung)} />{" "}
                    <strong>{checkin.preisleistungsbewertung}</strong>
                  </td>
                </tr>)}
                {hasShopNumber(checkin.waffelbewertung) && (<tr>
                  <th>Waffel:</th>
                  <td>
                    <Rating stars={Number(checkin.waffelbewertung)} />{" "}
                    <strong>{checkin.waffelbewertung}</strong>
                  </td>
                </tr>)}
              </tbody>
            </Table>
            {(checkin.anreise && checkin.anreise !== "" || checkin.is_on_site !== 0) && (
              <ArrivalInfo>
                {checkin.anreise && checkin.anreise !== "" && (
                  <ArrivalBadge>{anreiseIcons[checkin.anreise] || <HelpCircle size={18} style={{ marginRight: 4, verticalAlign: 'sub' }} />} Anreise: <strong>{checkin.anreise}</strong></ArrivalBadge>)}
                {checkin.is_on_site !== 0 && (<OnSiteBadge><MapPin size={18} style={{ marginRight: 4, verticalAlign: 'sub' }} />Vor Ort eingecheckt</OnSiteBadge>)}
              </ArrivalInfo>
            )}

            {checkin.kommentar && <p style={{ whiteSpace: 'pre-wrap' }}><MentionFormatter text={checkin.kommentar} /></p>}
            {Number(checkin.nutzer_id) === Number(userId) && (
              <SamllerSubmitButton onClick={handleEditClick}>Bearbeiten</SamllerSubmitButton>
            )}
          </LeftContent>
          {checkin.bilder?.length > 0 && <MediaColumn>
            <ImageGalleryWithLightbox
              large
              images={(checkin.bilder || []).map(b => ({
                url: shopAssetUrl(b.url),
                beschreibung: b.beschreibung
              }))}
              fallbackTitle={`${(checkin.eissorten || []).map(s => s.sortenname).join(', ')} Eis${hasPublicPlace ? ` bei ${checkin.eisdiele_name}` : ''}`}
            />
          </MediaColumn>}
        </StyledContentWrapper>
        <ActionRow>
          <LikeButton
            entityType="checkin"
            entityId={checkin.id}
            initialLikesCount={checkin.likes_count}
            initialHasLiked={checkin.has_liked}
          />
          <CommentToggle
            aria-expanded={areCommentsVisible}
            title={areCommentsVisible ? "Kommentare ausblenden" : "Kommentare einblenden"}
            onClick={() => setAreCommentsVisible(!areCommentsVisible)}
          >
            <MessageCircle size={18} /> {checkin.commentCount || 0} Kommentar(e)
          </CommentToggle>
        </ActionRow>
        {areCommentsVisible && (
          <CommentSection
            checkinId={checkin.id}
            focusCommentId={focusCommentId}
            focusLatestComment={Boolean(showComments)}
          />
        )}
      </Card>



      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)}>
          <CheckinForm
            checkinId={checkin.id}
            shopId={checkin.eisdiele_id}
            shopName={checkin.eisdiele_name}
            contextType={contextType}
            userId={userId}
            showCheckinForm={showEditModal}
            setShowCheckinForm={setShowEditModal}
            onSuccess={onSuccess}
          />
        </Modal>
      )}
    </>
  );
});

export default CheckinCard;

// ---------- Styled Components ----------




const StyledContentWrapper = ActivityLayout;
const ShareAction = CommentToggle;

const MediaColumn = ActivityMedia;



const Table = styled.table`
  border-collapse: collapse;
  margin: 1rem 0;

  th, td {
    padding: 0.4rem 0.5rem;
    text-align: left;
  }

  th {
    color: #666;
    font-weight: 500;
    overflow-wrap: normal;
  }

  td {
    font-weight: 500;
  }

  tr:not(:last-child) {
    border-bottom: 1px solid #eee;
  }
`;
const AttributeSection = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
`;

const AttributeBadge = ActivityChipLink;

const TypText = styled.em`
  font-size: 0.85rem;
  color: #777;
`;

const ArrivalInfo = styled.div`
  margin: 1rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

const ArrivalBadge = ActivityChip;

const OnSiteBadge = styled(ActivityChip)`background: #fff0ec; border-color: #f1ccc0; color: #8a4030;`;
