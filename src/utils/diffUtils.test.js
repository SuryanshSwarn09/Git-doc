import assert from 'node:assert/strict';
import { computeLineDiff, formatUnifiedDiff } from './diffUtils.js';

console.log('Running test suite for diffUtils...');

// 1. Identical text produces 0 additions and 0 deletions
const identical = computeLineDiff('# Hello World', '# Hello World');
assert.equal(identical.additions, 0);
assert.equal(identical.deletions, 0);
assert.equal(identical.hasChanges, false);
assert.equal(identical.lines.length, 1);
assert.equal(identical.lines[0].type, 'normal');

// 2. Line addition detection
const added = computeLineDiff('# Line 1', '# Line 1\n# Line 2');
assert.equal(added.additions, 1);
assert.equal(added.deletions, 0);
assert.equal(added.hasChanges, true);
assert.equal(added.lines[1].type, 'add');
assert.equal(added.lines[1].text, '# Line 2');

// 3. Line deletion detection
const removed = computeLineDiff('# Line 1\n# Line 2', '# Line 1');
assert.equal(removed.additions, 0);
assert.equal(removed.deletions, 1);
assert.equal(removed.hasChanges, true);
assert.equal(removed.lines[1].type, 'remove');
assert.equal(removed.lines[1].text, '# Line 2');

// 4. Line replacement (modification)
const modified = computeLineDiff('apples', 'oranges');
assert.equal(modified.additions, 1);
assert.equal(modified.deletions, 1);
assert.equal(modified.hasChanges, true);

// 5. Empty original text (brand new file)
const brandNew = computeLineDiff('', 'line 1\nline 2');
assert.equal(brandNew.additions, 2);
assert.equal(brandNew.hasChanges, true);

// 6. Format unified diff string
const unified = formatUnifiedDiff('old text', 'new text', 'README.md');
assert.ok(unified.includes('--- a/README.md'));
assert.ok(unified.includes('+++ b/README.md'));
assert.ok(unified.includes('- old text'));
assert.ok(unified.includes('+ new text'));

console.log('All diffUtils tests passed successfully!');
