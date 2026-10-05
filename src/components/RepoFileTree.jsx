import { useState, useEffect, useMemo } from 'react';
import { getRepoTree } from '../utils/githubApi.js';

/**
 * Helper to build a nested hierarchy from a flat list of paths.
 */
function buildTreeStructure(files) {
  const root = { name: '', isDir: true, children: {} };

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        current.children[part] = {
          name: part,
          path: file.path,
          size: file.size,
          isDir: false,
        };
      } else {
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: parts.slice(0, i + 1).join('/'),
            isDir: true,
            children: {},
          };
        }
        current = current.children[part];
      }
    }
  }

  return root;
}

/**
 * Recursive File/Folder node component.
 */
function TreeNode({ node, currentPath, onSelectFile, expandedDirs, onToggleDir }) {
  if (!node.isDir) {
    const isSelected = currentPath === node.path;
    return (
      <button
        type="button"
        className={`tree-file-item ${isSelected ? 'active' : ''}`}
        onClick={() => onSelectFile(node.path)}
        title={node.path}
      >
        <span className="tree-file-icon">📄</span>
        <span className="tree-file-name">{node.name}</span>
      </button>
    );
  }

  const isExpanded = Boolean(expandedDirs[node.path]);
  const childrenKeys = Object.keys(node.children || {}).sort((a, b) => {
    // Folders first, then files
    const aIsDir = node.children[a].isDir;
    const bIsDir = node.children[b].isDir;
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="tree-dir-group">
      {node.name && (
        <button
          type="button"
          className="tree-dir-item"
          onClick={() => onToggleDir(node.path)}
        >
          <span className="tree-chevron">{isExpanded ? '▾' : '▸'}</span>
          <span className="tree-dir-icon">📁</span>
          <span className="tree-dir-name">{node.name}</span>
        </button>
      )}
      {(isExpanded || !node.name) && (
        <div className={`tree-dir-children ${node.name ? 'nested' : ''}`}>
          {childrenKeys.map((key) => (
            <TreeNode
              key={key}
              node={node.children[key]}
              currentPath={currentPath}
              onSelectFile={onSelectFile}
              expandedDirs={expandedDirs}
              onToggleDir={onToggleDir}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * GitHub Repository File Tree Explorer Sidebar component.
 */
export default function RepoFileTree({
  isOpen,
  onClose,
  owner,
  repo,
  branch = 'main',
  currentFilePath = '',
  onSelectFile,
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDirs, setExpandedDirs] = useState({ '': true });

  useEffect(() => {
    if (!isOpen || !owner || !repo) return;

    let isMounted = true;
    setLoading(true);
    setError('');

    getRepoTree({ owner, repo, branch })
      .then((res) => {
        if (!isMounted) return;
        setFiles(res.files || []);
        // Auto-expand all directories by default for convenient navigation
        const dirs = { '': true };
        for (const f of res.files || []) {
          const parts = f.path.split('/');
          for (let i = 1; i < parts.length; i++) {
            dirs[parts.slice(0, i).join('/')] = true;
          }
        }
        setExpandedDirs(dirs);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load files');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, owner, repo, branch]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase().trim();
    return files.filter((f) => f.path.toLowerCase().includes(q));
  }, [files, searchQuery]);

  const treeData = useMemo(() => {
    return buildTreeStructure(filteredFiles);
  }, [filteredFiles]);

  const handleToggleDir = (path) => {
    setExpandedDirs((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  if (!isOpen) return null;

  return (
    <aside className="repo-explorer-sidebar" aria-label="Repository files explorer">
      <div className="repo-explorer-header">
        <div className="repo-explorer-title-box">
          <span className="repo-explorer-icon">📦</span>
          <div className="repo-explorer-names">
            <span className="repo-explorer-repo-name">{owner}/{repo}</span>
            <span className="repo-explorer-branch-badge">branch: {branch}</span>
          </div>
        </div>
        <button
          type="button"
          className="repo-explorer-close-btn"
          onClick={onClose}
          title="Close File Explorer (Ctrl+B)"
          aria-label="Close File Explorer"
        >
          ✕
        </button>
      </div>

      <div className="repo-explorer-search-box">
        <input
          type="search"
          className="repo-explorer-search-input"
          placeholder="Filter markdown files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="repo-explorer-content">
        {loading && (
          <div className="repo-explorer-loading">
            <span className="gh-spinner" />
            <span>Scanning repository tree...</span>
          </div>
        )}

        {error && (
          <div className="repo-explorer-error">
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && filteredFiles.length === 0 && (
          <div className="repo-explorer-empty">
            <span>No documentation files found.</span>
          </div>
        )}

        {!loading && !error && filteredFiles.length > 0 && (
          <div className="repo-explorer-tree">
            <TreeNode
              node={treeData}
              currentPath={currentFilePath}
              onSelectFile={onSelectFile}
              expandedDirs={expandedDirs}
              onToggleDir={handleToggleDir}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
