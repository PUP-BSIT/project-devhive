console.log("globalfeed20.js loaded");
document.addEventListener('click', function(e) {
    console.log('Global click detected:', e.target);
    const likeBtn = e.target.closest('.btn-like');
    console.log('Result of closest(".btn-like"):', likeBtn);
    if (likeBtn) {
        const postId = likeBtn.getAttribute('data-post-id');
        alert('Like button clicked for post: ' + postId);
        toggleLike({ id: postId, post_id: postId }, likeBtn);
        return;
    }
});

let currentUser = null;

async function getCurrentUser() {
    try {
        const response = await fetch('../api/users/get-session-user.php');
        const result = await response.json();
        
        if (result.success) {
            currentUser = {
                user_id: result.user_id,
                username: result.username
            };
            console.log('Current user:', currentUser);

            updateCommentInputs();

            showNotification(`Welcome back, ${currentUser.username}!`);
        } else {
            console.log('User not logged in');
        }
    } catch (error) {
        console.error('Error getting current user:', error);
    }
}

function updateCommentInputs() {
    const commentInputs = document.querySelectorAll('.comment-input');
    commentInputs.forEach(input => {
        if (currentUser) {
            input.placeholder = `Write a comment as ${currentUser.username}...`;
        } else {
            input.placeholder = 'Write a comment...';
        }
    
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

    loadPosts(0, 'all post');

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
        globalWallContainer.addEventListener('click', (e) => {
            console.log('Clicked element:', e.target);
            const likeBtn = e.target.closest('.btn-like');
            console.log('Result of closest(".btn-like"):', likeBtn);
            if (likeBtn) {
                const postId = likeBtn.getAttribute('data-post-id');
                alert('Like button clicked for post: ' + postId); 
                toggleLike({ id: postId, post_id: postId }, likeBtn);
                return;
            }
            const commentSendBtn = e.target.closest('.comment-send-btn');
            if (commentSendBtn) {
                const postElement = commentSendBtn.closest('.social-post');
                if (!postElement) return;
                const post = postElement._postData;
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
                        const commentsSection = postElement.querySelector('.comments-section');
                        if (commentsSection) commentsSection.classList.add('show');
                    });
                }
                return;
            }
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
        if (offset === 0) {
            globalWallContainer.innerHTML = '<div class="loading">Loading posts...</div>';
        }

        const url = new URL('../api/posts/get-post.php', window.location.href);
        url.searchParams.append('offset', offset);
        url.searchParams.append('limit', 10);
        if (filter !== 'all post') {
            url.searchParams.append('platform', filter);
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.status !== 'success' || !data.data.posts) {
            throw new Error('Invalid response format');
        }

        const { posts, pagination } = data.data;
        
        if (offset === 0) {
            globalWallContainer.innerHTML = '';
        }

        if (posts.length === 0 && offset === 0) {
            globalWallContainer.innerHTML = '<div class="no-posts">No posts yet. Be the first to post!</div>';
            return;
        }

        posts.forEach(post => {
            let videoData = null;
            if (post.videos) {
                console.log('Video data found:', post.videos); 
                const videoInfos = post.videos.split(',').map(videoStr => {
                    const [url, thumbnail, duration] = videoStr.split(':::');
                    return { url, thumbnail, duration };
                });
                videoData = videoInfos[0]; 
                console.log('Parsed video data:', videoData); 
            }

            let imageUrls = [];
            if (post.images) {
                console.log('Image data found:', post.images); 
                imageUrls = post.images.split(',').filter(url => url.trim());
                console.log('Parsed image URLs:', imageUrls); 
            }

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
                provider: post.provider || post.platform || ''
            };
            
            console.log('Display post object:', displayPost);
            
            const postElement = createPostElement(displayPost);
            postElement._postData = displayPost;
            globalWallContainer.appendChild(postElement);
        });

        document.querySelectorAll('.btn-like').forEach(btn => {
            btn.onclick = function(e) {
                const postElement = btn.closest('.social-post');
                if (postElement && postElement._postData) {
                    toggleLike(postElement._postData, btn);
                } else {
                    let postId = btn.getAttribute('data-post-id');
                    if (typeof postId === 'string') {
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

        updateCommentInputs();

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
        justify-content: space-between;
        margin-bottom: 10px;
    }

    .share-platforms button {
        flex: 1;
        margin: 0 5px;
        padding: 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.3s;
    }

    .share-platforms button:hover {
        background: #e0e0e0;
    }

    .share-main-btn {
        background: #2563eb;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        transition: background 0.3s;
        width: 100%;
    }

    .share-main-btn:hover {
        background: #1d4ed8;
    }
`;

document.head.appendChild(document.createElement('style')).textContent = additionalStyles;

function createPostElement(post) {
    console.log('Rendering post:', post, 'Likes:', post.likes);
    const likeCount = typeof post.likes !== 'undefined' ? post.likes : 0;
    const commentCount = typeof post.comment_count !== 'undefined' ? post.comment_count : (post.comments ? post.comments.length : 0);

    let mediaHTML = '';
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

    let provider = post.provider || post.platform || '';
    let providerTagHTML = '';
    if (provider === 'heybleepi' || provider === 'hershive') {
        providerTagHTML = `
            <span class="platform-oauth-tag" style="
                display:inline-block;
                margin-top:2px;
                background:#e3f0ff;
                color:#2563eb;
                font-size:12px;
                font-weight:500;
                padding:2px 10px;
                border-radius:12px;
                letter-spacing:0.3px;
            ">
                Shared post from ${provider.charAt(0).toUpperCase() + provider.slice(1)}
            </span>
        `;
    }

    let postHTML = '';
    if (post.isShare) {
        const isReshareOfShare = post.target_type === 'share';
        postHTML = `
            <div class="post-header">
                <div class="post-user-info">
                    <img src="../assets/human.png" alt="Profile" class="profile-pic">
                    <div class="user-details">
                        <h3 class="post-author">${post.author || 'Anonymous'}</h3>
                        <span class="post-timestamp">
                            ${getTimeDifference(post.timestamp)}
                            ${provider === 'heybleepi' || provider === 'hershive' ? `
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
                            ` : ''}
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
                    <img src="../assets/human.png" alt="Profile" class="profile-pic">
                    <div class="user-details">
                        <h3 class="post-author">${post.author || 'Anonymous'}</h3>
                        <span class="post-timestamp">
                            ${getTimeDifference(post.timestamp)}
                            ${provider === 'heybleepi' || provider === 'hershive' ? `
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
                            ` : ''}
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

    const postElement = document.createElement('div');
    postElement.className = 'social-post';
    postElement.setAttribute('data-post-id', post.id);

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

    if (!post.isShare) {
        loadComments(post.post_id || post.id, commentsList, postElement, false);
    } else if (post.isShare && post.share_id) {
        loadComments(post.share_id, commentsList, postElement, true);
    }

    if (commentBtn) {
        commentBtn.addEventListener('click', () => {
            if (!currentUser) {
                showNotification('Please log in to comment');
                return;
            }
            if (!post.isShare) {
                const postId = post.post_id || post.id;
                console.log('[commentBtn] Loading comments for postId:', postId);
                loadComments(postId, commentsList, postElement, post.isShare);
                commentInput && commentInput.focus();
                const commentsSection = postElement.querySelector('.comments-section');
                if (commentsSection) commentsSection.classList.add('show');
            }
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            openShareModal(post);
        });
    }

    const deleteBtn = postElement.querySelector('.delete-post-btn');
    const moreBtn = postElement.querySelector('.post-more-btn');
    
    if (moreBtn) {
        moreBtn.addEventListener('click', (e) => {
            const dropdownMenu = e.currentTarget.nextElementSibling;
            dropdownMenu.classList.toggle('show');
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
    const result = {
        text: escapeHTML(content || ''),
        media: null
    };

    const imageMediaHTML = post.images && post.images.length > 0 
        ? post.images.map(imageSrc => `
            <img src="${imageSrc}" alt="Post Image" style="max-width: 100%; max-height: 300px; object-fit: cover;">
        `).join('')
        : null;

    const videoMediaHTML = post.video 
        ? `<video src="${post.video}" controls style="max-width: 100%; max-height: 300px;"></video>`
        : null;

    result.media = imageMediaHTML || videoMediaHTML;

    return result;
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

window.addEventListener('storage', (event) => {
    if (event.key === 'devhive_posts') {
        loadPosts();
    }
});

function debugLocalStorage() {
    console.log('Local Storage Debug:');
    console.log('Uploaded Images:', JSON.parse(localStorage.getItem('devhive_uploaded_images') || '{}'));
    console.log('Uploaded Videos:', JSON.parse(localStorage.getItem('devhive_uploaded_videos') || '{}'));
    console.log('DevHive Posts:', JSON.parse(localStorage.getItem('devhive_posts') || '[]'));
}

function deletePost(postId) {
    let posts = JSON.parse(localStorage.getItem('devhive_posts') || '[]');
    
    const postIndex = posts.findIndex(post => post.id === postId);
    
    if (postIndex !== -1) {
        posts.splice(postIndex, 1);

        localStorage.setItem('devhive_posts', JSON.stringify(posts));
        const postElement = document.querySelector(`.social-post[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.remove();
        }

        showNotification('Post deleted successfully');
    } else {
        showNotification('Post not found');
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    attachVideoEventListeners();
});

function createPreviewModal(post) {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'preview-modal-container';

    let mediaHTML = '';

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

    document.body.appendChild(modalContainer);

    const closeBtn = modalContainer.querySelector('.preview-modal-close');
    const editBtn = modalContainer.querySelector('.preview-edit-btn');
    const shareBtn = modalContainer.querySelector('.preview-share-btn');

    closeBtn.addEventListener('click', () => {
        modalContainer.remove();
    });

    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            modalContainer.remove();
        }
    });

    editBtn.addEventListener('click', () => {
        // TODO: Implement edit post functionality
        alert('Edit post functionality coming soon!');
    });

    shareBtn.addEventListener('click', () => {
        sharePost(post, shareBtn);
        modalContainer.remove();
    });

    return modalContainer;
}

function toggleLike(post, likeBtn) {
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
            likeBtn.classList.toggle('liked');
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
                commentElement.innerHTML = `
                    <img src="${comment.profile_picture}" alt="Profile" class="comment-profile-pic">
                    <div class="comment-content">
                        <span class="comment-author">${authorName}</span>
                        <p class="comment-text">${escapeHTML(comment.content)}</p>
                        <span class="comment-time">${comment.formatted_time}</span>
                    </div>
                `;
                commentsList.appendChild(commentElement);
            });
            if (!postElement) postElement = commentsList.closest('.social-post');
            if (postElement) {
                const commentsCountElement = postElement.querySelector('.comments-count');
                if (commentsCountElement) {
                    commentsCountElement.innerHTML = `<i class="icon-comment">💬</i> ${result.data.total}`;
                }
            }
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
        const formData = new FormData();
        if (post.isShare && post.share_id) {
            formData.append('share_id', post.share_id);
        } else {
            formData.append('post_id', post.post_id || post.id);
        }
        formData.append('content', commentText);
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

    modal.setAttribute('data-current-post-id', post.post_id || post.id);

    // Render post preview
    const preview = modal.querySelector('.share-original-content');
    let mediaHTML = '';

    // Images
    if (post.images && post.images.length > 0) {
        mediaHTML += `<div class="post-media-gallery">` +
            post.images.map(img => `<img src="${img}" alt="Post Image">`).join('') +
            `</div>`;
    }
    // Video
    if (post.video && post.video.url) {
        mediaHTML += `
            <div class="post-media-video">
                <video src="${post.video.url}" controls poster="${post.video.thumbnail || ''}"></video>
            </div>
        `;
    }

    preview.innerHTML = `
    <div class="post-header">
        <img src="../assets/human.png" alt="Profile" class="profile-pic">
        <div>
            <strong>${post.author || 'Anonymous'}</strong>
            <div style="font-size:12px;color:#888;">${convertUTCMySQLToLocal(post.timestamp)}</div>
        </div>
    </div>
    <div class="post-content">${escapeHTML(post.content)}</div>
    ${mediaHTML}
    `;

    const closeBtn = modal.querySelector('.close-share-modal');
    closeBtn.onclick = null;
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    const shareBtn = modal.querySelector('.share-main-btn');
    const newShareBtn = shareBtn.cloneNode(true);
    shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);

    newShareBtn.addEventListener('click', async () => {
        const user_id = Number(localStorage.getItem('user_id')) || 1;
        const caption = modal.querySelector('.share-caption').value.trim();
        const isReshare = post.isShare && post.share_id && !isNaN(Number(post.share_id));
        const postIdToShare = post.post_id;
        const shareIdToShare = isReshare ? Number(post.share_id) : undefined;

        const payload = {
            post_id: postIdToShare,
            user_id: user_id,
            platform: 'devhive',
            caption: caption
        };
        if (shareIdToShare) {
            payload.share_id = shareIdToShare;
        }

        const response = await sharePostToBackend(payload);
        if (response && response.status === 'success') {
            alert('shared successfully.');
            loadPosts(0, 'all post');
        } else {
            alert('Failed to share post.');
        }
        modal.style.display = 'none';
    });
}

var btn = document.createElement('button');
btn.innerText = 'Test Like';
btn.className = 'btn-like';
btn.setAttribute('data-post-id', 'test');
btn.onclick = function() { alert('Test Like Clicked!'); };
document.body.appendChild(btn);

document.querySelectorAll('.share-btn-heybleepi, .share-btn-hershive').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const modal = document.getElementById('share-modal-overlay');
    const post_id = modal.getAttribute('data-current-post-id');
    const form = btn.closest('form');
    form.querySelector('input[name="share_post_id"]').value = post_id;
    const caption = modal.querySelector('.share-caption').value;
    form.querySelector('textarea[name="caption"]').value = caption;
  });
});