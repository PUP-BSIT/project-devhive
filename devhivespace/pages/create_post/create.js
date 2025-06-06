class PostCreator {
  constructor() {
    this.selectedPlatforms = ["all"];
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
      case "link":
        this.insertLink();
        break;
      case "image":
        this.insertImage();
        break;
      case "video":
        this.insertVideo();
        break;
      case "attachment":
        this.insertAttachment();
        break;
      case "emoji":
        this.insertEmoji();
        break;
    }
  }

  insertLink() {
    const url = prompt("Enter URL:");
    if (url) {
      const textarea = document.getElementById("post-content");
      const linkText = `[Link](${url})`;
      this.insertAtCursor(textarea, linkText);
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
          reader.onload = (event) => {
            const textarea = document.getElementById("post-content");
            const imagePreview = `\n[Image: ${file.name}]\n`;
            this.insertAtCursor(textarea, imagePreview);
            
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

            // Improved image storage
            const storedImages = JSON.parse(localStorage.getItem('devhive_uploaded_images') || '{}');
            
            // Use a unique key to prevent overwriting
            const uniqueKey = `${Date.now()}_${file.name}`;
            storedImages[uniqueKey] = event.target.result;
            
            localStorage.setItem('devhive_uploaded_images', JSON.stringify(storedImages));
            
            // Log for debugging
            console.log('Image stored:', {
              uniqueKey,
              fileSize: event.target.result.length,
              type: file.type
            });
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
            const textarea = document.getElementById("post-content");
            const videoPreview = `\n[Video: ${file.name}]\n`;
            this.insertAtCursor(textarea, videoPreview);
            
            const previewContainer = document.createElement('div');
            previewContainer.className = 'file-preview';
            const video = document.createElement('video');
            video.src = event.target.result;
            video.style.maxWidth = '200px';
            video.controls = true;
            previewContainer.appendChild(video);
            textarea.parentElement.appendChild(previewContainer);

            // Store the video in local storage
            const storedVideos = JSON.parse(localStorage.getItem('devhive_uploaded_videos') || '{}');
            storedVideos[file.name] = event.target.result;
            localStorage.setItem('devhive_uploaded_videos', JSON.stringify(storedVideos));
          };
          reader.readAsDataURL(file);
        } else {
          this.showNotification(`${file.name} is not a video file`);
        }
      });
    };
    input.click();
  }

  insertAttachment() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const textarea = document.getElementById("post-content");
        const attachmentPreview = `\n[Attachment: ${file.name}]\n`;
        this.insertAtCursor(textarea, attachmentPreview);
        
        const previewContainer = document.createElement('div');
        previewContainer.className = 'file-preview';
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        fileInfo.innerHTML = `
          <img src="../assets/.png" alt="" style="width: 24px; height: 24px;">
          <span>${file.name}</span>
          <span>(${(file.size / 1024).toFixed(2)} KB)</span>
        `;
        previewContainer.appendChild(fileInfo);
        textarea.parentElement.appendChild(previewContainer);
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
    const title = document.getElementById("post-title").value.trim();

    if (!content) {
      this.showNotification("Please enter post content");
      return;
    }

    // Create preview modal similar to global wall post style
    const previewModal = document.createElement('div');
    previewModal.className = 'preview-modal-container';
    
    // Prepare post object for preview
    const previewPost = {
      id: Date.now(), // Temporary ID
      title: title,
      content: content,
      author: this.getCurrentUser() || 'Anonymous',
      timestamp: new Date().toISOString(),
      platforms: this.selectedPlatforms,
      likes: 0,
      comments: [],
      shares: 0
    };

    // Use the global wall's parsePostContent function to handle media
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
              <h4 class="post-title">${this.escapeHTML(title || 'Untitled Post')}</h4>
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

    // Add to body
    document.body.appendChild(previewModal);

    // Close modal functionality
    const closeBtn = previewModal.querySelector('.preview-modal-close');
    const confirmBtn = previewModal.querySelector('.preview-confirm-btn');
    const cancelBtn = previewModal.querySelector('.preview-cancel-btn');

    // Close modal when clicking close button or outside modal
    closeBtn.addEventListener('click', () => {
      previewModal.remove();
    });

    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) {
        previewModal.remove();
      }
    });

    // Confirm post functionality
    confirmBtn.addEventListener('click', () => {
      this.sharePost();
      previewModal.remove();
    });

    // Cancel/Edit post functionality
    cancelBtn.addEventListener('click', () => {
      previewModal.remove();
    });
  }

  parsePreviewContent(content) {
    // Regular expressions for different media types
    const imageRegex = /\[Image: (.+?)\]/g;
    const videoRegex = /\[Video: (.+?)\]/g;
    const attachmentRegex = /\[Attachment: (.+?)\]/g;
    
    // Containers for parsed content
    let text = content;
    const mediaElements = [];

    // Handle image parsing
    const imageMatches = [...text.matchAll(imageRegex)];
    imageMatches.forEach(match => {
      const fileName = match[1];
      
      // Retrieve stored images
      const storedImages = JSON.parse(localStorage.getItem('devhive_uploaded_images') || '{}');
      const imageData = 
        storedImages[Object.keys(storedImages).find(key => key.endsWith(fileName))] ||
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

    // Handle video parsing
    const videoMatches = [...text.matchAll(videoRegex)];
    videoMatches.forEach(match => {
      const fileName = match[1];
      
      // Retrieve stored videos
      const storedVideos = JSON.parse(localStorage.getItem('devhive_uploaded_videos') || '{}');
      const videoData = 
        storedVideos[fileName] ||
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

    // Wrap media elements
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

  // Utility method to get time difference (similar to global wall)
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

  // Utility function to escape HTML to prevent XSS
  escapeHTML(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
  }

  sharePost() {
    const title = document.getElementById("post-title").value;
    const content = document.getElementById("post-content").value;
    const platforms = this.selectedPlatforms;

    if (!title.trim() || !content.trim()) {
      this.showNotification("Please enter both title and content");
      return;
    }

    // Create a post object with unique image references
    const storedImages = JSON.parse(localStorage.getItem('devhive_uploaded_images') || '{}');
    const imageKeys = Object.keys(storedImages);
    
    // Modify content to use unique image keys
    const modifiedContent = content.replace(/\[Image: (.+?)\]/g, (match, fileName) => {
      const matchingKey = imageKeys.find(key => key.endsWith(fileName));
      return matchingKey ? `[Image: ${matchingKey}]` : match;
    });

    const post = {
      id: Date.now(), // Unique identifier
      title: title,
      content: modifiedContent,
      platforms: platforms,
      timestamp: new Date().toISOString(),
      author: this.getCurrentUser()
    };

    // Save to local storage
    this.savePostToLocalStorage(post);

    // Update global wall
    this.updateGlobalWall(post);

    // Clear form
    document.getElementById("post-title").value = "";
    document.getElementById("post-content").value = "";

    // Remove file previews
    const previews = document.querySelectorAll('.file-preview');
    previews.forEach(preview => preview.remove());

    this.showNotification("Post shared successfully!");
  }

  getCurrentUser() {
    // Implement user authentication logic
    // For now, return a placeholder
    return "Current User";
  }

  savePostToLocalStorage(post) {
    let posts = JSON.parse(localStorage.getItem('devhive_posts') || '[]');
    posts.push(post);
    localStorage.setItem('devhive_posts', JSON.stringify(posts));
  }

  updateGlobalWall(post) {
    // Create a new post element
    const postElement = document.createElement('div');
    postElement.className = 'global-post';
    postElement.innerHTML = `
      <div class="post-header">
        <h3>${post.title}</h3>
        <span class="post-author">${post.author}</span>
        <span class="post-timestamp">${new Date(post.timestamp).toLocaleString()}</span>
      </div>
      <div class="post-content">
        ${post.content}
      </div>
      <div class="post-platforms">
        Platforms: ${post.platforms.join(', ')}
      </div>
    `;

    // Add to global wall (assuming there's a container for posts)
    const globalWallContainer = document.querySelector('.global-wall-posts');
    if (globalWallContainer) {
      globalWallContainer.insertBefore(postElement, globalWallContainer.firstChild);
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

document.addEventListener("DOMContentLoaded", () => {
  new PostCreator();
});
