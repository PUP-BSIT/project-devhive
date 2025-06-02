document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.post-filters button');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            alert('View post functionality to be implemented');
        });
    });

    const sidebarLinks = document.querySelectorAll('.sidebar nav ul li a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Load and display posts from local storage
    loadPosts();

    // Add event listener to improve video playback
    const globalWallContainer = document.querySelector('.global-wall-posts');
    
    if (globalWallContainer) {
        globalWallContainer.addEventListener('click', (e) => {
            const videoElement = e.target.closest('video');
            
            if (videoElement) {
                // Pause other videos when one starts playing
                const allVideos = document.querySelectorAll('video');
                allVideos.forEach(video => {
                    if (video !== videoElement) {
                        video.pause();
                    }
                });

                // Ensure video can play
                if (videoElement.paused) {
                    videoElement.play().catch(error => {
                        console.error('Video playback error:', error);
                        // Fallback for browsers or scenarios with playback restrictions
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
        // Remove existing listeners to prevent multiple attachments
        video.removeEventListener('click', videoClickHandler);
        
        // Add new click handler
        video.addEventListener('click', videoClickHandler);
    });
}

function videoClickHandler(e) {
    // Pause all other videos
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(v => {
        if (v !== e.currentTarget) {
            v.pause();
        }
    });

    // Toggle current video
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

function loadPosts() {
    const globalWallContainer = document.querySelector('.global-wall-posts');
    if (!globalWallContainer) return;

    // Clear existing posts
    globalWallContainer.innerHTML = '';

    // Fetch posts from local storage
    const posts = JSON.parse(localStorage.getItem('devhive_posts') || '[]');

    // Sort posts by timestamp (most recent first)
    posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Create and append post elements
    posts.forEach(post => {
        const postElement = createPostElement(post);
        globalWallContainer.appendChild(postElement);
    });

    // Attach video event listeners after posts are loaded
    attachVideoEventListeners();
}

function createPostElement(post) {
    // Initialize counts
    post.likes = post.likes || 0;
    post.comments = post.comments || [];
    post.shares = post.shares || 0;

    // Parse media content
    const parsedContent = parsePostContent(post.content);

    const postElement = document.createElement('div');
    postElement.className = 'social-post';
    postElement.setAttribute('data-post-id', post.id);

    postElement.innerHTML = `
        <div class="post-header">
            <div class="post-user-info">
                <img src="../assets/human.png" alt="Profile" class="profile-pic">
                <div class="user-details">
                    <h3 class="post-author">${escapeHTML(post.author || 'Anonymous')}</h3>
                    <span class="post-timestamp">${getTimeDifference(new Date(post.timestamp))}</span>
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
            <p class="post-text">${parsedContent.text}</p>
            
            ${parsedContent.media ? `
                <div class="post-media-container">
                    ${parsedContent.media}
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

    // Add event listeners for interactions
    const likeBtn = postElement.querySelector('.btn-like');
    const commentBtn = postElement.querySelector('.btn-comment');
    const shareBtn = postElement.querySelector('.btn-share');
    const commentInput = postElement.querySelector('.comment-input');
    const commentSendBtn = postElement.querySelector('.comment-send-btn');
    const commentsList = postElement.querySelector('.comments-list');

    // Like button functionality
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
            sharePost(post, shareBtn);
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
    // Regular expressions for different media types
    const imageRegex = /\[Image: (.+?)\]/g;
    const videoRegex = /\[Video: (.+?)\]/g;
    const linkRegex = /\[Link\]\((.+?)\)/g;
    const emojiRegex = /\[Emoji: (.+?)\]/g;
    
    // Containers for parsed content
    let text = content;
    const mediaElements = [];

    // Parse images with improved visual handling
    const imageMatches = [...text.matchAll(imageRegex)];
    imageMatches.forEach(match => {
        const fileName = match[1];
        
        // Check if it's a local storage image or uploaded image
        const storedImages = JSON.parse(localStorage.getItem('devhive_uploaded_images') || '{}');
        const imageData = storedImages[fileName] || 
            storedImages[Object.keys(storedImages).find(key => key.endsWith(fileName))];
        
        const filePreview = document.createElement('div');
        filePreview.className = 'post-media-preview image-preview';
        
        filePreview.innerHTML = `
            <div class="media-item image-item">
                <div class="image-wrapper">
                    <img src="${imageData || '/uploads/images/' + fileName}" 
                         alt="${fileName}" 
                         title="${fileName}"
                         onerror="this.src='../assets/image-placeholder.png'"
                         loading="lazy"
                    >
                    <div class="image-overlay">
                        <span class="media-caption">${fileName}</span>
                    </div>
                </div>
            </div>
        `;
        mediaElements.push(filePreview.outerHTML);
        text = text.replace(match[0], '');
    });

    // Parse videos with enhanced handling
    const videoMatches = [...text.matchAll(videoRegex)];
    videoMatches.forEach(match => {
        const fileName = match[1];
        
        // Check multiple storage locations for video
        const storedVideos = JSON.parse(localStorage.getItem('devhive_uploaded_videos') || '{}');
        const videoData = storedVideos[fileName] || 
            storedVideos[Object.keys(storedVideos).find(key => key.endsWith(fileName))];
        
        const videoSources = [
            videoData,  // Local storage video data
            `/uploads/videos/${fileName}`,  // Server-uploaded video
        ].filter(Boolean);  // Remove any undefined sources

        const videoPreview = document.createElement('div');
        videoPreview.className = 'post-media-preview video-preview';
        
        videoPreview.innerHTML = `
            <div class="media-item video-item">
                <div class="video-wrapper">
                    <video 
                        src="${videoSources[0]}" 
                        data-filename="${fileName}"
                        controls
                        preload="metadata"
                        playsinline
                        poster="../assets/video-placeholder.png"
                    >
                        <source src="${videoSources[0]}" type="video/mp4">
                        ${videoSources[1] ? `<source src="${videoSources[1]}" type="video/mp4">` : ''}
                        Your browser does not support the video tag.
                    </video>
                    <div class="video-overlay">
                        <span class="media-caption">${fileName}</span>
                    </div>
                </div>
            </div>
        `;
        
        mediaElements.push(videoPreview.outerHTML);
        text = text.replace(match[0], '');
    });

    // Wrap multiple media items in a scrollable container
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'post-media-container';
    
    if (mediaElements.length > 1) {
        // Create a horizontally scrollable container for multiple media
        mediaContainer.innerHTML = `
            <div class="media-scroll-container">
                ${mediaElements.join('')}
            </div>
        `;
    } else if (mediaElements.length === 1) {
        mediaContainer.innerHTML = mediaElements[0];
    }

    return {
        text: escapeHTML(text.trim()),
        media: mediaElements.length > 0 ? mediaContainer.outerHTML : ''
    };
}

function getTimeDifference(date) {
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

// Add CSS for dropdown and notification
const styleElement = document.createElement('style');
styleElement.textContent = `
    .post-actions-menu {
        position: relative;
    }
    
    .post-dropdown-menu {
        display: none;
        position: absolute;
        top: 100%;
        right: 0;
        background-color: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        z-index: 10;
    }
    
    .post-dropdown-menu.show {
        display: block;
    }
    
    .delete-post-btn {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        width: 100%;
        background: none;
        border: none;
        text-align: left;
        cursor: pointer;
    }
    
    .delete-post-btn:hover {
        background-color: #f0f0f0;
    }
    
    .delete-post-btn img {
        width: 16px;
        height: 16px;
        margin-right: 8px;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 1000;
    }
    
    .notification.show {
        opacity: 1;
    }
`;
document.head.appendChild(styleElement);

// Add CSS for better video styling
const videoStyleElement = document.createElement('style');
videoStyleElement.textContent = `
    .post-media-preview.video-preview {
        position: relative;
    }

    .post-media-preview .video-wrapper {
        position: relative;
        max-width: 100%;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .post-media-preview video {
        width: 100%;
        height: auto;
        max-height: 400px;
        object-fit: contain;
        background-color: #000;
    }

    .post-media-preview .video-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.5);
        padding: 8px;
        display: flex;
        align-items: center;
    }

    .post-media-preview .video-overlay .media-caption {
        color: white;
        font-size: 0.7em;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin: 0;
    }

    /* Video controls styling */
    .post-media-preview video:focus {
        outline: none;
    }

    .post-media-preview video::-webkit-media-controls {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
    }

    @media (max-width: 600px) {
        .post-media-preview video {
            max-height: 250px;
        }
    }
`;
document.head.appendChild(videoStyleElement);

// Add comprehensive video debugging script
document.addEventListener('DOMContentLoaded', () => {
    function debugVideoPlayback() {
        const videos = document.querySelectorAll('video');
        console.log('Total videos found:', videos.length);
        
        videos.forEach((video, index) => {
            console.log(`Video ${index + 1} details:`, {
                src: video.src,
                currentSrc: video.currentSrc,
                networkState: video.networkState,
                readyState: video.readyState,
                error: video.error
            });

            // Add more detailed event listeners
            video.addEventListener('loadstart', () => console.log('Video loadstart'));
            video.addEventListener('loadedmetadata', () => console.log('Video loadedmetadata'));
            video.addEventListener('canplay', () => console.log('Video can play'));
            video.addEventListener('error', (e) => console.error('Video playback error:', e));
        });
    }

    // Run video debugging
    debugVideoPlayback();

    // Add global video click handler
    document.body.addEventListener('click', (e) => {
        const video = e.target.closest('video');
        if (video) {
            // Pause all other videos
            document.querySelectorAll('video').forEach(v => {
                if (v !== video) v.pause();
            });

            // Toggle current video
            if (video.paused) {
                video.play().catch(error => {
                    console.error('Global video play error:', error);
                    alert('Unable to play video. Please check file compatibility.');
                });
            } else {
                video.pause();
            }
        }
    });
});

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

// Function to share post
function sharePost(post, shareBtn) {
    // Retrieve posts from local storage
    let posts = JSON.parse(localStorage.getItem('devhive_posts') || '[]');
    
    // Find the specific post
    const postIndex = posts.findIndex(p => p.id === post.id);
    
    if (postIndex !== -1) {
        // Ensure shares count exists
        if (!posts[postIndex].shares) {
            posts[postIndex].shares = 0;
        }

        // Increment share count
        posts[postIndex].shares += 1;
        
        // Update local storage
        localStorage.setItem('devhive_posts', JSON.stringify(posts));
        
        // Update share count in UI
        const shareCountElement = document.querySelector(
            `.social-post[data-post-id="${post.id}"] .shares-count`
        );
        
        if (shareCountElement) {
            shareCountElement.innerHTML = `
                <i class="icon-share">🔗</i> ${posts[postIndex].shares}
            `;
        }
        
        // Optional: Add share functionality (e.g., copy link, social media share)
        copyPostLink(post);
    }
}

// Function to copy post link
function copyPostLink(post) {
    // Create a temporary link based on post ID
    const postLink = `${window.location.origin}/post/${post.id}`;
    
    // Create a temporary textarea to copy the link
    const tempInput = document.createElement('textarea');
    tempInput.value = postLink;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    // Show notification
    showNotification('Post link copied to clipboard');
}

// Social Media-like Post Styling
const socialPostStyleElement = document.createElement('style');
socialPostStyleElement.textContent = `
    .social-post {
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        margin-bottom: 15px;
        overflow: hidden;
    }

    .post-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid #f0f0f0;
    }

    .post-user-info {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .profile-pic {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }

    .user-details {
        display: flex;
        flex-direction: column;
    }

    .post-author {
        margin: 0;
        font-weight: bold;
        font-size: 0.9em;
    }

    .post-timestamp {
        color: #888;
        font-size: 0.8em;
    }

    .post-options .post-more-btn {
        background: none;
        border: none;
        font-size: 1.2em;
        cursor: pointer;
    }

    .post-content {
        padding: 12px;
    }

    .post-text {
        margin: 0 0 10px 0;
    }

    .post-media-container {
        width: 100%;
        max-height: 400px;
        overflow: hidden;
    }

    .post-media-container img,
    .post-media-container video {
        width: 100%;
        max-height: 400px;
        object-fit: cover;
    }

    .post-interactions {
        border-top: 1px solid #f0f0f0;
        border-bottom: 1px solid #f0f0f0;
    }

    .interaction-stats {
        display: flex;
        justify-content: space-between;
        padding: 10px 12px;
        color: #888;
        font-size: 0.9em;
    }

    .interaction-stats span {
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .interaction-buttons {
        display: flex;
        justify-content: space-around;
        padding: 10px 0;
        border-top: 1px solid #f0f0f0;
    }

    .interaction-buttons button {
        background: none;
        border: none;
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        color: #666;
        font-size: 0.9em;
    }

    .interaction-buttons button:hover {
        color: #333;
    }

    .comments-section {
        padding: 12px;
        background-color: #f9f9f9;
    }

    .comments-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 10px;
    }

    .comment {
        display: flex;
        align-items: flex-start;
        gap: 10px;
    }

    .comment-profile-pic {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        object-fit: cover;
    }

    .comment-content {
        background-color: #f0f0f0;
        border-radius: 12px;
        padding: 8px 12px;
        flex-grow: 1;
    }

    .comment-author {
        display: block;
        font-size: 0.8em;
        color: #666;
        margin-bottom: 4px;
        font-weight: bold;
    }

    .comment-text {
        margin: 0;
        font-size: 0.9em;
    }

    .comments-input-container {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .input-profile-pic {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        object-fit: cover;
    }

    .comment-input {
        flex-grow: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 20px;
        background-color: white;
    }

    .comment-send-btn {
        background: none;
        border: none;
        color: #4CAF50;
        font-weight: bold;
        cursor: pointer;
    }
`;
document.head.appendChild(socialPostStyleElement);

// Add CSS for post options dropdown
const dropdownStyleElement = document.createElement('style');
dropdownStyleElement.textContent = `
    .post-options {
        position: relative;
    }
    
    .post-more-btn {
        background: none;
        border: none;
        font-size: 1.2em;
        cursor: pointer;
        padding: 5px;
    }
    
    .post-dropdown-menu {
        display: none;
        position: absolute;
        top: 100%;
        right: 0;
        background-color: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        z-index: 10;
        min-width: 150px;
    }
    
    .post-dropdown-menu.show {
        display: block;
    }
    
    .delete-post-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        background: none;
        border: none;
        padding: 10px;
        text-align: left;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    
    .delete-post-btn:hover {
        background-color: #f0f0f0;
    }
`;
document.head.appendChild(dropdownStyleElement);

// Add CSS for media handling
const mediaStyleElement = document.createElement('style');
mediaStyleElement.textContent = `
    .post-media-container {
        width: 100%;
        max-width: 100%;
        overflow: hidden;
        background-color: white;
        border-radius: 8px;
    }

    .media-scroll-container {
        display: flex;
        overflow-x: auto;
        gap: 10px;
        padding: 10px;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
    }

    .media-scroll-container::-webkit-scrollbar {
        display: none;
    }

    .post-media-preview {
        flex: 0 0 auto;
        scroll-snap-align: center;
        max-width: 100%;
        position: relative;
    }

    .post-media-preview .media-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 100%;
    }

    .post-media-preview .image-wrapper {
        position: relative;
        max-width: 100%;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .post-media-preview img {
        width: 100%;
        height: auto;
        max-height: 400px;
        object-fit: contain;
        border-radius: 8px;
    }

    .post-media-preview .image-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.5);
        padding: 8px;
        display: flex;
        align-items: center;
    }

    .post-media-preview .media-caption {
        color: white;
        font-size: 0.7em;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin: 0;
    }

    @media (max-width: 600px) {
        .media-scroll-container {
            padding: 8px;
            gap: 8px;
        }

        .post-media-preview img {
            max-height: 250px;
        }
    }
`;
document.head.appendChild(mediaStyleElement);

// Attach video event listeners on initial page load
document.addEventListener('DOMContentLoaded', () => {
    attachVideoEventListeners();
});