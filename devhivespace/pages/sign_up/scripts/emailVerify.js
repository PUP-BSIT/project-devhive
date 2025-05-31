document.getElementById('verifyBtn').addEventListener('click', function () {
    const verificationToken = sessionStorage.getItem('verification_token');
    
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
            const lockIcon = document.querySelector('.lock-icon');
            lockIcon.src = '../assets/unlocked.png';
            
            document.querySelector('h1').textContent = 'Email Verified Successfully!';
            document.querySelector('p').textContent = 
                'Congratulations! You can now start using DevHiveSpace and have fun!';
            document.querySelector('button').textContent = 'Continue to Dashboard';
            document.querySelector('button').classList.add('success');

            sessionStorage.removeItem('verification_token');

            this.addEventListener('click', function() {
                if (this.textContent === 'Continue to Dashboard') {
                    window.location.href = '../dashboard/index.html';
                }
            });
        } else {
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