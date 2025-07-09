document.addEventListener('DOMContentLoaded', function() {
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

    loadUserDisplayName();

    fetch('../api/users/get-user-data.php', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            const avatarImg = document.getElementById('user-profile-avatar');
            if (data.profile_image_url && avatarImg) {
                avatarImg.src = data.profile_image_url;
            }
            const profileNameElement = document.querySelector('.profile-details h2');
            if (data.first_name && data.last_name) {
                profileNameElement.textContent = data.first_name + ' ' + data.last_name;
            } else if (data.username) {
                profileNameElement.textContent = data.username;
            }
        })
        .catch(() => {
            document.getElementById('user-profile-avatar').src = '../assets/human.png';
        });

    loadUserPosts();

    window.addEventListener('storage', function(event) {
        if (event.key === 'userDisplayName') {
            loadUserDisplayName();
            loadUserPosts(); 
        }
    });
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

function loadUserPosts() {
    const postsSection = document.querySelector('.posts-section');
    if (!postsSection) return;

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

                const postDate = new Date(post.created_at);
                const formattedDate = postDate.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                postElement.innerHTML = `
                    <div class="post-header">
                        <div class="post-author">
                            <div class="post-meta">
                                <h3>You</h3>
                                <p>Posted ${formattedDate}</p>
                            </div>
                        </div>
                    </div>
                    <div class="post-content">
                        <p>${post.content}</p>
                    </div>
                `;
                postsSection.appendChild(postElement);
            });
        })
        .catch(() => {
            postsSection.innerHTML = '<p style="color:#888;text-align:center;">Failed to load posts.</p>';
        });
}