/**
 * Print layout customizer defaults, presets, and configuration maps.
 */

export const PRINT_STORAGE_KEY = 'markdown-pdf:print-options';

export const MARGIN_CSS = {
  normal: '15mm 15mm 20mm 15mm',
  compact: '10mm 10mm 12mm 10mm',
  wide: '25mm 25mm 25mm 25mm',
};

export const PAPER_SIZE_CSS = {
  a4: 'A4',
  letter: 'letter',
};

export const PRINT_PRESETS = {
  clean: {
    id: 'clean',
    name: 'Standard Document',
    description: '1-Column clean layout on Letter paper with comfortable margins',
    columns: 1,
    paperSize: 'letter',
    margins: 'normal',
    numberedHeadings: false,
    showHeader: false,
    headerText: '',
    showFooter: false,
    footerText: '',
    showPageNumbers: true,
    showDate: false,
  },
  academic: {
    id: 'academic',
    name: 'Academic Paper (2-Col)',
    description: 'IEEE/ACM style 2-column flow on A4 paper with numbered sections',
    columns: 2,
    paperSize: 'a4',
    margins: 'compact',
    numberedHeadings: true,
    showHeader: true,
    headerText: 'Academic Paper • Draft',
    showFooter: true,
    footerText: '',
    showPageNumbers: true,
    showDate: true,
  },
  formal: {
    id: 'formal',
    name: 'Technical Report',
    description: 'Formal 1-column layout on A4 with numbered hierarchical headings',
    columns: 1,
    paperSize: 'a4',
    margins: 'normal',
    numberedHeadings: true,
    showHeader: true,
    headerText: 'Technical Report',
    showFooter: true,
    footerText: 'Confidential',
    showPageNumbers: true,
    showDate: true,
  },
};

export const DEFAULT_PRINT_OPTIONS = {
  columns: 1,
  paperSize: 'letter',
  margins: 'normal',
  numberedHeadings: false,
  showHeader: false,
  headerText: '',
  showFooter: false,
  footerText: '',
  showPageNumbers: true,
  showDate: false,
  preset: 'clean',
};

/**
 * Validates and sanitizes a print options object.
 *
 * @param {Partial<typeof DEFAULT_PRINT_OPTIONS>} options
 * @returns {typeof DEFAULT_PRINT_OPTIONS}
 */
export function validatePrintOptions(options = {}) {
  if (!options || typeof options !== 'object') {
    return { ...DEFAULT_PRINT_OPTIONS };
  }
  const columns = options.columns === 2 || options.columns === '2' ? 2 : 1;
  const paperSize = options.paperSize === 'a4' ? 'a4' : 'letter';
  const margins = options.margins === 'compact' || options.margins === 'wide' 
    ? options.margins 
    : 'normal';
  const numberedHeadings = Boolean(options.numberedHeadings);
  const showHeader = Boolean(options.showHeader);
  const headerText = typeof options.headerText === 'string' ? options.headerText.slice(0, 120) : '';
  const showFooter = Boolean(options.showFooter);
  const footerText = typeof options.footerText === 'string' ? options.footerText.slice(0, 120) : '';
  const showPageNumbers = options.showPageNumbers !== undefined ? Boolean(options.showPageNumbers) : true;
  const showDate = Boolean(options.showDate);
  const preset = options.preset && PRINT_PRESETS[options.preset] 
    ? options.preset 
    : (options.preset ? 'custom' : DEFAULT_PRINT_OPTIONS.preset);

  return {
    columns,
    paperSize,
    margins,
    numberedHeadings,
    showHeader,
    headerText,
    showFooter,
    footerText,
    showPageNumbers,
    showDate,
    preset,
  };
}

export const MARGIN_SPECS = {
  normal: { top: 15, right: 15, bottom: 20, left: 15 },
  compact: { top: 10, right: 10, bottom: 12, left: 10 },
  wide: { top: 25, right: 25, bottom: 25, left: 25 },
};

/**
 * Computes dynamic @page margins accounting for running headers and footers.
 *
 * @param {'normal' | 'compact' | 'wide'} marginsKey
 * @param {boolean} showHeader
 * @param {boolean} showFooter
 * @returns {string} Margin CSS string, e.g. "22mm 15mm 24mm 15mm"
 */
export function getComputedMargins(marginsKey, showHeader, showFooter) {
  const base = MARGIN_SPECS[marginsKey] || MARGIN_SPECS.normal;
  const top = showHeader 
    ? (marginsKey === 'compact' ? 18 : (marginsKey === 'wide' ? 30 : 22)) 
    : base.top;
  const bottom = showFooter 
    ? (marginsKey === 'compact' ? 18 : (marginsKey === 'wide' ? 32 : 24)) 
    : base.bottom;
  return `${top}mm ${base.right}mm ${bottom}mm ${base.left}mm`;
}

/**
 * Generates dynamic @page and column styling CSS for the customized print job.
 * 
 * @param {Partial<typeof DEFAULT_PRINT_OPTIONS>} options
 * @returns {string} Clean CSS string for @page and print layout
 */
export function generatePrintCSS(options) {
  const valid = validatePrintOptions(options);
  const pageSize = PAPER_SIZE_CSS[valid.paperSize] || 'letter';
  const marginValue = getComputedMargins(valid.margins, valid.showHeader, valid.showFooter);
  const columns = valid.columns;

  let pageMediaCounters = '';
  if (valid.showFooter && valid.showPageNumbers) {
    pageMediaCounters = `
@page {
  @bottom-right {
    content: "Page " counter(page);
    font-size: 8.5pt;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #64748b;
  }
}`;
  }

  return `
@page {
  size: ${pageSize};
  margin: ${marginValue};
}
${pageMediaCounters}
@media print {
  .preview-output {
    column-count: ${columns} !important;
  }
}
`.trim();
}

/**
 * Retrieves the stored print options from localStorage or falls back to DEFAULT_PRINT_OPTIONS.
 * 
 * @returns {typeof DEFAULT_PRINT_OPTIONS}
 */
export function getStoredPrintOptions() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(PRINT_STORAGE_KEY);
      if (raw) {
        return validatePrintOptions(JSON.parse(raw));
      }
    } catch {
      // Ignore JSON parse or storage access errors
    }
  }
  return { ...DEFAULT_PRINT_OPTIONS };
}

/**
 * Persists the user's customized print options to localStorage.
 * 
 * @param {Partial<typeof DEFAULT_PRINT_OPTIONS>} options
 */
export function saveStoredPrintOptions(options) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const valid = validatePrintOptions(options);
      window.localStorage.setItem(PRINT_STORAGE_KEY, JSON.stringify(valid));
    } catch {
      // Ignore quota/security errors
    }
  }
}

