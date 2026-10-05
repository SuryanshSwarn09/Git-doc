/**
 * Zero-dependency line-by-line diff utility using Longest Common Subsequence (LCS).
 * Computes additions, deletions, line numbers, and changesets for Git-style diff viewing.
 */

/**
 * Computes the line-by-line difference between originalText and newText.
 *
 * @param {string} originalText - The original content (e.g. from GitHub import).
 * @param {string} newText - The current modified content in the editor.
 * @returns {{
 *   lines: Array<{
 *     type: 'add' | 'remove' | 'normal',
 *     oldLine: number | null,
 *     newLine: number | null,
 *     text: string
 *   }>,
 *   additions: number,
 *   deletions: number,
 *   hasChanges: boolean
 * }}
 */
export function computeLineDiff(originalText = '', newText = '') {
  if (originalText === newText) {
    const lines = (originalText ? originalText.split('\n') : []).map((text, i) => ({
      type: 'normal',
      oldLine: i + 1,
      newLine: i + 1,
      text,
    }));
    return { lines, additions: 0, deletions: 0, hasChanges: false };
  }

  const oldLines = originalText ? originalText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];

  const n = oldLines.length;
  const m = newLines.length;

  // Build LCS matrix (bounded for performance)
  // For documents up to a few thousand lines, dynamic programming with 1D/2D arrays is fast and exact.
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (oldLines[i] === newLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to build diff chunks
  let i = n;
  let j = m;
  const rawDiff = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      rawDiff.push({
        type: 'normal',
        oldLine: i,
        newLine: j,
        text: oldLines[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.push({
        type: 'add',
        oldLine: null,
        newLine: j,
        text: newLines[j - 1],
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawDiff.push({
        type: 'remove',
        oldLine: i,
        newLine: null,
        text: oldLines[i - 1],
      });
      i--;
    }
  }

  rawDiff.reverse();

  let additions = 0;
  let deletions = 0;

  for (const line of rawDiff) {
    if (line.type === 'add') additions++;
    else if (line.type === 'remove') deletions++;
  }

  return {
    lines: rawDiff,
    additions,
    deletions,
    hasChanges: additions > 0 || deletions > 0,
  };
}

/**
 * Formats line diff output as a standard unified Git diff string (e.g. for display or export).
 *
 * @param {string} originalText
 * @param {string} newText
 * @param {string} [filename='document.md']
 * @returns {string}
 */
export function formatUnifiedDiff(originalText = '', newText = '', filename = 'document.md') {
  const { lines, hasChanges } = computeLineDiff(originalText, newText);

  if (!hasChanges) {
    return `--- a/${filename}\n+++ b/${filename}\n(no changes)`;
  }

  let output = `--- a/${filename}\n+++ b/${filename}\n@@ -1,${originalText.split('\n').length} +1,${newText.split('\n').length} @@\n`;

  for (const item of lines) {
    if (item.type === 'add') {
      output += `+ ${item.text}\n`;
    } else if (item.type === 'remove') {
      output += `- ${item.text}\n`;
    } else {
      output += `  ${item.text}\n`;
    }
  }

  return output.trimEnd();
}
