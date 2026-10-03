import assert from 'node:assert/strict';
import {
  normalizeOwner,
  normalizeRepo,
  parseGitHubUrl,
  decodeBase64Utf8,
  encodeUtf8ToBase64,
  saveGitHubToken,
  getGitHubToken,
  clearGitHubToken,
} from './githubApi.js';

console.log('Running test suite for githubApi utilities...');

// ── 1. normalizeOwner and normalizeRepo ───────────────────────────────────────
assert.equal(normalizeOwner('@SuryanshSwarn09'), 'SuryanshSwarn09');
assert.equal(normalizeOwner(' /SuryanshSwarn09/ '), 'SuryanshSwarn09');
assert.equal(normalizeRepo(' gh space shooter '), 'gh-space-shooter');
assert.equal(normalizeRepo('bookshelf for browser'), 'bookshelf-for-browser');
assert.equal(normalizeRepo('my-repo.git'), 'my-repo');
assert.equal(normalizeRepo('/my-repo/'), 'my-repo');

// ── 2. parseGitHubUrl with spaces in repo names (user reported bug) ───────────
const case1 = parseGitHubUrl('https://github.com/czl9707/gh space shooter');
assert.ok(case1);
assert.equal(case1.owner, 'czl9707');
assert.equal(case1.repo, 'gh-space-shooter');
assert.equal(case1.path, 'README.md');
assert.equal(case1.isExplicitPath, false);

const case2 = parseGitHubUrl('https://github.com/SuryanshSwarn09/bookshelf for browser');
assert.ok(case2);
assert.equal(case2.owner, 'SuryanshSwarn09');
assert.equal(case2.repo, 'bookshelf-for-browser');
assert.equal(case2.path, 'README.md');
assert.equal(case2.isExplicitPath, false);

// ── 3. parseGitHubUrl shorthand with spaces ──────────────────────────────────
const case3 = parseGitHubUrl('czl9707 / gh space shooter');
assert.ok(case3);
assert.equal(case3.owner, 'czl9707');
assert.equal(case3.repo, 'gh-space-shooter');
assert.equal(case3.path, 'README.md');

// ── 4. parseGitHubUrl without protocol ────────────────────────────────────────
const case4 = parseGitHubUrl('github.com/czl9707/gh-space-shooter');
assert.ok(case4);
assert.equal(case4.owner, 'czl9707');
assert.equal(case4.repo, 'gh-space-shooter');
assert.equal(case4.path, 'README.md');

// ── 5. parseGitHubUrl blob / tree / raw ────────────────────────────────────────
const case5 = parseGitHubUrl('https://github.com/owner/repo/blob/main/docs/guide.md');
assert.ok(case5);
assert.equal(case5.owner, 'owner');
assert.equal(case5.repo, 'repo');
assert.equal(case5.ref, 'main');
assert.equal(case5.path, 'docs/guide.md');
assert.equal(case5.isExplicitPath, true);

const case6 = parseGitHubUrl('https://github.com/owner/repo/tree/feature-branch');
assert.ok(case6);
assert.equal(case6.owner, 'owner');
assert.equal(case6.repo, 'repo');
assert.equal(case6.ref, 'feature-branch');
assert.equal(case6.path, 'README.md');
assert.equal(case6.isExplicitPath, false);

const case7 = parseGitHubUrl('https://raw.githubusercontent.com/owner/repo/v1.0.0/README.md');
assert.ok(case7);
assert.equal(case7.owner, 'owner');
assert.equal(case7.repo, 'repo');
assert.equal(case7.ref, 'v1.0.0');
assert.equal(case7.path, 'README.md');
assert.equal(case7.isExplicitPath, true);

// ── 6. Unicode Base64 encoding & decoding ─────────────────────────────────────
const testMarkdown = '# Git-doc 🚀\n\nSupports LaTeX: $$\\sum_{i=1}^n i$$\n\nEmojis: ✨🎉 & German: Überprüfung';
const encoded = encodeUtf8ToBase64(testMarkdown);
const decoded = decodeBase64Utf8(encoded);
assert.equal(decoded, testMarkdown, 'UTF-8 Base64 roundtrip should preserve emojis, math, and unicode');

// ── 7. Token management fallback safety in non-browser env ───────────────────
// In Node (where localStorage is not native or mocked), should not throw
clearGitHubToken();
assert.equal(getGitHubToken(), null);
saveGitHubToken('ghp_testToken12345');

console.log('All githubApi tests passed successfully!');
