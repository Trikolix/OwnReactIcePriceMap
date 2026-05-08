import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useUser } from "../context/UserContext";
import { DeleteIcon, Pencil, Trash2 } from "lucide-react";
import LoginModal from "../LoginModal";

// type: "checkin" | "bewertung" | "route" | "user_registration" | "award"
const CommentSection = ({ checkinId, bewertungId, routeId, userRegistrationId, userAwardId, type = "checkin", focusCommentId = null, focusLatestComment = false }) => {
    const { userId, isLoggedIn } = useUser();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState("");
    const [loginModalMode, setLoginModalMode] = useState(null);
    const [highlightedCommentId, setHighlightedCommentId] = useState(null);
    const commentRefs = useRef({});
    const didFocusCommentRef = useRef(false);
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    // Validierung der Props
    const isValidProps = () => {
        // Nur eine ID darf gesetzt sein
        const ids = [checkinId, bewertungId, routeId, userRegistrationId, userAwardId].filter(Boolean);
        return ids.length === 1;
    };

    const formatDateTime = (datetimeStr) => {
        const date = new Date(datetimeStr);
        return date.toLocaleString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }) + " Uhr";
    };

    const loadComments = async () => {
        if (!isValidProps()) {
            console.error("CommentSection: Genau eine Ziel-ID muss gesetzt sein");
            return;
        }

        let parameterName, parameterValue;
        if (checkinId) {
            parameterName = 'checkin_id';
            parameterValue = checkinId;
        } else if (bewertungId) {
            parameterName = 'bewertung_id';
            parameterValue = bewertungId;
        } else if (routeId) {
            parameterName = 'route_id';
            parameterValue = routeId;
        } else if (userRegistrationId) {
            parameterName = 'user_registration_id';
            parameterValue = userRegistrationId;
        } else if (userAwardId) {
            parameterName = 'user_award_id';
            parameterValue = userAwardId;
        }
        const res = await fetch(`${apiUrl}/kommentare.php?action=list&${parameterName}=${parameterValue}`);
        const data = await res.json();
        if (data.status === "success") {
            setComments(data.kommentare);
        } else {
            console.error("Fehler beim Laden der Kommentare:", data.message);
        }
    };

    useEffect(() => {
        didFocusCommentRef.current = false;
        loadComments();
    }, [checkinId, bewertungId, routeId, userRegistrationId, userAwardId]);

    useEffect(() => {
        if (!comments.length || didFocusCommentRef.current) return;

        if (!focusCommentId && !focusLatestComment) return;

        const targetCommentId = focusCommentId
            ? String(focusCommentId)
            : String(comments[comments.length - 1]?.id || "");
        if (!targetCommentId) return;

        let target = commentRefs.current[targetCommentId];
        let highlightedId = targetCommentId;
        if (!target && focusLatestComment) {
            highlightedId = String(comments[comments.length - 1]?.id || "");
            target = commentRefs.current[highlightedId];
        }
        if (!target) return;

        didFocusCommentRef.current = true;
        setHighlightedCommentId(highlightedId);
        window.setTimeout(() => {
            target.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 80);
    }, [comments, focusCommentId, focusLatestComment]);

    const handleSubmit = async () => {
        if (!isLoggedIn || !newComment.trim() || !isValidProps()) return;

        const requestBody = {
            action: "create",
            nutzer_id: userId,
            kommentar: newComment
        };

        // Je nach Typ die entsprechende ID hinzufügen
        if (checkinId) {
            requestBody.checkin_id = checkinId;
        } else if (bewertungId) {
            requestBody.bewertung_id = bewertungId;
        } else if (routeId) {
            requestBody.route_id = routeId;
        } else if (userRegistrationId) {
            requestBody.user_registration_id = userRegistrationId;
        } else if (userAwardId) {
            requestBody.user_award_id = userAwardId;
        }

        const res = await fetch(`${apiUrl}/kommentare.php?action=create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        const data = await res.json();
        if (data.status === "success") {
            setNewComment("");
            loadComments();
        } else {
            console.error("Fehler beim Erstellen des Kommentars:", data.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Kommentar wirklich löschen?")) return;

        const res = await fetch(`${apiUrl}/kommentare.php?action=delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id,
                nutzer_id: userId
            })
        });

        const data = await res.json();
        if (data.status === "success") {
            loadComments();
        } else {
            console.error("Fehler beim Löschen des Kommentars:", data.message);
        }
    };

    const handleUpdate = async () => {
        const res = await fetch(`${apiUrl}/kommentare.php?action=update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: editingId,
                kommentar: editingText,
                nutzer_id: userId
            })
        });

        const data = await res.json();
        if (data.status === "success") {
            setEditingId(null);
            setEditingText("");
            loadComments();
        } else {
            console.error("Fehler beim Aktualisieren des Kommentars:", data.message);
        }
    };

    const insertSmiley = (smiley) => {
        if (editingId) {
            setEditingText(prev => prev + smiley);
        } else {
            setNewComment(prev => prev + smiley);
        }
    };

    // Wenn Props nicht valide sind, nichts rendern
    if (!isValidProps()) {
        return (
            <ErrorMessage>
                Fehler: Genau eine Ziel-ID (Check-in, Bewertung, Route, Nutzerregistrierung oder Award) muss gesetzt sein.
            </ErrorMessage>
        );
    }

    return (
        <Section>
            <h4>Kommentare ({comments.length})</h4>
            <List>
                {comments.map((kom) => (
                    <li
                        key={kom.id}
                        ref={(node) => {
                            if (node) {
                                commentRefs.current[String(kom.id)] = node;
                            } else {
                                delete commentRefs.current[String(kom.id)];
                            }
                        }}
                        data-focused={String(highlightedCommentId) === String(kom.id)}
                    >
                        <strong>{kom.nutzername}</strong>
                        <Zeitstempel>{formatDateTime(kom.erstellt_am)}</Zeitstempel>

                        {editingId === kom.id ? (
                            <>
                                <InputSection>
                                    <textarea
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                    />
                                    <SmileyBar>
                                        {["👍", "❤️", "🍦", "😂", "🥳", "🔥", "🙌"].map(smiley => (
                                            <SmileyButton key={smiley} type="button" onClick={() => insertSmiley(smiley)}>{smiley}</SmileyButton>
                                        ))}
                                    </SmileyBar>
                                </InputSection>
                                <ButtonLeiste>
                                    <button onClick={handleUpdate}>💾</button>
                                    <button onClick={() => {
                                        if (editingText !== kom.kommentar && !window.confirm("Änderungen verwerfen?")) return;
                                        setEditingId(null);
                                        setEditingText("");
                                    }}>❌</button>
                                </ButtonLeiste>
                            </>
                        ) : (
                            <KommentarText>
                                {kom.kommentar.split("\n").map((line, i) => (
                                    <span key={i}>
                                        {line}
                                        <br />
                                    </span>
                                ))}
                            </KommentarText>
                        )}

                        {Number(userId) === Number(kom.nutzer_id) && editingId !== kom.id && (
                            <ActionButtons>
                                <button onClick={() => {
                                    setEditingId(kom.id);
                                    setEditingText(kom.kommentar);
                                }}><Pencil size={14} /></button>
                                <button onClick={() => handleDelete(kom.id)}><Trash2 size={14} /></button>
                            </ActionButtons>
                        )}
                    </li>

                ))}
            </List>

            {isLoggedIn ? (
            <InputSection>
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Kommentar schreiben..."
                />
                <SmileyBar>
                    {["👍", "❤️", "🍦", "😂", "🥳", "🔥", "🙌"].map(smiley => (
                        <SmileyButton key={smiley} type="button" onClick={() => insertSmiley(smiley)}>{smiley}</SmileyButton>
                    ))}
                </SmileyBar>
                <button type="button" onClick={handleSubmit}>Absenden</button>
            </InputSection>
            ) : (
                <LoginPrompt>
                    <span>Bitte logge dich ein oder registriere dich, um einen Kommentar zu schreiben.</span>
                    <LoginPromptActions>
                        <button type="button" onClick={() => setLoginModalMode("login")}>Einloggen</button>
                        <button type="button" onClick={() => setLoginModalMode("register")}>Registrieren</button>
                    </LoginPromptActions>
                </LoginPrompt>
            )}
            {loginModalMode && (
                <LoginModal
                    initialMode={loginModalMode}
                    setShowLoginModal={(show) => {
                        if (!show) setLoginModalMode(null);
                    }}
                />
            )}
        </Section>
    );
};

export default CommentSection;

// Styled Components
const Section = styled.div`
  margin-top: 1.5rem;
  border-top: 1px solid #ddd;
  padding-top: 1rem;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: 1rem;

  li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
    position: relative;
    border-radius: 8px;
    transition: background 0.25s ease, box-shadow 0.25s ease;
  }

  li[data-focused="true"] {
    background: rgba(255, 181, 34, 0.16);
    box-shadow: 0 0 0 1px rgba(255, 181, 34, 0.28);
  }
`;


const ActionButtons = styled.span`
  position: absolute;
  top: 0.5rem;
  right: 0;
`;


const InputSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  textarea {
    width: 100%;
    min-height: 60px;
    resize: vertical;
  }

  button {
    align-self: flex-end;
    padding: 0.6rem 1rem;
    background-color: #ffb522;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 700;
    font-size: 0.8rem;
  }
`;

const LoginPrompt = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid rgba(255, 181, 34, 0.32);
  border-radius: 10px;
  background: rgba(255, 181, 34, 0.1);
  color: #6f4600;
  font-size: 0.92rem;
`;

const LoginPromptActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  button {
    background-color: #ffb522;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 700;
    padding: 0.55rem 0.85rem;
  }
`;

const KommentarText = styled.div`
  white-space: pre-wrap;
  margin: 0.3rem 0;
`;

const Zeitstempel = styled.div`
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.2rem;
`;

const ButtonLeiste = styled.div`
  margin-top: 0.3rem;
  button {
    margin-right: 0.5rem;
    font-size: 1rem;
  }
`;

const SmileyBar = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-top: -0.2rem;
`;

const SmileyButton = styled.button`
  background: none !important;
  border: none !important;
  padding: 0.2rem !important;
  font-size: 1.2rem !important;
  cursor: pointer;
  transition: transform 0.1s;

  &:hover {
    transform: scale(1.2);
  }
`;

const ErrorMessage = styled.div`
  color: #d73a49;
  background-color: #ffeaea;
  padding: 1rem;
  border: 1px solid #d73a49;
  border-radius: 4px;
  margin: 1rem 0;
`;
