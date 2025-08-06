# 🤖 Dependency Auto Approver

A browser extension that automatically approves Dependabot and Renovate pull requests and adds reviewers on GitHub.

## ✨ Features

- **🚀 Auto-Approval**: Automatically approves dependency update PRs from Dependabot and Renovate
- **👥 Smart Reviewer Management**: Adds configured reviewers/teams while avoiding duplicates
- **🔍 User-Specific Detection**: Checks if you've already approved to prevent duplicate actions
- **🎯 Repository Filtering**: Configure specific repositories or allow all
- **🛡️ Safe Operation**: Only works on dependency bot PRs, ignores regular PRs

## 📋 How It Works

1. **Detects dependency PRs** - Identifies PRs created by Dependabot or Renovate bots
2. **Checks existing approval** - Verifies if your configured username has already approved
3. **Auto-approves if needed** - Navigates through GitHub's review UI to approve
4. **Adds reviewers intelligently** - Only adds reviewers that aren't already assigned
5. **Handles teams and users** - Supports both individual users and GitHub teams

## 🚀 Installation

1. **Download the extension files** to a folder
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top-right)
4. **Click "Load unpacked"** and select the extension folder
5. **Pin the extension** to your toolbar for easy access

## ⚙️ Configuration

Click the extension icon to open the settings popup:

### 1. Enable/Disable
Toggle the extension on or off with the switch at the top.

### 2. Your GitHub Username
```
Enter: your-github-username
Example: arpithpm
```
**Why needed**: The extension checks if YOU have already approved the PR to avoid duplicate approvals.

### 3. Auto-add Reviewers
```
Add reviewers one by one:
- Individual users: buzzards, john-doe
- Teams: signavio/bmw-connectivity-buzzards
- Mixed: any combination
```
**Smart features**:
- ✅ Skips reviewers already assigned to the PR
- ✅ Handles both usernames and team names
- ✅ Case-insensitive duplicate detection

### 4. Allowed Repositories
```
Format: owner/repository
Examples:
- microsoft/vscode
- signavio/calm-config-ui
- your-org/your-repo
```
**Leave empty** to allow all repositories, or specify which ones should have auto-approval.

## 🎯 Usage

Once configured, the extension works automatically:

1. **Visit a GitHub PR** created by Dependabot or Renovate
2. **Extension activates** if the repository is allowed
3. **Approval happens** automatically if you haven't already approved
4. **Reviewers are added** (only those not already assigned)
5. **Notifications show** success/failure status

## 📱 Visual Notifications

The extension shows toast notifications:
- 🟢 **Green**: "Dependency PR approved successfully!"
- 🔵 **Blue**: "Dependency bot PR detected - Auto-approving..."
- 🔴 **Red**: "Failed to approve dependency PR"

## 🔧 Technical Details

### Supported Bots
- **Dependabot**: `dependabot[bot]`, `dependabot`
- **Renovate**: `renovate[bot]`, `renovate`
- **Detection**: Matches bot usernames in PR author field

### GitHub UI Navigation
- Clicks "Add your review" button
- Navigates to Files tab
- Selects "Approve" option
- Submits review with auto-generated message
- Returns to conversation tab for reviewer addition

### Reviewer Addition Process
- Opens reviewers dropdown
- Types each reviewer name
- Waits for GitHub's suggestion dropdown
- Presses Enter to select
- Clicks outside to save changes

## 🛠️ File Structure

```
extension/
├── manifest.json          # Extension configuration
├── popup.html            # Settings interface
├── popup.js              # Settings management
├── content.js            # Main automation logic
├── icon16.png            # Toolbar icon (16x16)
├── icon48.png            # Extension page icon (48x48)
├── icon128.png           # Chrome store icon (128x128)
└── icon.svg              # Source icon file
```

## 🔒 Permissions

The extension requests minimal permissions:
- **activeTab**: Access current GitHub tab
- **storage**: Save your settings
- **https://github.com/***: Only works on GitHub

## 🐛 Troubleshooting

### Extension Not Working?

1. **Check settings**: Ensure extension is enabled
2. **Verify repository**: Make sure current repo is in allowed list (or list is empty)
3. **Check PR author**: Confirm PR is from Dependabot/Renovate
4. **Open console**: Press F12 and look for "Dependabot Auto Approver" messages

### Common Issues

**"Add your review button not found"**
- You may have already approved this PR
- Extension will still try to add reviewers

**"Reviewer input field not found"**
- GitHub's UI may have changed
- Try refreshing the page

**"No suggestions appeared"**
- Reviewer name might not exist or be accessible
- Check spelling and permissions

### Debug Logs

The extension provides detailed console logging:
```javascript
// Open browser console (F12) to see:
Dependabot Auto Approver: Extension loaded
Dependabot Auto Approver: Found author: renovate
Dependabot Auto Approver: This is a Dependabot/Renovate PR!
Dependabot Auto Approver: User arpithpm approval status: false
Dependabot Auto Approver: Reviewers to add: ["buzzards"]
Dependabot Auto Approver: Added reviewer buzzards
```

## 🤝 Contributing

1. **Fork the repository**
2. **Make your changes**
3. **Test thoroughly** on different PR scenarios
4. **Submit a pull request**

### Development Tips
- Test with both Dependabot and Renovate PRs
- Verify duplicate reviewer prevention
- Check different repository configurations
- Test approval detection with various users

## 📄 License

This extension is provided as-is for automating dependency management workflows.

## 🆘 Support

If you encounter issues:
1. **Check the troubleshooting section** above
2. **Look at browser console** for error messages
3. **Verify your configuration** in the popup
4. **Test with a simple setup** (one reviewer, all repos allowed)

---

**Made with ❤️ for efficient dependency management**
