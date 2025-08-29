import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useUser } from "../context/UserContext";
import Header from "../Header";

export default function SystemmeldungForm() {
    const { userId } = useUser();

    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [meldungen, setMeldungen] = useState([]);
    const [editing, setEditing] = useState(null); // zu bearbeitende Meldung

    // Admin-Hook: nur für userId 1
    const isAdmin = parseInt(userId, 10) === 1;

    // Hooks immer aufrufen
    useEffect(() => {
        if (isAdmin) loadHistory();
    }, [userId]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/systemmeldung.php?action=list`);
            const data = await res.json();
            if (data.status === "success") setMeldungen(data.systemmeldungen);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(null);
        setError(null);

        try {
            const url = editing
                ? `${process.env.REACT_APP_API_BASE_URL}/systemmeldung.php?action=update`
                : `${process.env.REACT_APP_API_BASE_URL}/systemmeldung.php?action=create`;

            const bodyData = editing
                ? { id: editing.id, title: editing.title, message: editing.message }
                : { title, message };

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData)
            });

            const data = await res.json();
            if (data.status === "success") {
                setSuccess(editing ? "Systemmeldung aktualisiert!" : "Systemmeldung erstellt!");
                setTitle("");
                setMessage("");
                setEditing(null);
                loadHistory();
            } else {
                setError(data.message || "Fehler beim Speichern");
            }
        } catch (err) {
            setError("Netzwerkfehler");
        } finally {
            setLoading(false);
        }
    };

    const deleteMeldung = async (id) => {
        if (!window.confirm("Systemmeldung wirklich löschen?")) return;
        await fetch(`${process.env.REACT_APP_API_BASE_URL}/systemmeldung.php?action=delete&id=${id}`);
        loadHistory();
    };

    const startEditing = (m) => {
        setEditing({
            id: m.id,
            title: m.titel,
            message: m.nachricht
        });
    };

    if (!isAdmin) {
        return <InfoBox>Du hast keine Berechtigung, Systemmeldungen zu verwalten.</InfoBox>;
    }

    return (<>
        <Header />
        <Container>
            <Heading>{editing ? "Systemmeldung bearbeiten" : "Neue Systemmeldung anlegen"}</Heading>

            {success && <MessageSuccess>{success}</MessageSuccess>}
            {error && <MessageError>{error}</MessageError>}

            <Form onSubmit={handleSubmit}>
                <Field>
                    <Label>Titel</Label>
                    <Input
                        type="text"
                        value={editing ? editing.title : title}
                        onChange={(e) => editing
                            ? setEditing({ ...editing, title: e.target.value })
                            : setTitle(e.target.value)
                        }
                        required
                    />
                </Field>

                <Field>
                    <Label>Nachricht</Label>
                    <Textarea
                        value={editing ? editing.message : message}
                        onChange={(e) => editing
                            ? setEditing({ ...editing, message: e.target.value })
                            : setMessage(e.target.value)
                        }
                        required
                        rows="5"
                    />
                </Field>

                <Button type="submit" disabled={loading}>
                    {loading ? "Speichern..." : editing ? "Änderungen speichern" : "Systemmeldung erstellen"}
                </Button>

                {editing && (
                    <CancelButton type="button" onClick={() => setEditing(null)}>
                        Bearbeitung abbrechen
                    </CancelButton>
                )}
            </Form>

            <Heading>Systemmeldungen Historie</Heading>
            <Table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Titel</th>
                        <th>Nachricht</th>
                        <th>Erstellt</th>
                        <th>Benachricht</th>
                        <th>Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    {meldungen.map((m) => (
                        <tr key={m.id}>
                            <td>{m.id}</td>
                            <td>{m.titel}</td>
                            <td style={{ whiteSpace: "pre-line" }}>{m.nachricht}</td>
                            <td>{m.erstellt_am}</td>
                            <td>{m.benachrichtigungen_gelesen} / {m.benachrichtigungen_total} gelesen</td>
                            <td>
                                <ActionButton onClick={() => startEditing(m)}>Bearbeiten</ActionButton>
                                <DeleteButton onClick={() => deleteMeldung(m.id)}>Löschen</DeleteButton>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
        </>
    );
}

/* ---------------- styled-components ---------------- */

const Container = styled.div`
    max-width: 700px;
    margin: 2rem auto;
    padding: 2rem;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const Heading = styled.h2`
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1.5rem;
    color: #222;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const Field = styled.div`
    display: flex;
    flex-direction: column;
`;

const Label = styled.label`
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
    font-weight: 500;
    color: #444;
`;

const Input = styled.input`
    padding: 0.6rem 0.8rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 1rem;
    &:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 2px rgba(37,99,235,0.2);
    }
`;

const Textarea = styled.textarea`
    padding: 0.6rem 0.8rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 1rem;
    resize: vertical;
    &:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 2px rgba(37,99,235,0.2);
    }
`;

const Button = styled.button`
    padding: 0.75rem 1rem;
    background: ${(props) => (props.disabled ? "#9ca3af" : "#2563eb")};
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
    transition: background 0.2s;
    &:hover {
        background: ${(props) => (props.disabled ? "#9ca3af" : "#1e40af")};
    }
`;

const CancelButton = styled.button`
    padding: 0.5rem 1rem;
    background: #6b7280;
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 0.5rem;
    &:hover {
        background: #4b5563;
    }
`;

const MessageSuccess = styled.div`
    background: #dcfce7;
    color: #166534;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
`;

const MessageError = styled.div`
    background: #fee2e2;
    color: #991b1b;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
`;

const InfoBox = styled.div`
    margin: 2rem auto;
    padding: 1rem;
    max-width: 500px;
    text-align: center;
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
    border-radius: 8px;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;

    th, td {
        border: 1px solid #ddd;
        padding: 0.5rem;
        text-align: left;
    }

    th {
        background: #f3f4f6;
        font-weight: 600;
    }
`;

const ActionButton = styled.button`
    padding: 0.4rem 0.8rem;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    margin-right: 0.3rem;
    &:hover { background: #1e40af; }
`;

const DeleteButton = styled.button`
    padding: 0.4rem 0.8rem;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    &:hover { background: #b91c1c; }
`;
