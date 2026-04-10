import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { searchUsers as searchUsersApi } from "../utils/searchUsers";

function UserMentionMultiSelect({ onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const debounceTimerRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value = "") => {
    const nextQuery = String(value ?? "");
    setQuery(nextQuery);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (nextQuery.length < 2) {
      setResults([]);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const data = await searchUsersApi(apiUrl, nextQuery);
        setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Fehler bei der Nutzersuche:", error);
        setResults([]);
      }
    }, 300);
  };

  const addUser = (user) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      const updated = [...selectedUsers, user];
      setSelectedUsers(updated);
      onChange(updated);
    }
    setQuery("");
    setResults([]);
  };

  const removeUser = (id) => {
    const updated = selectedUsers.filter((u) => u.id !== id);
    setSelectedUsers(updated);
    onChange(updated);
  };

  return (
    <Container>
      <Input
        type="text"
        value={query}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Nutzername oder E-Mail eingeben..."
      />

      {Array.isArray(results) && results.length > 0 && (
        <ResultList>
          {results.map((user) => (
            <ResultItem key={user.id} onClick={() => addUser(user)}>
              {user.username}
            </ResultItem>
          ))}
        </ResultList>
      )}

      <ChipsContainer>
        {selectedUsers.map((user) => (
          <Chip key={user.id}>
            {user.username}
            <RemoveButton onClick={() => removeUser(user.id)}>✕</RemoveButton>
          </Chip>
        ))}
      </ChipsContainer>
    </Container>
  );
}

export default UserMentionMultiSelect;


const Container = styled.div`
  width: 100%;
`;

const Input = styled.input`
  width: 95%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.95rem;
  outline: none;

  &:focus {
    border-color: #3182ce;
    box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2);
  }
`;

const ResultList = styled.ul`
  margin-top: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  list-style: none;
  padding: 0;
`;

const ResultItem = styled.li`
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f7fafc;
  }
`;

const ChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  background: #ebf8ff;
  color: #2b6cb0;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
`;

const RemoveButton = styled.button`
  margin-left: 0.5rem;
  color: #2b6cb0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    color: #1a365d;
  }
`;
