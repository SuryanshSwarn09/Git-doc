/**
 * GitHub API utilities using raw fetch (no external SDK).
 * Supports: file fetching (with resilient raw.githubusercontent.com fallback),
 * gist creation, and repo file commits.
 * Authentication: GitHub Personal Access Token (PAT) stored in localStorage.
 */

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_PAT_KEY = 'markdown-pdf:github-pat';

// ─── Token Storage ────────────────────────────────────────────────────────────

export function saveGitHubToken(token) {
  try {
    if (token && token.trim()) {
      localStorage.setItem(GITHUB_PAT_KEY, token.trim());
    } else {
      localStorage.removeItem(GITHUB_PAT_KEY);
    }
  } catch { /* storage denied */ }
}

export function getGitHubToken() {
  try {
    return localStorage.getItem(GITHUB_PAT_KEY) || null;
  } catch {
    return null;
  }
}

export function clearGitHubToken() {
  try {
    localStorage.removeItem(GITHUB_PAT_KEY);
  } catch { /* ignore */ }
}

// ─── Internal Normalization Helpers ───────────────────────────────────────────

/**
 * Normalizes an owner name (strips @ and extra whitespace).
 */
export function normalizeOwner(owner) {
  if (!owner || typeof owner !== 'string') return '';
  return owner.trim().replace(/^@+/, '').replace(/^\/+|\/+$/g, '');
}

/**
 * Normalizes a repository name (trims, replaces internal spaces with hyphens,
 * removes .git suffix and slashes).
 */
export function normalizeRepo(repo) {
  if (!repo || typeof repo !== 'string') return '';
  return repo
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.git$/i, '')
    .replace(/\s+/g, '-');
}

/**
 * Robustly decodes a base64 string to a UTF-8 string without Latin-1 corruption.
 */
export function decodeBase64Utf8(base64Str) {
  const cleanStr = (base64Str || '').replace(/\s+/g, '');
  const binaryString = atob(cleanStr);
  const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Robustly encodes a UTF-8 string to base64, supporting full Unicode and emojis.
 */
export function encodeUtf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str || '');
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function buildHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
  };
  const pat = token || getGitHubToken();
  if (pat) {
    headers['Authorization'] = `Bearer ${pat}`;
    headers['X-GitHub-Api-Version'] = '2022-11-28';
  }
  return headers;
}

// ─── URL Parsing ──────────────────────────────────────────────────────────────

/**
 * Parses any GitHub URL or shorthand into { owner, repo, path, ref, isExplicitPath }.
 * Tolerates:
 *   - Spaces in repo names (e.g. "czl9707/gh space shooter" -> "gh-space-shooter")
 *   - Missing protocol (e.g. "github.com/owner/repo")
 *   - Raw content URLs ("raw.githubusercontent.com/owner/repo/branch/path")
 *   - Blob URLs ("github.com/owner/repo/blob/branch/path")
 *   - Tree URLs ("github.com/owner/repo/tree/branch")
 *   - Shorthand ("owner/repo" or "owner / repo")
 */
export function parseGitHubUrl(url) {
  if (!url || typeof url !== 'string') return null;
  let trimmed = url.trim();

  // Strip wrapping quotes or brackets
  trimmed = trimmed.replace(/^["'<(\[]+|["'>)\]]+$/g, '');

  // 1. Raw GitHub user content: raw.githubusercontent.com/owner/repo/branch/path
  const rawMatch = trimmed.match(
    /^(?:https?:\/\/)?raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/i
  );
  if (rawMatch) {
    return {
      owner: normalizeOwner(rawMatch[1]),
      repo: normalizeRepo(rawMatch[2]),
      ref: rawMatch[3].trim(),
      path: rawMatch[4].trim(),
      isExplicitPath: true,
    };
  }

  // 2. Blob format: github.com/owner/repo/blob/branch/path
  const blobMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i
  );
  if (blobMatch) {
    return {
      owner: normalizeOwner(blobMatch[1]),
      repo: normalizeRepo(blobMatch[2]),
      ref: blobMatch[3].trim(),
      path: blobMatch[4].trim(),
      isExplicitPath: true,
    };
  }

  // 3. Tree without specific file: github.com/owner/repo/tree/branch
  const treeRootMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/tree\/([^/?#]+)\/?$/i
  );
  if (treeRootMatch) {
    return {
      owner: normalizeOwner(treeRootMatch[1]),
      repo: normalizeRepo(treeRootMatch[2]),
      ref: treeRootMatch[3].trim(),
      path: 'README.md',
      isExplicitPath: false,
    };
  }

  // 4. Tree with file: github.com/owner/repo/tree/branch/path
  const treeFileMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)$/i
  );
  if (treeFileMatch) {
    return {
      owner: normalizeOwner(treeFileMatch[1]),
      repo: normalizeRepo(treeFileMatch[2]),
      ref: treeFileMatch[3].trim(),
      path: treeFileMatch[4].trim(),
      isExplicitPath: true,
    };
  }

  // 5. Standard repository URL: github.com/owner/repo
  const repoMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/?#]+)\/?(?:[?#].*)?$/i
  );
  if (repoMatch) {
    return {
      owner: normalizeOwner(repoMatch[1]),
      repo: normalizeRepo(repoMatch[2]),
      ref: null,
      path: 'README.md',
      isExplicitPath: false,
    };
  }

  // 6. Shorthand with file path: owner / repo / blob / branch / path
  const shortWithFileMatch = trimmed.match(
    /^([A-Za-z0-9_.-]+)\s*\/\s*([^/]+)\/(?:blob\/)?([^/]+)\/(.+)$/
  );
  if (shortWithFileMatch) {
    return {
      owner: normalizeOwner(shortWithFileMatch[1]),
      repo: normalizeRepo(shortWithFileMatch[2]),
      ref: shortWithFileMatch[3].trim(),
      path: shortWithFileMatch[4].trim(),
      isExplicitPath: true,
    };
  }

  // 7. Shorthand repository: owner / repo or owner/repo (spaces tolerated)
  const shortMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\s*\/\s*(.+)$/);
  if (shortMatch) {
    return {
      owner: normalizeOwner(shortMatch[1]),
      repo: normalizeRepo(shortMatch[2]),
      ref: null,
      path: 'README.md',
      isExplicitPath: false,
    };
  }

  return null;
}

// ─── API: Verify Token ────────────────────────────────────────────────────────

export async function verifyGitHubToken(token) {
  const cleanToken = (token || '').trim();
  const response = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: buildHeaders(cleanToken),
  });
  if (response.status === 401) throw new Error('Invalid or expired token. Please check your PAT.');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${response.status}`);
  }
  const data = await response.json();
  return { login: data.login, avatar_url: data.avatar_url, name: data.name || null };
}

// ─── API: Raw Fallback Fetcher ────────────────────────────────────────────────

/**
 * Attempts to fetch a public file directly from raw.githubusercontent.com
 * when the API rate limit is exceeded or blocked by network/CORS.
 */
async function fetchFromRawFallback({ owner, repo, path = 'README.md', ref = null }) {
  const cleanPath = path.replace(/^\/+/, '');
  const branches = ref ? [ref] : ['main', 'master'];
  const filenames = cleanPath === 'README.md'
    ? ['README.md', 'readme.md', 'README', 'Readme.md', 'README.markdown']
    : [cleanPath];

  for (const branch of branches) {
    for (const filename of filenames) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodeURIComponent(filename).replace(/%2F/g, '/')}`;
        const response = await fetch(rawUrl);
        if (response.ok) {
          const content = await response.text();
          return {
            content,
            sha: null,
            name: filename.split('/').pop() || 'README.md',
            path: filename,
            size: content.length,
          };
        }
      } catch {
        // Continue trying next candidate
      }
    }
  }
  return null;
}

// ─── API: Fetch File from Repository ─────────────────────────────────────────

/**
 * Fetches a file from a repository with resilient fallback.
 * If no explicit file path was specified, it queries the GitHub /readme endpoint
 * which automatically finds whatever README exists on the default branch.
 */
export async function fetchRepoFile({ owner, repo, path = 'README.md', ref = null, isExplicitPath = false }) {
  const cleanOwner = normalizeOwner(owner);
  const cleanRepo = normalizeRepo(repo);
  const cleanPath = (path || 'README.md').replace(/^\/+/, '');

  if (!cleanOwner || !cleanRepo) {
    throw new Error('Owner and repository name are required.');
  }

  // Attempt 1: Official GitHub REST API
  try {
    let endpoint = isExplicitPath
      ? `${GITHUB_API_BASE}/repos/${cleanOwner}/${cleanRepo}/contents/${encodeURIComponent(cleanPath).replace(/%2F/g, '/')}`
      : `${GITHUB_API_BASE}/repos/${cleanOwner}/${cleanRepo}/readme`;

    if (ref) endpoint += `?ref=${encodeURIComponent(ref)}`;

    const response = await fetch(endpoint, { headers: buildHeaders() });

    if (response.status === 404) {
      // If default readme was 404, try raw fallback before giving up
      if (!isExplicitPath) {
        const rawResult = await fetchFromRawFallback({ owner: cleanOwner, repo: cleanRepo, path: cleanPath, ref });
        if (rawResult) return rawResult;
      }
      throw new Error(`File or README not found in "${cleanOwner}/${cleanRepo}". Check repository name and branch.`);
    }

    if (response.status === 403) {
      // Check if rate limited
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        const rawResult = await fetchFromRawFallback({ owner: cleanOwner, repo: cleanRepo, path: cleanPath, ref });
        if (rawResult) return rawResult;
        throw new Error('GitHub API rate limit exceeded for your IP. Add a Personal Access Token in the Connect tab to continue.');
      }
      // If private repo
      throw new Error('Access denied. If this repository is private, connect a GitHub Personal Access Token with repo scope.');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      throw new Error(`"${cleanPath}" is a directory. Please provide a link to a specific file.`);
    }
    if (data.type && data.type !== 'file') {
      throw new Error(`"${cleanPath}" is not a regular file (type: ${data.type}).`);
    }
    if (!data.content) {
      // Empty file or binary
      return { content: '', sha: data.sha, name: data.name, path: data.path, size: 0 };
    }

    const decoded = decodeBase64Utf8(data.content);
    return {
      content: decoded,
      sha: data.sha,
      name: data.name,
      path: data.path,
      size: data.size,
    };
  } catch (err) {
    // If TypeError: Failed to fetch (network error, browser CORS block, adblocker)
    // or rate limit error, attempt raw.githubusercontent.com fallback
    const rawResult = await fetchFromRawFallback({ owner: cleanOwner, repo: cleanRepo, path: cleanPath, ref });
    if (rawResult) {
      return rawResult;
    }

    // If both failed, rethrow a clear, user-friendly error
    if (err.message && !err.message.includes('Failed to fetch')) {
      throw err;
    }

    throw new Error(
      `Unable to fetch "${cleanPath}" from ${cleanOwner}/${cleanRepo}. Check that the repository is public and spelled correctly, or add a GitHub Personal Access Token in the Connect tab.`
    );
  }
}

// ─── API: Create GitHub Gist ──────────────────────────────────────────────────

export async function createGist({ content, filename = 'document.md', description = '', isPublic = false }) {
  const token = getGitHubToken();
  if (!token) throw new Error('A GitHub token is required to create Gists. Add one in the Connect tab.');

  const cleanFilename = (filename || 'document.md').trim().replace(/[^A-Za-z0-9_.-]/g, '-');
  const response = await fetch(`${GITHUB_API_BASE}/gists`, {
    method: 'POST',
    headers: { ...buildHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: description || 'Created with Git-doc Markdown Editor',
      public: Boolean(isPublic),
      files: { [cleanFilename]: { content } },
    }),
  });

  if (response.status === 401) throw new Error('GitHub token is invalid or missing the "gist" scope.');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  return { id: data.id, htmlUrl: data.html_url, filename: cleanFilename };
}

// ─── API: Get File SHA ────────────────────────────────────────────────────────

export async function getFileSha({ owner, repo, path, branch }) {
  const cleanOwner = normalizeOwner(owner);
  const cleanRepo = normalizeRepo(repo);
  const cleanPath = (path || '').replace(/^\/+/, '');
  const safePath = encodeURIComponent(cleanPath).replace(/%2F/g, '/');

  let endpoint = `${GITHUB_API_BASE}/repos/${cleanOwner}/${cleanRepo}/contents/${safePath}`;
  if (branch) endpoint += `?ref=${encodeURIComponent(branch)}`;

  try {
    const response = await fetch(endpoint, { headers: buildHeaders() });
    if (!response.ok) return null;
    const data = await response.json();
    return data.sha || null;
  } catch {
    return null;
  }
}

// ─── API: Commit File to Repository ──────────────────────────────────────────

export async function commitFileToRepo({ owner, repo, path, content, message, branch, sha }) {
  const token = getGitHubToken();
  if (!token) throw new Error('A GitHub token is required to commit files. Add one in the Connect tab.');

  const cleanOwner = normalizeOwner(owner);
  const cleanRepo = normalizeRepo(repo);
  const cleanPath = (path || '').replace(/^\/+/, '');

  if (!cleanOwner || !cleanRepo) {
    throw new Error('Repository owner and name are required.');
  }
  if (!cleanPath) {
    throw new Error('File path is required (e.g. README.md).');
  }

  const encoded = encodeUtf8ToBase64(content);
  const body = { message: message || `Update ${cleanPath}`, content: encoded };
  if (branch) body.branch = branch.trim();
  if (sha) body.sha = sha;

  const safePath = encodeURIComponent(cleanPath).replace(/%2F/g, '/');
  const response = await fetch(`${GITHUB_API_BASE}/repos/${cleanOwner}/${cleanRepo}/contents/${safePath}`, {
    method: 'PUT',
    headers: { ...buildHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (response.status === 401) throw new Error('GitHub token is invalid or missing the "repo" scope.');
  if (response.status === 404) throw new Error(`Repository "${cleanOwner}/${cleanRepo}" not found, or you lack write access.`);
  if (response.status === 409) throw new Error('Conflict: file was modified remotely. Fetch the latest version first.');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    commitSha: data.commit?.sha || '',
    htmlUrl: data.content?.html_url || data.commit?.html_url || '',
  };
}
