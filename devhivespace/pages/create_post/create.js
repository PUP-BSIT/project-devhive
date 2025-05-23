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
    this.showNotification("Image upload feature would be implemented here");
  }

  insertVideo() {
    this.showNotification("Video upload feature would be implemented here");
  }

  insertAttachment() {
    this.showNotification("File attachment feature would be implemented here");
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

    if (!title && !content) {
      this.showNotification("Please enter some content to share");
      return;
    }

    console.log("Share post:", {
      title,
      content,
      platforms: this.selectedPlatforms,
    });
    this.showNotification(
      `Post shared to ${this.selectedPlatforms.join(", ")}!`
    );

    setTimeout(() => {
      document.getElementById("post-title").value = "";
      document.getElementById("post-content").value = "";
    }, 1000);
  }

  showNotifications() {
    this.showNotification("Notifications panel would open here");
  }

  showProfile() {
    this.showNotification("Profile menu would open here");
  }

  showNotification(message) {
    const notification = document.createElement("div");
    notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4a90e2;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                font-size: 14px;
                max-width: 300px;
            `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new PostCreator();
});
