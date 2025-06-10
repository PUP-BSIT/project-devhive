class PostCreator {
  constructor() {
    this.selectedPlatforms = ["all"];
    this.storageManager = new StorageManager();
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    document
      .querySelectorAll(".platform-btn")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => this.handlePlatformSelection(e));
      });

    document
      .querySelectorAll(".nav-item")
      .forEach((item) => {
        item.addEventListener("click", (e) => this.handleNavigation(e));
      });

    document
      .querySelectorAll(".toolbar-btn")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => this.handleFormatting(e));
      });

    document 
      .getElementById("preview-btn")
      .addEventListener("click", () => this.previewPost());
    
    document
      .getElementById("share-post-btn")
      .addEventListener("click", () => this.sharePost());

    document
      .getElementById("notifications")
      .addEventListener("click", () => this.showNotifications());
    
    document
      .getElementById("profile")
      .addEventListener("click", () => this.showProfile());
  }

  handlePlatformSelection(e) {
    const platform = e.target.dataset.platform;
    const buttons = document.querySelectorAll(".platform-btn");

    if (platform === "all") {
      buttons.forEach((btn) => btn.classList.remove("active"));
      e.target.classList.add("active");
      this.selectedPlatforms = ["all"];
    } else {
      document
        .querySelector('[data-platform="all"]')
        .classList.remove("active");

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
        document
          .querySelector('[data-platform="all"]')
          .classList.add("active");
        this.selectedPlatforms = ["all"];
      }
    }

    console.log("Selected platforms:", this.selectedPlatforms);
  }

  handleNavigation(e) {
    document
      .querySelectorAll(".nav-item")
      .forEach((item) => {
        item.classList.remove("active");
      });

    e.target.classList.add("active");
    const navId = e.target.id;
    console.log("Navigate to:", navId);
    this.showNotification(`Navigating to ${navId.replace("-", " ")}`);
  }

  handleFormatting(e) {
    const format = e.target.dataset.format;
    const textarea = document.getElementById("post-content");
    console.log("Apply formatting:", format);

    switch (format) {
      case "image":
        this.insertImage();
        break;
      case "video":
        this.insertVideo();
        break;
      case "emoji":
        this.insertEmoji();
        break;
    }
  }

  insertImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();

          reader.onerror = (error) => {
            console.error('FileReader error:', error);
            this.showNotification(`Error reading file: ${file.name}`);
          };

          reader.onload = (event) => {
            const uniqueKey = `${Date.now()}_${file.name}`;
            
            const storageResult = this.storageManager.storeItem('images', uniqueKey, event.target.result);
            
            if (storageResult) {
              const textarea = document.getElementById("post-content");
              
              const previewContainer = document.createElement('div');
              previewContainer.className = 'file-preview';
              const img = document.createElement('img');
              img.src = event.target.result;
              img.style.maxWidth = '200px';
              img.style.maxHeight = '200px';
              img.style.objectFit = 'cover';
              previewContainer.appendChild(img);
              textarea.parentElement.appendChild(previewContainer);

              this.showNotification(`Image ${file.name} added successfully`);
            } else {
              this.showNotification(`Could not store image: ${file.name}. Storage may be full.`);
            }
          };

          reader.readAsDataURL(file);
        } else {
          this.showNotification(`${file.name} is not an image file`);
        }
      });
    };

    input.click();
  }

  insertVideo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      
      // Local preview
      const reader = new FileReader();
      reader.onload = (event) => {
        // Show local preview
        this.showLocalVideoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
      
      // Upload to server
      try {
        const uploadedFileUrl = await this.uploadVideoToServer(file);
        // Store file URL instead of base64
        this.saveVideoMetadata(uploadedFileUrl);
      } catch (error) {
        this.showNotification('Video upload failed');
      }
    };
    
    input.click();
  }

  async uploadVideoToServer(file) {
    const formData = new FormData();
    formData.append('video', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const result = await response.json();
    return result.fileUrl;
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

    const storedImages = JSON.parse(localStorage.getItem('devhive_uploaded_images') || '{}');
    const storedVideos = JSON.parse(localStorage.getItem('devhive_uploaded_videos') || '{}');

    const imageMatches = [...text.matchAll(imageRegex)];
    if (imageMatches.length > 0) {
      imageMatches.forEach(match => {
        const fileName = match[1];
        
        const imageData = 
          Object.entries(storedImages).find(([key, value]) => key.endsWith(fileName))?.[1] ||
          '../assets/image-placeholder.png';
        
        const filePreview = document.createElement('div');
        filePreview.innerHTML = `
          <img 
            src="${imageData}" 
            alt="${fileName}" 
            class="preview-media-image"
          >
        `;
        mediaElements.push(filePreview.outerHTML);
        text = text.replace(match[0], '');
      });
    }

    if (mediaElements.length === 0) {
      Object.entries(storedImages).forEach(([key, imageData]) => {
        const filePreview = document.createElement('div');
        filePreview.innerHTML = `
          <img 
            src="${imageData}" 
            alt="Uploaded Image" 
            class="preview-media-image"
          >
        `;
        mediaElements.push(filePreview.outerHTML);
      });
    }

    const videoMatches = [...text.matchAll(videoRegex)];
    if (videoMatches.length > 0) {
      videoMatches.forEach(match => {
        const fileName = match[1];
        
        const videoData = 
          Object.entries(storedVideos).find(([key, value]) => key.endsWith(fileName))?.[1] ||
          '../assets/video-placeholder.png';

        const videoPreview = document.createElement('div');
        videoPreview.innerHTML = `
          <video 
            src="${videoData}" 
            controls
            class="preview-media-video"
          >
            Your browser does not support the video tag.
          </video>
        `;
        
        mediaElements.push(videoPreview.outerHTML);
        text = text.replace(match[0], '');
      });
    }

    if (mediaElements.length === 0) {
      Object.entries(storedVideos).forEach(([key, videoData]) => {
        const videoPreview = document.createElement('div');
        videoPreview.innerHTML = `
          <video 
            src="${videoData}" 
            controls
            class="preview-media-video"
          >
            Your browser does not support the video tag.
          </video>
        `;
        mediaElements.push(videoPreview.outerHTML);
      });
    }

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
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
  }

  async createPostAPI(postData) {
    try {
      // Validate post data
      if (!postData.content || postData.content.trim() === '') {
        throw new Error('Post content cannot be empty');
      }

      // Prepare post object
      const post = {
        id: Date.now(),
        content: postData.content,
        platforms: postData.platforms || ['all'],
        timestamp: new Date().toISOString(),
        author: postData.author || this.getCurrentUser(),
        mediaData: {
          images: postData.images || [],
          videos: postData.videos || []
        }
      };

      // Save post to local storage (existing method)
      this.savePostToLocalStorage(post);

      // Update global wall (existing method)
      this.updateGlobalWall(post);

      // Optional: Send post to backend server
      const response = await this.sendPostToServer(post);

      return {
        success: true,
        post: post,
        serverResponse: response
      };
    } catch (error) {
      console.error('Post creation error:', error);
      this.showNotification(error.message || 'Failed to create post');
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendPostToServer(post) {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post)
      });

      if (!response.ok) {
        throw new Error('Server responded with an error');
      }

      return await response.json();
    } catch (error) {
      console.error('Server post error:', error);
      return null;
    }
  }

  async sharePost() {
    const content = document.getElementById("post-content").value.trim();
    const imagePreviewContainers = document.querySelectorAll('.file-preview img');
    
    // Collect image data
    const images = Array.from(imagePreviewContainers).map(img => img.src);

    // Collect video data (if any)
    const videoPreview = document.querySelector('.video-preview video');
    const videoSrc = videoPreview ? videoPreview.src : null;

    if (!content && images.length === 0 && !videoSrc) {
      this.showNotification("Please enter post content or add media");
      return;
    }

    // Collect user profile information
    const userProfileInfo = {
      displayName: localStorage.getItem('userDisplayName') || 'User',
      avatar: localStorage.getItem('userProfileAvatar') || '../assets/human.png'
    };

    const post = {
      id: Date.now(), 
      content: content,
      images: images,
      video: videoSrc,
      author: userProfileInfo.displayName,
      authorAvatar: userProfileInfo.avatar,
      timestamp: new Date().toISOString(),
      platforms: this.selectedPlatforms,
      likes: 0,
      comments: [],
      shares: 0
    };

    // Save post to user's local posts
    this.savePostToLocalStorage(post);

    // Save post to global wall posts
    this.saveToGlobalWallPosts(post);

    // Clear post content and previews
    document.getElementById("post-content").value = '';
    
    // Remove image previews
    const filePreviewContainers = document.querySelectorAll('.file-preview');
    filePreviewContainers.forEach(container => container.remove());

    // Remove video preview
    const videoPreviewContainer = document.querySelector('.video-preview');
    if (videoPreviewContainer) {
      videoPreviewContainer.remove();
    }

    this.showNotification("Post shared successfully!");
  }

  savePostToLocalStorage(post) {
    // Retrieve existing posts or initialize an empty array
    let userPosts = JSON.parse(localStorage.getItem('userPosts') || '[]');
    
    // Add new post to the beginning of the array
    userPosts.unshift(post);
    
    // Limit to last 10 posts to prevent excessive storage
    userPosts = userPosts.slice(0, 10);
    
    // Save back to local storage
    localStorage.setItem('userPosts', JSON.stringify(userPosts));
  }

  saveToGlobalWallPosts(post) {
    // Retrieve existing global wall posts or initialize an empty array
    let globalWallPosts = JSON.parse(localStorage.getItem('devhive_posts') || '[]');
    
    // Add new post to the beginning of the array
    globalWallPosts.unshift(post);
    
    // Limit to last 50 posts to prevent excessive storage
    globalWallPosts = globalWallPosts.slice(0, 50);
    
    // Save back to local storage
    localStorage.setItem('devhive_posts', JSON.stringify(globalWallPosts));
  }

  getCurrentUser() {
    return "Current User";
  }

  showNotifications() {
    this.showNotification("Notifications panel would open here");
  }

  showProfile() {
    this.showNotification("Profile menu would open here");
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }, 100);
  }

  showLocalVideoPreview(videoSrc) {
    // Remove any existing video preview
    const existingVideoPreview = document.querySelector('.video-preview');
    if (existingVideoPreview) {
      existingVideoPreview.remove();
    }

    const textarea = document.getElementById("post-content");
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'video-preview';
    const video = document.createElement('video');
    video.src = videoSrc;
    video.style.maxWidth = '200px';
    video.style.maxHeight = '200px';
    video.controls = true;
    previewContainer.appendChild(video);
    
    textarea.parentElement.appendChild(previewContainer);
  }

  saveVideoMetadata(uploadedFileUrl) {
    // Optional: You can implement additional logic here if needed
    console.log('Video uploaded:', uploadedFileUrl);
  }
}

class StorageManager {
  constructor(maxSizeBytes = 64 * 1024 * 1024) { // Explicitly set to 64MB
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
