import { useState, useMemo } from 'react';
import { computeLineDiff } from '../utils/diffUtils.js';

/**
 * Pre-Commit Diff Viewer component.
 * Displays a GitHub-style unified or split line diff between original imported text and active editor text.
 */
export default function DiffViewer({
  originalContent = '',
  currentContent = '',
  filename = 'document.md',
}) {
  const [viewMode, setViewMode] = useState('unified'); // 'unified' | 'split'

  const diffResult = useMemo(() => {
    return computeLineDiff(originalContent, currentContent);
  }, [originalContent, currentContent]);

  const { lines, additions, deletions, hasChanges } = diffResult;

  if (!hasChanges) {
    return (
      <div className="diff-empty-state">
        <span className="diff-empty-icon">✓</span>
        <p className="diff-empty-title">No changes detected</p>
        <p className="diff-empty-desc">The content in your editor matches the original imported file.</p>
      </div>
    );
  }

  return (
    <div className="diff-viewer-container">
      <div className="diff-viewer-header">
        <div className="diff-header-left">
          <span className="diff-file-path">{filename}</span>
          <div className="diff-stats-pills">
            <span className="diff-stat-add" title={`${additions} additions`}>+{additions}</span>
            <span className="diff-stat-del" title={`${deletions} deletions`}>-{deletions}</span>
          </div>
        </div>
        <div className="diff-header-right">
          <div className="diff-mode-toggle" role="radiogroup" aria-label="Diff view mode">
            <button
              type="button"
              className={`diff-toggle-btn ${viewMode === 'unified' ? 'active' : ''}`}
              onClick={() => setViewMode('unified')}
            >
              Unified
            </button>
            <button
              type="button"
              className={`diff-toggle-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              Split
            </button>
          </div>
        </div>
      </div>

      <div className={`diff-table-scroll ${viewMode === 'split' ? 'diff-mode-split' : 'diff-mode-unified'}`}>
        <table className="diff-table">
          <tbody>
            {lines.map((line, idx) => {
              const isAdd = line.type === 'add';
              const isRem = line.type === 'remove';
              const rowClass = isAdd ? 'diff-row-add' : isRem ? 'diff-row-remove' : 'diff-row-normal';

              return (
                <tr key={idx} className={`diff-row ${rowClass}`}>
                  <td className="diff-gutter diff-gutter-old" aria-hidden="true">
                    {line.oldLine ?? ''}
                  </td>
                  <td className="diff-gutter diff-gutter-new" aria-hidden="true">
                    {line.newLine ?? ''}
                  </td>
                  <td className="diff-marker" aria-hidden="true">
                    {isAdd ? '+' : isRem ? '-' : ' '}
                  </td>
                  <td className="diff-content">
                    <pre className="diff-text-pre">{line.text || ' '}</pre>
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
