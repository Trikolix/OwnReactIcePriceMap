import React, { useState } from "react";
import styled from "styled-components";

function UserMentionMultiSelect({ onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  const searchUsers = (value) => {
    setQuery(value);

    if (debounceTimer) clearTimeout(debounceTimer);

    if (value.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await fetch(
        `${apiUrl}/api/search_user.php?q=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      setResults(data);
    }, 300);

    setDebounceTimer(timer);
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
        onChange={(e) => searchUsers(e.target.value)}
        placeholder="Nutzername oder E-Mail eingeben..."
      />

      {results.length > 0 && (
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