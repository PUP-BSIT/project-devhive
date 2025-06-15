document.addEventListener('DOMContentLoaded', () => {
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
        globalWallContainer.addEventListener('click', (e) => {
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
            console.log('Processing post:', post); // Debug log

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
            const displayPost = {
                id: post.post_id,
                author: post.user_id,
                content: post.content,
                timestamp: post.created_at,
                likes: 0,
                comments: [],
                shares: 0,
                images: imageUrls,
                video: videoData
            };
            
            console.log('Display post object:', displayPost); // Debug log
            
            const postElement = createPostElement(displayPost);
            globalWallContainer.appendChild(postElement);
        });

        attachVideoEventListeners();

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
`;

document.head.appendChild(document.createElement('style')).textContent = additionalStyles;

function createPostElement(post) {
    post.likes = post.likes || 0;
    post.comments = post.comments || [];
    post.shares = post.shares || 0;

    // Prepare media HTML
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

    const postElement = document.createElement('div');
    postElement.className = 'social-post';
    postElement.setAttribute('data-post-id', post.id);

    postElement.innerHTML = `
        <div class="post-header">
            <div class="post-user-info">
                <img src="../assets/human.png" alt="Profile" class="profile-pic">
                <div class="user-details">
                    <h3 class="post-author">${post.author || 'Anonymous'}</h3>
                    <span class="post-timestamp">
                        ${getTimeDifference(post.timestamp)}<br>
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

        <div class="post-content">
            <div class="post-text">${post.content}</div>
            ${mediaHTML ? `
                <div class="post-media-container">
                    ${mediaHTML}
                </div>
            ` : ''}
        </div>

        <div class="post-interactions">
            <div class="interaction-stats">
                <span class="likes-count">
                    <i class="icon-heart">❤️</i> ${post.likes}
                </span>
                <span class="comments-count">
                    <i class="icon-comment">💬</i> ${post.comments.length}
                </span>
                <span class="shares-count">
                    <i class="icon-share">🔗</i> ${post.shares}
                </span>
            </div>

            <div class="interaction-buttons">
                <button class="btn-like" data-post-id="${post.id}">
                    <i class="icon-heart">❤️</i> Like
                </button>
                <button class="btn-comment" data-post-id="${post.id}">
                    <i class="icon-comment">💬</i> Comment
                </button>
                <button class="btn-share" data-post-id="${post.id}">
                    <i class="icon-share">🔗</i> Share
                </button>
            </div>
        </div>

        <div class="comments-section">
            <div class="comments-list">
                ${post.comments.map(comment => `
                    <div class="comment">
                        <img src="../assets/human.png" alt="Profile" class="comment-profile-pic">
                        <div class="comment-content">
                            <span class="comment-author">Anonymous User</span>
                            <p class="comment-text">${escapeHTML(comment.text)}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="comments-input-container">
                <img src="../assets/human.png" alt="Profile" class="input-profile-pic">
                <input type="text" class="comment-input" placeholder="Write a comment...">
                <button class="comment-send-btn">Post</button>
            </div>
        </div>
    `;

    // Add image modal functionality
    if (post.images && post.images.length > 0) {
        postElement.innerHTML += `
            <div id="image-modal" class="image-modal" onclick="closeImageModal()">
                <span class="close-modal">&times;</span>
                <img class="modal-content" id="modal-image">
                <div id="image-caption"></div>
                ${post.images.length > 1 ? `
                    <a class="prev" onclick="changeImage(-1)">&#10094;</a>
                    <a class="next" onclick="changeImage(1)">&#10095;</a>
                ` : ''}
            </div>
        `;
    }

    const likeBtn = postElement.querySelector('.btn-like');
    const commentBtn = postElement.querySelector('.btn-comment');
    const shareBtn = postElement.querySelector('.btn-share');
    const commentInput = postElement.querySelector('.comment-input');
    const commentSendBtn = postElement.querySelector('.comment-send-btn');
    const commentsList = postElement.querySelector('.comments-list');

    if (likeBtn) {
        likeBtn.addEventListener('click', () => {
            toggleLike(post, likeBtn);
        });
    }

    // Comment button functionality
    if (commentBtn) {
        commentBtn.addEventListener('click', () => {
            commentInput.focus();
        });
    }

    // Share button functionality
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            openShareModal(post);
        });
    }

    // Comment send functionality
    if (commentSendBtn && commentInput) {
        commentSendBtn.addEventListener('click', () => {
            const commentText = commentInput.value.trim();
            if (commentText) {
                addComment(post, commentText, commentsList);
                commentInput.value = '';
            }
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
function deletePost(postId) {
    // Retrieve posts from local storage
    let posts = JSON.parse(localStorage.getItem('devhive_posts') || '[]');
    
    // Find the index of the post to delete
    const postIndex = posts.findIndex(post => post.id === postId);
    
    if (postIndex !== -1) {
        // Remove the post from the array
        posts.splice(postIndex, 1);
        
        // Update local storage
        localStorage.setItem('devhive_posts', JSON.stringify(posts));
        
        // Remove the post element from the DOM
        const postElement = document.querySelector(`.social-post[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.remove();
        }
        
        // Show notification
        showNotification('Post deleted successfully');
    } else {
        showNotification('Post not found');
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
    // Retrieve posts from local storage
    let posts = JSON.parse(localStorage.getItem('devhive_posts') || '[]');
    
    // Find the specific post
    const postIndex = posts.findIndex(p => p.id === post.id);
    
    if (postIndex !== -1) {
        // Ensure likes object exists
        if (!posts[postIndex].likes) {
            posts[postIndex].likes = 0;
        }

        // Toggle like
        if (!posts[postIndex].liked) {
            // Like the post
            posts[postIndex].likes += 1;
            posts[postIndex].liked = true;
            
            // Update like button style
            likeBtn.classList.add('liked');
        } else {
            // Unlike the post
            posts[postIndex].likes = Math.max(posts[postIndex].likes - 1, 0);
            posts[postIndex].liked = false;
            
            // Remove liked style
            likeBtn.classList.remove('liked');
        }
        
        // Update local storage
        localStorage.setItem('devhive_posts', JSON.stringify(posts));
        
        // Update like count in UI
        const likeCountElement = document.querySelector(
            `.social-post[data-post-id="${post.id}"] .likes-count`
        );
        
        if (likeCountElement) {
            likeCountElement.innerHTML = `
                <i class="icon-heart">❤️</i> ${posts[postIndex].likes}
            `;
        }
    }
}

// Function to add a comment
function addComment(post, commentText, commentsList) {
    // Retrieve posts from local storage
    let posts = JSON.parse(localStorage.getItem('devhive_posts') || '[]');
    
    // Find the specific post
    const postIndex = posts.findIndex(p => p.id === post.id);
    
    if (postIndex !== -1) {
        // Ensure comments array exists
        if (!posts[postIndex].comments) {
            posts[postIndex].comments = [];
        }

        // Create new comment object
        const newComment = {
            id: Date.now(), // Unique identifier
            text: commentText,
            timestamp: new Date().toISOString()
        };
        
        // Add comment to post's comments array
        posts[postIndex].comments.push(newComment);
        
        // Update local storage
        localStorage.setItem('devhive_posts', JSON.stringify(posts));
        
        // Create and append comment element
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <img src="../assets/human.png" alt="Profile" class="comment-profile-pic">
            <div class="comment-content">
                <span class="comment-author">Anonymous User</span>
                <p class="comment-text">${escapeHTML(commentText)}</p>
            </div>
        `;
        
        // Append to comments list
        commentsList.appendChild(commentElement);
        
        // Update comments count in UI
        const commentsCountElement = document.querySelector(
            `.social-post[data-post-id="${post.id}"] .comments-count`
        );
        
        if (commentsCountElement) {
            commentsCountElement.innerHTML = `
                <i class="icon-comment">💬</i> ${posts[postIndex].comments.length}
            `;
        }
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
    const modalContainer = document.createElement('div');
    modalContainer.className = 'share-modal-container';
    modalContainer.innerHTML = `
                <div class="share-preview">
                    <p class="share-preview-text">${escapeHTML(post.content)}</p>
                    ${post.media ? `
                        <div class="share-preview-media">
                            ${parsePostContent(post.content).media || ''}
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="share-modal-footer">
                <button class="btn-cancel">Cancel</button>
                <button class="btn-share-confirm">Share</button>
            </div>
        </div>
    `;

    document.body.appendChild(modalContainer);

    const closeModal = () => {
        document.body.removeChild(modalContainer);
    };

    const closeBtn = modalContainer.querySelector('.close-share-modal');
    const cancelBtn = modalContainer.querySelector('.btn-cancel');
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    const platformButtons = modalContainer.querySelectorAll('.share-platform');
    let selectedPlatform = null;

    platformButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            platformButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPlatform = btn.dataset.platform;
        });
    });

    const shareConfirmBtn = modalContainer.querySelector('.btn-share-confirm');
    shareConfirmBtn.addEventListener('click', () => {
        if (selectedPlatform) {
            switch(selectedPlatform) {
                case 'hershive':
                    shareToHershive(post);
                    break;
                case 'heybleepi':
                    shareToHeybleepi(post);
                    break;
            }
            closeModal();
        } else {
            showNotification('Please select a platform to share');
        }
    });
}

function shareToHershive(post) {
    const postLink = generatePostLink(post);
    const shareText = `Check out this post on DevHive: ${post.content.substring(0, 100)}...`;
    
    const hershiveShareUrl = `https://hershive.com/share?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postLink)}`;
    
    window.open(hershiveShareUrl, '_blank');
    
    incrementShareCount(post);
    showNotification('Shared to Hershive');
}

function shareToHeybleepi(post) {
    const postLink = generatePostLink(post);
    const shareText = `Shared from DevHive: ${post.content.substring(0, 100)}...`;
    
    const heybleep = `https://heybleepi.com/share?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postLink)}`;
    
    window.open(heybleep, '_blank');
    
    incrementShareCount(post);
    showNotification('Shared to Heybleepi');
}

function generatePostLink(post) {
    return `https://devhive.com/post/${post.id}`;
}

function incrementShareCount(post) {
    post.shares = (post.shares || 0) + 1;
    
    const posts = JSON.parse(localStorage.getItem('devhive_posts') || '[]');
    const postIndex = posts.findIndex(p => p.id === post.id);
    
    if (postIndex !== -1) {
        posts[postIndex] = post;
        localStorage.setItem('devhive_posts', JSON.stringify(posts));
    }
    
    const shareCountElement = document.querySelector(`.social-post[data-post-id="${post.id}"] .shares-count`);
    if (shareCountElement) {
        shareCountElement.textContent = `🔗 ${post.shares}`;
    }
}

// Add a storage event listener to reload posts when display name changes
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('storage', function(event) {
        if (event.key === 'userDisplayName') {
            loadPosts(); // Reload posts to update author name
        }
    });
});

// Add global functions for image modal
window.openImageModal = function(img) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const captionText = document.getElementById('image-caption');
    
    modal.style.display = "block";
    modalImg.src = img.src;
    captionText.innerHTML = img.alt;
    
    // Set current image index
    const gallery = img.closest('.post-media-gallery');
    if (gallery) {
        window.currentImageIndex = parseInt(img.closest('.post-media-item').dataset.index);
        window.currentImageGallery = gallery;
    }
}

window.closeImageModal = function() {
    const modal = document.getElementById('image-modal');
    modal.style.display = "none";
}

window.changeImage = function(direction) {
    if (!window.currentImageGallery) return;
    
    const images = window.currentImageGallery.querySelectorAll('.post-media-item');
    const totalImages = images.length;
    
    window.currentImageIndex = (window.currentImageIndex + direction + totalImages) % totalImages;
    
    const newImage = images[window.currentImageIndex].querySelector('img');
    const modalImg = document.getElementById('modal-image');
    const captionText = document.getElementById('image-caption');
    
    modalImg.src = newImage.src;
    captionText.innerHTML = newImage.alt;
}

// Add CSS for image modal
const modalStyle = document.createElement('style');
modalStyle.textContent = `
    .post-media-gallery.multi-image {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
    }

    .image-modal {
        display: none;
        position: fixed;
        z-index: 1000;
        padding-top: 100px;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0,0,0,0.9);
    }

    .modal-content {
        margin: auto;
        display: block;
        width: 80%;
        max-width: 700px;
        max-height: 80vh;
        object-fit: contain;
    }

    .close-modal {
        position: absolute;
        top: 15px;
        right: 35px;
        color: #f1f1f1;
        font-size: 40px;
        font-weight: bold;
        cursor: pointer;
    }

    .prev, .next {
        cursor: pointer;
        position: absolute;
        top: 50%;
        width: auto;
        padding: 16px;
        margin-top: -50px;
        color: white;
        font-weight: bold;
        font-size: 20px;
        transition: 0.6s ease;
        border-radius: 0 3px 3px 0;
        user-select: none;
        -webkit-user-select: none;
    }

    .next {
        right: 0;
        border-radius: 3px 0 0 3px;
    }

    .prev:hover, .next:hover {
        background-color: rgba(0, 0, 0, 0.8);
    }

    #image-caption {
        margin: auto;
        display: block;
        width: 80%;
        max-width: 700px;
        text-align: center;
        color: #ccc;
        padding: 10px 0;
        height: 150px;
    }
`;
document.head.appendChild(modalStyle);