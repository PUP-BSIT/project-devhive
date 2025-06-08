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
              img.style.maxWidth = '40px';
              img.style.height = '40px';
              img.style.borderRadius = '50%';
              img.style.objectFit = 'cover';
              previewContainer.appendChild(img);
              textarea.parentElement.appendChild(previewContainer);

              this.showNotification(`Image ${file.name} stored successfully`);
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
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        if (file.type.startsWith('video/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const uniqueKey = `${Date.now()}_${file.name}`;
            
            const storageResult = this.storageManager.storeItem('videos', uniqueKey, event.target.result);
            
            if (storageResult) {
              const textarea = document.getElementById("post-content");
              
              const previewContainer = document.createElement('div');
              previewContainer.className = 'file-preview';
              const video = document.createElement('video');
              video.src = event.target.result;
              video.style.maxWidth = '200px';
              video.controls = true;
              previewContainer.appendChild(video);
              textarea.parentElement.appendChild(previewContainer);

              this.showNotification(`Video ${file.name} stored successfully`);
            } else {
              this.showNotification(`Could not store video: ${file.name}. Storage may be full.`);
            }
          };
          reader.readAsDataURL(file);
        } else {
          this.showNotification(`${file.name} is not a video file`);
        }
      });
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

  sharePost() {
    const content = document.getElementById("post-content").value;
    const platforms = this.selectedPlatforms;

    if (!content.trim()) {
      this.showNotification("Please enter content");
      return;
    }

    const storedImages = JSON.parse(localStorage.getItem(this.storageManager.storageKeys.images) || '{}');
    const storedVideos = JSON.parse(localStorage.getItem(this.storageManager.storageKeys.videos) || '{}');
    
    const post = {
      id: Date.now(), 
      content: content,
      platforms: platforms,
      timestamp: new Date().toISOString(),
      author: this.getCurrentUser(),
      mediaData: {
        images: Object.entries(storedImages).map(([key, value]) => ({
          key: key,
          data: value
        })),
        videos: Object.entries(storedVideos).map(([key, value]) => ({
          key: key,
          data: value
        }))
      }
    };

    this.savePostToLocalStorage(post);
    this.updateGlobalWall(post);

    document.getElementById("post-content").value = "";
    const previews = document.querySelectorAll('.file-preview');
    previews.forEach(preview => preview.remove());

    localStorage.removeItem(this.storageManager.storageKeys.images);
    localStorage.removeItem(this.storageManager.storageKeys.videos);

    this.showNotification("Post shared successfully!");
  }

  getCurrentUser() {
    return "Current User";
  }

  savePostToLocalStorage(post) {
    let posts = JSON.parse(localStorage.getItem('devhive_posts') || '[]');
    posts.push(post);
    localStorage.setItem('devhive_posts', JSON.stringify(posts));
  }

  updateGlobalWall(post) {
    console.group('Update Global Wall Debug');
    console.log('Post received:', post);
    
    const postElement = document.createElement('div');
    postElement.className = 'global-post';
    
    let mediaHTML = '';

    if (post.mediaData && post.mediaData.images && post.mediaData.images.length > 0) {
      console.log('Images to display:', post.mediaData.images.length);
      
      const imageContainer = document.createElement('div');
      imageContainer.className = 'global-post-media-container';
      
      post.mediaData.images.forEach((image, index) => {
        console.log(`Image ${index + 1} data length:`, image.data.length);
        
        const imgElement = document.createElement('img');
        imgElement.src = image.data;
        imgElement.className = 'global-post-media-image';
        imageContainer.appendChild(imgElement);
      });
      
      mediaHTML += imageContainer.outerHTML;
    } else {
      console.log('No images found in mediaData');
    }

    if (post.mediaData && post.mediaData.videos && post.mediaData.videos.length > 0) {
      console.log('Videos to display:', post.mediaData.videos.length);
      
      const videoContainer = document.createElement('div');
      videoContainer.className = 'global-post-media-container';
      
      post.mediaData.videos.forEach((video, index) => {
        console.log(`Video ${index + 1} data length:`, video.data.length);
        
        const videoElement = document.createElement('video');
        videoElement.src = video.data;
        videoElement.className = 'global-post-media-video';
        videoElement.controls = true;
        videoContainer.appendChild(videoElement);
      });
      
      mediaHTML += videoContainer.outerHTML;
    } else {
      console.log('No videos found in mediaData');
    }

    console.groupEnd();

    postElement.innerHTML = `
      <div class="post-header">
        <h3>${this.escapeHTML(post.title || 'Untitled Post')}</h3>
        <span class="post-author">${this.escapeHTML(post.author)}</span>
        <span class="post-timestamp">${new Date(post.timestamp).toLocaleString()}</span>
      </div>
      <div class="post-content">
        ${this.escapeHTML(post.content)}
        ${mediaHTML}
      </div>
      <div class="post-platforms">
        Platforms: ${post.platforms.join(', ')}
      </div>
    `;

    const globalWallContainer = document.querySelector('.global-wall-posts');
    if (globalWallContainer) {
      globalWallContainer.insertBefore(postElement, globalWallContainer.firstChild);
    } else {
      console.error('Global wall container not found');
    }
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
}

class StorageManager {
  constructor(maxSizeBytes = 50 * 1024 * 1024) { // 50MB default
    this.maxSizeBytes = maxSizeBytes;
    this.storageKeys = {
      images: 'devhive_uploaded_images',
      videos: 'devhive_uploaded_videos'
    };
  }

  getCurrentStorageUsage(storageType) {
    try {
      const storedData = JSON.parse(localStorage.getItem(this.storageKeys[storageType]) || '{}');
      return Object.values(storedData).reduce((total, item) => total + this.getBase64Size(item), 0);
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return 0;
    }
  }

  getBase64Size(base64String) {
    return base64String ? base64String.length * 1.37 : 0;
  }

  canStoreItem(storageType, newItemSize) {
    const currentUsage = this.getCurrentStorageUsage(storageType);
    return (currentUsage + newItemSize) <= this.maxSizeBytes;
  }

  makeSpaceIfNeeded(storageType, newItemSize) {
    let storedData = JSON.parse(localStorage.getItem(this.storageKeys[storageType]) || '{}');
    
    const sortedItems = Object.entries(storedData)
      .sort(([key1], [key2]) => key1.localeCompare(key2));

    while (this.getCurrentStorageUsage(storageType) + newItemSize > this.maxSizeBytes && sortedItems.length > 0) {
      const [oldestKey] = sortedItems.shift();
      delete storedData[oldestKey];
    }

    return storedData;
  }

  storeItem(storageType, key, item) {
    const itemSize = this.getBase64Size(item);
    
    try {
      if (!this.canStoreItem(storageType, itemSize)) {
        const updatedStorage = this.makeSpaceIfNeeded(storageType, itemSize);
        
        if (!this.canStoreItem(storageType, itemSize)) {
          throw new Error('Not enough storage space');
        }
        
        localStorage.setItem(this.storageKeys[storageType], JSON.stringify(updatedStorage));
      }

      const storedData = JSON.parse(localStorage.getItem(this.storageKeys[storageType]) || '{}');
      
      storedData[key] = item;
      
      localStorage.setItem(this.storageKeys[storageType], JSON.stringify(storedData));
      
      return true;
    } catch (error) {
      console.error(`Storage error for ${storageType}:`, error);
      return false;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new PostCreator();
});
