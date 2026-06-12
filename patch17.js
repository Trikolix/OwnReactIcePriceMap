const fs = require('fs');
let code = fs.readFileSync('src/components/MentionTextarea.jsx', 'utf8');

code = code.replace(
  `        const match = textBeforeCursor.match(/(?:^|\\s)@([a-zA-Z0-9_.-]*)$/);

        if (match) {
            const search = match[1];
            setMentionSearch(search);
            setDropdownPos(getDropdownPosition());`,
  `        const match = textBeforeCursor.match(/(?:^|\\s)@([a-zA-Z0-9_.-]*)$/);

        if (match) {
            const search = match[1];
            setMentionSearch(search);
            setDropdownPos(getDropdownPosition(textBeforeCursor));`
);

fs.writeFileSync('src/components/MentionTextarea.jsx', code);
