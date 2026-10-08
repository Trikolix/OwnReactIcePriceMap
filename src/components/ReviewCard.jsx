import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import ImageGalleryWithLightbox from './ImageGalleryWithLightbox';
import CommentSection from "./CommentSection";
import { ActivityCard as Card, ActivityHeader, ActivityLayout, ActivityText as LeftContent, ActivityMedia, ActivityChip, ShopButton as SamllerSubmitButton, ActivityMetaRow as CardMetaRow, ActivityDate as DateText, ActivityUserHeader as Header, ActivityHeaderText as HeaderText, ActivityLink as CleanLink, ActivitySocialActions as ActionRow, ActivityCommentButton as CommentToggle } from '../styles/ShopUi';
import { formatActivityDate } from '../utils/activityFeed';
import { attributePath } from '../utils/shopOfferings.mjs';
import { shopAssetUrl } from '../utils/shopDetail';
import UserAvatar from "./UserAvatar";
import { MessageCircle } from "lucide-react";

import MentionFormatter from "./MentionFormatter";
import SubmitReviewModal from "../SubmitReviewModal";
import LikeButton from "./LikeButton";

const ReviewCard = ({ review, setShowReviewForm, onSuccess, showComments = false, focusCommentId = null }) => {
  const { userId } = useUser();
  const [areCommentsVisible, setAreCommentsVisible] = useState(showComments);
  const [showEditModal, setShowEditModal] = useState(false);
  const activityDate = review.aktivitaet_am || review.erstellt_am;
  const isEditedActivity = review.activity_type === "edit";
  const isOwner = Number(review.nutzer_id) === Number(userId);
  const reviewShop = useMemo(() => ({
    eisdiele: {
      id: review.eisdiele_id,
      name: review.eisdiele_name,
    },
    preise: review.preise ?? {},
  }), [review.eisdiele_id, review.eisdiele_name, review.preise]);
  const reviewAttributes = Array.isArray(review.attribute_details) && review.attribute_details.length > 0
    ? review.attribute_details
    : (Array.isArray(review.attributes) ? review.attributes : []);

  useEffect(() => {
    if (showComments) {
      setAreCommentsVisible(true);
    }
  }, [showComments]);

  const handleEditClick = () => {
    if (setShowReviewForm) {
      setShowReviewForm(true);
      return;
    }

    setShowEditModal(true);
  };

  return (
    <>
      <Card>
        <ActivityHeader>
          <Header>
            <UserAvatar
              userId={review.nutzer_id}
              name={review.nutzer_name}
              avatarUrl={review.avatar_url}
            />
            <HeaderText>
              <strong><CleanLink to={`/user/${review.nutzer_id}`}>{review.nutzer_name}</CleanLink></strong> hat{" "}
              <strong><CleanLink to={`/map/activeShop/${review.eisdiele_id}`}>{review.eisdiele_name}</CleanLink></strong> bewertet.{" "}
            </HeaderText>
          </Header>
          <CardMetaRow>
            <DateText dateTime={activityDate}>
              {isEditedActivity ? "Bearbeitet: " : ""}
              {formatActivityDate(activityDate)}
            </DateText>
          </CardMetaRow>
        </ActivityHeader>
        <StyledContentWrapper>
          <LeftContent>
            <Table>
              <tbody>
              {review.auswahl !== null && (
                <tr>
                  <th>Auswahl:</th>
                  <td>
                    ~<strong>{review.auswahl}</strong> Sorten
                  </td>
                </tr>
              )}
              </tbody>
            </Table>

            {review.beschreibung && <p style={{ whiteSpace: 'pre-wrap' }}><MentionFormatter text={review.beschreibung} /></p>}

            {reviewAttributes.length > 0 && (
              <AttributeSection>
                {reviewAttributes.map((attribute, i) => {
                  const attributeId = Number(typeof attribute === 'object' ? attribute.id : null);
                  const attributeName = typeof attribute === 'object' ? attribute.name : attribute;
                  return Number.isInteger(attributeId) && attributeId > 0 ? (
                    <AttributeBadge
                      as={Link}
                      key={attributeId}
                      to={attributePath(attributeId)}
                      aria-label={`Eisdielen mit dem Attribut ${attributeName} auf der Karte ansehen`}
                    >
                      {attributeName}
                    </AttributeBadge>
                  ) : (
                    <AttributeBadge key={`${attributeName}-${i}`}>{attributeName}</AttributeBadge>
                  );
                })}
              </AttributeSection>
            )}
            {isOwner && (
              <SamllerSubmitButton onClick={handleEditClick}>Bearbeiten</SamllerSubmitButton>
            )}
          </LeftContent>
          {review.bilder?.length > 0 && <MediaColumn>
            {review.bilder?.length > 0 && (
              <ImageGalleryWithLightbox
                large
                images={review.bilder.map(b => ({
                  url: shopAssetUrl(b.url),
                  beschreibung: b.beschreibung
                }))}
                fallbackTitle={`Bild von ${review.nutzer_name} für ${review.eisdiele_name}`}
              />
            )}

          </MediaColumn>}
        </StyledContentWrapper>
        <ActionRow>
          <LikeButton
            entityType="bewertung"
            entityId={review.id}
            initialLikesCount={review.likes_count}
            initialHasLiked={review.has_liked}
          />
          <CommentToggle
            aria-expanded={areCommentsVisible}
            title={areCommentsVisible ? "Kommentare ausblenden" : "Kommentare einblenden"}
            onClick={() => setAreCommentsVisible(!areCommentsVisible)}
          >
            <MessageCircle size={18} /> {review.commentCount || 0} Kommentar(e)
          </CommentToggle>
        </ActionRow>
        {areCommentsVisible && (
          <CommentSection
            bewertungId={review.id}
            focusCommentId={focusCommentId}
            focusLatestComment={Boolean(showComments)}
          />
        )}
      </Card>

      {showEditModal && (
        <SubmitReviewModal
          shop={reviewShop}
          userId={userId}
          showForm={showEditModal}
          setShowForm={setShowEditModal}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
};

export default ReviewCard;




const Table = styled.table`
  border-spacing: 0.5rem 0.25rem;
  margin-bottom: 1rem;

  th {
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
    padding-right: 0.5rem;
    font-weight: normal;
    color: #555;
  }

  td {
    vertical-align: top;
  }
`;

const AttributeSection = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin-bottom: 0.5rem;
`;

const AttributeBadge = ActivityChip;


const StyledContentWrapper = ActivityLayout;

const MediaColumn = ActivityMedia;
