document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    // You would typically handle form data submission to your backend here
    
    // Redirect to email verification page
    window.location.href = 'emailVerify.html';
});
