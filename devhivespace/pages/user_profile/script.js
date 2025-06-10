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

    // Load user avatar from local storage
    loadUserAvatar();

    // Load user display name from local storage
    loadUserDisplayName();

    // Load and display user posts
    loadUserPosts();

    // Listen for storage changes
    window.addEventListener('storage', function(event) {
        if (event.key === 'userDisplayName') {
            loadUserDisplayName();
            loadUserPosts(); // Reload posts to update author name
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

function loadUserPosts() {
    const postsSection = document.querySelector('.posts-section');
    if (!postsSection) return;

    // Retrieve user posts from local storage
    const userPosts = JSON.parse(localStorage.getItem('userPosts') || '[]');

    // Get current user profile information
    const displayName = localStorage.getItem('userDisplayName') || 'User';
    const userAvatar = localStorage.getItem('userProfileAvatar') || '../assets/human.png';

    // Clear existing posts
    postsSection.innerHTML = '';

    // If no posts, add a message
    if (userPosts.length === 0) {
        const noPostsMessage = document.createElement('p');
        noPostsMessage.textContent = 'No posts yet. Create your first post!';
        noPostsMessage.style.textAlign = 'center';
        noPostsMessage.style.color = '#888';
        postsSection.appendChild(noPostsMessage);
        return;
    }

    // Create and append post elements
    userPosts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post-item';
        
        // Format timestamp
        const postDate = new Date(post.timestamp);
        const formattedDate = postDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Create media content HTML
        let mediaHTML = '';
        if (post.images && post.images.length > 0) {
            mediaHTML = `
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
        } else if (post.video) {
            mediaHTML = `
            <div class="post-media-video">
                <video 
                    src="${post.video}" 
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
            </div>
            `;
        }

        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-author">
                    <img src="${userAvatar}" 
                        alt="Profile Picture" class="post-avatar">
                    <div class="post-meta">
                        <h3>${displayName}</h3>
                        <p>Posted ${formattedDate}</p>
                    </div>
                </div>
            </div>
            ${post.content ? `
                <div class="post-content">
                    <p>${post.content}</p>
                </div>
            ` : ''}
            ${mediaHTML}
            <div class="post-actions">
                <div class="action-stats">
                    <span class="likes">
                        <img src="../assets/heart.png" alt="Likes"> 
                        ${post.likes} Likes
                    </span>
                    <span class="comments">
                        <img src="../assets/comment.png" alt="Comments"> 
                        ${post.comments.length} Comments
                    </span>
                    <span class="shares">
                        <img src="../assets/share.png" alt="Shares"> 
                        ${post.shares} Shares
                    </span>
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

        postsSection.appendChild(postElement);
    });

    // Add global functions for image modal if not already added
    if (!window.openImageModal) {
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
    }
}