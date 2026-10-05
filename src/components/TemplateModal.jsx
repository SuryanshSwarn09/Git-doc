import { useState } from 'react';
import { GITHUB_TEMPLATES } from '../utils/templates.js';

/**
 * GitHub Template Gallery Modal.
 * Allows developers to preview and insert standardized README, Issue, PR, and Community guidelines.
 */
export default function TemplateModal({
  isOpen,
  onClose,
  onApplyTemplate,
  onInsertTemplate,
  onReplaceContent,
}) {
  const [selectedId, setSelectedId] = useState(GITHUB_TEMPLATES[0].id);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const selectedTemplate =
    GITHUB_TEMPLATES.find((t) => t.id === selectedId) || GITHUB_TEMPLATES[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedTemplate.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  const handleApply = (mode) => {
    if (typeof onApplyTemplate === 'function') {
      onApplyTemplate(selectedTemplate.content, mode, selectedTemplate.defaultFilename);
    } else if (mode === 'insert' && typeof onInsertTemplate === 'function') {
      onInsertTemplate(selectedTemplate.content, selectedTemplate.defaultFilename);
    } else if (mode === 'replace' && typeof onReplaceContent === 'function') {
      onReplaceContent(selectedTemplate.content, selectedTemplate.defaultFilename);
    }
    onClose();
  };

  // Group templates by category
  const categories = ['Documentation', 'Issues & PRs', 'Community'];
  const grouped = categories.map((cat) => ({
    name: cat,
    items: GITHUB_TEMPLATES.filter((t) => t.category === cat),
  }));

  return (
    <div
      className="modal-overlay template-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
    >
      <div className="template-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="template-modal-header">
          <div className="template-header-title">
            <span style={{ fontSize: '18px' }} aria-hidden="true">📄</span>
            <h3 id="template-modal-title">GitHub Template Gallery</h3>
            <span className="template-header-badge">7 Templates</span>
          </div>
          <button
            type="button"
            className="gh-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* 2-Column Dialog Layout */}
        <div className="template-dialog-layout">
          {/* Left Sidebar: Categories & Templates */}
          <div className="template-sidebar" role="tablist" aria-label="Available templates">
            {grouped.map((group) => (
              <div key={group.name} className="template-category-group">
                <div className="template-group-title">{group.name}</div>
                {group.items.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    role="tab"
                    aria-selected={selectedId === tmpl.id}
                    className={`template-list-item ${selectedId === tmpl.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(tmpl.id)}
                  >
                    <div className="template-item-name">{tmpl.name}</div>
                    <div className="template-item-file">{tmpl.defaultFilename}</div>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Right Main Pane: Template Preview & Actions */}
          <div className="template-main-view">
            <div className="template-view-header">
              <div className="template-view-title">
                <h4>{selectedTemplate.name}</h4>
                <p className="template-view-desc">{selectedTemplate.description}</p>
              </div>
              <button
                type="button"
                className="template-copy-btn"
                onClick={handleCopy}
                title="Copy markdown content to clipboard"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            <pre className="template-preview-code-box">{selectedTemplate.content}</pre>

            <div className="template-view-actions">
              <button
                type="button"
                className="template-insert-btn"
                onClick={() => handleApply('insert')}
                title="Insert template text at current cursor position"
              >
                Insert at Cursor
              </button>
              <button
                type="button"
                className="template-replace-btn"
                onClick={() => handleApply('replace')}
                title="Replace entire editor draft with this template"
              >
                Replace Editor Content
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
