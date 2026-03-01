import { React, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import ImageGalleryWithLightbox from './ImageGalleryWithLightbox';
import CommentSection from "./CommentSection";
import { SamllerSubmitButton, ContentWrapper, LeftContent, RightContent, CommentToggle, Card } from "../styles/SharedStyles";
import UserAvatar from "./UserAvatar";
import { MessageCircle } from "lucide-react";

const ReviewCard = ({ review, setShowReviewForm, showComments = false }) => {
  const { userId } = useUser();
  const [areCommentsVisible, setAreCommentsVisible] = useState(showComments);
  const activityDate = review.aktivitaet_am || review.erstellt_am;
  const isEditedActivity = review.activity_type === "edit";
  const parsedActivityDate = new Date(activityDate);
  const hasValidActivityDate = !Number.isNaN(parsedActivityDate.getTime());

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("de-DE");

  return (
    <Card>
      <CardMetaRow>
        <DateText dateTime={activityDate}>
          {isEditedActivity ? "Bearbeitet: " : ""}
          {hasValidActivityDate ? parsedActivityDate.toLocaleDateString("de-DE", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
          }) : "Unbekannt"}
        </DateText>
      </CardMetaRow>
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
      <StyledContentWrapper>
        <LeftContent>
          <Table>
            {review.auswahl !== null && (
              <tr>
                <th>Auswahl:</th>
                <td>
                  ~<strong>{review.auswahl}</strong> Sorten
                </td>
              </tr>
            )}
          </Table>

          {review.beschreibung && <p style={{ whiteSpace: 'pre-wrap' }}>{review.beschreibung}</p>}

          {review.attributes?.length > 0 && (
            <AttributeSection>
              {review.attributes.map((attr, i) => (
                <AttributeBadge key={i}>{attr}</AttributeBadge>
              ))}
            </AttributeSection>
          )}
          {Number(review.nutzer_id) === Number(userId) && setShowReviewForm && (
            <SamllerSubmitButton onClick={() => setShowReviewForm(true)}>Bearbeiten</SamllerSubmitButton>
          )}
        </LeftContent>
        <MediaColumn>
          {review.bilder?.length > 0 && (
            <ImageGalleryWithLightbox
              images={review.bilder.map(b => ({
                url: `https://ice-app.de/${b.url}`,
                beschreibung: b.beschreibung
              }))}
              fallbackTitle={`Bild von ${review.nutzer_name} für ${review.eisdiele_name}`}
            />
          )}

        </MediaColumn>
      </StyledContentWrapper>
      <CommentToggle
        title={areCommentsVisible ? "Kommentare ausblenden" : "Kommentare einblenden"}
        onClick={() => setAreCommentsVisible(!areCommentsVisible)}
      >
        <MessageCircle size={18} style={{ marginRight: 2, verticalAlign: 'text-bottom' }} /> {review.commentCount || 0} Kommentar(e)
      </CommentToggle>
      {areCommentsVisible && <CommentSection bewertungId={review.id} />}
    </Card>
  );
};

export default ReviewCard;

const CleanLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const HeaderText = styled.div`
  line-height: 1.4;
`;

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
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const AttributeBadge = styled.span`
  background: rgba(255, 181, 34, 0.12);
  color: #7a4a00;
  border: 1px solid rgba(255, 181, 34, 0.24);
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const CardMetaRow = styled.div`
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0;
  z-index: 1;
  pointer-events: none;

  @media (max-width: 640px) {
    position: static;
    justify-content: flex-end;
    margin-bottom: 0.5rem;
    pointer-events: auto;
  }
`;

const StyledContentWrapper = styled(ContentWrapper)`
  align-items: flex-start;
`;

const MediaColumn = styled(RightContent)`
  flex: 1 1 320px;
  min-width: min(100%, 280px);
  max-width: 520px;
  width: 100%;
  justify-content: flex-end;
  overflow: visible;
  padding-bottom: 0;
  margin-top: 0.55rem;

  @media (max-width: 900px) {
    max-width: none;
    justify-content: flex-start;
    margin-top: 0;
  }
`;

const DateText = styled.time`
  position: static;
  font-size: 0.85rem;
  color: rgba(47, 33, 0, 0.56);
  font-style: italic;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(47, 33, 0, 0.08);
  border-radius: 999px;
  padding: 0.2rem 0.65rem;

  @media (max-width: 640px) {
    margin-bottom: 0;
    justify-content: flex-end;
    font-size: 0.78rem;
    line-height: 1.2;
    flex-wrap: wrap;
  }
`;
