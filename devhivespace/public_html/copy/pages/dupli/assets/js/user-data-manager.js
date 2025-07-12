// User Data Manager
(function() {
  // Centralized user data storage
  const UserDataManager = {
    userData: null,

    // Fetch user data from server
    fetchUserData: function() {
      return new Promise((resolve, reject) => {
        // Get user token
        const userToken = localStorage.getItem('user_token') || sessionStorage.getItem('user_token');
        
        console.log('🔍 Fetching User Data - Token:', userToken); // Detailed logging

        if (!userToken) {
          console.error('❌ No user token found');
          reject(new Error('No user token'));
          return;
        }

        // Fetch user data
        fetch(`../api/users/get-user-data.php?token=${encodeURIComponent(userToken)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => {
          console.log('📡 Response Status:', response.status);
          return response.json();
        })
        .then(data => {
          console.log('📊 Received User Data:', data); // Log full data

          if (data.success) {
            // Store user data
            this.userData = data.user;
            
            // Dispatch event with user data
            const event = new CustomEvent('userDataUpdated', { 
              detail: { user: this.userData } 
            });
            window.dispatchEvent(event);

            // Immediately update interface
            this.updateUserInterface(this.userData);

            resolve(this.userData);
          } else {
            console.error('❌ User Data Fetch Failed:', data.error);
            reject(new Error(data.error || 'Failed to fetch user data'));
          }
        })
        .catch(error => {
          console.error('❌ Error fetching user data:', error);
          reject(error);
        });
      });
    },

    // Update user interface elements
    updateUserInterface: function(userData) {
      console.log('🖥️ Updating User Interface with:', userData);

      // Comprehensive selector for username elements
      const usernameElements = [
        ...document.querySelectorAll('.username'),
        document.querySelector('.dashboard-header'),
        document.querySelector('h2.dashboard-header'),
        document.querySelector('.profile-name') // Added profile name selector
      ].filter(el => el !== null);

      console.log('🔍 Found Username Elements:', usernameElements.length);

      usernameElements.forEach(el => {
        // More robust text replacement
        const currentText = el.textContent;
        const updatedText = currentText.includes(',') 
          ? `Welcome back, ${userData.first_name}!`
          : userData.first_name || 'User';
        
        el.textContent = updatedText;
        console.log('✅ Updated Element:', el, 'with text:', updatedText);
      });

      // Update profile image elements
      const profileImageElements = document.querySelectorAll('.profile-image');
      profileImageElements.forEach(img => {
        const imagePath = `../uploads/profile_images/${userData.profile_image || 'default_profile.png'}`;
        img.src = imagePath;
        console.log('🖼️ Updated Profile Image:', imagePath);
      });
    },

    // Initialize user data management
    init: function() {
      console.log('🚀 Initializing User Data Manager');

      // Fetch user data when script loads
      this.fetchUserData()
        .catch(error => console.error('❌ Initial user data fetch failed:', error));

      // Listen for profile update events
      window.addEventListener('profileUpdated', (event) => {
        console.log('🔄 Profile Updated Event Received:', event.detail);
        
        // If we have new user data, update interface
        if (event.detail && event.detail.user) {
          this.userData = event.detail.user;
          this.updateUserInterface(this.userData);
        } else {
          // If no specific data, re-fetch from server
          this.fetchUserData()
            .catch(error => console.error('❌ User data refresh failed:', error));
        }
      });
    }
  };

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    UserDataManager.init();
  });

  // Expose to global scope
  window.UserDataManager = UserDataManager;
})(); 