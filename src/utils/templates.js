/**
 * Standardized GitHub repository and community documentation templates.
 * Covers: README, Issue Templates, Pull Request Template, Contributing Guide,
 * Security Policy, and Code of Conduct.
 */

export const GITHUB_TEMPLATES = [
  {
    id: 'readme',
    name: 'Modern Project README',
    category: 'Repository',
    description: 'Clean, badge-ready open-source project overview with quick start and architecture.',
    defaultFilename: 'README.md',
    content: `# Project Name

> A concise, compelling one-line description of what this project does and why it exists.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/owner/repo.svg)](https://github.com/owner/repo/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/owner/repo/ci.yml?branch=main)](https://github.com/owner/repo/actions)
[![GitHub stars](https://img.shields.io/github/stars/owner/repo.svg)](https://github.com/owner/repo/stargazers)

---

## ✨ Features

- ⚡ **High Performance**: Built with modern standards for instant responsiveness.
- 🎨 **GitHub Primer Look**: Clean, distraction-free developer experience.
- 🔒 **Privacy-First**: Zero tracking, client-side execution, fully secure.
- 📦 **Extensible**: Modular architecture designed for easy customization.

---

## 🚀 Quick Start

### Prerequisites
- Node.js \`>= 18.0.0\`
- npm or pnpm

### Installation

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/owner/repo.git

# 2. Enter project directory
cd repo

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
\`\`\`

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: GitHub Primer Design System
- **Testing**: Vitest, Node Native Test Runner
- **Deployment**: Vercel Serverless

---

## 🤝 Contributing

Contributions are always welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
`,
  },
  {
    id: 'bug_report',
    name: 'Bug Report Issue Template',
    category: 'Issue Templates',
    description: 'Standard issue template for reporting bugs with reproduction steps and environment specs.',
    defaultFilename: '.github/ISSUE_TEMPLATE/bug_report.md',
    content: `---
name: Bug Report
about: Create a report to help us improve and fix reproducible bugs
title: "[BUG] "
labels: bug
assignees: ''
---

## 🐛 Bug Description
A clear and concise description of what the bug is.

## 🔁 Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

##  Expected Behavior
A clear and concise description of what you expected to happen.

## 📸 Screenshots & Logs
If applicable, add screenshots, recordings, or browser console error logs to help explain the problem.

## 🖥️ Environment
- **OS**: [e.g. Windows 11, macOS Sequoia, Ubuntu 24.04]
- **Browser**: [e.g. Chrome 128, Edge 128, Safari 18, Firefox 130]
- **Version / Commit**: [e.g. v3.0.0 or commit sha]

## 📌 Additional Context
Add any other context about the problem here (e.g. network firewalls, extensions installed).
`,
  },
  {
    id: 'feature_request',
    name: 'Feature Request Template',
    category: 'Issue Templates',
    description: 'Structured proposal template for suggesting new capabilities or enhancements.',
    defaultFilename: '.github/ISSUE_TEMPLATE/feature_request.md',
    content: `---
name: Feature Request
about: Suggest an idea or enhancement for this project
title: "[FEAT] "
labels: enhancement
assignees: ''
---

## 💡 Problem Statement
Is your feature request related to a problem? Please describe clearly.
*Example: I'm always frustrated when [...] because [...].*

## 🎯 Proposed Solution
Describe the solution you'd like to see implemented.
What is the desired behavior or API?

## 🔄 Alternatives Considered
Describe any alternative solutions or features you've considered.

## 🎨 User Experience / Mockups
If applicable, describe how users would interact with this feature or sketch a UI mockup.

## 📌 Additional Context
Add any other context, benchmarks, or references to other tools here.
`,
  },
  {
    id: 'pull_request',
    name: 'Pull Request Template',
    category: 'Pull Requests',
    description: 'Comprehensive PR checklist for reviewers, breaking changes, and linked issues.',
    defaultFilename: '.github/pull_request_template.md',
    content: `## 📌 Summary of Changes
Describe the purpose of this Pull Request and summarize the key code modifications made.

Fixes #(issue number)

## 🔍 Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update (README, docs, guides)
- [ ] 🎨 Code style / Refactor (formatting, internal cleanup, performance)

## 🧪 Testing Performed
Describe the tests you ran to verify your changes:
- [ ] Ran automated test suite (\`npm test\`) with 0 errors
- [ ] Built production bundle (\`npm run build\`) successfully
- [ ] Manually tested across Dark and Light modes
- [ ] Verified responsiveness on mobile / desktop viewports

## 📋 Checklist
- [ ] My code adheres to the project style conventions.
- [ ] I have performed a self-review of my own code.
- [ ] I have commented hard-to-understand areas.
- [ ] I have added tests that prove my fix is effective or that my feature works.
- [ ] Any dependent changes have been merged and published.
`,
  },
  {
    id: 'contributing',
    name: 'Contributing Guide',
    category: 'Community',
    description: 'Guidance for external contributors: environment setup, branching, and commit conventions.',
    defaultFilename: 'CONTRIBUTING.md',
    content: `# Contributing to This Project

First off, thank you for considering contributing! Projects like this thrive because of community members like you.

---

## 📜 Code of Conduct
By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 🛠️ How to Contribute

### 1. Reporting Bugs
- Check existing issues to see if the bug has already been reported.
- If not, open a new issue using our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md).
- Include clear reproduction steps and environment details.

### 2. Suggesting Enhancements
- Open a feature request issue to discuss your ideas before writing large pull requests.

### 3. Submitting Pull Requests
1. **Fork** the repository and create your branch from \`main\`:
   \`\`\`bash
   git checkout -b feat/my-new-feature
   \`\`\`
2. **Install dependencies** and verify the test suite:
   \`\`\`bash
   npm install
   npm test
   \`\`\`
3. **Commit your changes** using conventional commit messages:
   - \`feat:\` for new features
   - \`fix:\` for bug fixes
   - \`docs:\` for documentation updates
   - \`refactor:\` for code cleanups
4. **Push to your fork** and submit a Pull Request to \`main\`.

---

## 🧪 Testing Requirements
All pull requests must:
- Pass \`npm test\` with 100% success rate.
- Successfully build via \`npm run build\`.
- Maintain clean, semantic Git history.
`,
  },
  {
    id: 'security',
    name: 'Security Policy',
    category: 'Community',
    description: 'Responsible disclosure policy and supported version matrix.',
    defaultFilename: 'SECURITY.md',
    content: `# Security Policy

## 🛡️ Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 3.x.x   | :white_check_mark: |
| 2.x.x   | :x:                |
| 1.x.x   | :x:                |

---

## 🚨 Reporting a Vulnerability

We take the security of our users and software very seriously. If you believe you have found a security vulnerability:

1. **Do NOT report security issues via public GitHub issues.**
2. Send an email to the project maintainer with the subject:
   \`[SECURITY] Vulnerability Report in Project Name\`
3. Please include:
   - Description of the vulnerability
   - Proof of Concept (PoC) or reproduction steps
   - Potential impact and affected components

### Disclosure Timeline
- **Acknowledgement**: Within 48 hours.
- **Triage & Patch**: Within 7 business days for high-severity vulnerabilities.
- **Public Disclosure**: Once a patched release is published.
`,
  },
  {
    id: 'code_of_conduct',
    name: 'Code of Conduct',
    category: 'Community',
    description: 'Contributor Covenant 2.1 standard open-source community pledge.',
    defaultFilename: 'CODE_OF_CONDUCT.md',
    content: `# Contributor Covenant Code of Conduct

## Our Pledge
We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, caste, color, religion, or sexual
identity and orientation.

We pledge to act and interact in ways that contribute to an open, welcoming,
diverse, inclusive, and healthy community.

## Our Standards
Examples of behavior that contributes to a positive environment for our community include:
- Demonstrating empathy and kindness toward other people
- Being respectful of differing opinions, viewpoints, and experiences
- Giving and gracefully accepting constructive feedback
- Accepting responsibility and apologizing to those affected by our mistakes
- Focusing on what is best not just for us as individuals, but for the overall community

Examples of unacceptable behavior include:
- The use of sexualized language or imagery, and sexual attention or advances of any kind
- Trolling, insulting or derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## Enforcement Responsibilities
Community leaders are responsible for clarifying and enforcing our standards of
acceptable behavior and will take appropriate and fair corrective action in
response to any behavior that they deem inappropriate, threatening, offensive,
or harmful.

## Enforcement Guidelines
Community leaders will follow these Community Impact Guidelines in determining
the consequences for any action they deem in violation of this Code of Conduct:
1. Correction
2. Warning
3. Temporary Ban
4. Permanent Ban

## Attribution
This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org),
version 2.1, available at https://www.contributor-covenant.org/version/2/1/code_of_conduct.html.
`,
  },
];

/**
 * Retrieves a template by its unique identifier.
 */
export function getTemplateById(id) {
  return GITHUB_TEMPLATES.find((t) => t.id === id) || null;
}
