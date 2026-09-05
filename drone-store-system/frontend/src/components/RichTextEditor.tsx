import React, { useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<Props> = ({ value, onChange, placeholder = 'Type formatted product content, paragraphs, or bullet points...' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  const executeCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  return (
    <div style={{
      border: '1px solid var(--color-outline, #cbd5e1)',
      borderRadius: '0.5rem',
      background: '#ffffff',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        padding: '6px 8px',
        background: '#f8fafc',
        borderBottom: '1px solid var(--color-outline, #e2e8f0)',
        alignItems: 'center',
      }}>
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          title="Bold (Ctrl+B)"
          style={btnStyle}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          title="Italic (Ctrl+I)"
          style={btnStyle}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => executeCommand('underline')}
          title="Underline (Ctrl+U)"
          style={btnStyle}
        >
          <u>U</u>
        </button>

        <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 4px' }} />

        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<h2>')}
          title="Heading 2"
          style={{ ...btnStyle, fontSize: '11px', fontWeight: 700 }}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<h3>')}
          title="Heading 3"
          style={{ ...btnStyle, fontSize: '11px', fontWeight: 700 }}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<p>')}
          title="Paragraph"
          style={{ ...btnStyle, fontSize: '11px' }}
        >
          ¶
        </button>

        <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 4px' }} />

        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          title="Bullet List"
          style={{ ...btnStyle, fontSize: '13px' }}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          title="Numbered List"
          style={{ ...btnStyle, fontSize: '11px' }}
        >
          1. List
        </button>

        <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 4px' }} />

        <button
          type="button"
          onClick={() => executeCommand('removeFormat')}
          title="Clear Formatting"
          style={{ ...btnStyle, fontSize: '11px', color: '#64748b' }}
        >
          Clear
        </button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        style={{
          padding: '12px 14px',
          minHeight: '130px',
          maxHeight: '280px',
          overflowY: 'auto',
          outline: 'none',
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#1e293b',
          fontFamily: 'inherit',
        }}
        data-placeholder={placeholder}
      />
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  padding: '4px 8px',
  cursor: 'pointer',
  fontSize: '12px',
  color: '#334155',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '26px',
  height: '26px',
};
