const fs = require('fs');
let code = fs.readFileSync('src/components/MentionTextarea.jsx', 'utf8');

code = code.replace(
  `    const getDropdownPosition = () => {
        if (!textareaRef.current) return { top: 0, left: 0 };
        return {
            top: textareaRef.current.offsetHeight + 5,
            left: 0
        };
    };`,
  `    const getDropdownPosition = (textBeforeCursor) => {
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
        div.style.top = '0';
        div.style.left = '0';
        div.style.overflow = 'hidden';

        div.textContent = textBeforeCursor;
        const span = document.createElement('span');
        span.textContent = textBeforeCursor.length === 0 ? '.' : textBeforeCursor.slice(-1);

        if (textBeforeCursor.length > 0) {
            div.textContent = textBeforeCursor.slice(0, -1);
            div.appendChild(span);
        } else {
            div.appendChild(span);
        }

        document.body.appendChild(div);

        const spanRect = span.getBoundingClientRect();

        document.body.removeChild(div);

        // Return relative to the textarea Container (which is position: relative)
        return {
            top: spanRect.top - computed.paddingTop.replace('px', '') + 20, // Rough estimate
            left: Math.min(spanRect.left, ta.offsetWidth - 150)
        };
    };`
);

fs.writeFileSync('src/components/MentionTextarea.jsx', code);
