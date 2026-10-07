import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Search } from "lucide-react";
import { ShopButton, SHOP_COLORS } from "../../styles/ShopUi";

export default function SearchSelect({ id, label, placeholder, query, onQuery, items, onChoose, loading, error, onRetry, emptyText, disabled = false, autoFocus = false }) {
  const [open, setOpen] = useState(true), [active, setActive] = useState(-1);
  const input = useRef(null);
  useEffect(() => { setActive(-1); }, [query, items]);
  useEffect(() => { if (autoFocus) input.current?.focus(); }, [autoFocus]);
  const expanded = open && items.length > 0 && !disabled;
  useEffect(() => {
    if (expanded && active >= 0) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [expanded, active, id]);
  const choose = item => { onChoose(item); setActive(-1); setOpen(false); input.current?.focus(); };
  const onKeyDown = event => {
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); setActive(-1); }
    else if (["ArrowDown", "ArrowUp"].includes(event.key) && items.length) {
      event.preventDefault(); setOpen(true);
      setActive(previous => event.key === "ArrowDown" ? (previous + 1) % items.length : (previous < 0 ? items.length - 1 : (previous + items.length - 1) % items.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (expanded && active >= 0 && items[active]) choose(items[active]);
    }
  };
  return <Container>
    <label htmlFor={id}>{label}</label>
    <InputWrap><Search size={18} aria-hidden="true" /><input ref={input} id={id} value={query} onChange={event => { onQuery(event.target.value); setOpen(true); }}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={onKeyDown} placeholder={placeholder} disabled={disabled} autoComplete="off"
      role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls={`${id}-results`} aria-activedescendant={expanded && active >= 0 ? `${id}-option-${active}` : undefined} aria-describedby={`${id}-hint`} /></InputWrap>
    <Hint id={`${id}-hint`} role="status">{loading ? "Suche läuft …" : error || (open && !items.length ? emptyText : "")}</Hint>
    {error && onRetry && <ShopButton onClick={onRetry}>Suche wiederholen</ShopButton>}
    <Options id={`${id}-results`} role="listbox" aria-label={label} hidden={!expanded}>
      {items.map((item, index) => <Option key={item.id} id={`${id}-option-${index}`} role="option" aria-selected={active === index}
        $active={active === index} onPointerDown={event => event.preventDefault()} onClick={() => choose(item)}>
        <strong>{item.name || item.username}</strong>{item.adresse && <span>{item.adresse}</span>}
      </Option>)}
    </Options>
  </Container>;
}

const Container = styled.div`display:grid;gap:6px;min-width:0;label{font-weight:600;font-size:.92rem;}`;
const InputWrap = styled.div`display:flex;align-items:center;gap:9px;border:1px solid #ddd4c2;border-radius:10px;padding:0 12px;background:#fff;min-width:0;
  svg{flex-shrink:0;color:${SHOP_COLORS.muted};}input{width:100%;min-width:0;min-height:44px;border:0;background:transparent;color:inherit;font:inherit;}
  &:focus-within{outline:3px solid #986b0e;outline-offset:3px;}input:focus-visible{outline:none;}`;
const Hint = styled.div`font-size:.83rem;color:${SHOP_COLORS.muted};line-height:1.45;overflow-wrap:anywhere;&:empty{display:none;}`;
const Options = styled.div`display:grid;gap:4px;max-height:290px;overflow:auto;border:1px solid ${SHOP_COLORS.border};border-radius:10px;padding:4px;[hidden],&[hidden]{display:none;}`;
const Option = styled.div`display:grid;gap:3px;align-content:center;min-height:44px;box-sizing:border-box;padding:8px 10px;border-radius:7px;cursor:pointer;
  background:${({ $active }) => $active ? SHOP_COLORS.soft : "#fff"};overflow-wrap:anywhere;
  strong{font-weight:600;font-size:.92rem;}span{font-size:.82rem;color:${SHOP_COLORS.muted};}&:hover{background:${SHOP_COLORS.soft};}`;
