const fs = require('fs');
let code = fs.readFileSync('src/components/MentionTextarea.jsx', 'utf8');

code = code.replace(
  `        // Return relative to the textarea Container (which is position: relative)
        return {
            top: spanRect.top - computed.paddingTop.replace('px', '') + 20, // Rough estimate
            left: Math.min(spanRect.left, ta.offsetWidth - 150)
        };`,
  `        // Fallback or better estimation based on scroll and padding
        const topPos = span.offsetTop + parseInt(computed.lineHeight || '20', 10) - ta.scrollTop;
        const leftPos = span.offsetLeft - ta.scrollLeft;

        return {
            top: Math.min(topPos, ta.offsetHeight),
            left: Math.min(leftPos, ta.offsetWidth - 150)
        };`
);

fs.writeFileSync('src/components/MentionTextarea.jsx', code);
