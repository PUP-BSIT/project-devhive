function openShareModal(post) {
    const modal = document.getElementById('share-modal-overlay');
    modal.style.display = 'flex';

    // Populate the original post content in the modal
    const originalContentDiv = modal.querySelector('.share-original-content');
    if (originalContentDiv) {
        originalContentDiv.innerHTML = post.content || '';
    }

    // Set the caption field to empty
    const captionInput = modal.querySelector('.share-caption');
    if (captionInput) {
        captionInput.value = '';
    }

    // Set the share link input
    const linkInput = modal.querySelector('.share-link-input');
    if (linkInput) {
        linkInput.value = `${window.location.origin}/post/${post.id}`;
    }

    // Remove previous listeners to avoid stacking
    const closeBtn = modal.querySelector('.close-share-modal');
    closeBtn.onclick = null;
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    const shareBtn = modal.querySelector('.share-main-btn');
    shareBtn.onclick = null;
    shareBtn.addEventListener('click', async () => {
        const user_id = Number(localStorage.getItem('user_id')) || 1;
        const postIdToShare = post.post_id;
        if (!postIdToShare) {
            alert('Error: No post_id found to share.');
            return;
        }
        const caption = captionInput.value.trim();
        const response = await sharePostToBackend(postIdToShare, user_id, 'devhive', caption);
        if (response && response.status === 'success') {
            alert('shared successfully.');
        } else {
            alert('Failed to share post.');
        }
        modal.style.display = 'none';
    });

    const copyBtn = modal.querySelector('.copy-link-btn');
    copyBtn.onclick = null;
    copyBtn.addEventListener('click', () => {
        linkInput.select();
        document.execCommand('copy');
        alert('Link copied!');
    });
}

async function sharePostToBackend(postId, userId, platform = 'devhive', caption = '') {
    try {
        console.log('Sharing post:', { postId, userId, platform, caption });
        const response = await fetch('../api/posts/share.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_id: postId, user_id: userId, platform, caption })
        });
        return await response.json();
    } catch (e) {
        return null;
    }
}