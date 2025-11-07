import { React, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useUser } from "./../context/UserContext";
import ImageGalleryWithLightbox from './ImageGalleryWithLightbox';
import CommentSection from "./CommentSection";
import { SamllerSubmitButton, ContentWrapper, LeftContent, RightContent, CommentToggle, Card } from "../styles/SharedStyles";
import UserAvatar from "./UserAvatar";

const ReviewCard = ({ review, setShowReviewForm, showComments = false }) => {
  const { userId } = useUser();
  const [areCommentsVisible, setAreCommentsVisible] = useState(showComments);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("de-DE");

  return (
    <Card>
      <DateText dateTime={review.erstellt_am}>
        {new Date(review.erstellt_am).toLocaleDateString("de-DE", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
        })}
      </DateText>
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
      <ContentWrapper>
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
        <RightContent>
          {review.bilder?.length > 0 && (
            <ImageGalleryWithLightbox
              images={review.bilder.map(b => ({
                url: `https://ice-app.de/${b.url}`,
                beschreibung: b.beschreibung
              }))}
              fallbackTitle={`Bild von ${review.nutzer_name} für ${review.eisdiele_name}`}
            />
          )}

        </RightContent>
      </ContentWrapper>
      <CommentToggle
        title={areCommentsVisible ? "Kommentare ausblenden" : "Kommentare einblenden"}
        onClick={() => setAreCommentsVisible(!areCommentsVisible)}
      >
        💬 {review.commentCount || 0} Kommentar(e)
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
  margin-bottom: 1rem;
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
  background: #e0f3ff;
  color: #0077b6;
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const DateText = styled.time`
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-size: 0.85rem;
  color: #777;
  font-style: italic;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;
