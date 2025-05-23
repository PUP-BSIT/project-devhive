// Add click event listeners to navigation items
document.addEventListener('DOMContentLoaded', function() {
    // Navigation menu interactions
    const navItems = document.querySelectorAll('.nav-menu li');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
        });
    });

    // Button hover effects
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.opacity = '0.9';
        });

        button.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
    });

    // Initialize performance bars
    const performanceBars = document.querySelectorAll('.progress');
    performanceBars.forEach(bar => {
        const percentage = bar.parentElement.nextElementSibling.textContent;
        bar.style.width = percentage;
    });

    // Quick action buttons interactions
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });

        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });

        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'translateY(0)';
            }, 150);
        });
    });

    // Notification bell animation
    const notificationBell = document.querySelector('.notifications i');
    notificationBell.addEventListener('click', function() {
        this.style.transform = 'rotate(15deg)';
        setTimeout(() => {
            this.style.transform = 'rotate(-15deg)';
            setTimeout(() => {
                this.style.transform = 'rotate(0)';
            }, 150);
        }, 150);
    });

    // Update statistics with animation
    function animateValue(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                clearInterval(timer);
                element.textContent = end.toString().includes('%') ? end : end.toLocaleString();
            } else {
                element.textContent = Math.round(current).toLocaleString();
            }
        }, 16);
    }

    function updateStats() {
        const stats = {
            'Total Users': Math.floor(Math.random() * 2000 + 1000),
            'Active Posts': Math.floor(Math.random() * 1000 + 500),
            'Engagement': Math.floor(Math.random() * 20 + 80) + '%'
        };

        Object.entries(stats).forEach(([key, value]) => {
            const statCard = document.querySelector(`.stat-card:has(h4:contains("${key}")) p`);
            if (statCard) {
                const currentValue = parseInt(statCard.textContent.replace(/[^0-9]/g, ''));
                const newValue = parseInt(value.toString().replace(/[^0-9]/g, ''));
                animateValue(statCard, currentValue, newValue, 1000);
            }
        });
    }

    // Initial stats update
    updateStats();

    // Update stats periodically
    setInterval(updateStats, 30000);

    // Get all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // Add click event to each tab button
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            // Here you would typically show/hide content based on the selected tab
            // For now, we'll just console log which tab was clicked
            console.log(`Switched to ${button.textContent} tab`);
        });
    });

    // Menu items navigation
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page === 'profile') {
                window.location.href = '../USER_PROFILE/index.html';
            }
        });
    });

    // Profile navigation
    const profileMenuItem = document.querySelector('.menu-item span:contains("Profile")').parentElement;
    profileMenuItem.addEventListener('click', function() {
        window.location.href = '../USER_PROFILE/index.html';
    });
}); 