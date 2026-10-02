import { useState, useEffect } from 'react';
import { GitHubIcon, CheckIcon, CheckCircleIcon } from './Icons.jsx';
import {
  saveGitHubToken,
  clearGitHubToken,
  verifyGitHubToken,
  parseGitHubUrl,
  fetchRepoFile,
  createGist,
  getFileSha,
  commitFileToRepo,
} from '../utils/githubApi.js';
import { extractDocTitle, slugifyTitle } from '../utils/exportUtils.js';

/**
 * GitHubModal — 4-tab modal for GitHub integration:
 *  Tab 1: Connect  — PAT setup & user verification
 *  Tab 2: Import   — Fetch Markdown from any GitHub URL
 *  Tab 3: Gist     — Save draft as a GitHub Gist
 *  Tab 4: Commit   — Push Markdown file to a repository
 */
export default function GitHubModal({
  isOpen,
  onClose,
  markdown,
  onImport,
  githubUser,
  onUserChange,
}) {
  const [activeTab, setActiveTab] = useState('connect');

  // ── Tab 1: Connect ──────────────────────────────────────────────────
  const [patInput, setPatInput] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState('');

  // ── Tab 2: Import ───────────────────────────────────────────────────
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importPreview, setImportPreview] = useState(null); // { name, content, size }

  // ── Tab 3: Gist ─────────────────────────────────────────────────────
  const [gistFilename, setGistFilename] = useState('document.md');
  const [gistDesc, setGistDesc] = useState('');
  const [gistPublic, setGistPublic] = useState(false);
  const [gistLoading, setGistLoading] = useState(false);
  const [gistError, setGistError] = useState('');
  const [gistResult, setGistResult] = useState(null); // { htmlUrl }

  // ── Tab 4: Commit ───────────────────────────────────────────────────
  const [commitOwner, setCommitOwner] = useState('');
  const [commitRepo, setCommitRepo] = useState('');
  const [commitPath, setCommitPath] = useState('');
  const [commitBranch, setCommitBranch] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitError, setCommitError] = useState('');
  const [commitResult, setCommitResult] = useState(null); // { htmlUrl, commitSha }

  // Pre-fill filenames from current markdown title whenever modal opens
  useEffect(() => {
    if (isOpen && markdown) {
      const title = extractDocTitle(markdown);
      const slug = slugifyTitle(title);
      setGistFilename(`${slug}.md`);
      setCommitPath(`${slug}.md`);
      setCommitMessage(`docs: update ${slug}.md`);
    }
    if (isOpen) {
      setImportPreview(null);
      setGistResult(null);
      setCommitResult(null);
      setImportError('');
      setGistError('');
      setCommitError('');
      setConnectError('');
    }
  }, [isOpen, markdown]);

  if (!isOpen) return null;

  // ── Handlers ────────────────────────────────────────────────────────

  const handleConnect = async () => {
    if (!patInput.trim()) {
      setConnectError('Please paste your Personal Access Token.');
      return;
    }
    setConnectLoading(true);
    setConnectError('');
    try {
      const user = await verifyGitHubToken(patInput.trim());
      saveGitHubToken(patInput.trim());
      onUserChange(user);
      setPatInput('');
    } catch (err) {
      setConnectError(err.message);
    } finally {
      setConnectLoading(false);
    }
  };

  const handleDisconnect = () => {
    clearGitHubToken();
    onUserChange(null);
    setConnectError('');
  };

  const handleImportFetch = async () => {
    if (!importUrl.trim()) {
      setImportError('Please enter a GitHub URL or owner/repo.');
      return;
    }
    const parsed = parseGitHubUrl(importUrl.trim());
    if (!parsed) {
      setImportError('Could not parse URL. Try: github.com/owner/repo/blob/main/README.md');
      return;
    }
    setImportLoading(true);
    setImportError('');
    setImportPreview(null);
    try {
      const result = await fetchRepoFile(parsed);
      setImportPreview(result);
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportConfirm = () => {
    if (importPreview) {
      onImport(importPreview.content);
      setImportPreview(null);
      setImportUrl('');
      onClose();
    }
  };

  const handleCreateGist = async () => {
    if (!markdown.trim()) {
      setGistError('Editor is empty — nothing to save.');
      return;
    }
    setGistLoading(true);
    setGistError('');
    setGistResult(null);
    try {
      const result = await createGist({
        content: markdown,
        filename: gistFilename || 'document.md',
        description: gistDesc,
        isPublic: gistPublic,
      });
      setGistResult(result);
    } catch (err) {
      setGistError(err.message);
    } finally {
      setGistLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!commitOwner.trim() || !commitRepo.trim()) {
      setCommitError('Owner and repository name are required.');
      return;
    }
    if (!commitPath.trim()) {
      setCommitError('File path is required (e.g. docs/notes.md).');
      return;
    }
    if (!markdown.trim()) {
      setCommitError('Editor is empty — nothing to commit.');
      return;
    }
    setCommitLoading(true);
    setCommitError('');
    setCommitResult(null);
    try {
      const sha = await getFileSha({
        owner: commitOwner.trim(),
        repo: commitRepo.trim(),
        path: commitPath.trim(),
        branch: commitBranch.trim() || undefined,
      });
      const result = await commitFileToRepo({
        owner: commitOwner.trim(),
        repo: commitRepo.trim(),
        path: commitPath.trim(),
        content: markdown,
        message: commitMessage.trim() || `docs: update ${commitPath.trim()}`,
        branch: commitBranch.trim() || undefined,
        sha: sha || undefined,
      });
      setCommitResult(result);
    } catch (err) {
      setCommitError(err.message);
    } finally {
      setCommitLoading(false);
    }
  };

  // ── Tab definitions ─────────────────────────────────────────────────
  const tabs = [
    { id: 'connect', label: 'Connect',  emoji: '🔑' },
    { id: 'import',  label: 'Import',   emoji: '📥' },
    { id: 'gist',    label: 'Gist',     emoji: '☁️' },
    { id: 'commit',  label: 'Commit',   emoji: '📤' },
  ];

  return (
    <div
      className="modal-overlay gh-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gh-modal-title"
    >
      <div className="modal-window gh-modal-window" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="gh-modal-header">
          <div className="gh-modal-icon-badge">
            <GitHubIcon size={22} />
          </div>
          <div className="gh-modal-title-group">
            <h2 id="gh-modal-title">GitHub Integration</h2>
            <p className="gh-modal-subtitle">
              {githubUser
                ? `Connected as @${githubUser.login}`
                : 'Import, save, and commit Markdown directly with GitHub.'}
            </p>
          </div>
          {githubUser && (
            <img
              src={githubUser.avatar_url}
              alt={githubUser.login}
              className="gh-avatar"
            />
          )}
        </div>

        {/* Tabs */}
        <div className="gh-tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`gh-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="gh-tab-emoji">{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab 1: Connect ─────────────────────────────────────────── */}
        {activeTab === 'connect' && (
          <div className="gh-tab-panel">
            {githubUser ? (
              <div className="gh-connected-card">
                <img src={githubUser.avatar_url} alt={githubUser.login} className="gh-connected-avatar" />
                <div className="gh-connected-info">
                  <span className="gh-connected-name">{githubUser.name || githubUser.login}</span>
                  <span className="gh-connected-login">@{githubUser.login}</span>
                </div>
                <div className="gh-connected-badge">
                  <CheckCircleIcon size={14} />
                  Connected
                </div>
                <button className="gh-disconnect-btn" onClick={handleDisconnect}>
                  Disconnect
                </button>
              </div>
            ) : (
              <>
                <div className="gh-info-box">
                  <strong>How to get a Personal Access Token (PAT):</strong>
                  <ol className="gh-info-list">
                    <li>Go to <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer">github.com/settings/tokens/new</a></li>
                    <li>Give it a name and set expiry</li>
                    <li>Select scopes: <code>repo</code> (for commits) and <code>gist</code> (for gists)</li>
                    <li>Click <strong>Generate token</strong> and paste it below</li>
                  </ol>
                </div>
                <label className="gh-label" htmlFor="gh-pat-input">
                  Personal Access Token
                </label>
                <input
                  id="gh-pat-input"
                  type="password"
                  className="gh-input"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  autoComplete="off"
                  spellCheck={false}
                />
                {connectError && <p className="gh-error-msg">{connectError}</p>}
                <button
                  className="gh-primary-btn"
                  onClick={handleConnect}
                  disabled={connectLoading}
                >
                  {connectLoading ? <span className="gh-spinner" /> : <CheckIcon size={15} />}
                  {connectLoading ? 'Verifying…' : 'Verify & Connect'}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Tab 2: Import ──────────────────────────────────────────── */}
        {activeTab === 'import' && (
          <div className="gh-tab-panel">
            <p className="gh-panel-desc">
              Paste any GitHub file URL and load it directly into the editor. Public repos work without a token.
            </p>
            <label className="gh-label" htmlFor="gh-import-url">GitHub URL or <code>owner/repo</code></label>
            <div className="gh-input-action-row">
              <input
                id="gh-import-url"
                type="text"
                className="gh-input"
                placeholder="https://github.com/owner/repo/blob/main/README.md"
                value={importUrl}
                onChange={(e) => { setImportUrl(e.target.value); setImportError(''); setImportPreview(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handleImportFetch()}
                spellCheck={false}
              />
              <button
                className="gh-primary-btn gh-fetch-btn"
                onClick={handleImportFetch}
                disabled={importLoading}
              >
                {importLoading ? <span className="gh-spinner" /> : null}
                {importLoading ? 'Fetching…' : 'Fetch'}
              </button>
            </div>
            {importError && <p className="gh-error-msg">{importError}</p>}
            {importPreview && (
              <div className="gh-preview-card">
                <div className="gh-preview-card-info">
                  <span className="gh-preview-filename">📄 {importPreview.name}</span>
                  <span className="gh-preview-meta">
                    {(importPreview.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <p className="gh-preview-snippet">
                  {importPreview.content.slice(0, 120).replace(/\n/g, ' ')}…
                </p>
                <div className="gh-preview-actions">
                  <button className="gh-primary-btn" onClick={handleImportConfirm}>
                    <CheckIcon size={15} /> Replace Editor Content
                  </button>
                  <button className="gh-secondary-btn" onClick={() => setImportPreview(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: Gist ────────────────────────────────────────────── */}
        {activeTab === 'gist' && (
          <div className="gh-tab-panel">
            {!githubUser && (
              <div className="gh-warning-box">
                ⚠️ Connect your GitHub account first to create Gists.
                <button className="gh-inline-link" onClick={() => setActiveTab('connect')}>
                  Go to Connect →
                </button>
              </div>
            )}
            <label className="gh-label" htmlFor="gh-gist-filename">Filename</label>
            <input
              id="gh-gist-filename"
              type="text"
              className="gh-input"
              value={gistFilename}
              onChange={(e) => setGistFilename(e.target.value)}
            />
            <label className="gh-label" htmlFor="gh-gist-desc">Description <span className="gh-optional">(optional)</span></label>
            <input
              id="gh-gist-desc"
              type="text"
              className="gh-input"
              placeholder="e.g. My notes on quantum computing"
              value={gistDesc}
              onChange={(e) => setGistDesc(e.target.value)}
            />
            <div className="gh-visibility-toggle">
              <span className="gh-label" style={{ marginBottom: 0 }}>Visibility</span>
              <div className="gh-segmented">
                <button
                  className={`gh-seg-btn ${!gistPublic ? 'active' : ''}`}
                  onClick={() => setGistPublic(false)}
                >
                  🔒 Secret
                </button>
                <button
                  className={`gh-seg-btn ${gistPublic ? 'active' : ''}`}
                  onClick={() => setGistPublic(true)}
                >
                  🌐 Public
                </button>
              </div>
            </div>
            {gistError && <p className="gh-error-msg">{gistError}</p>}
            {gistResult && (
              <div className="gh-success-card">
                <CheckCircleIcon size={18} />
                <div>
                  <strong>Gist created!</strong>
                  <a href={gistResult.htmlUrl} target="_blank" rel="noopener noreferrer" className="gh-result-link">
                    Open Gist →
                  </a>
                </div>
              </div>
            )}
            <button
              className="gh-primary-btn"
              onClick={handleCreateGist}
              disabled={gistLoading || !githubUser}
            >
              {gistLoading ? <span className="gh-spinner" /> : <GitHubIcon size={15} />}
              {gistLoading ? 'Creating…' : 'Create Gist'}
            </button>
          </div>
        )}

        {/* ── Tab 4: Commit ──────────────────────────────────────────── */}
        {activeTab === 'commit' && (
          <div className="gh-tab-panel">
            {!githubUser && (
              <div className="gh-warning-box">
                ⚠️ Connect your GitHub account first to commit files.
                <button className="gh-inline-link" onClick={() => setActiveTab('connect')}>
                  Go to Connect →
                </button>
              </div>
            )}
            <div className="gh-input-row">
              <div className="gh-field">
                <label className="gh-label" htmlFor="gh-commit-owner">Owner</label>
                <input
                  id="gh-commit-owner"
                  type="text"
                  className="gh-input"
                  placeholder="SuryanshSwarn09"
                  value={commitOwner}
                  onChange={(e) => setCommitOwner(e.target.value)}
                />
              </div>
              <div className="gh-field">
                <label className="gh-label" htmlFor="gh-commit-repo">Repository</label>
                <input
                  id="gh-commit-repo"
                  type="text"
                  className="gh-input"
                  placeholder="Git-doc"
                  value={commitRepo}
                  onChange={(e) => setCommitRepo(e.target.value)}
                />
              </div>
            </div>
            <label className="gh-label" htmlFor="gh-commit-path">File Path in Repo</label>
            <input
              id="gh-commit-path"
              type="text"
              className="gh-input"
              placeholder="docs/notes.md"
              value={commitPath}
              onChange={(e) => setCommitPath(e.target.value)}
            />
            <label className="gh-label" htmlFor="gh-commit-branch">
              Branch <span className="gh-optional">(leave blank for default branch)</span>
            </label>
            <input
              id="gh-commit-branch"
              type="text"
              className="gh-input"
              placeholder="main"
              value={commitBranch}
              onChange={(e) => setCommitBranch(e.target.value)}
            />
            <label className="gh-label" htmlFor="gh-commit-msg">Commit Message</label>
            <input
              id="gh-commit-msg"
              type="text"
              className="gh-input"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
            />
            {commitError && <p className="gh-error-msg">{commitError}</p>}
            {commitResult && (
              <div className="gh-success-card">
                <CheckCircleIcon size={18} />
                <div>
                  <strong>Committed successfully!</strong>
                  {commitResult.htmlUrl && (
                    <a href={commitResult.htmlUrl} target="_blank" rel="noopener noreferrer" className="gh-result-link">
                      View on GitHub →
                    </a>
                  )}
                </div>
              </div>
            )}
            <button
              className="gh-primary-btn"
              onClick={handleCommit}
              disabled={commitLoading || !githubUser}
            >
              {commitLoading ? <span className="gh-spinner" /> : <GitHubIcon size={15} />}
              {commitLoading ? 'Pushing…' : 'Push Commit'}
            </button>
          </div>
        )}

        {/* Footer close */}
        <button className="modal-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
