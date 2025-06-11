class PostCreator {
  constructor() {
    this.selectedPlatforms = ["all"];
    this.storageManager = new StorageManager();
    this.apiBaseUrl = '/api/posts'; // Base URL for API endpoints
    this.uploadedImages = [];
    this.uploadedVideos = [];
    this.initializeEventListeners();
    this.addCustomStyles();
  }

  initializeEventListeners() {
    // Bind methods to preserve 'this' context
    this.handlePlatformSelection = this.handlePlatformSelection.bind(this);
    this.handleNavigation = this.handleNavigation.bind(this);
    this.handleFormatting = this.handleFormatting.bind(this);
    this.previewPost = this.previewPost.bind(this);
    this.sharePost = this.sharePost.bind(this);
    this.showNotifications = this.showNotifications.bind(this);
    this.showProfile = this.showProfile.bind(this);
    this.insertImage = this.insertImage.bind(this);
    this.insertVideo = this.insertVideo.bind(this);

    // Helper function to safely add event listeners
    const addListener = (selector, event, handler) => {
      const element = document.querySelector(selector);
      if (element) {
        element.addEventListener(event, handler);
      }
    };

    // Helper function to safely add event listeners to multiple elements
    const addListeners = (selector, event, handler) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => element.addEventListener(event, handler));
    };

    // Add event listeners with error checking
    addListeners(".platform-btn", "click", this.handlePlatformSelection);
    addListeners(".nav-item", "click", this.handleNavigation);
    
    // Only add toolbar button listeners for non-media buttons
    document.querySelectorAll(".toolbar-btn:not(#video-upload-btn):not(#image-upload-btn)").forEach(btn => {
      btn.addEventListener("click", this.handleFormatting);
    });
    
    addListener("#preview-btn", "click", this.previewPost);
    addListener("#share-post-btn", "click", this.sharePost);
    addListener("#notifications", "click", this.showNotifications);
    addListener("#profile", "click", this.showProfile);
    addListener("#image-upload-btn", "click", this.insertImage);
    addListener("#video-upload-btn", "click", this.insertVideo);
  }

  handlePlatformSelection(e) {
    const platform = e.target.dataset.platform;
    const buttons = document.querySelectorAll(".platform-btn");

    if (platform === "all") {
      buttons.forEach((btn) => btn.classList.remove("active"));
      e.target.classList.add("active");
      this.selectedPlatforms = ["all"];
    } else {
      const allButton = document.querySelector('[data-platform="all"]');
      if (allButton) {
        allButton.classList.remove("active");
      }

      e.target.classList.toggle("active");

      if (e.target.classList.contains("active")) {
        this.selectedPlatforms = this.selectedPlatforms.filter(
          (p) => p !== "all"
        );
        if (!this.selectedPlatforms.includes(platform)) {
          this.selectedPlatforms.push(platform);
        }
      } else {
        this.selectedPlatforms = this.selectedPlatforms.filter(
          (p) => p !== platform
        );
      }
      if (this.selectedPlatforms.length === 0) {
        if (allButton) {
          allButton.classList.add("active");
        }
        this.selectedPlatforms = ["all"];
      }
    }

    console.log("Selected platforms:", this.selectedPlatforms);
  }

  handleNavigation(e) {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      item.classList.remove("active");
    });

    e.target.classList.add("active");
    const navId = e.target.id;
    console.log("Navigate to:", navId);
    this.showNotification(`Navigating to ${navId.replace("-", " ")}`);
  }

  handleFormatting(e) {
    const format = e.target.closest('.toolbar-btn')?.dataset?.format;
    if (!format) {
      console.warn('No format specified for toolbar button');
      return;
    }

    console.log("Apply formatting:", format);

    switch (format) {
      case "emoji":
        this.insertEmoji();
        break;
      default:
        console.warn(`Unknown format: ${format}`);
    }
  }

  async insertImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      const maxFileSize = 5 * 1024 * 1024; // 5MB limit per image
      
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          if (file.size > maxFileSize) {
            this.showNotification(`Image ${file.name} is too large. Maximum size is 5MB.`, 'error');
            continue;
          }

          try {
            // Read file as Data URL
            const reader = new FileReader();
            reader.onload = (e) => {
              const imageData = e.target.result;
              
              // Add image to uploadedImages array
              const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              this.uploadedImages.push({
                url: imageData,
                id: imageId,
                filename: file.name
              });

              // Create preview container if it doesn't exist
              let previewsContainer = document.getElementById("image-previews");
              if (!previewsContainer) {
                previewsContainer = document.createElement('div');
                previewsContainer.id = 'image-previews';
                previewsContainer.className = 'media-previews';
                document.querySelector('#post-form').appendChild(previewsContainer);
              }

              // Add image preview
              const previewContainer = document.createElement('div');
              previewContainer.className = 'image-preview';
              
              const img = document.createElement('img');
              img.src = imageData;
              img.alt = file.name;
              img.style.maxWidth = '200px';
              img.style.height = '150px';
              img.style.objectFit = 'cover';
              img.style.borderRadius = '8px';
              img.style.margin = '5px';
              
              const removeBtn = document.createElement('button');
              removeBtn.innerHTML = '×';
              removeBtn.className = 'remove-media-btn';
              removeBtn.style.position = 'absolute';
              removeBtn.style.top = '5px';
              removeBtn.style.right = '5px';
              removeBtn.style.background = 'rgba(0, 0, 0, 0.5)';
              removeBtn.style.color = 'white';
              removeBtn.style.border = 'none';
              removeBtn.style.borderRadius = '50%';
              removeBtn.style.width = '25px';
              removeBtn.style.height = '25px';
              removeBtn.style.cursor = 'pointer';
              removeBtn.style.display = 'flex';
              removeBtn.style.alignItems = 'center';
              removeBtn.style.justifyContent = 'center';
              
              removeBtn.onclick = () => {
                this.uploadedImages = this.uploadedImages.filter(img => img.id !== imageId);
                previewContainer.remove();
                this.showNotification('Image removed');
              };

              previewContainer.style.position = 'relative';
              previewContainer.style.display = 'inline-block';
              previewContainer.style.margin = '5px';

              previewContainer.appendChild(img);
              previewContainer.appendChild(removeBtn);
              previewsContainer.appendChild(previewContainer);

              this.showNotification(`Image ${file.name} added successfully`);
            };

            reader.onerror = () => {
              this.showNotification(`Error reading file: ${file.name}`, 'error');
            };

            reader.readAsDataURL(file);
          } catch (error) {
            console.error('Error handling image:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
          }
        } else {
          this.showNotification(`${file.name} is not an image file`, 'error');
        }
      }
    };

    input.click();
  }

  async insertVideo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      
      for (const file of files) {
        if (file.type.startsWith('video/')) {
          try {
            // Create local preview URL immediately
            const localVideoUrl = URL.createObjectURL(file);
            
            const formData = new FormData();
            formData.append('video', file);

            // Create and show preview before upload completes
            const previewContainer = document.createElement('div');
            previewContainer.className = 'video-preview';
            
            const video = document.createElement('video');
            video.src = localVideoUrl;
            video.controls = true;
            video.style.maxWidth = '200px';
            video.style.height = '150px';
            video.style.objectFit = 'cover';
            video.style.borderRadius = '8px';
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '×';
            removeBtn.className = 'remove-media-btn';
            
            previewContainer.appendChild(video);
            previewContainer.appendChild(removeBtn);
            
            const previewsContainer = document.getElementById("video-previews");
            if (!previewsContainer) {
              const container = document.createElement('div');
              container.id = 'video-previews';
              container.className = 'media-previews';
              document.querySelector('.post-form').appendChild(container);
            }
            document.getElementById("video-previews").appendChild(previewContainer);

            // Upload video to server
            const response = await fetch(`${this.apiBaseUrl}/upload-video.php`, {
              method: 'POST',
              body: formData
            });

            if (!response.ok) {
              throw new Error(`Failed to upload video: ${file.name}`);
            }

            const result = await response.json();
            
            if (result.status === 'success') {
              // Update uploadedVideos array
              const videoData = {
                url: result.data.url,
                localUrl: localVideoUrl,
                id: result.data.video_id,
                filename: result.data.filename,
                thumbnail_url: result.data.thumbnail_url,
                duration: result.data.duration
              };
              
              this.uploadedVideos.push(videoData);

              // Update remove button functionality
              removeBtn.onclick = () => {
                URL.revokeObjectURL(localVideoUrl);
                this.uploadedVideos = this.uploadedVideos.filter(v => v.url !== result.data.url);
                previewContainer.remove();
              };

              if (result.data.duration) {
                const duration = document.createElement('span');
                duration.className = 'video-duration';
                duration.textContent = this.formatDuration(result.data.duration);
                previewContainer.appendChild(duration);
              }

              this.showNotification(`Video ${file.name} uploaded successfully`);
            } else {
              // Clean up on upload failure
              URL.revokeObjectURL(localVideoUrl);
              previewContainer.remove();
              throw new Error(result.message || `Failed to upload video: ${file.name}`);
            }
          } catch (error) {
            console.error('Error uploading video:', error);
            this.showNotification(`Error: ${error.message}`);
          }
        } else {
          this.showNotification(`${file.name} is not a video file`);
        }
      }
    };

    input.click();
  }

  insertEmoji() {
    const emojis = ["😊", "😂", "❤️", "👍", "🎉", "🔥", "💯", "✨", "💅"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const textarea = document.getElementById("post-content");
    this.insertAtCursor(textarea, randomEmoji);
  }

  insertAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value = 
      textarea.value.substring(0, start) + 
      text + 
      textarea.value.substring(end);
    textarea.setSelectionRange(start + text.length, start + text.length);
    textarea.focus();
  }

  previewPost() {
    const content = document.getElementById("post-content").value.trim();

    if (!content) {
      this.showNotification("Please enter post content");
      return;
    }

    const previewModal = document.createElement('div');
    previewModal.className = 'preview-modal-container';
    
    const previewPost = {
      id: Date.now(), 
      content: content,
      author: this.getCurrentUser() || 'Anonymous',
      timestamp: new Date().toISOString(),
      platforms: this.selectedPlatforms,
      likes: 0,
      comments: [],
      shares: 0
    };

    const parsedContent = this.parsePreviewContent(content);

    previewModal.innerHTML = `
      <div class="preview-modal">
        <div class="preview-modal-header">
          <h2 class="preview-modal-title">Post Preview</h2>
          <button class="preview-modal-close">×</button>
        </div>
        <div class="preview-modal-body">
          <div class="social-post preview-post">
            <div class="post-header">
              <div class="post-user-info">
                <img src="../assets/human.png" alt="Profile" class="profile-pic">
                <div class="user-details">
                  <h3 class="post-author">${this.escapeHTML(previewPost.author)}</h3>
                  <span class="post-timestamp">${this.getTimeDifference(new Date())}</span>
                </div>
              </div>
            </div>

            <div class="post-content">
              <p class="post-text">${parsedContent.text}</p>
              
              ${parsedContent.media ? `
                <div class="post-media-container">
                  ${parsedContent.media}
                </div>
              ` : ''}
            </div>

            <div class="preview-platforms">
              <h4>Shared Platforms:</h4>
              <div class="platform-list">
                ${this.selectedPlatforms.map(platform => `
                  <span class="platform-tag">${this.escapeHTML(platform)}</span>
                `).join('') || 'No platforms selected'}
              </div>
            </div>
          </div>
        </div>
        <div class="preview-modal-footer">
          <button class="preview-confirm-btn">Confirm Post</button>
          <button class="preview-cancel-btn">Edit Post</button>
        </div>
      </div>
    `;

    document.body.appendChild(previewModal);

    const closeBtn = previewModal.querySelector('.preview-modal-close');
    const confirmBtn = previewModal.querySelector('.preview-confirm-btn');
    const cancelBtn = previewModal.querySelector('.preview-cancel-btn');

    closeBtn.addEventListener('click', () => {
      previewModal.remove();
    });

    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) {
        previewModal.remove();
      }
    });

    confirmBtn.addEventListener('click', () => {
      this.sharePost();
      previewModal.remove();
    });

    cancelBtn.addEventListener('click', () => {
      previewModal.remove();
    });
  }

  parsePreviewContent(content) {
    const imageRegex = /\[Image: (.+?)\]/g;
    const videoRegex = /\[Video: (.+?)\]/g;
    const attachmentRegex = /\[Attachment: (.+?)\]/g;
    
    let text = content;
    const mediaElements = [];

    // Add uploaded images
    this.uploadedImages.forEach(image => {
      const filePreview = document.createElement('div');
      filePreview.innerHTML = `
        <img 
          src="${image.url}" 
          alt="Uploaded Image" 
          class="preview-media-image"
        >
      `;
      mediaElements.push(filePreview.outerHTML);
    });

    // Add uploaded videos
    this.uploadedVideos.forEach(video => {
      const videoPreview = document.createElement('div');
      // Use local URL for preview if available, fallback to server URL
      const videoUrl = video.localUrl || video.url;
      videoPreview.innerHTML = `
        <video 
          src="${videoUrl}"
          controls
          class="preview-media-video"
          ${video.thumbnail_url ? `poster="${video.thumbnail_url}"` : ''}
        >
          Your browser does not support the video tag.
        </video>
        ${video.duration ? `<span class="video-duration">${this.formatDuration(video.duration)}</span>` : ''}
      `;
      mediaElements.push(videoPreview.outerHTML);
    });

    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'post-media-container';
    
    if (mediaElements.length > 1) {
      mediaContainer.innerHTML = `
        <div class="media-scroll-container">
          ${mediaElements.join('')}
        </div>
      `;
    } else if (mediaElements.length === 1) {
      mediaContainer.innerHTML = mediaElements[0];
    }

    return {
      text: this.escapeHTML(text.trim()),
      media: mediaElements.length > 0 ? mediaContainer.outerHTML : ''
    };
  }

  async sharePost() {
    try {
      const content = document.getElementById("post-content").value;

      if (!content.trim()) {
        this.showNotification("Please enter content");
        return;
      }

      // Create post data
      const postData = {
        id: Date.now(),
        content: content,
        author: localStorage.getItem('userDisplayName') || 'Anonymous',
        authorAvatar: localStorage.getItem('userProfileAvatar') || '../assets/human.png',
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: [],
        shares: 0,
        images: this.uploadedImages.map(img => img.url),
        videos: this.uploadedVideos.map(vid => vid.url)
      };

      // Get existing posts from local storage
      const existingPosts = JSON.parse(localStorage.getItem('devhive_posts') || '[]');
      
      // Add new post to the beginning of the array
      existingPosts.unshift(postData);
      
      // Save updated posts to local storage
      localStorage.setItem('devhive_posts', JSON.stringify(existingPosts));

      // Clear the form
      document.getElementById("post-content").value = '';
        this.uploadedImages = [];
        this.uploadedVideos = [];

      // Clear preview area
      const previewArea = document.querySelector('.post-media-container');
      if (previewArea) {
        previewArea.innerHTML = '';
      }

      // Show success notification
      this.showNotification("Post shared successfully!");

      // Redirect to global wall
      window.location.href = '../global_wall/index.html';
    } catch (error) {
      console.error('Error sharing post:', error);
      this.showNotification("Failed to share post. Please try again.", "error");
    }
  }

  getCurrentUserId() {
    // This should be implemented to get the logged-in user's ID
    // For now, return null to use the nullable user_id
    return null;
  }

  showNotifications() {
    this.showNotification("Notifications panel would open here");
  }

  showProfile() {
    this.showNotification("Profile menu would open here");
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
  }

  formatDuration(seconds) {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getTimeDifference(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) {
      return 'Just now';
    } else if (diff < 3600) {
      return Math.floor(diff / 60) + ' minutes ago';
    } else if (diff < 86400) {
      return Math.floor(diff / 3600) + ' hours ago';
    } else if (diff < 604800) {
      return Math.floor(diff / 86400) + ' days ago';
    } else {
      return Math.floor(diff / 604800) + ' weeks ago';
    }
  }

  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  getCurrentUser() {
    // This should be implemented to get the current user's info
    // For now, return null
    return null;
  }

  cleanup() {
    // Revoke all object URLs when they're no longer needed
    this.uploadedVideos.forEach(video => {
      if (video.localUrl) {
        URL.revokeObjectURL(video.localUrl);
      }
    });
  }

  addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .media-previews {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 10px 0;
            min-height: 50px;
            padding: 10px;
            border: 2px dashed #ddd;
            border-radius: 8px;
            background-color: #f8f9fa;
        }

        .image-preview, .video-preview {
            position: relative;
            display: inline-block;
            margin: 5px;
        }

        .remove-media-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            border-radius: 50%;
            width: 25px;
            height: 25px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            transition: background-color 0.3s;
        }

        .remove-media-btn:hover {
            background: rgba(0, 0, 0, 0.7);
        }

        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
  }
}

class StorageManager {
  constructor(maxSizeBytes = 64 * 1024 * 1024) { // 64MB max
    this.maxSizeBytes = maxSizeBytes;
    this.storageKeys = {
      images: 'devhive_uploaded_images',
      videos: 'devhive_uploaded_videos'
    };
    this.MAX_FILE_SIZE = 64 * 1024 * 1024; // 64MB max file size
  }

  getBase64Size(base64String) {
    if (!base64String) return 0;
    
    // Remove data URL prefix if present
    const base64Content = base64String.split(',')[1] || base64String;
    
    const binarySize = atob(base64Content).length;
    return Math.ceil(binarySize * 1.33);
  }

  getCurrentStorageUsage(storageType) {
    try {
      const storedData = JSON.parse(localStorage.getItem(this.storageKeys[storageType]) || '{}');
      const usage = Object.values(storedData).reduce((total, item) => {
        const itemSize = this.getBase64Size(item);
        return total + itemSize;
      }, 0);
      
      console.log(`Current ${storageType} storage usage:`, usage / (1024 * 1024), 'MB');
      return usage;
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return 0;
    }
  }

  canStoreItem(storageType, newItemSize) {
    const currentUsage = this.getCurrentStorageUsage(storageType);
    const canStore = (currentUsage + newItemSize) <= this.maxSizeBytes && 
                     newItemSize <= this.MAX_FILE_SIZE;
    
    console.log('Storage check:', {
      currentUsage: currentUsage / (1024 * 1024),
      newItemSize: newItemSize / (1024 * 1024),
      maxSizeBytes: this.maxSizeBytes / (1024 * 1024),
      canStore
    });
    
    return canStore;
  }

  storeItem(storageType, key, item) {
    console.group('Storage Item Attempt');
    console.log('Storage Type:', storageType);
    console.log('Key:', key);
    console.log('Item length:', item ? item.length : 'No item');

    const itemSize = this.getBase64Size(item);
    console.log('Calculated Item Size:', itemSize / (1024 * 1024), 'MB');

    try {
      if (itemSize > this.MAX_FILE_SIZE) {
        console.error(`File too large. Maximum file size is ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
        console.groupEnd();
        return false;
      }

      // Get current stored data
      const storedData = JSON.parse(localStorage.getItem(this.storageKeys[storageType]) || '{}');
      
      // Add new item
      storedData[key] = item;
      
      // Store updated data
      localStorage.setItem(this.storageKeys[storageType], JSON.stringify(storedData));
      
      console.log('Item stored successfully');
      console.groupEnd();
      return true;
    } catch (error) {
      console.error(`Storage error for ${storageType}:`, error);
      console.groupEnd();
      return false;
    }
  }

  getStorageInfo(storageType) {
    const storedData = JSON.parse(localStorage.getItem(this.storageKeys[storageType]) || '{}');
    const currentUsage = this.getCurrentStorageUsage(storageType);
    
    return {
      totalItems: Object.keys(storedData).length,
      currentUsageBytes: currentUsage,
      currentUsageMB: (currentUsage / (1024 * 1024)).toFixed(2),
      maxSizeMB: (this.maxSizeBytes / (1024 * 1024)).toFixed(2),
      remainingSpaceMB: ((this.maxSizeBytes - currentUsage) / (1024 * 1024)).toFixed(2)
    };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new PostCreator();
}); 