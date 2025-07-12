document.addEventListener('DOMContentLoaded', function() {
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

    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            console.log(`Switched to ${button.textContent} tab`);
        });
    });

    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.opacity = '0.9';
        });

        button.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
    });

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Always load display name from localStorage
    loadUserDisplayName();

    // Fetch user data from backend using token (required)
    const userToken = localStorage.getItem('oauth_token') || sessionStorage.getItem('oauth_token') || localStorage.getItem('token');
    let fetchUrl = '../api/users/get-session-user.php';
    if (userToken) {
        fetchUrl += `?token=${encodeURIComponent(userToken)}`;
    }
    fetch(fetchUrl, { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            const avatarImg = document.getElementById('user-profile-avatar');
            if (data.profile_image_url && avatarImg) {
                avatarImg.src = data.profile_image_url;
            }
            // Set display name to 'FirstName LastName' if available, else username
            const profileNameElement = document.querySelector('.profile-details h2');
            if (data.first_name && data.last_name) {
                profileNameElement.textContent = data.first_name + ' ' + data.last_name;
            } else if (data.username) {
                profileNameElement.textContent = data.username;
            }
        })
        .catch(() => {
            document.getElementById('user-profile-avatar').src = '../assets/human.png';
            console.error('No user token found. Please log in again.');
        });

    // Load and display user posts
    loadUserPosts();

    // Listen for storage changes
    window.addEventListener('storage', function(event) {
        if (event.key === 'userDisplayName') {
            loadUserDisplayName();
            loadUserPosts(); // Reload posts to update author name
        }
        if (event.key === 'userProfileAvatar') {
            const avatarImg = document.getElementById('user-profile-avatar');
            if (avatarImg && event.newValue) {
                avatarImg.src = event.newValue;
            }
        }
    });

    // Avatar upload logic
    const avatarInput = document.getElementById('avatar-upload');
    const uploadBtn = document.getElementById('upload-avatar-btn');
    const avatarImg = document.getElementById('user-profile-avatar');

    if (avatarInput && uploadBtn && avatarImg) {
        uploadBtn.addEventListener('click', function() {
            if (!avatarInput.files[0]) {
                alert('Please select an image file.');
                return;
            }
            const formData = new FormData();
            formData.append('avatar', avatarInput.files[0]);

            fetch('../api/users/upload-avatar.php', {
                method: 'POST',
                credentials: 'include',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.avatar_url) {
                    // Re-fetch user data to get the new profile_image_url
                    fetch('../api/users/get-user-data.php', { credentials: 'include' })
                        .then(response => response.json())
                        .then(user => {
                            if (user.profile_image_url) {
                                // Cache-bust the image
                                avatarImg.src = user.profile_image_url + '?t=' + Date.now();
                                // Optionally update localStorage
                                localStorage.setItem('userProfileAvatar', avatarImg.src);
                            }
                        });
                } else {
                    alert('Avatar upload failed: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(() => {
                alert('Avatar upload failed due to network error.');
            });
        });
    }
});

function loadUserAvatar() {
    const userProfileAvatar = document.querySelector('#user-profile-avatar');
    if (userProfileAvatar) {
        const savedAvatar = localStorage.getItem('userProfileAvatar');
        if (savedAvatar) {
            userProfileAvatar.src = savedAvatar;
        }
    }
}

function loadUserDisplayName() {
    const savedDisplayName = localStorage.getItem('userDisplayName');
    
    // Update display name in profile details
    const profileNameElements = [
        document.querySelector('.profile-details h2')
    ];

    if (savedDisplayName) {
        profileNameElements.forEach(element => {
            if (element) {
                element.textContent = savedDisplayName;
            }
        });
    }
}

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

function loadUserPosts() {
    const postsSection = document.querySelector('.posts-section');
    if (!postsSection) return;

    // Fetch posts from backend
    fetch('../api/posts/get-user-posts.php', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            postsSection.innerHTML = '';
            if (!data.success || !data.posts || data.posts.length === 0) {
                const noPostsMessage = document.createElement('p');
                noPostsMessage.textContent = 'No posts yet. Create your first post!';
                noPostsMessage.style.textAlign = 'center';
                noPostsMessage.style.color = '#888';
                postsSection.appendChild(noPostsMessage);
                return;
            }

            data.posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post-item';

                // Real-time (local) timestamp
                const formattedDate = convertUTCMySQLToLocal(post.created_at);

                // Media rendering
                let mediaHTML = '';
                if (post.images && post.images.length > 0) {
                    mediaHTML += `<div class='post-media-gallery' style='display:flex;gap:8px;margin-bottom:8px;'>` +
                        post.images.map(img => `<img src='${img}' alt='Post Image' style='max-width:120px;max-height:120px;object-fit:cover;border-radius:6px;border:1.5px solid #eee;'>`).join('') +
                        `</div>`;
                }
                if (post.videos && post.videos.length > 0) {
                    mediaHTML += post.videos.map(vid => `<video src='${vid}' controls style='max-width:220px;max-height:180px;object-fit:contain;border-radius:6px;background:#000;margin-bottom:8px;'></video>`).join('');
                }

                // Like, comment, share counts
                const likeCount = post.like_count || 0;
                const commentCount = post.comment_count || 0;
                const shareCount = post.share_count || 0;

                postElement.innerHTML = `
                    <div class="post-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <img class="avatar" src="${post.profile_image_url || '../assets/human.png'}" alt="User Avatar" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%; border: 2.5px solid #000; background: #e0f7fa;">
                        <div style="display: flex; flex-direction: column;">
                            <span class="username" style="font-weight: 700; color: #000;">You</span>
                            <span class="timestamp" style="font-size: 13px; color: #666;">${formattedDate}</span>
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
                postsSection.appendChild(postElement);
            });
        })
        .catch(() => {
            postsSection.innerHTML = '<p style="color:#888;text-align:center;">Failed to load posts.</p>';
        });
}