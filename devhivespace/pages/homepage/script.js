document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.querySelector('.login-btn');
    
    loginBtn.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = '../login/index.html';
    });
});