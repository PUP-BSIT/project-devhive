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

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const postItem = this.closest('.post-item');
            console.log('Edit post:', postItem);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const postItem = this.closest('.post-item');
            if (confirm('Are you sure you want to delete this post?')) {
                console.log('Delete post:', postItem);
            }
        });
    });

    document.querySelector('.edit-profile-btn').addEventListener('click', function() {
        console.log('Edit profile clicked');
    });
}); 