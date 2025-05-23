document.getElementById('verifyBtn').addEventListener('click', function () {
    // Change the lock icon to unlocked
    const lockIcon = document.querySelector('.lock-icon');
    lockIcon.src = '../assets/unlocked.png';
    
    // Update the message and button
    document.querySelector('h1').textContent = 'Email Verified Successfully!';
    document.querySelector('p').textContent = 
        'You can now start using DevHiveSpace and have fun!';
    document.querySelector('button').textContent = 'Continue to Dashboard';
    document.querySelector('button').classList.add('success');
});