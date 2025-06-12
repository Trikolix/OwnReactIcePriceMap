import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useUser } from "../context/UserContext";

const CommentSection = ({ checkinId }) => {
    const { userId } = useUser();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState("");
    const apiUrl = process.env.REACT_APP_API_BASE_URL;

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
        const res = await fetch(`${apiUrl}/kommentare.php?action=list&checkin_id=${checkinId}`);
        const data = await res.json();
        if (data.status === "success") {
            setComments(data.kommentare);
        }
    };

    useEffect(() => {
        loadComments();
    }, [checkinId]);

    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        const res = await fetch(`${apiUrl}/kommentare.php?action=create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "create",
                checkin_id: checkinId,
                nutzer_id: userId,
                kommentar: newComment
            })
        });
        const data = await res.json();
        if (data.status === "success") {
            setNewComment("");
            loadComments();
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
        if (data.status === "success") loadComments();
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
        }
    };

    return (
        <Section>
            <h4>Kommentare ({comments.length})</h4>
            <List>
                {comments.map((kom) => (
                    <li key={kom.id}>
                        <strong>{kom.nutzername}</strong>
                        <Zeitstempel>{formatDateTime(kom.erstellt_am)}</Zeitstempel>

                        {editingId === kom.id ? (
                            <>
                                <InputSection>
                                    <textarea
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                    />
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
                                }}>✏️</button>
                                <button onClick={() => handleDelete(kom.id)}>🗑️</button>
                            </ActionButtons>
                        )}
                    </li>

                ))}
            </List>

            <InputSection>
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Kommentar schreiben..."
                />
                <button onClick={handleSubmit}>Absenden</button>
            </InputSection>
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
    padding: 0.4rem 0.8rem;
    background-color: #339af0;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
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