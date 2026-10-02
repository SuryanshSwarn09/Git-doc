/**
 * GitHub API utilities using raw fetch (no external SDK).
 * Supports: file fetching, gist creation, and repo file commits.
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

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function buildHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const pat = token || getGitHubToken();
  if (pat) headers['Authorization'] = `Bearer ${pat}`;
  return headers;
}

// ─── URL Parsing ──────────────────────────────────────────────────────────────

/**
 * Parses a GitHub file URL into { owner, repo, path, ref }.
 * Supports:
 *   https://github.com/owner/repo/blob/branch/path/to/file.md
 *   https://raw.githubusercontent.com/owner/repo/branch/path/to/file.md
 *   https://github.com/owner/repo  (defaults to README.md)
 *   owner/repo  (shorthand, defaults to README.md)
 */
export function parseGitHubUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  const rawMatch = trimmed.match(
    /^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/
  );
  if (rawMatch) return { owner: rawMatch[1], repo: rawMatch[2], ref: rawMatch[3], path: rawMatch[4] };

  const blobMatch = trimmed.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/
  );
  if (blobMatch) return { owner: blobMatch[1], repo: blobMatch[2], ref: blobMatch[3], path: blobMatch[4] };

  const repoMatch = trimmed.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/?#]+)\/?(?:[?#].*)?$/
  );
  if (repoMatch) return { owner: repoMatch[1], repo: repoMatch[2], ref: null, path: 'README.md' };

  const shortMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (shortMatch) return { owner: shortMatch[1], repo: shortMatch[2], ref: null, path: 'README.md' };

  return null;
}

// ─── API: Verify Token ────────────────────────────────────────────────────────

export async function verifyGitHubToken(token) {
  const response = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: buildHeaders(token),
  });
  if (response.status === 401) throw new Error('Invalid or expired token. Please check your PAT.');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${response.status}`);
  }
  const data = await response.json();
  return { login: data.login, avatar_url: data.avatar_url, name: data.name || null };
}

// ─── API: Fetch File from Repository ─────────────────────────────────────────

export async function fetchRepoFile({ owner, repo, path, ref }) {
  let endpoint = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;
  if (ref) endpoint += `?ref=${encodeURIComponent(ref)}`;

  const response = await fetch(endpoint, { headers: buildHeaders() });

  if (response.status === 404)
    throw new Error(`File not found: "${path}" in ${owner}/${repo}. Check the path or branch.`);
  if (response.status === 403)
    throw new Error('Access denied. This may be a private repo — add a GitHub token in Settings.');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${response.status}`);
  }

  const data = await response.json();

  if (Array.isArray(data))
    throw new Error(`"${path}" is a directory. Please link to a specific file.`);
  if (data.type !== 'file')
    throw new Error(`"${path}" is not a regular file (type: ${data.type}).`);
  if (!data.content)
    throw new Error('File appears to be empty or binary.');

  const decoded = atob(data.content.replace(/\n/g, ''));
  return { content: decoded, sha: data.sha, name: data.name, path: data.path, size: data.size };
}

// ─── API: Create GitHub Gist ──────────────────────────────────────────────────

export async function createGist({ content, filename = 'document.md', description = '', isPublic = false }) {
  const token = getGitHubToken();
  if (!token) throw new Error('A GitHub token is required to create Gists. Add one in GitHub Settings.');

  const response = await fetch(`${GITHUB_API_BASE}/gists`, {
    method: 'POST',
    headers: { ...buildHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: description || 'Created with Markdown PDF Editor',
      public: isPublic,
      files: { [filename]: { content } },
    }),
  });

  if (response.status === 401) throw new Error('GitHub token is invalid or missing the "gist" scope.');
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  return { id: data.id, htmlUrl: data.html_url, filename };
}

// ─── API: Get File SHA ────────────────────────────────────────────────────────

export async function getFileSha({ owner, repo, path, branch }) {
  const cleanPath = (path || '').replace(/^\/+/, '');
  const safePath = encodeURIComponent(cleanPath).replace(/%2F/g, '/');
  let endpoint = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${safePath}`;
  if (branch) endpoint += `?ref=${encodeURIComponent(branch)}`;
  const response = await fetch(endpoint, { headers: buildHeaders() });
  if (response.status === 404) return null;
  if (!response.ok) return null;
  const data = await response.json();
  return data.sha || null;
}

// ─── API: Commit File to Repository ──────────────────────────────────────────

export async function commitFileToRepo({ owner, repo, path, content, message, branch, sha }) {
  const token = getGitHubToken();
  if (!token) throw new Error('A GitHub token is required to commit files. Add one in GitHub Settings.');

  const encoded = btoa(unescape(encodeURIComponent(content)));
  const cleanPath = (path || '').replace(/^\/+/, '');
  const body = { message: message || `Update ${cleanPath}`, content: encoded };
  if (branch) body.branch = branch;
  if (sha) body.sha = sha;

  const safePath = encodeURIComponent(cleanPath).replace(/%2F/g, '/');
  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${safePath}`, {
    method: 'PUT',
    headers: { ...buildHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (response.status === 401) throw new Error('GitHub token is invalid or missing the "repo" scope.');
  if (response.status === 404) throw new Error(`Repository "${owner}/${repo}" not found, or you lack write access.`);
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
