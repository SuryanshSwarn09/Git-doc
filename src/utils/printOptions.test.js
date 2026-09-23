import {
  PRINT_STORAGE_KEY,
  DEFAULT_PRINT_OPTIONS,
  PRINT_PRESETS,
  MARGIN_CSS,
  MARGIN_SPECS,
  PAPER_SIZE_CSS,
  getComputedMargins,
  validatePrintOptions,
  generatePrintCSS,
  getStoredPrintOptions,
  saveStoredPrintOptions,
} from './printOptions.js';
import assert from 'node:assert';

console.log('Running test suite for printOptions...');

// 1. Constants & Presets
assert.strictEqual(PRINT_STORAGE_KEY, 'markdown-pdf:print-options');
assert.strictEqual(DEFAULT_PRINT_OPTIONS.columns, 1);
assert.strictEqual(DEFAULT_PRINT_OPTIONS.paperSize, 'letter');
assert.strictEqual(DEFAULT_PRINT_OPTIONS.margins, 'normal');
assert.strictEqual(DEFAULT_PRINT_OPTIONS.numberedHeadings, false);
assert.strictEqual(DEFAULT_PRINT_OPTIONS.showHeader, false);
assert.strictEqual(DEFAULT_PRINT_OPTIONS.headerText, '');
assert.strictEqual(DEFAULT_PRINT_OPTIONS.showFooter, false);
assert.strictEqual(DEFAULT_PRINT_OPTIONS.footerText, '');
assert.strictEqual(DEFAULT_PRINT_OPTIONS.showPageNumbers, true);
assert.strictEqual(DEFAULT_PRINT_OPTIONS.showDate, false);

assert.strictEqual(PRINT_PRESETS.clean.columns, 1);
assert.strictEqual(PRINT_PRESETS.clean.showHeader, false);
assert.strictEqual(PRINT_PRESETS.clean.showFooter, false);

assert.strictEqual(PRINT_PRESETS.academic.columns, 2);
assert.strictEqual(PRINT_PRESETS.academic.numberedHeadings, true);
assert.strictEqual(PRINT_PRESETS.academic.showHeader, true);
assert.strictEqual(PRINT_PRESETS.academic.headerText, 'Academic Paper • Draft');
assert.strictEqual(PRINT_PRESETS.academic.showFooter, true);
assert.strictEqual(PRINT_PRESETS.academic.showPageNumbers, true);
assert.strictEqual(PRINT_PRESETS.academic.showDate, true);

assert.strictEqual(PRINT_PRESETS.formal.columns, 1);
assert.strictEqual(PRINT_PRESETS.formal.numberedHeadings, true);
assert.strictEqual(PRINT_PRESETS.formal.showHeader, true);
assert.strictEqual(PRINT_PRESETS.formal.headerText, 'Technical Report');
assert.strictEqual(PRINT_PRESETS.formal.showFooter, true);
assert.strictEqual(PRINT_PRESETS.formal.footerText, 'Confidential');
assert.strictEqual(PRINT_PRESETS.formal.showPageNumbers, true);
assert.strictEqual(PRINT_PRESETS.formal.showDate, true);

// 2. Computed Margins
assert.strictEqual(getComputedMargins('normal', false, false), MARGIN_CSS.normal);
assert.strictEqual(getComputedMargins('normal', true, false), '22mm 15mm 20mm 15mm');
assert.strictEqual(getComputedMargins('normal', false, true), '15mm 15mm 24mm 15mm');
assert.strictEqual(getComputedMargins('normal', true, true), '22mm 15mm 24mm 15mm');
assert.strictEqual(getComputedMargins('compact', true, true), '18mm 10mm 18mm 10mm');
assert.strictEqual(getComputedMargins('wide', true, true), '30mm 25mm 32mm 25mm');

// 3. Options validation
assert.deepStrictEqual(validatePrintOptions(null), DEFAULT_PRINT_OPTIONS);
assert.deepStrictEqual(validatePrintOptions(undefined), DEFAULT_PRINT_OPTIONS);
assert.deepStrictEqual(validatePrintOptions({}), DEFAULT_PRINT_OPTIONS);

// Custom sanitization
const custom = validatePrintOptions({
  columns: 2,
  paperSize: 'a4',
  margins: 'compact',
  numberedHeadings: true,
  showHeader: true,
  headerText: '  My Custom Lab Report  ',
  showFooter: true,
  footerText: 'Proprietary Notice',
  showPageNumbers: false,
  showDate: true,
  preset: 'academic',
});
assert.strictEqual(custom.columns, 2);
assert.strictEqual(custom.paperSize, 'a4');
assert.strictEqual(custom.margins, 'compact');
assert.strictEqual(custom.numberedHeadings, true);
assert.strictEqual(custom.showHeader, true);
assert.strictEqual(custom.headerText, '  My Custom Lab Report  ');
assert.strictEqual(custom.showFooter, true);
assert.strictEqual(custom.footerText, 'Proprietary Notice');
assert.strictEqual(custom.showPageNumbers, false);
assert.strictEqual(custom.showDate, true);
assert.strictEqual(custom.preset, 'academic');

// Long string truncation & invalid fields fallback
const longString = 'a'.repeat(200);
const fallback = validatePrintOptions({
  columns: 99,
  paperSize: 'tabloid',
  margins: 'huge',
  preset: 'unknown_preset',
  headerText: longString,
  footerText: longString,
});
assert.strictEqual(fallback.columns, 1);
assert.strictEqual(fallback.paperSize, 'letter');
assert.strictEqual(fallback.margins, 'normal');
assert.strictEqual(fallback.preset, 'custom');
assert.strictEqual(fallback.headerText.length, 120);
assert.strictEqual(fallback.footerText.length, 120);

// 4. Print CSS generation
const cleanCSS = generatePrintCSS(DEFAULT_PRINT_OPTIONS);
assert.ok(cleanCSS.includes('size: letter;'));
assert.ok(cleanCSS.includes(`margin: ${MARGIN_CSS.normal};`));
assert.ok(cleanCSS.includes('column-count: 1 !important;'));
assert.ok(!cleanCSS.includes('@bottom-right'));

const academicCSS = generatePrintCSS(PRINT_PRESETS.academic);
assert.ok(academicCSS.includes(`size: ${PAPER_SIZE_CSS.a4};`));
assert.ok(academicCSS.includes('margin: 18mm 10mm 18mm 10mm;'));
assert.ok(academicCSS.includes('column-count: 2 !important;'));
assert.ok(academicCSS.includes('@bottom-right'));
assert.ok(academicCSS.includes('content: "Page " counter(page);'));

// 5. Persistence with mock localStorage
const mockStorage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => mockStorage.get(key) ?? null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
  },
};

// Initial read with empty storage
assert.deepStrictEqual(getStoredPrintOptions(), DEFAULT_PRINT_OPTIONS);

// Save academic preset and retrieve
saveStoredPrintOptions(PRINT_PRESETS.academic);
const retrieved = getStoredPrintOptions();
assert.strictEqual(retrieved.columns, 2);
assert.strictEqual(retrieved.paperSize, 'a4');
assert.strictEqual(retrieved.margins, 'compact');
assert.strictEqual(retrieved.numberedHeadings, true);
assert.strictEqual(retrieved.showHeader, true);
assert.strictEqual(retrieved.headerText, 'Academic Paper • Draft');
assert.strictEqual(retrieved.showFooter, true);
assert.strictEqual(retrieved.showPageNumbers, true);
assert.strictEqual(retrieved.showDate, true);

// Corrupted JSON in storage fallback
mockStorage.set(PRINT_STORAGE_KEY, '{ invalid json');
assert.deepStrictEqual(getStoredPrintOptions(), DEFAULT_PRINT_OPTIONS);

// Storage throws exception fallback
globalThis.window.localStorage.getItem = () => { throw new Error('StorageBlocked'); };
assert.deepStrictEqual(getStoredPrintOptions(), DEFAULT_PRINT_OPTIONS);

globalThis.window.localStorage.setItem = () => { throw new Error('StorageQuota'); };
assert.doesNotThrow(() => saveStoredPrintOptions(PRINT_PRESETS.clean));

console.log('All printOptions tests passed successfully!');

