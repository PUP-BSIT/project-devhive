document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const client_id = urlParams.get('client_id');
  const redirect_uri = urlParams.get('redirect_uri');
  const provider = urlParams.get('provider');
  let action = null; // Track which button was clicked
  
  try {
    const res = await fetch(`copy/pages/api/oauth/oauth_authorize.php?client_id=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(redirect_uri)}&provider=${encodeURIComponent(provider)}`, { credentials: 'include' });
    const data = await res.json();
    
    if (data.error) {
      // Hide the form and show only the error
      document.getElementById('consent_form').style.display = 'none';
      document.querySelector('.oauth-container').innerHTML = `<p style="color:red;">${data.error}</p>`;
      return;
    }
    
    // Fix: Use client_id as fallback (you might want to add client_name to your PHP response)
    document.getElementById('client_name').textContent = data.client_name || client_id || 'Unknown App';
    document.getElementById('csrf_token').value = data.csrf_token;
    
    if (data.user_id) document.getElementById('user_id').textContent = data.user_id;
    
    if (data.scope) {
      document.getElementById('scope').textContent = data.scope;
      document.getElementById('scope_section').style.display = '';
    }
    
    const form = document.getElementById('consent_form');
    const approveBtn = form.querySelector('.approve-btn');
    const denyBtn = form.querySelector('.deny-btn');
    
    approveBtn.addEventListener('click', function() {
      action = 'approve';
    });
    
    denyBtn.addEventListener('click', function() {
      action = 'deny';
    });
    
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const csrf_token = document.getElementById('csrf_token').value;
      const payload = {
        client_id,
        redirect_uri,
        provider,
        csrf_token
      };
      
      if (action === 'approve') {
        payload.approve = 1;
      } else if (action === 'deny') {
        payload.deny = 1;
      } else {
        alert('Please click either Approve or Deny button.');
        return;
      }
      
      // Reset action for next submit
      action = null;
      
      try {
        const resp = await fetch('/copy/pages/api/oauth/oauth_authorize.php', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const result = await resp.json();
        
        if (result.redirect) {
          window.location.href = result.redirect;
        } else if (result.error) {
          alert(result.error);
        }
      } catch (submitErr) {
        alert('Error submitting authorization request.');
        console.error('Submit error:', submitErr);
      }
    });
    
  } catch (err) {
    console.error('Fetch error:', err);
    // Hide the form and show only the error
    document.getElementById('consent_form').style.display = 'none';
    document.querySelector('.oauth-container').innerHTML = `<p style="color:red;">Error loading authorization page. Please try again.</p>`;
  }
});