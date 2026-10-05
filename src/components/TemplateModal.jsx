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
}) {
  const [selectedId, setSelectedId] = useState(GITHUB_TEMPLATES[0].id);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const selectedTemplate = GITHUB_TEMPLATES.find((t) => t.id === selectedId) || GITHUB_TEMPLATES[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedTemplate.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleApply = (mode) => {
    onApplyTemplate(selectedTemplate.content, mode, selectedTemplate.defaultFilename);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="template-modal-title">
      <div className="template-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="template-modal-header">
          <div className="template-modal-title-wrap">
            <span className="template-modal-icon">📄</span>
            <div>
              <h2 id="template-modal-title" className="template-modal-title">GitHub Template Gallery</h2>
              <p className="template-modal-subtitle">Insert standardized documentation, community standards, and issue templates.</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <div className="template-modal-body">
          {/* Left Sidebar: Template List */}
          <div className="template-sidebar">
            <div className="template-list" role="tablist">
              {GITHUB_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedId === tmpl.id}
                  className={`template-list-item ${selectedId === tmpl.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(tmpl.id)}
                >
                  <div className="template-item-top">
                    <span className="template-item-name">{tmpl.name}</span>
                    <span className="template-item-category">{tmpl.category}</span>
                  </div>
                  <span className="template-item-desc">{tmpl.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Main Pane: Template Details & Code Preview */}
          <div className="template-preview-pane">
            <div className="template-preview-meta">
              <div>
                <h3 className="template-meta-name">{selectedTemplate.name}</h3>
                <span className="template-meta-file">Default path: <code>{selectedTemplate.defaultFilename}</code></span>
              </div>
              <button
                type="button"
                className="template-action-btn template-copy-btn"
                onClick={handleCopy}
                title="Copy markdown text to clipboard"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            <div className="template-code-box">
              <pre className="template-code-pre">{selectedTemplate.content}</pre>
            </div>

            <div className="template-preview-actions">
              <button
                type="button"
                className="template-action-btn template-btn-insert"
                onClick={() => handleApply('insert')}
                title="Insert template text at current cursor position"
              >
                Insert at Cursor
              </button>
              <button
                type="button"
                className="template-action-btn template-btn-replace"
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
