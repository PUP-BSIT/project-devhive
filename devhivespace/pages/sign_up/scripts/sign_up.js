document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData();
    formData.append('email', form.querySelector('input[type="email"]').value);
    formData.append('name', form.querySelector('input[type="text"]').value);
    
    const passwords = form.querySelectorAll('input[type="password"]');
    formData.append('password', passwords[0].value);
    formData.append('confirmPassword', passwords[1].value);

    // Send form data to backend
    fetch('/devhivespace/api/auth/register.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store verification token in sessionStorage
            sessionStorage.setItem('verification_token', data.verification_token);
            window.location.href = 'emailVerify.html';
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    });
});

// Handle Google Sign Up
document.querySelector('.social-buttons button:first-child').addEventListener('click', function() {
    // Use the original google.php endpoint
    fetch('/devhivespace/api/auth/google_oauth/google.php')
        .then(response => response.json())
        .then(data => {
            if (data.auth_url) {
                // Store sign-up flow indicator in sessionStorage
                sessionStorage.setItem('auth_flow', 'signup');
                window.location.href = data.auth_url;
            } else {
                console.error('Failed to get Google auth URL');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});
