import React from 'react';

export function parseInlineMarkdown(text) {
  if (!text) return '';
  const tokens = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  let match;
  let lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    const plainText = text.substring(lastIndex, match.index);
    if (plainText) {
      tokens.push(plainText);
    }
    const matchedToken = match[0];
    if (matchedToken.startsWith('**') && matchedToken.endsWith('**')) {
      tokens.push(<strong key={match.index}>{matchedToken.slice(2, -2)}</strong>);
    } else if (matchedToken.startsWith('*') && matchedToken.endsWith('*')) {
      tokens.push(<em key={match.index}>{matchedToken.slice(1, -1)}</em>);
    } else if (matchedToken.startsWith('`') && matchedToken.endsWith('`')) {
      tokens.push(<code key={match.index} className="inline-code">{matchedToken.slice(1, -1)}</code>);
    } else if (matchedToken.startsWith('[') && matchedToken.includes('](')) {
      const closingBracket = matchedToken.indexOf('](');
      const linkText = matchedToken.slice(1, closingBracket);
      const linkUrl = matchedToken.slice(closingBracket + 2, -1);
      tokens.push(
        <a key={match.index} href={linkUrl} target="_blank" rel="noopener noreferrer" className="content-link">
          {linkText}
        </a>
      );
    } else {
      tokens.push(matchedToken);
    }
    lastIndex = regex.lastIndex;
  }
  const remainingText = text.substring(lastIndex);
  if (remainingText) {
    tokens.push(remainingText);
  }
  return tokens.length > 0 ? tokens : text;
}

export function ContentRenderer({ text }) {
  if (!text) return <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No content available.</p>;
  const lines = String(text).split('\n');
  const elements = [];
  let codeBuffer = [];
  let inCode = false;
  let listBuffer = [];

  const flushList = (keyPrefix) => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${keyPrefix}`} className="content-ul">
          {listBuffer}
        </ul>
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      flushList(i);
      if (inCode) {
        elements.push(<pre key={`code-${i}`} className="code-block">{codeBuffer.join('\n')}</pre>);
        codeBuffer = []; inCode = false;
      } else { inCode = true; }
      return;
    }
    if (inCode) { codeBuffer.push(line); return; }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      listBuffer.push(<li key={`li-${i}`} className="content-li">{parseInlineMarkdown(line.slice(2))}</li>);
    } else {
      flushList(i);
      if (line.startsWith('### ')) {
        elements.push(<h4 key={i} className="content-h3">{parseInlineMarkdown(line.slice(4))}</h4>);
      } else if (line.startsWith('## ')) {
        elements.push(<h3 key={i} className="content-h2">{parseInlineMarkdown(line.slice(3))}</h3>);
      } else if (line.startsWith('# ')) {
        elements.push(<h2 key={i} className="content-h1">{parseInlineMarkdown(line.slice(2))}</h2>);
      } else if (line.trim() === '') {
        elements.push(<br key={i} />);
      } else {
        elements.push(<p key={i} className="content-p">{parseInlineMarkdown(line)}</p>);
      }
    }
  });

  flushList('end');

  return <div className="content-renderer">{elements}</div>;
}
