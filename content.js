// Content script that runs on GitHub PR pages
class DependabotAutoApprover {
  constructor() {
    this.init();
  }

  async init() {
    console.log('Dependabot Auto Approver: Extension loaded');
    
    // Check if auto-approval is enabled
    const settings = await this.getSettings();
    console.log('Dependabot Auto Approver: Settings:', settings);
    
    if (!settings.enabled) {
      console.log('Dependabot Auto Approver: Extension disabled in settings');
      return;
    }

    // Wait for page to load completely and GitHub's dynamic content
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.waitAndCheck());
    } else {
      this.waitAndCheck();
    }
  }

  async waitAndCheck() {
    // Wait for GitHub's dynamic content to load
    let attempts = 0;
    const maxAttempts = 20; // Try for up to 10 seconds
    
    while (attempts < maxAttempts) {
      // Check if we can find any author element
      const authorExists = document.querySelector('a.author') ||
                          document.querySelector('[data-hovercard-type="user"]') || 
                          document.querySelector('.author a') ||
                          document.querySelector('.timeline-comment-header-text a');
      
      if (authorExists) {
        console.log('Dependabot Auto Approver: Author element found, proceeding...');
        await this.sleep(1000); // Give it one more second to be sure
        this.checkAndApprove();
        return;
      }
      
      await this.sleep(500);
      attempts++;
    }
    
    console.log('Dependabot Auto Approver: Timeout waiting for author element to load');
    // Try anyway as a fallback
    this.checkAndApprove();
  }

  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['enabled', 'repositories'], (result) => {
        resolve({
          enabled: result.enabled || false,
          repositories: result.repositories || []
        });
      });
    });
  }

  isDependabotPR() {
    // Check if PR author is dependabot or renovate - try multiple selectors
    const authorSelectors = [
      'a.author',
      '.author a',
      '[data-hovercard-type="user"]',
      '.timeline-comment-header-text a',
      '.gh-header-meta a[data-hovercard-type="user"]',
      'a[data-hovercard-type="user"]:first-of-type'
    ];
    
    let authorElement = null;
    for (const selector of authorSelectors) {
      authorElement = document.querySelector(selector);
      if (authorElement) break;
    }
    
    if (!authorElement) {
      console.log('Dependabot Auto Approver: No author element found with any selector');
      return false;
    }
    
    const author = authorElement.textContent.trim().toLowerCase();
    console.log('Dependabot Auto Approver: Found author:', author);
    
    return author === 'dependabot[bot]' || 
           author === 'dependabot' || 
           author === 'renovate[bot]' ||
           author === 'renovate' ||
           author.includes('dependabot') ||
           author.includes('renovate');
  }

  getCurrentRepository() {
    // Extract repo name from URL
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length >= 3) {
      return `${pathParts[1]}/${pathParts[2]}`;
    }
    return null;
  }

  isRepositoryAllowed(settings) {
    const currentRepo = this.getCurrentRepository();
    if (!currentRepo) return false;
    
    // If no specific repositories configured, allow all
    if (settings.repositories.length === 0) return true;
    
    return settings.repositories.some(repo => 
      repo.toLowerCase() === currentRepo.toLowerCase()
    );
  }

  isAlreadyApproved() {
    // Check if there's already an approval review
    const reviews = document.querySelectorAll('.js-reviews-container .timeline-comment');
    for (const review of reviews) {
      const reviewState = review.querySelector('.review-summary-state');
      if (reviewState && reviewState.textContent.includes('approved')) {
        return true;
      }
    }
    return false;
  }

  isPRMergeable() {
    // Always return true - we don't care about checks anymore
    return true;
  }

  async approvePR() {
    try {
      // Check if this PR is already approved by checking for approval status
      const alreadyApproved = document.querySelector('.octicon-check.color-fg-success') && 
                             document.querySelector('[data-hovercard-url*="/users/"][data-assignee-name]');
      
      if (alreadyApproved) {
        console.log('Dependabot Auto Approver: PR already approved, skipping approval step');
        // Go directly to adding reviewers
        await this.addReviewers();
        return true;
      }
      
      // Step 1: Find and click "Add your review" button
      const addReviewButton = document.querySelector('a.btn.btn-primary.btn-sm[href*="/files#submit-review"]');
      
      if (!addReviewButton) {
        console.log('Dependabot Auto Approver: Add your review button not found');
        // If button not found but not already approved, try adding reviewers anyway
        await this.addReviewers();
        return false;
      }

      console.log('Dependabot Auto Approver: Clicking "Add your review" button');
      addReviewButton.click();
      
      // Wait for navigation to files page
      await this.sleep(2000);
      
      // Step 2: Wait for the Submit review dropdown button to appear
      let submitReviewButton = null;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts && !submitReviewButton) {
        submitReviewButton = document.querySelector('button.ReviewMenuButton-module__ReviewMenuButton--RFyxN[data-variant="primary"]');
        if (!submitReviewButton) {
          await this.sleep(500);
          attempts++;
        }
      }
      
      if (!submitReviewButton) {
        console.log('Dependabot Auto Approver: Submit review button not found');
        return false;
      }

      console.log('Dependabot Auto Approver: Clicking Submit review dropdown');
      submitReviewButton.click();
      
      // Wait for dropdown to appear
      await this.sleep(500);
      
      // Step 3: Select "Approve" radio button
      const approveRadio = document.querySelector('input[value="approve"]');
      if (!approveRadio) {
        console.log('Dependabot Auto Approver: Approve radio button not found');
        return false;
      }

      console.log('Dependabot Auto Approver: Selecting Approve option');
      approveRadio.click();
      
      // Wait a moment for the selection to register
      await this.sleep(500);
      
      // Step 4: Submit the review
      let finalSubmitButton = null;
      const submitButtonSelectors = [
        'button.prc-Button-ButtonBase-c50BI[data-variant="primary"][data-no-visuals="true"]',
        'button.prc-Button-ButtonBase-c50BI[data-variant="primary"]',
        'button[data-variant="primary"][data-size="medium"]',
        'button[data-variant="primary"]'
      ];
      
      for (const selector of submitButtonSelectors) {
        const buttons = document.querySelectorAll(selector);
        for (const button of buttons) {
          // Check if this button contains "Submit review" text anywhere in its content
          const textContent = button.textContent || button.innerText || '';
          if (textContent.includes('Submit review')) {
            finalSubmitButton = button;
            console.log('Dependabot Auto Approver: Found submit button with text:', textContent.trim());
            break;
          }
        }
        if (finalSubmitButton) break;
      }
      
      if (!finalSubmitButton) {
        console.log('Dependabot Auto Approver: Final submit button not found');
        // Debug: log all buttons with data-variant="primary"
        const allPrimaryButtons = document.querySelectorAll('button[data-variant="primary"]');
        console.log('Dependabot Auto Approver: Found', allPrimaryButtons.length, 'primary buttons:');
        allPrimaryButtons.forEach((btn, index) => {
          console.log(`Button ${index}:`, btn.textContent?.trim() || 'no text', btn);
        });
        return false;
      }

      console.log('Dependabot Auto Approver: Submitting review');
      finalSubmitButton.click();
      
      // Wait for review submission to complete
      await this.sleep(2000);
      
      console.log('Dependabot Auto Approver: PR approved successfully');
      
      // Step 5: Add colleague reviewers
      await this.addReviewers();
      
      return true;
      
    } catch (error) {
      console.error('Dependabot Auto Approver: Error approving PR:', error);
    }
    
    return false;
  }

  async addReviewers() {
    try {
      console.log('Dependabot Auto Approver: Adding colleague reviewers...');
      
      // Navigate back to the PR conversation page if we're on files page
      const currentUrl = window.location.href;
      if (currentUrl.includes('/files')) {
        const conversationUrl = currentUrl.replace('/files', '').split('#')[0];
        console.log('Dependabot Auto Approver: Navigating back to conversation:', conversationUrl);
        window.location.href = conversationUrl;
        
        // Wait for navigation to complete
        await this.sleep(3000);
      }
      
      // Find the reviewers summary/details element (the clickable area)
      const reviewersSummary = document.querySelector('summary[data-menu-trigger="reviewers-select-menu"]') ||
                              document.querySelector('summary[aria-haspopup="menu"]') ||
                              document.querySelector('.hx_rsm-trigger');
      
      if (!reviewersSummary) {
        console.log('Dependabot Auto Approver: Reviewers summary not found');
        return false;
      }
      
      console.log('Dependabot Auto Approver: Clicking reviewers summary');
      reviewersSummary.click();
      
      // Wait for reviewers dropdown to appear
      await this.sleep(1000);
      
      // Find the specific input field with the exact ID from your HTML
      const reviewerInput = document.querySelector('#review-filter-field') ||
                           document.querySelector('input.js-filterable-field') ||
                           document.querySelector('input[placeholder="Type or choose a user"]');
      
      if (!reviewerInput) {
        console.log('Dependabot Auto Approver: Reviewer input field not found');
        // Debug: log all inputs found
        const allInputs = document.querySelectorAll('input');
        console.log('Dependabot Auto Approver: Found inputs:', allInputs.length);
        allInputs.forEach((input, index) => {
          console.log(`Input ${index}:`, input.placeholder, input.id, input.className);
        });
        return false;
      }
      
      console.log('Dependabot Auto Approver: Found reviewer input:', reviewerInput.id || reviewerInput.className);
      console.log('Dependabot Auto Approver: Typing "buzzards" in reviewer field');
      
      // Focus the input and type "buzzards"
      reviewerInput.focus();
      reviewerInput.value = 'buzzards';
      
      // Trigger input events to simulate typing
      const inputEvent = new Event('input', { bubbles: true });
      reviewerInput.dispatchEvent(inputEvent);
      
      // Also trigger keyup event which some systems listen for
      const keyupEvent = new Event('keyup', { bubbles: true });
      reviewerInput.dispatchEvent(keyupEvent);
      
      console.log('Dependabot Auto Approver: Waiting for suggestions to appear...');
      
      // Wait for suggestions to appear and get focused
      let suggestionFound = false;
      let attempts = 0;
      const maxAttempts = 10; // Wait up to 5 seconds
      
      while (attempts < maxAttempts && !suggestionFound) {
        await this.sleep(500);
        
        // Look for suggestion items that might appear
        const suggestions = document.querySelectorAll('.select-menu-item') ||
                           document.querySelectorAll('[role="menuitemcheckbox"]') ||
                           document.querySelectorAll('.js-username') ||
                           document.querySelectorAll('label[role="menuitemcheckbox"]');
        
        if (suggestions.length > 0) {
          console.log('Dependabot Auto Approver: Found', suggestions.length, 'suggestions');
          suggestionFound = true;
          break;
        }
        
        attempts++;
      }
      
      if (suggestionFound) {
        console.log('Dependabot Auto Approver: Suggestions appeared, waiting a bit more for focus...');
        await this.sleep(1000); // Additional wait for focus
      } else {
        console.log('Dependabot Auto Approver: No suggestions appeared, proceeding with Enter');
      }
      
      // Simulate pressing Enter to select the focused suggestion
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      });
      reviewerInput.dispatchEvent(enterEvent);
      
      // Also try keypress event
      const keypressEvent = new KeyboardEvent('keypress', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      });
      reviewerInput.dispatchEvent(keypressEvent);
      
      // Wait a moment for the selection to be processed
      await this.sleep(500);
      
      console.log('Dependabot Auto Approver: Clicking outside dropdown to send reviewer request...');
      
      // Debug: log what elements we can find
      const titleSelectors = [
        'h1.gh-header-title .js-issue-title',
        'h1.gh-header-title',
        '.js-issue-title', 
        'h1[class*="title"]',
        'bdi.js-issue-title',
        '.markdown-title'
      ];
      
      let prTitle = null;
      for (const selector of titleSelectors) {
        prTitle = document.querySelector(selector);
        if (prTitle) {
          console.log('Dependabot Auto Approver: Found title element with selector:', selector);
          break;
        }
      }
      
      if (!prTitle) {
        console.log('Dependabot Auto Approver: No title found, trying other clickable elements...');
        // Try other safe elements to click
        prTitle = document.querySelector('main') ||
                 document.querySelector('[role="main"]') ||
                 document.querySelector('.Layout-main') ||
                 document.querySelector('#repo-content-pjax-container');
      }
      
      if (prTitle) {
        console.log('Dependabot Auto Approver: Clicking element to close dropdown:', prTitle.tagName, prTitle.className);
        
        // Create and dispatch a proper click event
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        prTitle.dispatchEvent(clickEvent);
        
        // Also try direct click method
        prTitle.click();
        
        console.log('Dependabot Auto Approver: Click events dispatched');
      } else {
        console.log('Dependabot Auto Approver: No suitable element found, clicking document body');
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        document.body.dispatchEvent(clickEvent);
        document.body.click();
      }
      
      console.log('Dependabot Auto Approver: Added "buzzards" as reviewer and sent request');
      return true;
      
    } catch (error) {
      console.error('Dependabot Auto Approver: Error adding reviewers:', error);
      return false;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkAndApprove() {
    console.log('Dependabot Auto Approver: Starting check...');
    
    const settings = await this.getSettings();
    
    // Verify this is a Dependabot or Renovate PR
    if (!this.isDependabotPR()) {
      console.log('Dependabot Auto Approver: Not a Dependabot/Renovate PR');
      const authorElement = document.querySelector('.author a');
      console.log('Dependabot Auto Approver: PR Author:', authorElement ? authorElement.textContent : 'Not found');
      return;
    }

    console.log('Dependabot Auto Approver: This is a Dependabot/Renovate PR!');

    // Check if repository is allowed
    if (!this.isRepositoryAllowed(settings)) {
      console.log('Dependabot Auto Approver: Repository not in allowed list');
      console.log('Dependabot Auto Approver: Current repo:', this.getCurrentRepository());
      console.log('Dependabot Auto Approver: Allowed repos:', settings.repositories);
      return;
    }

    console.log('Dependabot Auto Approver: Repository is allowed');

    // Check if already approved
    if (this.isAlreadyApproved()) {
      console.log('Dependabot Auto Approver: PR already approved');
      return;
    }

    console.log('Dependabot Auto Approver: PR not yet approved, proceeding...');

    // Show notification immediately
    this.showNotification('Dependency bot PR detected - Auto-approving immediately...');

    // Approve the PR right away
    const success = await this.approvePR();
    if (success) {
      this.showNotification('✅ Dependency PR approved successfully!', 'success');
    } else {
      this.showNotification('❌ Failed to approve dependency PR', 'error');
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Initialize the auto approver
new DependabotAutoApprover();
