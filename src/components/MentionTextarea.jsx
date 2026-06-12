import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { searchUsers as searchUsersApi } from "../utils/searchUsers";

const Container = styled.div`
    position: relative;
    width: 100%;
`;

const StyledTextarea = styled.textarea`
    width: 100%;
    min-height: ${props => props.$minHeight || "60px"};
    border-radius: ${props => props.$borderRadius || "8px"};
    border: ${props => props.$border || "1px solid #ccc"};
    padding: ${props => props.$padding || "10px"};
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
    box-sizing: border-box;
    margin: 0;
`;

const SuggestionsDropdown = styled.ul`
    position: absolute;
    top: ${props => props.top}px;
    left: ${props => props.left}px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 150px;
    overflow-y: auto;
    z-index: 1000;
    min-width: 150px;
`;

const SuggestionItem = styled.li`
    padding: 8px 12px;
    cursor: pointer;
    background: ${props => props.active ? "#f0f0f0" : "transparent"};
    &:hover {
        background: #f0f0f0;
    }
`;

const MentionTextarea = ({ value, onChange, placeholder, minHeight, borderRadius, border, padding, rows, className }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [activeIndex, setActiveIndex] = useState(0);
    const textareaRef = useRef(null);
    const apiUrl = import.meta.env.VITE_API_BASE_URL;

    const getDropdownPosition = (text, targetIndex) => {
        if (!textareaRef.current) return { top: 0, left: 0 };

        const ta = textareaRef.current;
        const div = document.createElement('div');
        const computed = window.getComputedStyle(ta);

        for (const prop of computed) {
            div.style[prop] = computed[prop];
        }

        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.style.overflowWrap = computed.overflowWrap;
        div.style.top = '0';
        div.style.left = '0';
        div.style.overflow = 'hidden';
        div.style.width = `${ta.clientWidth}px`;
        div.style.height = 'auto';

        div.textContent = text.slice(0, targetIndex);
        const span = document.createElement('span');
        span.textContent = text[targetIndex] || '.';
        div.appendChild(span);

        document.body.appendChild(div);

        const lineHeight = Number.parseFloat(computed.lineHeight)
            || Number.parseFloat(computed.fontSize) * 1.2
            || 20;
        const topPos = span.offsetTop + lineHeight - ta.scrollTop;
        const leftPos = span.offsetLeft - ta.scrollLeft;
        document.body.removeChild(div);

        const dropdownWidth = 220;

        return {
            top: Math.min(topPos, ta.offsetHeight),
            left: Math.max(0, Math.min(leftPos, ta.offsetWidth - dropdownWidth))
        };
    };

    const handleKeyDown = (e) => {
        if (showSuggestions) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) => (prev + 1) % suggestions.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                if (suggestions.length > 0) {
                    insertMention(suggestions[activeIndex]);
                }
            } else if (e.key === "Escape") {
                setShowSuggestions(false);
            }
        }
    };

    const handleChange = async (e) => {
        const val = e.target.value;
        onChange(e);

        const pos = e.target.selectionStart;
        setCursorPosition(pos);

        const textBeforeCursor = val.slice(0, pos);
        const match = textBeforeCursor.match(/(^|\s)@([a-zA-Z0-9_.-]*)$/);

        if (match) {
            const search = match[2];
            const atIndex = match.index + match[1].length;
            setDropdownPos(getDropdownPosition(val, atIndex));

            if (search.length >= 2) {
                try {
                    const data = await searchUsersApi(apiUrl, search);
                    if (Array.isArray(data) && data.length > 0) {
                        setSuggestions(data);
                        setShowSuggestions(true);
                        setActiveIndex(0);
                    } else {
                        setShowSuggestions(false);
                    }
                } catch (err) {
                    console.error(err);
                    setShowSuggestions(false);
                }
            } else {
                 setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    };

    const insertMention = (user) => {
        const textBeforeCursor = value.slice(0, cursorPosition);
        const textAfterCursor = value.slice(cursorPosition);

        const match = textBeforeCursor.match(/(^|\s)@([a-zA-Z0-9_.-]*)$/);
        if (match) {
            const mentionText = `@${user.username} `;
            const matchString = match[0];
            const beforeMatch = textBeforeCursor.slice(0, textBeforeCursor.length - matchString.length);
            const prefix = matchString.startsWith(" ") || matchString.startsWith("\n") ? matchString[0] : "";

            const newBeforeCursor = beforeMatch + prefix + mentionText;
            const newValue = newBeforeCursor + textAfterCursor;

            onChange({ target: { value: newValue } });

            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    const newCursorPos = newBeforeCursor.length;
                    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                }
            }, 0);
        }

        setShowSuggestions(false);
    };

    return (
        <Container className={className}>
            <StyledTextarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onClick={() => setShowSuggestions(false)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={placeholder}
                $minHeight={minHeight}
                $borderRadius={borderRadius}
                $border={border}
                $padding={padding}
                rows={rows}
            />
            {showSuggestions && suggestions.length > 0 && (
                <SuggestionsDropdown top={dropdownPos.top} left={dropdownPos.left}>
                    {suggestions.map((user, idx) => (
                        <SuggestionItem
                            key={user.id}
                            active={idx === activeIndex}
                            onMouseDown={(e) => {
                                e.preventDefault(); // Prevents blur
                                insertMention(user);
                            }}
                        >
                            {user.username}
                        </SuggestionItem>
                    ))}
                </SuggestionsDropdown>
            )}
        </Container>
    );
};

export default MentionTextarea;
