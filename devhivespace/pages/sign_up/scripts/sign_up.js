document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const form = e.target;
    const userData = {
        email: form.querySelector('input[name="email"]').value,
        username: form.querySelector('input[name="username"]').value,
        first_name: form.querySelector('input[name="firstName"]').value,
        middle_name: form.querySelector('input[name="middleName"]').value || null,
        last_name: form.querySelector('input[name="lastName"]').value,
        birthday: form.querySelector('input[name="birthday"]').value,
        password: form.querySelector('input[name="password"]').value,
        confirm_password: form.querySelector('input[name="confirmPassword"]').value
    };

    console.log('Sending user data:', { 
        ...userData, 
        password: '***', 
        confirm_password: '***' 
    });

    fetch('/devhivespace/api/auth/register.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error('Server response: ' + text);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            sessionStorage.setItem('verification_token', data.verification_token);
            sessionStorage.setItem('user_id', data.user_id);
            sessionStorage.setItem('email', userData.email);
            window.location.href = 'emailVerify.html';
        } else {
            console.error('Registration failed:', data);
            alert(data.message || 'Registration failed. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error details:', error);
        alert('An error occurred. Please check the console for details ' +
            'and try again.');
    });
});

function handleGoogleCallback(response) {
    const jwt = response.credential;
    const parts = jwt.split('.');
    const payload = JSON.parse(atob(parts[1]));

    const userData = {
        email: payload.email,
        first_name: payload.given_name,
        last_name: payload.family_name,
        profile_picture: payload.picture,
        provider: 'google',
        provider_user_id: payload.sub
    };

    fetch('/devhivespace/api/auth/google_oauth/callback.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error('Server response: ' + text);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            sessionStorage.setItem('user_id', data.user_id);
            sessionStorage.setItem('email', data.email);
            window.location.href = '../dashboard/index.html';
        } else {
            console.error('Google sign-in failed:', data);
            alert(data.message || 'Failed to complete Google sign up');
        }
    })
    .catch(error => {
        console.error('Error details:', error);
        alert('An error occurred during Google sign up. Please check the ' +
            'console for details.');
    });
}