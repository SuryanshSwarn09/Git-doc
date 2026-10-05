import assert from 'node:assert/strict';
import { GITHUB_TEMPLATES, getTemplateById } from './templates.js';

console.log('Running test suite for templates...');

// 1. All 7 templates exist
assert.equal(GITHUB_TEMPLATES.length, 7);

// 2. Each template has required metadata fields
for (const tmpl of GITHUB_TEMPLATES) {
  assert.ok(tmpl.id, 'Template must have an id');
  assert.ok(tmpl.name, `Template ${tmpl.id} must have a name`);
  assert.ok(tmpl.category, `Template ${tmpl.id} must have a category`);
  assert.ok(tmpl.description, `Template ${tmpl.id} must have a description`);
  assert.ok(tmpl.defaultFilename, `Template ${tmpl.id} must have a defaultFilename`);
  assert.ok(tmpl.content && tmpl.content.trim().length > 50, `Template ${tmpl.id} must have meaningful content`);
}

// 3. Retrieval by ID works
const readme = getTemplateById('readme');
assert.ok(readme);
assert.equal(readme.name, 'Modern Project README');

const bugReport = getTemplateById('bug_report');
assert.ok(bugReport);
assert.ok(bugReport.content.includes('Steps to Reproduce'));

const pullRequest = getTemplateById('pull_request');
assert.ok(pullRequest);
assert.ok(pullRequest.content.includes('Type of Change'));

// 4. Invalid ID returns null
assert.equal(getTemplateById('non_existent_id'), null);

console.log('All templates tests passed successfully!');
