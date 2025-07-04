class PostCreator {
  constructor() {
    this.selectedPlatforms = ["all"];
    this.storageManager = new StorageManager();
    this.apiBaseUrl = '/api/posts'; // Base URL for API endpoints
    this.uploadedImages = [];
    this.uploadedVideos = [];
    this.activeFormats = new Set();
    this.initializeEventListeners();
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

    // Add formatting button listeners
    document.querySelectorAll('.toolbar-btn[data-format]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const format = e.target.closest('.toolbar-btn').dataset.format;
        this.toggleFormat(format);
      });
    });

    // Add input event listener for the editor
    const editor = document.getElementById('post-content');
    editor.addEventListener('input', () => {
      this.updateFormatButtons();
    });

    // Handle paste events to clean up formatting
    editor.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    });
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
      
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          try {
            const formData = new FormData();
            formData.append('image', file);

            // Upload image to server
            const response = await fetch(`${this.apiBaseUrl}/upload-image.php`, {
              method: 'POST',
              body: formData
            });

            if (!response.ok) {
              throw new Error(`Failed to upload image: ${file.name}`);
            }

            const result = await response.json();
            
            if (result.status === 'success') {
              // Add image to uploadedImages array
              this.uploadedImages.push({
                url: result.data.url,
                id: result.data.image_id,
                filename: result.data.filename
              });

              // Add image preview
              const previewContainer = document.createElement('div');
              previewContainer.className = 'image-preview';
              
              const img = document.createElement('img');
              img.src = result.data.url;
              img.alt = file.name;
              img.style.maxWidth = '100px';
              img.style.height = '100px';
              img.style.objectFit = 'cover';
              img.style.borderRadius = '8px';
              
              const removeBtn = document.createElement('button');
              removeBtn.innerHTML = '×';
              removeBtn.className = 'remove-media-btn';
              removeBtn.onclick = () => {
                this.uploadedImages = this.uploadedImages.filter(img => img.url !== result.data.url);
                previewContainer.remove();
              };

              previewContainer.appendChild(img);
              previewContainer.appendChild(removeBtn);
              
              const previewsContainer = document.getElementById("image-previews");
              if (!previewsContainer) {
                const container = document.createElement('div');
                container.id = 'image-previews';
                container.className = 'media-previews';
                document.querySelector('.post-form').appendChild(container);
              }
              document.getElementById("image-previews").appendChild(previewContainer);

              this.showNotification(`Image ${file.name} uploaded successfully`);
            } else {
              throw new Error(result.message || `Failed to upload image: ${file.name}`);
            }
          } catch (error) {
            console.error('Error uploading image:', error);
            this.showNotification(`Error: ${error.message}`);
          }
        } else {
          this.showNotification(`${file.name} is not an image file`);
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
    const editor = document.getElementById('post-content');
    
    // Create a new text node with the emoji
    const textNode = document.createTextNode(emoji);
    
    // Get the current selection
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // Insert the emoji at the cursor position
    range.deleteContents();
    range.insertNode(textNode);
    
    // Move cursor after the inserted emoji
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Focus back on the editor
    editor.focus();
  }

  previewPost() {
    const content = document.getElementById('post-content').innerHTML;
    const modalContainer = document.querySelector('.preview-modal-container');
    const modal = document.querySelector('.preview-modal');
    const closeBtn = document.querySelector('.preview-modal-close');
    const cancelBtn = document.querySelector('.preview-cancel-btn');
    const confirmBtn = document.querySelector('.preview-confirm-btn');
    const postText = document.querySelector('.preview-post .post-text');
    const platformList = document.querySelector('.platform-list');
    const postAuthor = document.querySelector('.preview-post .post-author');
    const postContent = document.querySelector('.preview-post .post-content');

    // Get current user info
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      postAuthor.textContent = currentUser.name || 'Your Name';
    }

    // Parse and update post content
    const parsedContent = this.parsePreviewContent(content);
    postText.innerHTML = parsedContent.text;
    
    // Add media if any
    if (parsedContent.media) {
      postContent.innerHTML = parsedContent.media + postContent.innerHTML;
    }

    // Update platform list
    platformList.innerHTML = '';
    this.selectedPlatforms.forEach(platform => {
      if (platform !== 'all') {
        const platformTag = document.createElement('span');
        platformTag.className = 'platform-tag';
        platformTag.textContent = platform;
        platformList.appendChild(platformTag);
      }
    });

    // Show modal
    modalContainer.style.display = 'flex';

    // Close modal handlers
    const closeModal = () => {
      modalContainer.style.display = 'none';
    };

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;
    confirmBtn.onclick = () => {
      closeModal();
      this.sharePost();
    };

    // Close on outside click
    modalContainer.onclick = (e) => {
      if (e.target === modalContainer) {
        closeModal();
      }
    };

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
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
      filePreview.className = 'preview-media-item';
      filePreview.innerHTML = `
        <div class="preview-media-wrapper">
          <img 
            src="${image.url}" 
            alt="Uploaded Image" 
            class="preview-media-image"
          >
        </div>
      `;
      mediaElements.push(filePreview.outerHTML);
    });

    // Add uploaded videos
    this.uploadedVideos.forEach(video => {
      const videoPreview = document.createElement('div');
      videoPreview.className = 'preview-media-item';
      // Use local URL for preview if available, fallback to server URL
      const videoUrl = video.localUrl || video.url;
      videoPreview.innerHTML = `
        <div class="preview-media-wrapper">
          <video 
            src="${videoUrl}"
            controls
            class="preview-media-video"
            ${video.thumbnail_url ? `poster="${video.thumbnail_url}"` : ''}
          >
            Your browser does not support the video tag.
          </video>
          ${video.duration ? `<span class="video-duration">${this.formatDuration(video.duration)}</span>` : ''}
        </div>
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
      text: text.trim(), // Remove escapeHTML to preserve formatting
      media: mediaElements.length > 0 ? mediaContainer.outerHTML : ''
    };
  }

  async sharePost() {
    try {
      const editor = document.getElementById('post-content');
      const content = editor.innerHTML;

      if (!content.trim()) {
        this.showNotification("Please enter content");
        return;
      }

      const userId = this.getCurrentUserId();
      if (!userId) {
        this.showNotification("You must be logged in to post.");
        return;
      }
      const postData = {
        content: content,
        user_id: userId
      };

      console.log("Sending post data: ", postData);

      // Create post first
      const response = await fetch(`${this.apiBaseUrl}/create-post.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
        credentials: 'include' // <-- add this!
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create post');
      }

      const result = await response.json();
      console.log("Raw response: ", JSON.stringify(result));

      if (result.status === 'success') {
        // If there are images, associate them with the post
        if (this.uploadedImages.length > 0) {
          for (const image of this.uploadedImages) {
            const formData = new FormData();
            formData.append('post_id', result.data.post_id);
            formData.append('image_url', image.url);

            await fetch(`${this.apiBaseUrl}/upload-image.php`, {
              method: 'POST',
              body: formData
            });
          }
        }

        // If there are videos, associate them with the post
        if (this.uploadedVideos.length > 0) {
          for (const video of this.uploadedVideos) {
            const formData = new FormData();
            formData.append('post_id', result.data.post_id);
            formData.append('video_url', video.url);

            await fetch(`${this.apiBaseUrl}/upload-video.php`, {
              method: 'POST',
              body: formData
            });
          }
        }

        // Clear form and media
        editor.innerHTML = "";
        document.getElementById("image-previews").innerHTML = "";
        document.getElementById("video-previews").innerHTML = "";
        this.uploadedImages = [];
        this.uploadedVideos = [];

        this.showNotification("Post shared successfully!");
        
        // Redirect to the global wall page after successful post
        setTimeout(() => {
          window.location.href = '/global_wall/';
        }, 1500); // Wait 1.5 seconds so user can see the success message
      } else {
        throw new Error(result.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      this.showNotification(`Error: ${error.message}`);
    }
  }

  getCurrentUserId() {
  // Example: get user_id from localStorage (set this after login)
  return Number(localStorage.getItem('user_id')) || null;
}

  showNotifications() {
    this.showNotification("Notifications panel would open here");
  }

  showProfile() {
    this.showNotification("Profile menu would open here");
  }

  showNotification(message) {
    // Remove any existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 2000); // Show for 2 seconds
    }, 100);
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

  async getCurrentUser() {
    try {
      const response = await fetch('/api/users/get-user-data.php', {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (data && data.user) {
        return data.user; // Should contain user_id, username, etc.
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  cleanup() {
    // Revoke all object URLs when they're no longer needed
    this.uploadedVideos.forEach(video => {
      if (video.localUrl) {
        URL.revokeObjectURL(video.localUrl);
      }
    });
  }

  toggleFormat(format) {
    const editor = document.getElementById('post-content');
    
    // Save current selection
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // Apply formatting
    switch (format) {
      case 'bold':
        document.execCommand('bold', false, null);
        break;
      case 'italic':
        document.execCommand('italic', false, null);
        break;
      case 'underline':
        document.execCommand('underline', false, null);
        break;
    }
    
    // Restore focus
    editor.focus();
    this.updateFormatButtons();
  }

  updateFormatButtons() {
    const editor = document.getElementById('post-content');
    
    // Update button states based on current formatting
    document.querySelectorAll('.toolbar-btn[data-format]').forEach(btn => {
      const format = btn.dataset.format;
      let isActive = false;
      
      switch (format) {
        case 'bold':
          isActive = document.queryCommandState('bold');
          break;
        case 'italic':
          isActive = document.queryCommandState('italic');
          break;
        case 'underline':
          isActive = document.queryCommandState('underline');
          break;
      }
      
      btn.classList.toggle('active', isActive);
    });
  }

  getMediaPreviewHTML() {
    const mediaElements = [];

    // Add uploaded images
    this.uploadedImages.forEach(image => {
      const imagePreview = document.createElement('div');
      imagePreview.innerHTML = `
        <img 
          src="${image.url}" 
          alt="Uploaded Image" 
          class="preview-media-image"
        >
      `;
      mediaElements.push(imagePreview.outerHTML);
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

    return mediaContainer.outerHTML;
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

function createPost(content) {
  fetch('/api/posts/create-post.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: content }),
    credentials: 'include'
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert("Post created successfully!");
      } else {
        alert(data.message || "Failed to create post. Please try again.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred while creating the post. Please try again.");
    });
}
