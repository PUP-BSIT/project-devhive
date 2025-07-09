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

  fetch('/api/users/get-session-user.php', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      console.log('User data:', data);
      if (data && data.success && data.username) {
        const usernameSpan = document.getElementById('dashboard-username');
        if (usernameSpan) {
          usernameSpan.textContent = data.username;
        }
      }
    });

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
      data.posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        const date = new Date(post.created_at);
        card.innerHTML = `
          <h3>Post #${post.post_id}</h3>
          <p>Posted ${date.toLocaleString()}${post.user_id ? ' | User ID: ' + post.user_id : ''}</p>
          <span class="platform">devhivespace</span>
          <div class="post-content">${post.content}</div>
        `;
        postsList.appendChild(card);
      });
    })
    .catch(err => {
      console.error('Failed to load recent posts:', err);
    });
});
