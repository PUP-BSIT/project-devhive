console.log("globalfeed20.js loaded");
document.addEventListener('click', function(e) {
    console.log('Global click detected:', e.target);
    const likeBtn = e.target.closest('.btn-like');
    console.log('Result of closest(".btn-like"):', likeBtn);
    if (likeBtn) {
        const postId = likeBtn.getAttribute('data-post-id');
        alert('Like button clicked for post: ' + postId); // Debugging
        toggleLike({ id: postId, post_id: postId }, likeBtn);
        return;
    }
});

// Global variable to store current user info
let currentUser = null;

// Function to get current user information
async function getCurrentUser() {
    try {
        // Try token-based first (OAuth)
        const token = localStorage.getItem('user_token') || localStorage.getItem('token') || localStorage.getItem('oauth_token');
        const provider = localStorage.getItem('provider') || 'devhive';
        let url = `/../api/users/get-user-data.php?provider=${encodeURIComponent(provider)}`;
        if (token) {
            url += `&token=${encodeURIComponent(token)}`;
        }
        const response = await fetch(url, { credentials: 'include' });
        const result = await response.json();

        if (result.success) {
            currentUser = {
                user_id: result.user_id,
                username: result.username,
                provider: result.provider || null
            };
            if (currentUser.provider) {
                localStorage.setItem('provider', currentUser.provider);
            }
            console.log('Current user:', currentUser);
            updateCommentInputs();
            showNotification(`Welcome back, ${currentUser.username}!`);
        } else {
            console.log('User not logged in:', result.error);
            currentUser = null;
        }
    } catch (error) {
        console.error('Error getting current user:', error);
        currentUser = null;
    }
}

// Function to update comment input placeholders and user indicators
function updateCommentInputs() {
    const commentInputs = document.querySelectorAll('.comment-input');
    commentInputs.forEach(input => {
        if (currentUser) {
            input.placeholder = `Write a comment as ${currentUser.username}...`;
        } else {
            input.placeholder = 'Write a comment...';
        }
        
        // Update user indicatora
        const wrapper = input.closest('.comment-input-wrapper');
        if (wrapper) {
            let indicator = wrapper.querySelector('.comment-user-indicator');
            if (currentUser) {
                if (!indicator) {
                    indicator = document.createElement('div');
                    indicator.className = 'comment-user-indicator';
                    wrapper.appendChild(indicator);
                }
                indicator.textContent = `Commenting as ${currentUser.username}`;
            } else if (indicator) {
                indicator.remove();
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Restore session if token exists but no session
    // const token = localStorage.getItem('user_token') || localStorage.getItem('token') || localStorage.getItem('oauth_token');
    // if (token) {
    //     try {
    //         await fetch('/api/auth/test_session.php?token=' + encodeURIComponent(token), { credentials: 'include' });
    //     } catch (e) { console.warn('Session restore failed', e); }
    // }
    // // Get current user information first
    await getCurrentUser();
    
    const filterButtons = document.querySelectorAll('.post-filters button');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            loadPosts(0, button.textContent.trim().toLowerCase());
        });
    });

    const sidebarLinks = document.querySelectorAll('.sidebar nav ul li a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Initial load
    loadPosts(0, 'all post');

    // Add refresh button to header
    const globalWallHeader = document.querySelector('.global-wall-header');
    const refreshButton = document.createElement('button');
    refreshButton.className = 'refresh-btn';
    refreshButton.innerHTML = '🔄 Refresh';
    globalWallHeader.appendChild(refreshButton);

    refreshButton.addEventListener('click', () => {
        const activeFilter = document.querySelector('.post-filters button.active');
        loadPosts(0, activeFilter.textContent.trim().toLowerCase());
    });

    const globalWallContainer = document.querySelector('.global-wall-posts');
    
    if (globalWallContainer) {
        // Event delegation for like button with detailed logging
        globalWallContainer.addEventListener('click', (e) => {
            console.log('Clicked element:', e.target);
            const likeBtn = e.target.closest('.btn-like');
            console.log('Result of closest(".btn-like"):', likeBtn);
            if (likeBtn) {
                const postId = likeBtn.getAttribute('data-post-id');
                alert('Like button clicked for post: ' + postId); // Debugging
                toggleLike({ id: postId, post_id: postId }, likeBtn);
                return;
            }
            // Event delegation for comment send button
            const commentSendBtn = e.target.closest('.comment-send-btn');
            if (commentSendBtn) {
                // Find the parent .social-post
                const postElement = commentSend
                if (!postElement) return;
                // Get the post data
                const post = postElement._postData;
                // Find the input
                const commentInput = postElement.querySelector('.comment-input');
                const commentsList = postElement.querySelector('.comments-list');
                if (!commentInput || !commentsList) return;
                if (!currentUser) {
                    showNotification('Please log in to comment');
                    return;
                }
                const commentText = commentInput.value.trim();
                if (commentText) {
                    addComment(post, commentText, commentsList, postElement).then(() => {
                        commentInput.value = '';
                        // Show the comments section after posting
                        const commentsSection = postElement.querySelector('.comments-section');
                        if (commentsSection) commentsSection.classList.add('show');
                    });
                }
                return;
            }
            // Event delegation for pressing Enter in comment input
            const commentInput = e.target.closest('.comment-input');
            if (commentInput && e.type === 'keypress' && e.key === 'Enter') {
                const postElement = commentInput.closest('.social-post');
                if (!postElement) return;
                const post = postElement._postData;
                const commentsList = postElement.querySelector('.comments-list');
                if (!currentUser) {
                    showNotification('Please log in to comment');
                    return;
                }
                const commentText = commentInput.value.trim();
                if (commentText) {
                    addComment(post, commentText, commentsList, postElement).then(() => {
                        commentInput.value = '';
                        const commentsSection = postElement.querySelector('.comments-section');
                        if (commentsSection) commentsSection.classList.add('show');
                    });
                }
                return;
            }
            const videoElement = e.target.closest('video');
            
            if (videoElement) {
                const allVideos = document.querySelectorAll('video');
                allVideos.forEach(video => {
                    if (video !== videoElement) {
                        video.pause();
                    }
                });

                if (videoElement.paused) {
                    videoElement.play().catch(error => {
                        console.error('Video playback error:', error);
                        videoElement.load();
                    });
                } else {
                    videoElement.pause();
                }
            }
        });
        // Add event delegation for Enter key on comment input
        globalWallContainer.addEventListener('keypress', (e) => {
            if (e.target.classList.contains('comment-input') && e.key === 'Enter') {
                const postElement = e.target.closest('.social-post');
                if (!postElement) return;
                const post = postElement._postData;
                const commentsList = postElement.querySelector('.comments-list');
                if (!currentUser) {
                    showNotification('Please log in to comment');
                    return;
                }
                const commentText = e.target.value.trim();
                if (commentText) {
                    addComment(post, commentText, commentsList, postElement).then(() => {
                        e.target.value = '';
                        const commentsSection = postElement.querySelector('.comments-section');
                        if (commentsSection) commentsSection.classList.add('show');
                    });
                }
            }
        });
    } else {
        // If the container is not found, show a visible error
        const errorDiv = document.createElement('div');
        errorDiv.style.background = '#ffdddd';
        errorDiv.style.color = '#b00020';
        errorDiv.style.padding = '16px';
        errorDiv.style.margin = '16px';
        errorDiv.style.fontWeight = 'bold';
        errorDiv.textContent = 'Error: .global-wall-posts container not found. Like button will not work.';
        document.body.prepend(errorDiv);
    }
});

document.addEventListener('DOMContentLoaded', function () {
    // Sidebar toggle functionality (match settings page)
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    // Load sidebar state from localStorage
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
    }
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    });
});

function attachVideoEventListeners() {
    const videos = document.querySelectorAll('video');
    
    videos.forEach(video => {
        video.removeEventListener('click', videoClickHandler);
        
        // Add new click handler
        video.addEventListener('click', videoClickHandler);
    });
}

function videoClickHandler(e) {
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(v => {
        if (v !== e.currentTarget) {
            v.pause();
        }
    });

    const video = e.currentTarget;
    if (video.paused) {
        video.play().catch(error => {
            console.error('Video play error:', error);
            alert('Unable to play video. Please check file compatibility.');
        });
    } else {
        video.pause();
    }
}

async function loadPosts(offset = 0, filter = 'all post') {
    const globalWallContainer = document.querySelector('.global-wall-posts');
    if (!globalWallContainer) return;

    try {
        // Show loading state
        if (offset === 0) {
            globalWallContainer.innerHTML = '<div class="loading">Loading posts...</div>';
        }

        // Construct API URL with parameters
        const url = new URL('../api/posts/get-post.php', window.location.href);
        url.searchParams.append('offset', offset);
        url.searchParams.append('limit', 10);
        if (filter !== 'all post') {
            url.searchParams.append('platform', filter);
        }

        // Fetch posts from the API
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }

        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
        if (data.status !== 'success' || !data.data.posts) {
            throw new Error('Invalid response format');
        }

        const { posts, pagination } = data.data;
        
        // Clear container only on first load
        if (offset === 0) {
            globalWallContainer.innerHTML = '';
        }

        if (posts.length === 0 && offset === 0) {
            globalWallContainer.innerHTML = '<div class="no-posts">No posts yet. Be the first to post!</div>';
            return;
        }

        posts.forEach(post => {
            // Parse video data if exists
            let videoData = null;
            if (post.videos) {
                console.log('Video data found:', post.videos); // Debug log
                const videoInfos = post.videos.split(',').map(videoStr => {
                    const [url, thumbnail, duration] = videoStr.split(':::');
                    return { url, thumbnail, duration };
                });
                videoData = videoInfos[0]; // Take the first video for now
                console.log('Parsed video data:', videoData); // Debug log
            }

            // Parse image data if exists
            let imageUrls = [];
            if (post.images) {
                console.log('Image data found:', post.images); // Debug log
                imageUrls = post.images.split(',').filter(url => url.trim());
                console.log('Parsed image URLs:', imageUrls); // Debug log
            }

            // Convert the database post format to our display format
            const isShare = post.shared_by !== null;
            const displayPost = {
                id: isShare ? `share-${post.share_id}` : post.post_id,
                post_id: post.post_id,
                share_id: isShare ? post.share_id : null,
                author: isShare ? (post.shared_by_username || "Anonymous") : (post.author_username || "Anonymous"),
                content: post.content,
                timestamp: isShare ? post.shared_at : post.created_at,
                images: imageUrls,
                video: videoData,
                isShare,
                originalAuthor: isShare ? (post.author_username || "Anonymous") : null,
                share_caption: isShare ? (post.share_caption || "") : null,
                shares: post.shares !== undefined && post.shares !== null ? Number(post.shares) : 0,
                likes: post.likes !== undefined && post.likes !== null ? Number(post.likes) : 0,
                target_type: isShare ? post.target_type : null,
                provider: post.provider || post.platform || '',
                profile_image_url: post.profile_image_url
            };
            
            console.log('Display post object:', displayPost); // Debug log
            
            const postElement = createPostElement(displayPost);
            // Attach the post object to the element for later use
            postElement._postData = displayPost;
            globalWallContainer.appendChild(postElement);
        });

        // Attach direct click event to all like buttons after rendering
        document.querySelectorAll('.btn-like').forEach(btn => {
            btn.onclick = function(e) {
                const postElement = btn.closest('.social-post');
                if (postElement && postElement._postData) {
                    toggleLike(postElement._postData, btn);
                } else {
                    // fallback: try to find postId from data attribute and extract numeric part
                    let postId = btn.getAttribute('data-post-id');
                    if (typeof postId === 'string') {
                        // Remove any non-digit prefix (e.g., 'share-84' -> '84')
                        const match = postId.match(/(\d+)$/);
                        if (match) {
                            postId = parseInt(match[1], 10);
                        } else {
                            postId = null;
                        }
                    }
                    if (postId) {
                        toggleLike({ post_id: postId }, btn);
                    } else {
                        showLikeError('Invalid post ID');
                    }
                }
            };
        });

        attachVideoEventListeners();

        // Update comment input placeholders after posts are loaded
        updateCommentInputs();

        // Add load more button if there are more posts
        if (pagination.total > offset + posts.length) {
            const loadMoreContainer = document.createElement('div');
            loadMoreContainer.className = 'load-more-container';
            loadMoreContainer.innerHTML = `
                <button class="load-more-btn">
                    Load More Posts
                </button>
            `;

            const loadMoreBtn = loadMoreContainer.querySelector('.load-more-btn');
            loadMoreBtn.addEventListener('click', () => {
                loadMoreBtn.disabled = true;
                loadMoreBtn.textContent = 'Loading...';
                loadPosts(offset + 10, filter);
                loadMoreContainer.remove();
            });

            globalWallContainer.appendChild(loadMoreContainer);
        }

    } catch (error) {
        console.error('Error loading posts:', error);
        if (offset === 0) {
            globalWallContainer.innerHTML = `
                <div class="error-message">
                    Failed to load posts. Please try again later.
                    <button onclick="loadPosts(0, '${filter}')">Retry</button>
                </div>
            `;
        }
    }
}
// Add styles for new elements
const additionalStyles = `
    .refresh-btn {
        background: #2563eb;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;
        margin-left: auto;
    }

    .refresh-btn:hover {
        background: #1d4ed8;
        transform: scale(1.05);
    }

    .load-more-container {
        display: flex;
        justify-content: center;
        padding: 20px 0;
    }

    .load-more-btn {
        background: #2563eb;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
    }

    .load-more-btn:hover {
        background: #1d4ed8;
        transform: translateY(-2px);
    }

    .load-more-btn:disabled {
        background: #94a3b8;
        cursor: not-allowed;
        transform: none;
    }

    .share-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .share-modal {
        background: white;
        border-radius: 8px;
        padding: 20px;
        max-width: 500px;
        width: 100%;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .close-share-modal {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        position: absolute;
        top: 10px;
        right: 10px;
        color: #333;
    }

    .share-caption {
        width: 100%;
        height: 60px;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 10px;
        font-size: 14px;
        resize: none;
    }

    .share-platforms {
        display: flex;
        flex-direction: row;
        gap: 10px;
        margin-bottom: 10px;
        justify-content: stretch;
        align-items: stretch;
    }
    .share-platforms form {
        display: flex;
        flex-direction: row;
        gap: 10px;
        width: 100%;
    }
    .share-platforms button {
        flex: 1 1 0;
        margin: 0;
        padding: 10px 0;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background 0.3s, color 0.3s;
        width: 100%;
        box-sizing: border-box;
        max-width: 100%;
        background: #e5e7eb;
        color: #9ca3af;
        pointer-events: auto;
        display: block;
        text-align: center;
    }

    .share-platforms button.active-share-btn {
        background: #2563eb !important;
        color: #fff !important;
        cursor: pointer !important;
        border: none !important;
        opacity: 1 !important;
        pointer-events: auto !important;
    }

    .share-platforms button.greyed-out {
        background: #e5e7eb !important;
        color: #9ca3af !important;
        cursor: not-allowed !important;
        border: 1px solid #d1d5db !important;
        opacity: 0.7 !important;
        pointer-events: none !important;
    }

    .share-original-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 10px 0;
    }

    .share-original-header {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .share-original-header img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }

    .share-original-header .share-user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .share-original-header .share-username {
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 2px;
    }

    .share-original-header .share-date {
        font-size: 12px;
        color: #888;
    }

    .share-original-content .share-post-content {
        margin-top: 4px;
        font-size: 15px;
        color: #222;
    }

    .share-original-content .share-media {
        margin-top: 8px;
        width: 100%;
    }

    .share-original-content .share-media img,
    .share-original-content .share-media video {
        max-width: 100%;
        max-height: 220px;
        border-radius: 8px;
        display: block;
        margin: 0 auto;
    }

    .share-main-btn {
        background: #2563eb;
        color: white;
        border: none;
        padding: 12px 0;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        transition: background 0.3s, color 0.3s;
        width: 100%;
        margin-top: 8px;
        margin-bottom: 0;
        box-sizing: border-box;
        display: block;
    }
    .share-main-btn.active-share-btn {
        background: #2563eb !important;
        color: #fff !important;
        opacity: 1 !important;
        cursor: pointer !important;
        border: none !important;
    }
    .share-main-btn.greyed-out {
        background: #e5e7eb !important;
        color: #9ca3af !important;
        cursor: not-allowed !important;
        border: 1px solid #d1d5db !important;
        opacity: 0.7 !important;
        pointer-events: none !important;
    }
`;

document.head.appendChild(document.createElement('style')).textContent = additionalStyles;

function createPostElement(post) {
    // Debug: log the profile image URL being used
    console.log('Rendering post:', post, 'Profile Image URL:', post.profile_image_url);
    // Always use likes from backend
    console.log('Rendering post:', post, 'Likes:', post.likes);
    const likeCount = typeof post.likes !== 'undefined' ? post.likes : 0;
    const commentCount = typeof post.comment_count !== 'undefined' ? post.comment_count : (post.comments ? post.comments.length : 0);

    let mediaHTML = '';
    // Handle images
    if (post.images && post.images.length > 0) {
        mediaHTML += `
            <div class="post-media-gallery ${post.images.length > 1 ? 'multi-image' : 'single-image'}">
                ${post.images.map((imageSrc, index) => `
                    <div class="post-media-item" data-index="${index}">
                        <img 
                            src="${imageSrc}" 
                            alt="Post Image ${index + 1}" 
                            onclick="openImageModal(this)"
                            style="
                                width: 100%; 
                                height: ${post.images.length === 1 ? '400px' : '200px'}; 
                                object-fit: ${post.images.length === 1 ? 'contain' : 'cover'}; 
                                border-radius: 8px; 
                                cursor: pointer;
                            "
                        >
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Handle video
    if (post.video) {
        mediaHTML += `
            <div class="post-media-video">
                <video 
                    src="${post.video.url}" 
                    ${post.video.thumbnail ? `poster="${post.video.thumbnail}"` : ''}
                    controls 
                    style="
                        width: 100%; 
                        max-height: 400px; 
                        object-fit: contain; 
                        border-radius: 8px;
                    "
                    preload="metadata"
                    playsinline
                >
                    Your browser does not support the video tag.
                </video>
                ${post.video.duration ? `
                    <div class="video-duration">${post.video.duration}</div>
                ` : ''}
            </div>
        `;
    }

    // --- Provider tag for OAuth posts (original or shared) ---
    let provider = (post.provider || post.platform || '').trim().toLowerCase();
    console.log('Provider value:', provider, 'for post:', post); // Debug
    let providerTagHTML = '';
    if (provider === 'heybleepi' || provider === 'hershive') {
        providerTagHTML = `
            <span class="platform-oauth-tag" style="
                display:inline-block;
                margin-left:8px;
                background:#e3f0ff;
                color:#2563eb;
                font-size:12px;
                font-weight:500;
                padding:2px 10px;
                border-radius:12px;
                letter-spacing:0.3px;
                vertical-align:middle;
            ">
                • Shared post from ${provider.charAt(0).toUpperCase() + provider.slice(1)}
            </span>
        `;
    }

    // --- Render post header and content ---
    let postHTML = '';
    if (post.isShare) {
        const isReshareOfShare = post.target_type === 'share';
        postHTML = `
            <div class="post-header">
                <div class="post-user-info">
                    <img src="${post.profile_image_url ? post.profile_image_url + '?v=' + Date.now() : '../assets/human.png'}" alt="Profile" class="profile-pic" onerror="this.onerror=null;this.src='../assets/human.png';">
                    <div class="user-details">
                        <h3 class="post-author">${post.author || 'Anonymous'}</h3>
                        <span class="post-timestamp">
                            ${getTimeDifference(post.timestamp)}
                            ${providerTagHTML}
                            <br>
                            <span class="local-time">${convertUTCMySQLToLocal(post.timestamp)}</span>
                        </span>
                    </div>
                </div>
            </div>
            <div class="post-content" style="position:relative;">
                ${post.share_caption ? `<div class="share-caption-text" style="margin-bottom:8px;">${escapeHTML(post.share_caption)}</div>` : ''}
                <div class="shared-post-box${isReshareOfShare ? ' reshared-share-box' : ''}" style="background:${isReshareOfShare ? '#fffbe6' : '#f5f6fa'};border-radius:8px;padding:12px;border:1px solid #e0e0e0;position:relative;">
                    <div style="font-size:13px;color:#555;margin-bottom:4px;">
                        <b>
                            ${isReshareOfShare 
                                ? 'Reshared a shared post' 
                                : 'Shared from ' + (post.originalAuthor || 'Anonymous')}
                        </b>
                    </div>
                    <div class="post-text">${post.content}</div>
                    ${mediaHTML ? `<div class="post-media-container">${mediaHTML}</div>` : ''}
                    ${isReshareOfShare ? `
                        <span class="reshared-label" style="
                            position:absolute;top:8px;right:16px;
                            background:#e9b949;color:#222;
                            font-size:12px;font-weight:bold;
                            padding:2px 10px;border-radius:12px;z-index:2;">
                            Reshared
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    } else {
        postHTML = `
            <div class="post-header">
                <div class="post-user-info">
                    <img src="${post.profile_image_url ? post.profile_image_url + '?v=' + Date.now() : '../assets/human.png'}" alt="Profile" class="profile-pic" onerror="this.onerror=null;this.src='../assets/human.png';">
                    <div class="user-details">
                        <h3 class="post-author">${post.author || 'Anonymous'}</h3>
                        <span class="post-timestamp">
                            ${getTimeDifference(post.timestamp)}
                            ${providerTagHTML}
                            <br>
                            <span class="local-time">${convertUTCMySQLToLocal(post.timestamp)}</span>
                        </span>
                    </div>
                </div>
                <div class="post-options">
                    <button class="post-more-btn">...</button>
                    <div class="post-dropdown-menu">
                        <button class="delete-post-btn" data-post-id="${post.id}">
                            🗑️ Delete Post
                        </button>
                    </div>
                </div>
            </div>
            <div class="post-content" style="position:relative;">
                <div class="post-text">${post.content}</div>
                ${mediaHTML ? `
                    <div class="post-media-container">
                        ${mediaHTML}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // --- Render interactions for ALL posts (shared and original) ---
    postHTML += `
        <div class="post-interactions">
            <div class="interaction-stats">
                <span class="likes-count">
                    <i class="icon-heart">❤️</i> ${likeCount}
                </span>
                <span class="comments-count">
                    <i class="icon-comment">💬</i> ${commentCount}
                </span>
                <span class="shares-count">
                    <i class="icon-share">🔗</i> ${post.shares || 0}
                </span>
            </div>
            <div class="interaction-buttons">
                <button class="btn-like" data-post-id="${post.id}">
                    <i class="icon-heart">❤️</i> Like
                </button>
                ${!post.isShare ? `<button class="btn-comment" data-post-id="${post.id}">
                    <i class="icon-comment">💬</i> Comment
                </button>` : ''}
                <button class="btn-share" data-post-id="${post.id}">
                    <i class="icon-share">🔗</i> Share
                </button>
            </div>
        </div>
    `;

    // Allow commenting on both original and shared posts
    postHTML += `
        <div class="comments-section">
            <div class="comments-list"></div>
            <div class="comments-input-container">
                <img src="../assets/human.png" alt="Profile" class="input-profile-pic">
                <div class="comment-input-wrapper">
                    <input type="text" class="comment-input" placeholder="Write a comment...">
                    ${currentUser ? `<div class="comment-user-indicator">Commenting as ${currentUser.username}</div>` : ''}
                </div>
                <button class="comment-send-btn">Post</button>
            </div>
        </div>
    `;

    // Add image modal functionality
    if (post.images && post.images.length > 0) {
        postHTML += `
            <div id="image-modal" class="image-modal" onclick="closeImageModal()"
                <img class="modal-content" id="modal-image">
                <div id="image-caption"></div>
                ${post.images.length > 1 ? `
                    <a class="prev" onclick="changeImage(-1)">&#10094;</a>
                    <a class="next" onclick="changeImage(1)">&#10095;</a>
                ` : ''}
            </div>
        `;
    }

    // Create the post element
    const postElement = document.createElement('div');
    postElement.className = 'social-post';
    postElement.setAttribute('data-post-id', post.id);

    // Insert the provider tag above the post
    postElement.innerHTML = `
        ${postHTML}
    `;

    const likeBtn = postElement.querySelector('.btn-like');
    const commentBtn = postElement.querySelector('.btn-comment');
    const shareBtn = postElement.querySelector('.btn-share');
    const commentInput = postElement.querySelector('.comment-input');
    const commentSendBtn = postElement.querySelector('.comment-send-btn');
    const commentsList = postElement.querySelector('.comments-list');

    if (likeBtn) {
        console.log('Attaching like event for post:', post.id);
        likeBtn.addEventListener('click', () => {
            console.log('Like button clicked for post:', post.id);
            toggleLike(post, likeBtn);
        });
    } else {
        console.warn('Like button NOT FOUND for post:', post.id);
    }

    // Automatically load comments for each post (original and shared)
    if (!post.isShare) {
        loadComments(post.post_id || post.id, commentsList, postElement, false);
    } else if (post.isShare && post.share_id) {
        loadComments(post.share_id, commentsList, postElement, true);
    }

    // Comment button functionality
    if (commentBtn) {
        commentBtn.addEventListener('click', () => {
            // Check if user is logged in
            if (!currentUser) {
                showNotification('Please log in to comment');
                return;
            }
            // Only load comments for original posts
            if (!post.isShare) {
                // Always use post.post_id for API
                const postId = post.post_id || post.id;
                console.log('[commentBtn] Loading comments for postId:', postId);
                loadComments(postId, commentsList, postElement, post.isShare);
                commentInput && commentInput.focus();
                // Always show the comments section when comment button is clicked
                const commentsSection = postElement.querySelector('.comments-section');
                if (commentsSection) commentsSection.classList.add('show');
            }
        });
    }

    // Share button functionality
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            openShareModal(post);
        });
    }

    // Add event listener for delete button
    const deleteBtn = postElement.querySelector('.delete-post-btn');
    const moreBtn = postElement.querySelector('.post-more-btn');
    
    if (moreBtn) {
        moreBtn.addEventListener('click', (e) => {
            const dropdownMenu = e.currentTarget.nextElementSibling;
            dropdownMenu.classList.toggle('show');
            
            // Close dropdown when clicking outside
            const closeDropdown = (event) => {
                if (!dropdownMenu.contains(event.target) && event.target !== moreBtn) {
                    dropdownMenu.classList.remove('show');
                    document.removeEventListener('click', closeDropdown);
                }
            };
            
            document.addEventListener('click', closeDropdown);
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            const postId = e.currentTarget.dataset.postId;
            deletePost(parseInt(postId));
        });
    }

    return postElement;
}

function parsePostContent(content) {
    // Initialize result object
    const result = {
        text: escapeHTML(content || ''),
        media: null
    };

    // Check for images
    const imageMediaHTML = post.images && post.images.length > 0 
        ? post.images.map(imageSrc => `
            <img src="${imageSrc}" alt="Post Image" style="max-width: 100%; max-height: 300px; object-fit: cover;">
        `).join('')
        : null;

    // Check for video
    const videoMediaHTML = post.video 
        ? `<video src="${post.video}" controls style="max-width: 100%; max-height: 300px;"></video>`
        : null;

    // Combine media
    result.media = imageMediaHTML || videoMediaHTML;

    return result;
}

function convertUTCMySQLToLocal(dateString) {
    // Parse the MySQL UTC datetime string
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);

    // Create a Date object in UTC
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    // Convert to local time string (e.g., "Jun 13, 2025, 2:17 AM")
    return utcDate.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function parseMySQLDateToUTC(dateString) {
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

function getTimeDifference(date) {
    const now = new Date();
    const postDate = parseMySQLDateToUTC(date);
    const diff = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diff < 60) {
        return 'Just now';
    } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diff < 604800) {
        const days = Math.floor(diff / 86400);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (diff < 2592000) {
        const weeks = Math.floor(diff / 604800);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return postDate.toLocaleDateString(undefined, options);
    }
}

function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Add event listener to update posts when a new post is added
window.addEventListener('storage', (event) => {
    if (event.key === 'devhive_posts') {
        loadPosts();
    }
});

// Add a function to help debug local storage
function debugLocalStorage() {
    console.log('Local Storage Debug:');
    console.log('Uploaded Images:', JSON.parse(localStorage.getItem('devhive_uploaded_images') || '{}'));
    console.log('Uploaded Videos:', JSON.parse(localStorage.getItem('devhive_uploaded_videos') || '{}'));
    console.log('DevHive Posts:', JSON.parse(localStorage.getItem('devhive_posts') || '[]'));
}

// Function to delete a post
async function deletePost(postId) {
    try {
        // Send delete request to backend
        const response = await fetch('/../api/posts/delete-post.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_id: postId })
        });
        const result = await response.json();
        if (result.status === 'success') {
            // Remove the post element from the DOM
            const postElement = document.querySelector(`.social-post[data-post-id="${postId}"]`);
            if (postElement) {
                postElement.remove();
            }
            showNotification('Post deleted successfully');
        } else {
            showNotification(result.message || 'Failed to delete post');
        }
    } catch (error) {
        showNotification('Error deleting post');
    }
}

// Add a notification function if not already present
function showNotification(message) {
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

// Attach video event listeners on initial page load
document.addEventListener('DOMContentLoaded', () => {
    attachVideoEventListeners();
});

// Add preview modal functionality
function createPreviewModal(post) {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'preview-modal-container';

    // Prepare media HTML
    let mediaHTML = '';

    // Handle images from mediaData
    if (post.mediaData && post.mediaData.images && post.mediaData.images.length > 0) {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'preview-media-container';
        
        post.mediaData.images.forEach((image, index) => {
            const imgElement = document.createElement('img');
            imgElement.src = image.data;
            imgElement.alt = `Uploaded Image ${index + 1}`;
            imgElement.title = image.key;
            imgElement.style.maxWidth = '100%';
            imgElement.style.maxHeight = '400px';
            imgElement.style.objectFit = 'contain';
            imageContainer.appendChild(imgElement);
        });
        
        mediaHTML += imageContainer.outerHTML;
    }

    // Handle videos from mediaData
    if (post.mediaData && post.mediaData.videos && post.mediaData.videos.length > 0) {
        const videoContainer = document.createElement('div');
        videoContainer.className = 'preview-media-container';
        
        post.mediaData.videos.forEach((video, index) => {
            const videoElement = document.createElement('video');
            videoElement.src = video.data;
            videoElement.controls = true;
            videoElement.style.maxWidth = '100%';
            videoElement.style.maxHeight = '400px';
            videoElement.style.objectFit = 'contain';
            videoElement.poster = '../assets/video-placeholder.png';
            
            const sourceElement = document.createElement('source');
            sourceElement.src = video.data;
            sourceElement.type = 'video/mp4';
            
            videoElement.appendChild(sourceElement);
            videoContainer.appendChild(videoElement);
        });
        
        mediaHTML += videoContainer.outerHTML;
    }

    // Fallback to parsing content if no mediaData
    if (!mediaHTML) {
        const parsedContent = parsePostContent(post.content);
        mediaHTML = parsedContent.media || '';
    }

    modalContainer.innerHTML = `
        <div class="preview-modal">
            <div class="preview-modal-header">
                <h2 class="preview-modal-title">${escapeHTML(post.title || 'Untitled Post')}</h2>
                <button class="preview-modal-close">×</button>
            </div>
            <div class="preview-modal-body">
                <div class="preview-user-info">
                    <img src="../assets/human.png" alt="Profile" class="preview-profile-pic">
                    <div class="preview-user-details">
                        <h3 class="preview-author">${escapeHTML(post.author || 'Anonymous')}</h3>
                        <span class="preview-timestamp">${getTimeDifference(new Date(post.timestamp))}</span>
                    </div>
                </div>
                
                <div class="preview-post-content">
                    <p class="preview-text">${escapeHTML(post.content)}</p>
                    
                    ${mediaHTML ? `
                        <div class="preview-media-container">
                            ${mediaHTML}
                        </div>
                    ` : ''}
                </div>
                
                <div class="preview-platforms">
                    <h4>Shared Platforms:</h4>
                    <div class="platform-list">
                        ${(post.platforms || []).map(platform => `
                            <span class="platform-tag">${escapeHTML(platform)}</span>
                        `).join('') || 'No platforms selected'}
                    </div>
                </div>
            </div>
            <div class="preview-modal-footer">
                <button class="preview-edit-btn">Edit Post</button>
                <button class="preview-share-btn">Share Post</button>
            </div>
        </div>
    `;

    // Add to body
    document.body.appendChild(modalContainer);

    // Close modal functionality
    const closeBtn = modalContainer.querySelector('.preview-modal-close');
    const editBtn = modalContainer.querySelector('.preview-edit-btn');
    const shareBtn = modalContainer.querySelector('.preview-share-btn');

    // Close modal when clicking close button or outside modal
    closeBtn.addEventListener('click', () => {
        modalContainer.remove();
    });

    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            modalContainer.remove();
        }
    });

    // Edit post functionality (placeholder)
    editBtn.addEventListener('click', () => {
        // TODO: Implement edit post functionality
        alert('Edit post functionality coming soon!');
    });

    // Share post functionality
    shareBtn.addEventListener('click', () => {
        sharePost(post, shareBtn);
        modalContainer.remove();
    });

    return modalContainer;
}

// Function to toggle like
function toggleLike(post, likeBtn) {
    // Always ensure post_id is a number
    let postId = post.post_id;
    if (typeof postId === 'string') {
        const match = postId.match(/(\d+)$/);
        if (match) {
            postId = parseInt(match[1], 10);
        } else {
            showLikeError('Invalid post ID');
            return;
        }
    }
    // Retrieve user ID from localStorage
    const userId = localStorage.getItem('user_id');
    
    console.log('Attempting to like post:', post);
    console.log('Current localStorage user_id:', userId);

    if (!userId) {
        console.error('No user_id found in localStorage');
        showLikeError('User not logged in. Please log in first.');
        return;
    }

    const payload = {
        post_id: postId,
        user_id: userId,
        reaction_type: 'like'
    };

    console.log('Like Payload:', payload);

    fetch('../api/posts/add-reaction.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Like Response:', data);
        if (data.status === 'success') {
            // Update like button UI
            likeBtn.classList.toggle('liked');
            // Update like count
            // Find the correct likes-count element for this post
            const postElement = likeBtn.closest('.social-post');
            const likesCountEl = postElement ? postElement.querySelector('.likes-count') : null;
            if (likesCountEl) {
                likesCountEl.innerHTML = `<i class="icon-heart">❤️</i> ${data.data.reaction_count}`;
            }
        } else {
            console.error('Like Error:', data.message);
            showLikeError(data.message || 'Failed to like post');
        }
    })
    .catch(error => {
        console.error('Like Error:', error);
        showLikeError('Network error occurred. Please try again.');
    });
}

function showLikeError(message) {
    let errorDiv = document.getElementById('like-error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'like-error-message';
        errorDiv.style.background = '#ffdddd';
        errorDiv.style.color = '#b00020';
        errorDiv.style.padding = '12px';
        errorDiv.style.margin = '12px';
        errorDiv.style.fontWeight = 'bold';
        errorDiv.style.zIndex = '9999';
        document.body.prepend(errorDiv);
    }
    errorDiv.textContent = 'Like Error: ' + message;
    setTimeout(() => { errorDiv.remove(); }, 5000);
}

// Function to load comments for a post
async function loadComments(id, commentsList, postElement, isShare = false) {
    try {
        const param = isShare ? 'share_id' : 'post_id';
        const response = await fetch(`../api/posts/get-comments.php?${param}=${id}&limit=10`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.status === 'success') {
            commentsList.innerHTML = '';
            result.data.comments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                const authorName = (currentUser && comment.user_id == currentUser.user_id)
                    ? 'You'
                    : escapeHTML(comment.username);
                let deleteBtnHTML = '';
                if (currentUser && comment.user_id == currentUser.user_id) {
                    deleteBtnHTML = `<button class="comment-delete-btn" data-comment-id="${comment.comment_id}">🗑️</button>`;
                }
                commentElement.innerHTML = `
                    <img src="${comment.profile_image_url}" alt="Profile" class="comment-profile-pic">
                    <div class="comment-content">
                        <span class="comment-author">${authorName}</span>
                        <p class="comment-text">${escapeHTML(comment.content)}</p>
                        <span class="comment-time">${comment.formatted_time}</span>
                        ${deleteBtnHTML}
                    </div>
                `;
                // Add delete handler if button exists
                if (deleteBtnHTML) {
                    const btn = commentElement.querySelector('.comment-delete-btn');
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (!confirm('Delete this comment?')) return;
                        const formData = new FormData();
                        formData.append('comment_id', comment.comment_id);
                        try {
                            const resp = await fetch('../api/posts/delete-comment.php', {
                                method: 'POST',
                                body: formData,
                                credentials: 'include'
                            });
                            const res = await resp.json();
                            if (res.status === 'success') {
                                showNotification('Comment deleted.');
                                // Reload comments
                                const id = isShare ? postElement._postData.share_id : (postElement._postData.post_id || postElement._postData.id);
                                await loadComments(id, commentsList, postElement, isShare);
                            } else {
                                showNotification(res.message || 'Failed to delete comment.');
                            }
                        } catch (err) {
                            showNotification('Error deleting comment.');
                        }
                    });
                }
                commentsList.appendChild(commentElement);
            });
            // Update comment count
            if (!postElement) postElement = commentsList.closest('.social-post');
            if (postElement) {
                const commentsCountElement = postElement.querySelector('.comments-count');
                if (commentsCountElement) {
                    commentsCountElement.innerHTML = `<i class="icon-comment">💬</i> ${result.data.total}`;
                }
            }
            // Show the comments section
            const commentsSection = commentsList.closest('.comments-section');
            if (commentsSection) commentsSection.classList.add('show');
        } else {
            showNotification('Failed to load comments: ' + result.message);
        }
    } catch (error) {
        showNotification('Error loading comments. Please try again.');
        console.error('[loadComments] Error:', error);
    }
}

async function addComment(post, commentText, commentsList, postElement) {
    try {
        if (!currentUser) {
            showNotification('Please log in to comment');
            return;
        }
        // Use post_id for originals, share_id for shared posts
        const formData = new FormData();
        if (post.isShare && post.share_id) {
            formData.append('share_id', post.share_id);
        } else {
            formData.append('post_id', post.post_id || post.id);
        }
        formData.append('content', commentText);
        // Always include token if available (use the correct key)
        const token = localStorage.getItem('user_token') || localStorage.getItem('token') || localStorage.getItem('oauth_token');
        if (token) formData.append('token', token);
        const response = await fetch('../api/posts/add-comment.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        if (!response.ok) {
            if (response.status === 401) {
                showNotification('Please log in to comment');
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.status === 'success') {
            // Reload comments and update count
            const id = post.isShare && post.share_id ? post.share_id : (post.post_id || post.id);
            await loadComments(id, commentsList, postElement, post.isShare);
            const commentsSection = commentsList.closest('.comments-section');
            if (commentsSection) commentsSection.classList.add('show');
            showNotification('Comment added successfully!');
        } else {
            showNotification('Failed to add comment: ' + result.message);
        }
    } catch (error) {
        showNotification('Error adding comment. Please try again.');
        console.error('[addComment] Error:', error);
    }
}

async function sharePostToBackend(payload) {
    try {
        console.log('Sharing post:', payload);
        const response = await fetch('../api/posts/share.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (e) {
        return null;
    }
}

function sharePost(post, shareBtn) {
    let posts = JSON.parse(localStorage.getItem('devhive_posts') || '[]');
    const postIndex = posts.findIndex(p => p.id === post.id);  
    if (postIndex !== -1) {
        if (!posts[postIndex].shares) {
            posts[postIndex].shares = 0;
        }
        posts[postIndex].shares += 1;     
        localStorage.setItem('devhive_posts', JSON.stringify(posts));     
        const shareCountElement = document.querySelector(
            `.social-post[data-post-id="${post.id}"] .shares-count`
        );      
        if (shareCountElement) {
            shareCountElement.innerHTML = `
                <i class="icon-share">🔗</i> ${posts[postIndex].shares}
            `;
        }      
        copyPostLink(post);
    }
}

function copyPostLink(post) {
    const postLink = `${window.location.origin}/post/${post.id}`;
    const tempInput = document.createElement('textarea');
    tempInput.value = postLink;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    showNotification('Post link copied to clipboard');
}

function openShareModal(post) {
    const modal = document.getElementById('share-modal-overlay');
    modal.style.display = 'flex';
  
    // Ensure currentUser is loaded before updating buttons
    if (!currentUser) {
        getCurrentUser().then(() => {
            updateShareButtonsByProvider();
        });
    } else {
        updateShareButtonsByProvider();
    }

    // Set the post_id as a data attribute for later retrieval -changes/
    modal.setAttribute('data-current-post-id', post.post_id || post.id);

    // Render post preview
    const preview = modal.querySelector('.share-original-content');
    let mediaHTML = '';

    // Images
    if (post.images && post.images.length > 0) {
        mediaHTML += `<div class="share-media">` +
            post.images.map(img => `<img src="${img}" alt="Post Image">`).join('') +
            `</div>`;
    }
    // Video
    if (post.video && post.video.url) {
        mediaHTML += `
            <div class="share-media">
                <video src="${post.video.url}" controls poster="${post.video.thumbnail || ''}"></video>
            </div>
        `;
    }

    preview.innerHTML = `
    <div class="share-original-header">
        <img src="../assets/human.png" alt="Profile">
        <div class="share-user-info">
            <span class="share-username">${post.author || 'Anonymous'}</span>
            <span class="share-date">${convertUTCMySQLToLocal(post.timestamp)}</span>
        </div>
    </div>
    <div class="share-post-content">${escapeHTML(post.content)}</div>
    ${mediaHTML}
    `;

    const closeBtn = modal.querySelector('.close-share-modal');
    closeBtn.onclick = null;
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    const shareBtn = modal.querySelector('.share-main-btn');
    // Remove previous event listeners by replacing the button with a clone
    const newShareBtn = shareBtn.cloneNode(true);
    shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);

    newShareBtn.addEventListener('click', async () => {
        const post_id = modal.getAttribute('data-current-post-id');
        const caption = modal.querySelector('.share-caption').value.trim();

        // Get user_id from currentUser
        if (!currentUser || !currentUser.user_id) {
            showNotification('You must be logged in to share.');
            return;
        }

        // Prepare payload for internal share
        const payload = {
            post_id: Number(post_id),
            user_id: Number(currentUser.user_id),
            platform: 'devhive',
            caption: caption
        };

        // If this is a reshare of a shared post, add share_id
        if (post.isShare && post.share_id) {
            payload.share_id = Number(post.share_id);
        }

        try {
            const response = await fetch('/api/posts/share.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
            const result = await response.json();
            console.log('Share to Devhive result:', result);
            if (result.status === 'success') {
                showNotification('Post shared to Devhive!');
                modal.style.display = 'none';
                loadPosts(0, 'all post'); // Reload posts
            } else {
                showNotification(result.message || 'Failed to share post.');
            }
        } catch (e) {
            showNotification('Failed to share post.');
        }
    });
}

document.querySelectorAll('.share-btn-heybleepi, .share-btn-hershive').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const modal = document.getElementById('share-modal-overlay');
    const post_id = modal.getAttribute('data-current-post-id');
    const form = btn.closest('form');
    form.querySelector('input[name="share_post_id"]').value = post_id;
    // Use the textarea value as content
    const captionInput = modal.querySelector('.share-caption');
    form.querySelector('input[name="content"]').value = captionInput ? captionInput.value : '';
    // Set the provider
    if (btn.classList.contains('share-btn-hershive')) {
      form.querySelector('input[name="share_to_other"]').value = 'hershive';
    } else if (btn.classList.contains('share-btn-heybleepi')) {
      form.querySelector('input[name="share_to_other"]').value = 'heybleepi';
    }
    form.submit();
  });
});

function updateShareButtonsByProvider() {
    const btnHershive = document.querySelector('.share-btn-hershive');
    const btnHeybleepi = document.querySelector('.share-btn-heybleepi');
    const btnDevhive = document.querySelector('.share-main-btn');

    console.log('updateShareButtonsByProvider: currentUser =', currentUser);

    if (!btnHershive || !btnHeybleepi || !btnDevhive) {
        console.warn('Share buttons not found!');
        return;
    }

    // Always show all buttons
    btnHershive.style.display = '';
    btnHeybleepi.style.display = '';
    btnDevhive.style.display = '';

    // Remove all disabled/active styles first
    [btnHershive, btnHeybleepi, btnDevhive].forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('greyed-out');
        btn.classList.remove('active-share-btn');
    });

    if (currentUser && currentUser.provider === 'hershive') {
        btnHershive.disabled = false;
        btnHershive.classList.add('active-share-btn');
        btnHeybleepi.disabled = true;
        btnHeybleepi.classList.add('greyed-out');
        btnDevhive.disabled = false;
        btnDevhive.classList.add('active-share-btn');
    } else if (currentUser && currentUser.provider === 'heybleepi') {
        btnHeybleepi.disabled = false;
        btnHeybleepi.classList.add('active-share-btn');
        btnHershive.disabled = true;
        btnHershive.classList.add('greyed-out');
        btnDevhive.disabled = false;
        btnDevhive.classList.add('active-share-btn');
    } else if (currentUser && currentUser.provider === 'devhive') {
        btnDevhive.disabled = false;
        btnDevhive.classList.add('active-share-btn');
        btnHershive.disabled = true;
        btnHershive.classList.add('greyed-out');
        btnHeybleepi.disabled = true;
        btnHeybleepi.classList.add('greyed-out');
    } else {
        btnDevhive.disabled = false;
        btnDevhive.classList.add('active-share-btn');
        btnHershive.disabled = true;
        btnHershive.classList.add('greyed-out');
        btnHeybleepi.disabled = true;
        btnHeybleepi.classList.add('greyed-out');
    }
}

// Prevent click on greyed-out buttons
document.querySelectorAll('.share-btn-hershive, .share-btn-heybleepi').forEach(btn => {
    btn.addEventListener('click', function(e) {
        if (btn.disabled) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        // ...existing submit logic...
    });
});

console.log('CurrentUser after login:', currentUser);

document.addEventListener('DOMContentLoaded', function () {
    // Sync share-caption textarea to hidden input in the form
    const modal = document.getElementById('share-modal-overlay');
    const captionTextarea = modal.querySelector('.share-caption');
    const shareForm = modal.querySelector('#share-form');
    const captionHiddenInput = shareForm.querySelector('input[name="caption"]');
    if (captionTextarea && captionHiddenInput) {
        captionTextarea.addEventListener('input', function () {
            captionHiddenInput.value = captionTextarea.value;
        });
    }
});
