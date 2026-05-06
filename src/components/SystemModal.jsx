// SystemModal.js
import React from "react";
import { Dialog } from "@headlessui/react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { Overlay as SharedOverlay, Button as SharedButton } from '../styles/SharedStyles';

import { Link } from "react-router-dom";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isSafeHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function renderInlineMarkdownHtml(text) {
  const tokens = [];
  let nextText = String(text || "").replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi, (match, label, url) => {
    if (!isSafeHttpUrl(url)) return escapeHtml(match);
    const key = `%%ICEAPP_TOKEN_${tokens.length}%%`;
    tokens.push([key, `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label.trim())}</a>`]);
    return key;
  });

  let safe = escapeHtml(nextText).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  tokens.forEach(([key, html]) => {
    safe = safe.replaceAll(key, html);
  });
  return safe;
}

function renderMarkdownHtml(markdown) {
  const lines = String(markdown || "").trim().split(/\r?\n/);
  const blocks = [];
  let paragraph = [];
  let listItems = [];
  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join("\n") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: headingMatch[2].trim() });
      return;
    }
    const listMatch = trimmed.match(/^-\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      listItems.push(listMatch[1].trim());
      return;
    }
    flushList();
    paragraph.push(trimmed);
  });

  flushParagraph();
  flushList();

  return blocks.map((block) => {
    if (block.type === "heading") return `<h3>${escapeHtml(block.text)}</h3>`;
    if (block.type === "list") return `<ul>${block.items.map((item) => `<li>${renderInlineMarkdownHtml(item)}</li>`).join("")}</ul>`;
    return `<p>${renderInlineMarkdownHtml(block.text).replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

function SystemModal({ isOpen, onClose, title, message, linkUrl, linkLabel }) {
  if (!isOpen || typeof document === "undefined") return null;

  const isExternal = linkUrl?.startsWith("http");
  const messageHtml = renderMarkdownHtml(message);

  return createPortal(
    <Dialog open={isOpen} onClose={onClose}>
        <SharedOverlay aria-hidden="true" />
        <Wrapper>
          <Dialog.Panel as={Panel}>
            <TopCloseButton type="button" onClick={onClose} aria-label="Systemmeldung schließen">
              x
            </TopCloseButton>
            <Dialog.Title as={Title}>{title}</Dialog.Title>
            <Dialog.Description as={Description} dangerouslySetInnerHTML={{ __html: messageHtml }} />

            <ActionRow>
              {linkUrl && linkUrl.trim() !== "" && (
                isExternal ? (
                  <ActionButton as="a" href={linkUrl} target="_blank" rel="noopener noreferrer" onClick={onClose}>
                    {linkLabel || "Ansehen"}
                  </ActionButton>
                ) : (
                  <ActionButton as={Link} to={linkUrl} onClick={onClose}>
                    {linkLabel || "Ansehen"}
                  </ActionButton>
                )
              )}
            </ActionRow>
            <CloseRow>
              <SharedButton onClick={onClose}>
                {linkUrl && linkUrl.trim() !== "" ? "Schließen" : "Verstanden"}
              </SharedButton>
            </CloseRow>
          </Dialog.Panel>
        </Wrapper>
      </Dialog>,
    document.body
  );
}

export default SystemModal;

// Styled Components

const ActionButton = styled(SharedButton)`
  background: #ffb522;
  color: #2f2100;
  border: 1px solid rgba(255, 181, 34, 0.5);
  &:hover {
    background: #ffc34a;
  }
`;

const ActionRow = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const CloseRow = styled.div`
  margin-top: 12px;
  display: flex;
  justify-content: center;
`;

const Wrapper = styled.div`
  position: fixed;
  inset: 0;
  z-index: 3001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  pointer-events: none;
`;

const Panel = styled.div`
  position: relative;
  width: min(100%, 520px);
  background: #fffdf8;
  border: 1px solid rgba(47, 33, 0, 0.12);
  border-radius: 18px;
  box-shadow: 0 20px 48px rgba(47, 33, 0, 0.18);
  padding: 1.65rem 1.4rem 1.4rem;
  pointer-events: auto;
`;

const TopCloseButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 50%;
  background: rgba(47, 33, 0, 0.08);
  color: #2f2100;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(47, 33, 0, 0.14);
  }
`;

const Title = styled.h2`
  margin: 0;
  padding-right: 2.25rem;
  color: #2f2100;
  font-size: 1.25rem;
  line-height: 1.3;
`;

const Description = styled.div`
  margin: 0.9rem 0 0;
  color: #5f4a1f;
  line-height: 1.55;

  p {
    margin: 0 0 0.8rem;
  }

  p:last-child {
    margin-bottom: 0;
  }

  h3 {
    margin: 1rem 0 0.45rem;
    color: #2f2100;
    font-size: 1.05rem;
  }

  ul {
    margin: 0 0 0.9rem;
    padding-left: 1.25rem;
  }

  li {
    margin-bottom: 0.35rem;
  }

  a {
    color: #b45309;
    font-weight: 700;
  }
`;
