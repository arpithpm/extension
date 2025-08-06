# Dependency Auto Approver Chrome Extension

## Overview

**Dependency Auto Approver** is a Chrome extension that automatically approves Dependabot and Renovate pull requests on GitHub, and can add a specific reviewer ("buzzards") to those PRs. It is configurable to work on all or selected repositories.

---

## Features
- **Auto-approve**: Detects PRs created by Dependabot or Renovate and automatically approves them.
- **Reviewer Assignment**: Adds a specific reviewer ("buzzards") to the PR after approval.
- **Repository Filtering**: Optionally restricts auto-approval to a list of allowed repositories.
- **User Control**: Enable/disable the extension and manage allowed repositories via a popup UI.
- **Notifications**: Shows in-page notifications for actions taken.

---

## File Structure

- `manifest.json` — Chrome extension manifest (v3), permissions, content script, popup, icons.
- `content.js` — Main content script that runs on GitHub PR pages, handles detection and approval logic.
- `popup.html` — Popup UI for managing extension settings (enable/disable, allowed repositories).
- `popup.js` — Logic for popup UI, settings storage, and repository management.
- `icon.svg`, `icon16.png`, `icon48.png`, `icon128.png` — Extension icons.

---

## How It Works

### 1. Content Script (`content.js`)
- Runs on GitHub PR pages (`https://github.com/*/pull/*`).
- Checks if auto-approval is enabled and if the current repository is allowed.
- Detects if the PR author is Dependabot or Renovate.
- If so, checks if the PR is already approved. If not, it:
  - Clicks the "Add your review" button.
  - Selects "Approve" and submits the review.
  - Navigates back to the PR conversation and adds "buzzards" as a reviewer.
- Shows notifications for success or failure.

### 2. Popup UI (`popup.html` + `popup.js`)
- Allows users to enable/disable auto-approval.
- Lets users add/remove allowed repositories (in `owner/repo` format).
- Settings are stored using Chrome's `storage.sync` API.
- Shows status messages for user actions.

### 3. Manifest (`manifest.json`)
- Declares permissions for `activeTab`, `storage`, and GitHub PR pages.
- Registers the content script and popup.
- Specifies extension icons.

---

## Usage
1. **Install the extension** in Chrome (load as unpacked extension in developer mode).
2. **Configure settings** via the popup:
   - Enable/disable auto-approval.
   - Add allowed repositories (or leave empty to allow all).
3. **Visit a GitHub PR** created by Dependabot or Renovate. The extension will auto-approve and add the reviewer if enabled and allowed.

---

## Customization
- To change the reviewer added, modify the string "buzzards" in `content.js` (method: `addReviewers`).
- To support more bots, update the `isDependabotPR` method in `content.js`.

---

## Icons
- `icon.svg` is a robot with a checkmark, used for branding.
- PNG icons are used for Chrome extension requirements (16x16, 48x48, 128x128).

---

## Security & Privacy
- The extension only interacts with GitHub PR pages and uses Chrome's storage for settings.
- No data is sent externally.

---

## License
MIT License (add a LICENSE file if distributing publicly).

---

## Authors
- [Your Name Here]

---

## Example Screenshots
- ![Popup UI](popup.html)
- ![Extension Icon](icon.svg)

---

## Changelog
- v1.0: Initial release.
