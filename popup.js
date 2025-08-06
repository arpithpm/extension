// Popup script for managing extension settings
class DependabotSettings {
  constructor() {
    this.enableToggle = document.getElementById('enableToggle');
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
    this.addRepoBtn.addEventListener('click', () => this.addRepository());
    this.repoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addRepository();
    });
  }
  
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['enabled', 'repositories'], (result) => {
        this.enableToggle.checked = result.enabled || false;
        this.repositories = result.repositories || [];
        this.renderRepositories();
        resolve();
      });
    });
  }
  
  async saveSettings() {
    const settings = {
      enabled: this.enableToggle.checked,
      repositories: this.repositories
    };
    
    chrome.storage.sync.set(settings, () => {
      this.showStatus('Settings saved successfully!', 'success');
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
