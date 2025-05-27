document.getElementById('verifyBtn').addEventListener('click', function () {
    // Get verification token if it exists
    const verificationToken = sessionStorage.getItem('verification_token');
    
    // Send verification request to backend
    fetch('/devhivespace/api/auth/verify_email.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token: verificationToken
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Change the lock icon to unlocked
            const lockIcon = document.querySelector('.lock-icon');
            lockIcon.src = '../assets/unlocked.png';
            
            // Update the message and button
            document.querySelector('h1').textContent = 'Email Verified Successfully!';
            document.querySelector('p').textContent = 
                'Congratulations! You can now start using DevHiveSpace and have fun!';
            document.querySelector('button').textContent = 'Continue to Dashboard';
            document.querySelector('button').classList.add('success');

            // Clear verification token
            sessionStorage.removeItem('verification_token');

            // Add a click event listener for the "Continue to Dashboard" button
            this.addEventListener('click', function() {
                if (this.textContent === 'Continue to Dashboard') {
                    window.location.href = '../dashboard/index.html';
                }
            });
        } else {
            // Handle verification failure
            document.querySelector('p').textContent = 
                'Verification failed. Please try again or contact support.';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.querySelector('p').textContent = 
            'An error occurred. Please try again later.';
    });
});