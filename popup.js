// Popup script for managing extension settings
class DependabotSettings {
  constructor() {
    this.enableToggle = document.getElementById('enableToggle');
    this.usernameInput = document.getElementById('usernameInput');
    this.saveUsernameBtn = document.getElementById('saveUsername');
    this.reviewerInput = document.getElementById('reviewerInput');
    this.addReviewerBtn = document.getElementById('addReviewer');
    this.reviewerList = document.getElementById('reviewerList');
    this.repoInput = document.getElementById('repoInput');
    this.addRepoBtn = document.getElementById('addRepo');
    this.repoList = document.getElementById('repoList');
    this.status = document.getElementById('status');
    
    this.init();
  }
  
  async init() {
    // Load current settings
    await this.loadSettings();
    
    // Set up event listeners
    this.enableToggle.addEventListener('change', () => this.saveSettings());
    this.saveUsernameBtn.addEventListener('click', () => this.saveUsername());
    this.usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.saveUsername();
    });
    this.addReviewerBtn.addEventListener('click', () => this.addReviewer());
    this.reviewerInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addReviewer();
    });
    this.addRepoBtn.addEventListener('click', () => this.addRepository());
    this.repoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addRepository();
    });
  }
  
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['enabled', 'username', 'reviewers', 'repositories'], (result) => {
        this.enableToggle.checked = result.enabled || false;
        this.usernameInput.value = result.username || '';
        this.reviewers = result.reviewers || [];
        this.repositories = result.repositories || [];
        this.renderReviewers();
        this.renderRepositories();
        resolve();
      });
    });
  }
  
  async saveSettings() {
    const settings = {
      enabled: this.enableToggle.checked,
      username: this.usernameInput.value.trim(),
      reviewers: this.reviewers,
      repositories: this.repositories
    };
    
    chrome.storage.sync.set(settings, () => {
      this.showStatus('Settings saved successfully!', 'success');
    });
  }

  saveUsername() {
    const username = this.usernameInput.value.trim();
    
    if (!username) {
      this.showStatus('Please enter your GitHub username', 'error');
      return;
    }
    
    // Validate username format
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      this.showStatus('Please enter a valid GitHub username', 'error');
      return;
    }
    
    this.saveSettings();
  }

  addReviewer() {
    const reviewer = this.reviewerInput.value.trim();
    
    if (!reviewer) return;
    
    // Check if already exists
    if (this.reviewers.includes(reviewer)) {
      this.showStatus('Reviewer already in the list', 'error');
      return;
    }
    
    // Add reviewer
    this.reviewers.push(reviewer);
    this.reviewerInput.value = '';
    this.renderReviewers();
    this.saveSettings();
  }

  removeReviewer(reviewer) {
    this.reviewers = this.reviewers.filter(r => r !== reviewer);
    this.renderReviewers();
    this.saveSettings();
  }

  renderReviewers() {
    this.reviewerList.innerHTML = '';
    
    if (this.reviewers.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'repository-item';
      emptyItem.style.fontStyle = 'italic';
      emptyItem.style.color = '#666';
      emptyItem.textContent = 'No reviewers configured';
      this.reviewerList.appendChild(emptyItem);
      return;
    }
    
    this.reviewers.forEach(reviewer => {
      const listItem = document.createElement('li');
      listItem.className = 'repository-item';
      
      const reviewerName = document.createElement('span');
      reviewerName.textContent = reviewer;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = 'Remove';
      removeBtn.onclick = () => this.removeReviewer(reviewer);
      
      listItem.appendChild(reviewerName);
      listItem.appendChild(removeBtn);
      this.reviewerList.appendChild(listItem);
    });
  }
  
  addRepository() {
    const repo = this.repoInput.value.trim();
    
    if (!repo) return;
    
    // Validate repository format (owner/repo)
    if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(repo)) {
      this.showStatus('Please enter a valid repository format: owner/repository', 'error');
      return;
    }
    
    // Check if already exists
    if (this.repositories.includes(repo)) {
      this.showStatus('Repository already in the list', 'error');
      return;
    }
    
    // Add repository
    this.repositories.push(repo);
    this.repoInput.value = '';
    this.renderRepositories();
    this.saveSettings();
  }
  
  removeRepository(repo) {
    this.repositories = this.repositories.filter(r => r !== repo);
    this.renderRepositories();
    this.saveSettings();
  }
  
  renderRepositories() {
    this.repoList.innerHTML = '';
    
    if (this.repositories.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'repository-item';
      emptyItem.style.fontStyle = 'italic';
      emptyItem.style.color = '#666';
      emptyItem.textContent = 'All repositories allowed';
      this.repoList.appendChild(emptyItem);
      return;
    }
    
    this.repositories.forEach(repo => {
      const listItem = document.createElement('li');
      listItem.className = 'repository-item';
      
      const repoName = document.createElement('span');
      repoName.textContent = repo;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = 'Remove';
      removeBtn.onclick = () => this.removeRepository(repo);
      
      listItem.appendChild(repoName);
      listItem.appendChild(removeBtn);
      this.repoList.appendChild(listItem);
    });
  }
  
  showStatus(message, type) {
    this.status.textContent = message;
    this.status.className = `status ${type}`;
    this.status.style.display = 'block';
    
    setTimeout(() => {
      this.status.style.display = 'none';
    }, 3000);
  }
}

// Initialize settings when popup loads
document.addEventListener('DOMContentLoaded', () => {
  new DependabotSettings();
});
