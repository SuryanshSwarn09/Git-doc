# MARKDOWN LATEX PDF GENERATOR — GitHub Edition
*A Markdown + LaTeX editor with live preview, PDF export, and full GitHub API integration.*

> This project started in March 2026 as a practical Markdown + LaTeX editor. In October 2026 it was extended with a full **GitHub API integration** as part of the GitHub Developer Program — enabling users to import files from repos, save drafts as Gists, and commit Markdown directly to GitHub, all from inside the editor.

### Tech stack
_`React` `Vite` `marked.js` `highlight.js` `KaTeX` `DOMPurify` `GitHub REST API`_

---

## GitHub Integration (New — October 2026)

This version adds a dedicated **GitHub panel** accessible via the `GitHub` button in the top action bar. It connects to three GitHub REST API endpoints using a Personal Access Token (PAT) stored securely in `localStorage`.

### Features

#### Connect — PAT Authentication
- Paste a GitHub Personal Access Token to authenticate
- Token is verified live against `GET /user` and displays your avatar + username on success
- Session is silently restored on every page load from `localStorage`
- One-click **Disconnect** to revoke the session

#### Import — Fetch Markdown from Any GitHub URL
- Paste any of the following and the app fetches and decodes the file automatically:
  - `https://github.com/owner/repo/blob/branch/path/to/file.md`
  - `https://raw.githubusercontent.com/owner/repo/branch/path/to/file.md`
  - `https://github.com/owner/repo` — auto-fetches `README.md`
  - `owner/repo` shorthand — auto-fetches `README.md`
- Shows a preview card (filename, size, content snippet) before loading
- Public repos work **without a token**; private repos require a connected PAT
- All imported content routes through the **existing DOMPurify sanitization pipeline** — no XSS risk

#### Gist — Save Draft as a GitHub Gist
- Saves the current editor content as a new GitHub Gist
- Filename is pre-filled from the document top heading (slugified)
- Toggle between **Public** and **Secret** visibility
- Optional description field
- Returns a direct link to the created Gist on success

#### Commit — Push to a Repository
- Commit the current Markdown file directly to any GitHub repo you have write access to
- Fields: Owner, Repository, File Path, Branch (optional), Commit Message
- Auto-detects whether the file already exists (fetches SHA via `GET /repos/.../contents/...`) and sends a create or update accordingly
- Returns a direct link to the committed file on GitHub

### GitHub API Endpoints Used

| Feature | Method | Endpoint |
|---|---|---|
| Token verification | `GET` | `/user` |
| Import file | `GET` | `/repos/{owner}/{repo}/contents/{path}` |
| Get file SHA (for updates) | `GET` | `/repos/{owner}/{repo}/contents/{path}` |
| Create Gist | `POST` | `/gists` |
| Commit file | `PUT` | `/repos/{owner}/{repo}/contents/{path}` |

### Setup — Getting a Personal Access Token

1. Go to [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Give it a name (e.g. `markdown-editor`)
3. Select scopes: `repo` (for commits) and `gist` (for Gists)
4. Click **Generate token** and copy it
5. Open the app → click **GitHub** → paste in the **Connect** tab

> **Security note:** The token is stored only in your browser's `localStorage` and is only ever sent to `api.github.com` over HTTPS. The app has no backend and does not transmit your token anywhere else.

# ORIGINAL PROJECT: MARKDOWN LATEX PDF GENERATOR  Go to [github.com/SuryanshSwarn09/markdown-pdf](https://github.com/SuryanshSwarn09/markdown-pdf)