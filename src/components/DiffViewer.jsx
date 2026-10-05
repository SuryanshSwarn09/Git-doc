import { useState, useMemo } from 'react';
import { computeLineDiff } from '../utils/diffUtils.js';

/**
 * Pre-Commit Diff Viewer component.
 * Displays a GitHub-style unified or split line diff between original imported text and active editor text.
 */
export default function DiffViewer({
  original,
  originalContent,
  modified,
  currentContent,
  filename = 'document.md',
}) {
  const [viewMode, setViewMode] = useState('unified'); // 'unified' | 'split'

  const origText = original !== undefined ? original : (originalContent ?? '');
  const currText = modified !== undefined ? modified : (currentContent ?? '');

  const diffResult = useMemo(() => {
    return computeLineDiff(origText, currText);
  }, [origText, currText]);

  const { lines, additions, deletions, hasChanges } = diffResult;

  if (!hasChanges) {
    return (
      <div className="diff-empty-state diff-empty-msg">
        <span className="diff-empty-icon" style={{ display: 'block', fontSize: '18px', marginBottom: '4px' }}>✓</span>
        <p className="diff-empty-title" style={{ fontWeight: 600, margin: '0 0 2px' }}>No changes detected</p>
        <p className="diff-empty-desc" style={{ margin: 0, fontSize: '12px' }}>The active editor content matches the original document.</p>
      </div>
    );
  }

  return (
    <div className="diff-viewer-root diff-viewer-container">
      <div className="diff-header diff-viewer-header">
        <div className="diff-file-meta diff-header-left">
          <span className="diff-filename diff-file-path">{filename}</span>
          <div className="diff-stats diff-stats-pills">
            <span className="diff-stat-add" title={`${additions} additions`}>+{additions}</span>
            <span className="diff-stat-del" title={`${deletions} deletions`}>-{deletions}</span>
          </div>
        </div>
        <div className="diff-header-right">
          <div className="diff-mode-toggle" role="radiogroup" aria-label="Diff view mode">
            <button
              type="button"
              className={`diff-mode-btn diff-toggle-btn ${viewMode === 'unified' ? 'active' : ''}`}
              onClick={() => setViewMode('unified')}
            >
              Unified
            </button>
            <button
              type="button"
              className={`diff-mode-btn diff-toggle-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              Split
            </button>
          </div>
        </div>
      </div>

      <div className={`diff-table-container diff-table-scroll ${viewMode === 'split' ? 'diff-mode-split' : 'diff-mode-unified'}`}>
        <table className="diff-table">
          <tbody>
            {lines.map((line, idx) => {
              const isAdd = line.type === 'add';
              const isRem = line.type === 'remove';
              const rowClass = isAdd ? 'diff-row-add' : isRem ? 'diff-row-del diff-row-remove' : 'diff-row-normal diff-row-context';

              return (
                <tr key={idx} className={`diff-row ${rowClass}`}>
                  <td className="diff-gutter-num diff-gutter diff-gutter-old" aria-hidden="true">
                    {line.oldLine ?? ''}
                  </td>
                  <td className="diff-gutter-num diff-gutter diff-gutter-new" aria-hidden="true">
                    {line.newLine ?? ''}
                  </td>
                  <td className="diff-gutter-sign diff-marker" aria-hidden="true">
                    {isAdd ? '+' : isRem ? '-' : ' '}
                  </td>
                  <td className="diff-code-cell diff-code diff-content">
                    <pre className="diff-text-pre" style={{ margin: 0, font: 'inherit', whiteSpace: 'pre-wrap' }}>{line.text || ' '}</pre>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
