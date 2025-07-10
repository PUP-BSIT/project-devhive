document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.querySelector('.login-btn');

  // Add focus effects
  const inputs = document.querySelectorAll('.form-input');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', () => {
      input.parentElement.classList.remove('focused');
      // Validate email on blur
      if (input.type === 'email' && input.value) {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
        input.classList.toggle('error', !isValid);
      }
    });

    // Add subtle interaction effect
    input.addEventListener('keydown', () => {
      input.style.transform = 'translateY(1px)';
      setTimeout(() => {
        input.style.transform = 'none';
      }, 100);
    });
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous errors
    inputs.forEach(input => input.classList.remove('error'));

    // Basic validation
    let hasError = false;
    if (!emailInput.value) {
      emailInput.classList.add('error');
      hasError = true;
    }
    if (!passwordInput.value) {
      passwordInput.classList.add('error');
      hasError = true;
    }

    if (hasError) return;

    // Show loading state
    loginBtn.classList.add('loading');
    loginBtn.textContent = 'Signing in...';
    loginBtn.disabled = true;

    try {
      const response = await fetch('../api/auth/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailInput.value,
          password: passwordInput.value,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Success animation
        loginBtn.style.background = 'var(--primary)';
        loginBtn.textContent = 'Success!';
        
        // Redirect after success animation
        setTimeout(() => {
          window.location.href = '../dashboard/';
        }, 1000);
    } else {
        // Error animation
        loginBtn.classList.remove('loading');
        loginBtn.classList.add('error');
        loginBtn.textContent = 'Login failed';
        loginBtn.style.background = '#FF3B30';
        
        // Show error on inputs
        emailInput.classList.add('error');
        passwordInput.classList.add('error');
        
        // Reset button after delay
        setTimeout(() => {
          loginBtn.classList.remove('error');
          loginBtn.disabled = false;
          loginBtn.textContent = 'Sign in';
          loginBtn.style.background = '';
        }, 2000);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Error state
      loginBtn.classList.remove('loading');
      loginBtn.classList.add('error');
      loginBtn.textContent = 'Network error';
      loginBtn.style.background = '#FF3B30';
      
      // Reset button after delay
      setTimeout(() => {
        loginBtn.classList.remove('error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign in';
        loginBtn.style.background = '';
      }, 2000);
      }
    });

  // Remember me checkbox animation
  const checkbox = document.getElementById('remember');
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      checkbox.style.transform = 'scale(0.9)';
      setTimeout(() => {
        checkbox.style.transform = 'scale(1)';
      }, 100);
    }
  });

  // Smooth hover effects for buttons
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('mouseover', () => {
      button.style.transition = 'all 0.2s ease';
    });
  });
});