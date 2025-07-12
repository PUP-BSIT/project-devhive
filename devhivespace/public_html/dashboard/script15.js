// ✅ Your original logic starts here, unchanged
(function () {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('oauth_token');
  if (token) {
    localStorage.setItem('oauth_token', token);
    window.history.replaceState({}, document.title, window.location.pathname);
    console.log('OAuth token stored in localStorage:', token);
  }
})();

document.addEventListener("DOMContentLoaded", function () {
  // Sidebar toggle functionality
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  
  // Load sidebar state from localStorage
  const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  if (sidebarCollapsed) {
    sidebar.classList.add('collapsed');
  }
  
  // Toggle sidebar on button click
  sidebarToggle.addEventListener('click', function() {
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  });

  const navItems = document.querySelectorAll(".nav-menu li");

  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      navItems.forEach((i) => i.classList.remove("active"));
      this.classList.add("active");
    });
  });

  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.addEventListener("mouseenter", function () {
      this.style.opacity = "0.9";
    });

    button.addEventListener("mouseleave", function () {
      this.style.opacity = "1";
    });
  });

  const performanceBars = document.querySelectorAll(".progress");
  performanceBars.forEach((bar) => {
    const percentage = bar.parentElement.nextElementSibling.textContent;
    bar.style.width = percentage;
  });

  const actionButtons = document.querySelectorAll(".action-btn");
  actionButtons.forEach((button) => {
    button.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-4px)";
    });

    button.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });

    button.addEventListener("click", function () {
      this.style.transform = "scale(0.95)";
      setTimeout(() => {
        this.style.transform = "translateY(0)";
      }, 150);
    });
  });

  const notificationBell = document.querySelector(".notifications i");
  if (notificationBell) {
    notificationBell.addEventListener("click", function () {
      this.style.transform = "rotate(15deg)";
      setTimeout(() => {
        this.style.transform = "rotate(-15deg)";
        setTimeout(() => {
          this.style.transform = "rotate(0)";
        }, 150);
      }, 150);
    });
  }

  function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (
        (increment > 0 && current >= end) ||
        (increment < 0 && current <= end)
      ) {
        clearInterval(timer);
        element.textContent = end.toString().includes("%")
          ? end
          : end.toLocaleString();
      } else {
        element.textContent = Math.round(current).toLocaleString();
      }
    }, 16);
  }

  function updateStats() {
    const stats = {
      "Total Users": Math.floor(Math.random() * 2000 + 1000),
      "Active Posts": Math.floor(Math.random() * 1000 + 500),
      Engagement: Math.floor(Math.random() * 20 + 80) + "%",
    };

    Object.entries(stats).forEach(([key, value]) => {
      let statCard = null;
      document.querySelectorAll('.stat-card').forEach(card => {
        const h4 = card.querySelector('h4');
        if (h4 && h4.textContent.trim() === key) {
          statCard = card.querySelector('p');
        }
      });
      if (statCard) {
        const currentValue = parseInt(
          statCard.textContent.replace(/[^0-9]/g, "")
        );
        const newValue = parseInt(value.toString().replace(/[^0-9]/g, ""));
        animateValue(statCard, currentValue, newValue, 1000);
      }
    });
  }

  updateStats();
  setInterval(updateStats, 30000);

  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      console.log(`Switched to ${button.textContent} tab`);
    });
  });

  const menuItems = document.querySelectorAll(".menu-item");
  menuItems.forEach((item) => {
    item.addEventListener("click", function () {
      const page = this.getAttribute("data-page");
      if (page === "profile") {
        window.location.href = "../user_profile/index.html";
      }
    });
  });

  // Fetch and display username in welcome message
  fetch('/api/users/get-session-user.php', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data && data.success && data.username) {
        const usernameSpan = document.getElementById('dashboard-username');
        if (usernameSpan) {
          usernameSpan.textContent = data.username;
        }
      }
    });

  // Fetch and display recent posts
  fetch('/api/posts/get-recent-posts.php', { credentials: 'include' })
    .then(res => {
      if (res.status === 401) {
        window.location.href = '/login/index.html';
        return null;
      }
      return res.json();
    })
    .then(data => {
      if (!data || !data.posts) return;
      const postsList = document.getElementById('posts-list');
      const noPostsMsg = document.getElementById('no-posts-message');
      postsList.innerHTML = '';
      if (data.posts.length === 0) {
        noPostsMsg.style.display = 'block';
        return;
      } else {
        noPostsMsg.style.display = 'none';
      }

      // Add UTC to local time conversion function
      function convertUTCMySQLToLocal(dateString) {
        const [datePart, timePart] = dateString.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = timePart.split(':').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
        return utcDate.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }

      data.posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        // Use profile image from backend
        const avatarUrl = post.profile_image_url || '../assets/default_avatar.png';
        // Prefer username, else full name, else 'User'
        let displayName = 'User';
        if (post.username) {
          displayName = post.username;
        } else if (post.first_name || post.last_name) {
          displayName = `${post.first_name || ''} ${post.last_name || ''}`.trim();
        }
        const likeCount = post.likes || post.like_count || 0;
        const commentCount = post.comments || post.comment_count || 0;
        const shareCount = post.shares || post.share_count || 0;
        // Render images and videos if present
        let mediaHTML = '';
        if (post.images && post.images.length > 0) {
          mediaHTML += `<div class='post-media-gallery' style='display:flex;gap:8px;margin-bottom:8px;'>` +
            post.images.map(img => `<img src='${img}' alt='Post Image' style='max-width:120px;max-height:120px;object-fit:cover;border-radius:6px;border:1.5px solid #eee;'>`).join('') +
            `</div>`;
        }
        if (post.videos && post.videos.length > 0) {
          mediaHTML += post.videos.map(vid => `<video src='${vid}' controls style='max-width:220px;max-height:180px;object-fit:contain;border-radius:6px;background:#000;margin-bottom:8px;'></video>`).join('');
        }
        card.innerHTML = `
          <div class="post-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <img class="avatar" src="${avatarUrl}" alt="User Avatar" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%; border: 2.5px solid #000; background: #e0f7fa;">
            <div style="display: flex; flex-direction: column;">
              <span class="username" style="font-weight: 700; color: #000;">${displayName}</span>
              <span class="timestamp" style="font-size: 13px; color: #666;">${convertUTCMySQLToLocal(post.created_at)}</span>
            </div>
          </div>
          <div class="post-content" style="margin-bottom: 12px; color: #222; font-size: 16px;">${post.content}</div>
          ${mediaHTML}
          <div class="post-stats" style="display: flex; gap: 24px; font-size: 14px; color: #333; border-top: 2px solid #eee; padding-top: 8px;">
            <span style="display: flex; align-items: center; gap: 4px;">👍 <span class="like-count">${likeCount} Likes</span></span>
            <span style="display: flex; align-items: center; gap: 4px;">💬 <span class="comment-count">${commentCount} Comments</span></span>
            <span style="display: flex; align-items: center; gap: 4px;">↗️ <span class="share-count">${shareCount} Shares</span></span>
          </div>
        `;
        postsList.appendChild(card);
      });
    })
    .catch(err => {
      console.error('Failed to load recent posts:', err);
    });
});
