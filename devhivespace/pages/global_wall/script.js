// Styles have been moved to styles.css

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
                <button class="btn-view" data-post-id="${post.id}">
                    <i class="icon-view">👁️</i> View
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

    // Add view button event listener
    const viewButtons = postElement.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            createPreviewModal(post);
        });
    });

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

    // Debugging function for image issues
    function debugImageIssue(fileName, imageData) {
        console.group(`🖼️ Image Upload Debugging: ${fileName}`);
        console.log('Filename:', fileName);
        console.log('Image Data Type:', typeof imageData);
        console.log('Image Data Length:', imageData ? imageData.length : 'N/A');
        console.log('Data Starts With:', imageData ? imageData.substring(0, 50) + '...' : 'No Data');
        
        // Check if it's a valid base64 image
        if (imageData && imageData.startsWith('data:image')) {
            console.log('✅ Looks like a valid base64 image');
        } else {
            console.warn('❌ Potential image data issue');
        }
        
        // Check local storage
        const storedImages = JSON.parse(localStorage.getItem('devhive_uploaded_images') || '{}');
        console.log('Total Stored Images:', Object.keys(storedImages).length);
        console.log('Matching Image Keys:', 
            Object.keys(storedImages).filter(key => 
                key === fileName || key.endsWith(fileName)
            )
        );
        
        console.groupEnd();
    }

    // Handles image parsing
    const imageMatches = [...text.matchAll(imageRegex)];
    imageMatches.forEach(match => {
        const fileName = match[1];
        
        // Multiple fallback mechanisms for image retrieval
        const storedImages = JSON.parse(localStorage.getItem('devhive_uploaded_images') || '{}');
        const imageData = 
            storedImages[fileName] ||  // Direct match
            storedImages[Object.keys(storedImages).find(key => key.endsWith(fileName))] ||  // Partial match
            `/uploads/images/${fileName}` ||  // Server path
            '../assets/image-placeholder.png';  // Fallback placeholder
        
        // Debug image data
        debugImageIssue(fileName, imageData);
        
        // Creates an image element with multiple error handling strategies
        const filePreview = document.createElement('div');
        filePreview.innerHTML = `
            <img 
                src="${imageData}" 
                alt="${fileName}" 
                title="${fileName}"
                onerror="this.src='../assets/image-placeholder.png'; 
                         console.error('Image failed to load:', this.src)"
                loading="lazy"
                style="width: 100%; height: auto; max-height: 400px; object-fit: contain; border-radius: 8px;"
            >
        `;
        mediaElements.push(filePreview.outerHTML);
        text = text.replace(match[0], '');
    });

    // Similar robust handling for videos
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
        videoPreview.innerHTML = `
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

// Attach video event listeners on initial page load
document.addEventListener('DOMContentLoaded', () => {
    attachVideoEventListeners();
});

// Add preview modal functionality
function createPreviewModal(post) {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'preview-modal-container';
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
                    
                    ${post.media ? `
                        <div class="preview-media-container">
                            ${parsePostContent(post.content).media || ''}
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