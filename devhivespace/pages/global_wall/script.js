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
}

function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'social-post';
    postElement.setAttribute('data-post-id', post.id);
    
    // Calculate time difference
    const timeDiff = getTimeDifference(new Date(post.timestamp));

    // Render platforms as icons or badges
    const platformBadges = post.platforms.map(platform => {
        const platformIcons = {
            'all': '../assets/global_feed.png',
            'facebook': '../assets/link.png',
            'instagram': '../assets/link.png',
            'twitter': '../assets/link.png'
        };
        const iconSrc = platformIcons[platform.toLowerCase()] || '../assets/link.png';
        return `<img src="${iconSrc}" alt="${platform}" class="platform-badge" title="${platform}">`;
    }).join('');

    // Parse and render post content with media
    const parsedContent = parsePostContent(post.content);

    postElement.innerHTML = `
        <div class="post-header">
            <img src="../assets/human.png" alt="Profile" class="profile-pic">
            <div class="post-user-info">
                <h3 class="post-author">${escapeHTML(post.author)}</h3>
                <div class="post-meta">
                    <span class="post-timestamp">${timeDiff}</span>
                    <div class="platform-badges">
                        ${platformBadges}
                    </div>
                </div>
            </div>
            <div class="post-actions-menu">
                <button class="post-options-btn">...</button>
                <div class="post-dropdown-menu">
                    <button class="delete-post-btn" data-post-id="${post.id}">
                        <img src="../assets/delete.png" alt="Delete">
                        Delete Post
                    </button>
                </div>
            </div>
        </div>
        
        <div class="post-content">
            <h4 class="post-title">${escapeHTML(post.title)}</h4>
            <div class="post-text">${parsedContent.text}</div>
            ${parsedContent.media}
        </div>
        
        <div class="post-interaction-actions">
            <button class="action-btn like-btn">
                <img src="../assets/heart.png" alt="Like">
                <span>Like</span>
            </button>
            <button class="action-btn comment-btn">
                <img src="../assets/comment.png" alt="Comment">
                <span>Comment</span>
            </button>
            <button class="action-btn share-btn">
                <img src="../assets/share.png" alt="Share">
                <span>Share</span>
            </button>
        </div>
    `;

    // Enhanced video handling
    const videoElements = postElement.querySelectorAll('video');
    videoElements.forEach(videoEl => {
        // Add custom play/pause functionality
        videoEl.addEventListener('click', function() {
            if (this.paused) {
                this.play().catch(error => {
                    console.error('Video play error:', error);
                    // Fallback error handling
                    alert('Unable to play video. Please check file compatibility.');
                });
            } else {
                this.pause();
            }
        });

        // Debugging video source
        videoEl.addEventListener('error', function(e) {
            console.error('Video error details:', {
                src: this.src,
                error: e,
                networkState: this.networkState,
                readyState: this.readyState
            });
        });

        // Preload metadata
        videoEl.preload = 'metadata';
    });

    // Add event listener for delete button
    const deleteBtn = postElement.querySelector('.delete-post-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            const postId = e.currentTarget.dataset.postId;
            deletePost(parseInt(postId));
        });
    }

    // Add event listener to toggle dropdown menu
    const optionsBtn = postElement.querySelector('.post-options-btn');
    if (optionsBtn) {
        optionsBtn.addEventListener('click', (e) => {
            const dropdownMenu = e.currentTarget.nextElementSibling;
            dropdownMenu.classList.toggle('show');
            
            // Close dropdown when clicking outside
            const closeDropdown = (event) => {
                if (!dropdownMenu.contains(event.target) && event.target !== optionsBtn) {
                    dropdownMenu.classList.remove('show');
                    document.removeEventListener('click', closeDropdown);
                }
            };
            
            document.addEventListener('click', closeDropdown);
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

    // Parse images
    const imageMatches = [...text.matchAll(imageRegex)];
    imageMatches.forEach(match => {
        const fileName = match[1];
        
        // Check if it's a local storage image or uploaded image
        const storedImages = JSON.parse(localStorage.getItem('devhive_uploaded_images') || '{}');
        const imageData = storedImages[fileName] || storedImages[Object.keys(storedImages).find(key => key.endsWith(fileName))];
        
        const filePreview = document.createElement('div');
        filePreview.className = 'post-media-preview';
        
        filePreview.innerHTML = `
            <div class="media-item image-item">
                <img src="${imageData || '/uploads/images/' + fileName}" 
                     alt="${fileName}" 
                     title="${fileName}"
                     onerror="this.src='../assets/image-placeholder.png'">
                <span class="media-caption">${fileName}</span>
            </div>
        `;
        mediaElements.push(filePreview.outerHTML);
        text = text.replace(match[0], '');
    });

    // Parse videos with enhanced debugging
    const videoMatches = [...text.matchAll(videoRegex)];
    videoMatches.forEach(match => {
        const fileName = match[1];
        console.log('Processing video file:', fileName);
        
        // Check multiple storage locations
        const storedVideos = JSON.parse(localStorage.getItem('devhive_uploaded_videos') || '{}');
        const localStorageVideo = storedVideos[fileName] || 
            storedVideos[Object.keys(storedVideos).find(key => key.endsWith(fileName))];
        
        // Potential video sources
        const videoSources = [
            localStorageVideo,  // Local storage video data
            `/uploads/videos/${fileName}`,  // Server-uploaded video
            `../assets/video-placeholder.png`  // Fallback placeholder
        ].filter(Boolean);  // Remove any undefined sources

        const filePreview = document.createElement('div');
        filePreview.className = 'post-media-preview';
        
        filePreview.innerHTML = `
            <div class="media-item video-item">
                <video 
                    src="${videoSources[0]}" 
                    data-filename="${fileName}"
                    controls
                    preload="metadata"
                    style="max-width: 100%; max-height: 400px;"
                >
                    Your browser does not support the video tag.
                    <source src="${videoSources[0]}" type="video/mp4">
                    <source src="${videoSources[1]}" type="video/mp4">
                </video>
                <span class="media-caption">${fileName}</span>
            </div>
        `;
        
        // Log video source details for debugging
        console.log('Video source details:', {
            localStorageVideo: !!localStorageVideo,
            serverVideo: `/uploads/videos/${fileName}`,
            sources: videoSources
        });

        mediaElements.push(filePreview.outerHTML);
        text = text.replace(match[0], '');
    });

    // Parse links
    const linkMatches = [...text.matchAll(linkRegex)];
    linkMatches.forEach(match => {
        const url = match[1];
        const linkPreview = document.createElement('div');
        linkPreview.className = 'post-media-preview';
        linkPreview.innerHTML = `
            <div class="media-item link-item">
                <a href="${url}" target="_blank" rel="noopener noreferrer">
                    <img src="../assets/link.png" alt="Link">
                    <span class="media-caption">${url}</span>
                </a>
            </div>
        `;
        mediaElements.push(linkPreview.outerHTML);
        text = text.replace(match[0], '');
    });

    // Parse emojis
    const emojiMatches = [...text.matchAll(emojiRegex)];
    const emojiContainer = document.createElement('div');
    emojiContainer.className = 'post-media-preview emoji-preview';
    const emojiElements = emojiMatches.map(match => {
        const emoji = match[1];
        text = text.replace(match[0], '');
        return `<span class="emoji-item">${emoji}</span>`;
    });
    
    if (emojiElements.length > 0) {
        emojiContainer.innerHTML = `
            <div class="media-item emoji-item">
                <div class="emoji-container">
                    ${emojiElements.join(' ')}
                </div>
                <span class="media-caption">Emojis</span>
            </div>
        `;
        mediaElements.push(emojiContainer.outerHTML);
    }

    return {
        text: escapeHTML(text.trim()),
        media: mediaElements.length > 0 ? `
            <div class="post-media-container">
                ${mediaElements.join('')}
            </div>
        ` : ''
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
    // Retrieve existing posts from local storage
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
    .post-media-preview .video-item {
        max-width: 100%;
        width: 100%;
        position: relative;
    }
    
    .post-media-preview video {
        max-width: 100%;
        max-height: 400px;
        object-fit: contain;
        background-color: #000;
        border-radius: 8px;
    }
    
    .post-media-preview .media-caption {
        display: block;
        text-align: center;
        margin-top: 8px;
        color: #666;
        font-size: 0.9em;
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