import React, { useState, useEffect } from 'react';
import { useContent } from './ContentProvider';

interface EditableTextProps {
  contentKey: string;
  defaultText: string;
  isAdmin: boolean;
  tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
}

const EditableText: React.FC<EditableTextProps> = ({ 
  contentKey, 
  defaultText, 
  isAdmin, 
  tagName: Tag = 'span',
  className = '',
  style,
  multiline = false
}) => {
  const { content, updateContent } = useContent();
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState('');
  
  const text = content[contentKey] || defaultText;

  useEffect(() => {
    setTempText(text);
  }, [text]);

  const handleSave = async () => {
    await updateContent(contentKey, tempText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempText(text);
    setIsEditing(false);
  };

  if (isAdmin && isEditing) {
    return (
      <div className={`editable-container editing ${className}`}>
        {multiline ? (
          <textarea 
            value={tempText} 
            onChange={(e) => setTempText(e.target.value)}
            className="edit-input"
            rows={5}
          />
        ) : (
          <input 
            type="text" 
            value={tempText} 
            onChange={(e) => setTempText(e.target.value)}
            className="edit-input"
          />
        )}
        <div className="edit-controls">
          <button onClick={handleSave} className="save-btn">Save</button>
          <button onClick={handleCancel} className="cancel-btn">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <Tag className={`editable-container ${className} ${isAdmin ? 'admin-editable' : ''}`} style={style}>
      {text}
      {isAdmin && (
        <button 
          className="edit-icon-btn" 
          onClick={() => setIsEditing(true)}
          title="Edit text"
        >
          ✎
        </button>
      )}
    </Tag>
  );
};

export default EditableText;
