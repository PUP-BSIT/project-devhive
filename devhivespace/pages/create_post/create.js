class PostCreator {
  constructor() {
    this.selectedPlatforms = ["all"];
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    document.querySelectorAll(".platform-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.handlePlatformSelection(e));
    });

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", (e) => this.handleNavigation(e));
    });

    document.querySelectorAll(".toolbar-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleFormatting(e));
    });

    document
      .getElementById("preview-btn")
      .addEventListener("click", () => this.previewPost());
    document
      .getElementById("save-draft-btn")
      .addEventListener("click", () => this.saveDraft());
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
        document.querySelector('[data-platform="all"]').classList.add("active");
        this.selectedPlatforms = ["all"];
      }
    }

    console.log("Selected platforms:", this.selectedPlatforms);
  }

  handleNavigation(e) {
    document.querySelectorAll(".nav-item").forEach((item) => {
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
      case "bold":
      case "italic":
      case "underline":
        this.applyTextFormatting(format);
        break;
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

  applyTextFormatting(format) {
    const textarea = document.getElementById("post-content");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let formattedText = "";
    switch (format) {
      case "bold":
        formattedText = `**${selectedText || "bold text"}**`;
        break;
      case "italic":
        formattedText = `*${selectedText || "italic text"}*`;
        break;
      case "underline":
        formattedText = `__${selectedText || "underlined text"}__`;
        break;
    }

    textarea.value =
      textarea.value.substring(0, start) +
      formattedText +
      textarea.value.substring(end);
    textarea.focus();
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
            img.style.maxWidth = '200px';
            previewContainer.appendChild(img);
            textarea.parentElement.appendChild(previewContainer);
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
    const emojis = ["😊", "😂", "❤️", "👍", "🎉", "🔥", "💯", "✨"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const textarea = document.getElementById("post-content");
    this.insertAtCursor(textarea, randomEmoji);
  }

  insertAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value =
      textarea.value.substring(0, start) + text + textarea.value.substring(end);
    textarea.setSelectionRange(start + text.length, start + text.length);
    textarea.focus();
  }

  previewPost() {
    const title = document.getElementById("post-title").value;
    const content = document.getElementById("post-content").value;

    if (!title && !content) {
      this.showNotification("Please enter a title or content to preview");
      return;
    }

    console.log("Preview post:", {
      title,
      content,
      platforms: this.selectedPlatforms,
    });
    this.showNotification("Post preview would open in a modal");
  }

  saveDraft() {
    const title = document.getElementById("post-title").value;
    const content = document.getElementById("post-content").value;

    if (!title && !content) {
      this.showNotification("Please enter some content to save as draft");
      return;
    }

    console.log("Save draft:", {
      title,
      content,
      platforms: this.selectedPlatforms,
    });
    this.showNotification("Draft saved successfully!");
  }

  sharePost() {
    const title = document.getElementById("post-title").value;
    const content = document.getElementById("post-content").value;
    const previews = document.querySelectorAll('.file-preview');
    
    if (!title && !content && previews.length === 0) {
      this.showNotification("Please enter a title, content, or add files to share");
      return;
    }

    const postData = {
      title,
      content,
      platforms: this.selectedPlatforms,
      files: Array.from(previews).map(preview => {
        const mediaElement = preview.querySelector('img, video');
        const fileInfo = preview.querySelector('.file-info');
        return {
          type: mediaElement ? (mediaElement.tagName === 'IMG' ? 'image' : 'video') : 'attachment',
          src: mediaElement ? mediaElement.src : null,
          name: fileInfo ? fileInfo.querySelector('span').textContent : null
        };
      })
    };

    console.log("Sharing post:", postData);
    this.showNotification("Post shared successfully!");
    
    document.getElementById("post-title").value = "";
    document.getElementById("post-content").value = "";
    previews.forEach(preview => preview.remove());
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
