import { useState, useEffect } from 'react';
import {
  GitHubIcon,
  CheckIcon,
  CheckCircleIcon,
  GitPullRequestIcon,
  GitBranchIcon,
  DiffIcon,
} from './Icons.jsx';
import {
  saveGitHubToken,
  clearGitHubToken,
  verifyGitHubToken,
  parseGitHubUrl,
  fetchRepoFile,
  createGist,
  getFileSha,
  commitFileToRepo,
  normalizeOwner,
  normalizeRepo,
  createBranch,
  createPullRequest,
} from '../utils/githubApi.js';
import { extractDocTitle, slugifyTitle } from '../utils/exportUtils.js';
import DiffViewer from './DiffViewer.jsx';

/**
 * GitHubModal — 5-tab modal for GitHub integration:
 *  Tab 1: Connect      — PAT setup & user verification
 *  Tab 2: Import       — Fetch Markdown from any GitHub URL
 *  Tab 3: Gist         — Save draft as a GitHub Gist
 *  Tab 4: Commit       — Push Markdown file to a repository
 *  Tab 5: Pull Request — Branch creation & Pull Request workflow
 */
export default function GitHubModal({
  isOpen,
  onClose,
  markdown,
  originalContent = '',
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

  // ── Tab 5: Pull Request ─────────────────────────────────────────────
  const [prOwner, setPrOwner] = useState('');
  const [prRepo, setPrRepo] = useState('');
  const [prPath, setPrPath] = useState('');
  const [prBaseBranch, setPrBaseBranch] = useState('main');
  const [prHeadBranch, setPrHeadBranch] = useState('');
  const [prTitle, setPrTitle] = useState('');
  const [prBody, setPrBody] = useState('');
  const [prLoading, setPrLoading] = useState(false);
  const [prError, setPrError] = useState('');
  const [prResult, setPrResult] = useState(null); // { prNumber, htmlUrl }

  // ── Diff Review Toggles ─────────────────────────────────────────────
  const [showCommitDiff, setShowCommitDiff] = useState(false);
  const [showPrDiff, setShowPrDiff] = useState(false);

  // Pre-fill filenames and owner from current state whenever modal opens
  useEffect(() => {
    if (isOpen && markdown) {
      const title = extractDocTitle(markdown);
      const slug = slugifyTitle(title);
      setGistFilename(`${slug}.md`);
      setCommitPath((prev) => prev || `${slug}.md`);
      setCommitMessage((prev) => prev || `docs: update ${slug}.md`);
      setPrPath((prev) => prev || `${slug}.md`);
      setPrTitle((prev) => prev || `docs: update ${slug}.md`);
      setPrHeadBranch((prev) => prev || `patch-${Math.floor(1000 + Math.random() * 9000)}`);
      setPrBody(
        (prev) =>
          prev ||
          `### Proposed Documentation Changes\n\n- Updated \`${slug}.md\` documentation.\n\n*Created with Git-doc*`
      );
    }
    if (isOpen && githubUser?.login) {
      setCommitOwner((prev) => prev || githubUser.login);
      setPrOwner((prev) => prev || githubUser.login);
    }
    if (isOpen) {
      setImportPreview(null);
      setGistResult(null);
      setCommitResult(null);
      setPrResult(null);
      setImportError('');
      setGistError('');
      setCommitError('');
      setPrError('');
      setConnectError('');
      setShowCommitDiff(false);
      setShowPrDiff(false);
    }
  }, [isOpen, markdown, githubUser]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      setCommitOwner((prev) => prev || user.login);
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
      const parsed = parseGitHubUrl(importUrl.trim());
      const meta = parsed
        ? {
            owner: parsed.owner,
            repo: parsed.repo,
            path: parsed.path,
            branch: parsed.ref || 'main',
          }
        : null;
      if (parsed) {
        setCommitOwner(parsed.owner);
        setCommitRepo(parsed.repo);
        setCommitPath(parsed.path);
        if (parsed.ref) setCommitBranch(parsed.ref);
        setCommitMessage(`docs: update ${parsed.path}`);
        setPrOwner(parsed.owner);
        setPrRepo(parsed.repo);
        setPrPath(parsed.path);
        if (parsed.ref) setPrBaseBranch(parsed.ref);
      }
      onImport(importPreview.content, meta);
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
    let owner = commitOwner.trim();
    let repo = commitRepo.trim();

    // Auto-detect if user pasted full URL or "owner/repo" into either field
    if (owner.includes('/') || owner.startsWith('http')) {
      const parsed = parseGitHubUrl(owner);
      if (parsed) {
        owner = parsed.owner;
        if (!repo) repo = parsed.repo;
      } else {
        const parts = owner.split('/');
        owner = parts[0];
        if (!repo && parts[1]) repo = parts[1];
      }
    }
    if (repo.includes('/') || repo.startsWith('http')) {
      const parsed = parseGitHubUrl(repo);
      if (parsed) {
        if (!owner) owner = parsed.owner;
        repo = parsed.repo;
      } else {
        const parts = repo.split('/');
        if (!owner && parts[0]) owner = parts[0];
        if (parts[1]) repo = parts[1];
      }
    }

    owner = normalizeOwner(owner);
    repo = normalizeRepo(repo);

    if (!owner || !repo) {
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
        owner,
        repo,
        path: commitPath.trim(),
        branch: commitBranch.trim() || undefined,
      });
      const result = await commitFileToRepo({
        owner,
        repo,
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

  const handleCreatePR = async () => {
    let owner = prOwner.trim();
    let repo = prRepo.trim();

    if (owner.includes('/') || owner.startsWith('http')) {
      const parsed = parseGitHubUrl(owner);
      if (parsed) {
        owner = parsed.owner;
        if (!repo) repo = parsed.repo;
      } else {
        const parts = owner.split('/');
        owner = parts[0];
        if (!repo && parts[1]) repo = parts[1];
      }
    }
    if (repo.includes('/') || repo.startsWith('http')) {
      const parsed = parseGitHubUrl(repo);
      if (parsed) {
        if (!owner) owner = parsed.owner;
        repo = parsed.repo;
      } else {
        const parts = repo.split('/');
        if (!owner && parts[0]) owner = parts[0];
        if (parts[1]) repo = parts[1];
      }
    }

    owner = normalizeOwner(owner);
    repo = normalizeRepo(repo);

    if (!owner || !repo) {
      setPrError('Owner and repository name are required.');
      return;
    }
    if (!prPath.trim()) {
      setPrError('File path is required (e.g. README.md or docs/guide.md).');
      return;
    }
    if (!prHeadBranch.trim()) {
      setPrError('New branch name is required.');
      return;
    }
    if (!prTitle.trim()) {
      setPrError('Pull request title is required.');
      return;
    }
    if (!markdown.trim()) {
      setPrError('Editor is empty — nothing to submit.');
      return;
    }

    setPrLoading(true);
    setPrError('');
    setPrResult(null);

    try {
      const base = prBaseBranch.trim() || 'main';
      const head = prHeadBranch.trim();

      // Step 1: Create the branch from base
      await createBranch({
        owner,
        repo,
        newBranch: head,
        baseBranch: base,
      });

      // Step 2: Determine SHA if file exists in the branch
      let sha = undefined;
      try {
        sha = await getFileSha({
          owner,
          repo,
          path: prPath.trim(),
          branch: head,
        });
      } catch {
        // file doesn't exist yet, proceed with undefined sha
      }

      // Step 3: Commit the markdown changes to the new branch
      await commitFileToRepo({
        owner,
        repo,
        path: prPath.trim(),
        content: markdown,
        message: prTitle.trim(),
        branch: head,
        sha: sha || undefined,
      });

      // Step 4: Create the pull request
      const pr = await createPullRequest({
        owner,
        repo,
        title: prTitle.trim(),
        head,
        base,
        body:
          prBody.trim() ||
          `### Proposed Changes\n\n- Updated \`${prPath.trim()}\` via Git-doc.\n\n*Created with Git-doc*`,
      });

      setPrResult({
        prNumber: pr.number,
        htmlUrl: pr.html_url,
      });
    } catch (err) {
      setPrError(err.message);
    } finally {
      setPrLoading(false);
    }
  };

  // ── Tab definitions ─────────────────────────────────────────────────
  const tabs = [
    { id: 'connect', label: 'Connect',      emoji: '🔑' },
    { id: 'import',  label: 'Import',       emoji: '📥' },
    { id: 'gist',    label: 'Gist',         emoji: '☁️' },
    { id: 'commit',  label: 'Commit',       emoji: '📤' },
    { id: 'pr',      label: 'Pull Request', emoji: '🔀' },
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
          <button
            type="button"
            className="gh-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            title="Close (Esc)"
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="gh-tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
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
                <button type="button" className="gh-disconnect-btn" onClick={handleDisconnect}>
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
                <div className="gh-preview-actions">
                  <button
                    type="button"
                    className="gh-primary-btn"
                    onClick={handleConnect}
                    disabled={connectLoading}
                  >
                    {connectLoading ? <span className="gh-spinner" /> : <CheckIcon size={15} />}
                    {connectLoading ? 'Verifying…' : 'Verify & Connect'}
                  </button>
                  <button
                    type="button"
                    className="gh-secondary-btn"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
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
                type="button"
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
                  <button type="button" className="gh-primary-btn" onClick={handleImportConfirm}>
                    <CheckIcon size={15} /> Replace Editor Content
                  </button>
                  <button type="button" className="gh-secondary-btn" onClick={() => setImportPreview(null)}>
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
                <button type="button" className="gh-inline-link" onClick={() => setActiveTab('connect')}>
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
                  type="button"
                  className={`gh-seg-btn ${!gistPublic ? 'active' : ''}`}
                  onClick={() => setGistPublic(false)}
                >
                  🔒 Secret
                </button>
                <button
                  type="button"
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
            <div className="gh-preview-actions">
              <button
                type="button"
                className="gh-primary-btn"
                onClick={handleCreateGist}
                disabled={gistLoading || !githubUser}
              >
                {gistLoading ? <span className="gh-spinner" /> : <GitHubIcon size={15} />}
                {gistLoading ? 'Creating…' : 'Create Gist'}
              </button>
              <button
                type="button"
                className="gh-secondary-btn"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
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
                  placeholder="e.g. SuryanshSwarn09"
                  value={commitOwner}
                  onChange={(e) => setCommitOwner(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
                  spellCheck={false}
                />
              </div>
              <div className="gh-field">
                <label className="gh-label" htmlFor="gh-commit-repo">Repository</label>
                <input
                  id="gh-commit-repo"
                  type="text"
                  className="gh-input"
                  placeholder="e.g. Git-doc"
                  value={commitRepo}
                  onChange={(e) => setCommitRepo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
                  spellCheck={false}
                />
              </div>
            </div>
            <label className="gh-label" htmlFor="gh-commit-path">File Path in Repo</label>
            <input
              id="gh-commit-path"
              type="text"
              className="gh-input"
              placeholder="e.g. README.md or docs/notes.md"
              value={commitPath}
              onChange={(e) => setCommitPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
              spellCheck={false}
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
              onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
              spellCheck={false}
            />
            <label className="gh-label" htmlFor="gh-commit-msg">Commit Message</label>
            <input
              id="gh-commit-msg"
              type="text"
              className="gh-input"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
            />
            <div className="gh-diff-toggle-row">
              <button
                type="button"
                className="gh-diff-toggle-btn"
                onClick={() => setShowCommitDiff((v) => !v)}
              >
                <DiffIcon size={14} />
                <span>{showCommitDiff ? 'Hide Diff Review' : 'Review Changes before Committing'}</span>
              </button>
            </div>
            {showCommitDiff && (
              <div className="gh-modal-diff-wrapper">
                <DiffViewer
                  original={originalContent || ''}
                  modified={markdown}
                  filename={commitPath || 'document.md'}
                />
              </div>
            )}
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
            <div className="gh-preview-actions">
              <button
                type="button"
                className="gh-primary-btn"
                onClick={handleCommit}
                disabled={commitLoading || !githubUser}
              >
                {commitLoading ? <span className="gh-spinner" /> : <GitHubIcon size={15} />}
                {commitLoading ? 'Pushing…' : 'Push Commit'}
              </button>
              <button
                type="button"
                className="gh-secondary-btn"
                onClick={onClose}
              >
                {commitResult ? 'Done' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* ── Tab 5: Pull Request ────────────────────────────────────── */}
        {activeTab === 'pr' && (
          <div className="gh-tab-panel">
            {!githubUser && (
              <div className="gh-warning-box">
                ⚠️ Connect your GitHub account first to open Pull Requests.
                <button className="gh-inline-link" onClick={() => setActiveTab('connect')}>
                  Go to Connect →
                </button>
              </div>
            )}
            <div className="gh-input-row">
              <div className="gh-field">
                <label className="gh-label" htmlFor="gh-pr-owner">Owner</label>
                <input
                  id="gh-pr-owner"
                  type="text"
                  className="gh-input"
                  placeholder="e.g. SuryanshSwarn09"
                  value={prOwner}
                  onChange={(e) => setPrOwner(e.target.value)}
                  spellCheck={false}
                />
              </div>
              <div className="gh-field">
                <label className="gh-label" htmlFor="gh-pr-repo">Repository</label>
                <input
                  id="gh-pr-repo"
                  type="text"
                  className="gh-input"
                  placeholder="e.g. Git-doc"
                  value={prRepo}
                  onChange={(e) => setPrRepo(e.target.value)}
                  spellCheck={false}
                />
              </div>
            </div>

            <label className="gh-label" htmlFor="gh-pr-path">Target File Path</label>
            <input
              id="gh-pr-path"
              type="text"
              className="gh-input"
              placeholder="e.g. README.md or docs/guide.md"
              value={prPath}
              onChange={(e) => setPrPath(e.target.value)}
              spellCheck={false}
            />

            <div className="gh-input-row">
              <div className="gh-field">
                <label className="gh-label" htmlFor="gh-pr-base">Base Branch</label>
                <input
                  id="gh-pr-base"
                  type="text"
                  className="gh-input"
                  placeholder="main"
                  value={prBaseBranch}
                  onChange={(e) => setPrBaseBranch(e.target.value)}
                  spellCheck={false}
                />
              </div>
              <div className="gh-field">
                <label className="gh-label" htmlFor="gh-pr-head">New Branch Name</label>
                <input
                  id="gh-pr-head"
                  type="text"
                  className="gh-input"
                  placeholder="patch-1"
                  value={prHeadBranch}
                  onChange={(e) => setPrHeadBranch(e.target.value)}
                  spellCheck={false}
                />
              </div>
            </div>

            <label className="gh-label" htmlFor="gh-pr-title">PR Title</label>
            <input
              id="gh-pr-title"
              type="text"
              className="gh-input"
              placeholder="docs: update documentation"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
            />

            <label className="gh-label" htmlFor="gh-pr-body">PR Description (Markdown)</label>
            <textarea
              id="gh-pr-body"
              className="gh-input gh-textarea"
              rows={3}
              value={prBody}
              onChange={(e) => setPrBody(e.target.value)}
            />

            <div className="gh-diff-toggle-row">
              <button
                type="button"
                className="gh-diff-toggle-btn"
                onClick={() => setShowPrDiff((v) => !v)}
              >
                <DiffIcon size={14} />
                <span>{showPrDiff ? 'Hide Diff Review' : 'Review Changes before Opening PR'}</span>
              </button>
            </div>
            {showPrDiff && (
              <div className="gh-modal-diff-wrapper">
                <DiffViewer
                  original={originalContent || ''}
                  modified={markdown}
                  filename={prPath || 'document.md'}
                />
              </div>
            )}

            {prError && <p className="gh-error-msg">{prError}</p>}
            {prResult && (
              <div className="gh-success-card">
                <CheckCircleIcon size={18} />
                <div>
                  <strong>Pull Request #{prResult.prNumber} created!</strong>
                  {prResult.htmlUrl && (
                    <a
                      href={prResult.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gh-result-link"
                    >
                      View PR on GitHub →
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="gh-preview-actions">
              <button
                type="button"
                className="gh-primary-btn"
                onClick={handleCreatePR}
                disabled={prLoading || !githubUser}
              >
                {prLoading ? <span className="gh-spinner" /> : <GitPullRequestIcon size={15} />}
                {prLoading ? 'Creating PR…' : 'Create Pull Request'}
              </button>
              <button
                type="button"
                className="gh-secondary-btn"
                onClick={onClose}
              >
                {prResult ? 'Done' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
