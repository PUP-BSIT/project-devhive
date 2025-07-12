document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const urlParams = new URLSearchParams(window.location.search);
  const client_id = urlParams.get('client_id');
  const redirect_uri = urlParams.get('redirect_uri');
  const provider = urlParams.get('provider');

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('loginError');
  errorDiv.style.display = 'none';
  errorDiv.textContent = '';

  try {
    const resp = await fetch('/api/oauth/oauth_login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await resp.json();
    if (resp.ok && data.success) {
      // Redirect to consent page with original params
      window.location.href = `/authorization_page/authorize.html?client_id=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(redirect_uri)}&provider=${encodeURIComponent(provider)}`;
    } else {
      errorDiv.textContent = data.error || 'Login failed. Please try again.';
      errorDiv.style.display = 'block';
    }
  } catch (err) {
    errorDiv.textContent = 'Network error. Please try again.';
    errorDiv.style.display = 'block';
  }
});