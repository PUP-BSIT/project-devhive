document.addEventListener('DOMContentLoaded', () => {
    initializeSettingsPage();
});

function initializeSettingsPage() {
    initializeProfileSection();
    initializeAccountSettings();
    initializeNotificationSettings();
    initializePrivacySettings();
    initializeAdvancedSettings();
    
    const saveButton = document.querySelector('.save-btn');
    if (saveButton) {
    saveButton.addEventListener('click', saveAllSettings);
    }

    // Load saved display name
    loadDisplayName();
    
    // Load saved profile picture
    loadSavedProfilePicture();
    
    // Load saved profile data
    loadSavedProfileData();
    
    // Add styles to document
    addCustomStyles();
    
    // Initialize additional event listeners
    initializeAdditionalEventListeners();
}

function loadDisplayName() {
    const displayNameInput = document.getElementById('display-name');
    const savedDisplayName = localStorage.getItem('userDisplayName');
    if (savedDisplayName && displayNameInput) {
        displayNameInput.value = savedDisplayName;
        updateDisplayNameInProfile(savedDisplayName);
    }
}

function updateDisplayNameInProfile(displayName) {
    // Update display name in user profile page
    const profileNameElements = [
        document.querySelector('.profile-details h2')
    ];

    profileNameElements.forEach(element => {
        if (element) {
            element.textContent = displayName;
        }
    });
}

function initializeProfileSection() {
    const changePhotoBtn = document.querySelector('.change-photo-btn');
    if (changePhotoBtn) {
    changePhotoBtn.addEventListener('click', handleProfilePhotoChange);
    }
    
    // Handle photo upload button and input
    const photoUploadBtn = document.getElementById('change-photo-btn');
    const photoUploadInput = document.getElementById('photo-upload');
    
    if (photoUploadBtn && photoUploadInput) {
        photoUploadBtn.addEventListener('click', () => {
            photoUploadInput.click();
        });

        photoUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const profileImage = document.getElementById('profile-image');
                    if (profileImage) {
                        profileImage.src = e.target.result;
                        localStorage.setItem('userProfileAvatar', e.target.result);
                        updateAllProfileAvatars(e.target.result);
                        showSaveMessage('Profile picture updated successfully!');
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function handleProfilePhotoChange() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target.result;
                
                // Save avatar to local storage
                localStorage.setItem('userProfileAvatar', imageData);
                
                // Update all profile avatars in the current page
                updateAllProfileAvatars(imageData);
                
                // Save the change immediately
                saveProfileChanges();
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

function updateAllProfileAvatars(imageUrl) {
    // Update avatar in settings page
    const settingsAvatars = document.querySelectorAll('.profile-avatar img, #profile-image');
    settingsAvatars.forEach(avatar => {
        avatar.src = imageUrl;
    });
    
    // Update avatar in user profile page if it exists
    const userProfileAvatars = document.querySelectorAll('#user-profile-avatar, .user-avatar img');
    userProfileAvatars.forEach(avatar => {
        avatar.src = imageUrl;
    });
}

function saveProfileChanges() {
    const settings = {
        lastUpdated: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    // Show success message
    showSaveMessage('Changes saved successfully!');
}

function initializeAccountSettings() {
    const displayNameInput = document.getElementById('display-name');
    const emailInput = document.getElementById('email');
    
    if (displayNameInput) {
    // Add real-time display name update
    displayNameInput.addEventListener('input', function() {
        const newDisplayName = this.value;
        updateDisplayNameInProfile(newDisplayName);
        localStorage.setItem('userDisplayName', newDisplayName);
    });
    
    displayNameInput.addEventListener('change', validateAndUpdateDisplayName);
    }
    
    if (emailInput) {
    emailInput.addEventListener('change', validateAndUpdateEmail);
    }

    // Initialize password change functionality
    initializePasswordChange();
    
    const twoFactorToggle = document.querySelector('.setting-item:nth-child(4) .toggle-switch');
    if (twoFactorToggle) {
    twoFactorToggle.addEventListener('click', () => toggleSwitch(twoFactorToggle));
    }
}

function initializePasswordChange() {
    const passwordSection = document.querySelector('.setting-item:has(#current-password)');
    if (!passwordSection) return;

    // Initially hide password fields
    const passwordFields = document.querySelector('.password-change-fields');
    if (passwordFields) {
        passwordFields.style.display = 'none';
    }

    // Add change password button if it doesn't exist
    let changePasswordBtn = document.getElementById('change-password-btn');
    if (!changePasswordBtn) {
        changePasswordBtn = document.createElement('button');
        changePasswordBtn.id = 'change-password-btn';
        changePasswordBtn.className = 'update-btn';
        changePasswordBtn.textContent = 'Change Password';
        passwordSection.appendChild(changePasswordBtn);
    }

    // Add event listener to toggle password fields
    changePasswordBtn.addEventListener('click', () => {
        const fields = document.querySelector('.password-change-fields');
        if (fields) {
            if (fields.style.display === 'none') {
                fields.style.display = 'block';
                changePasswordBtn.textContent = 'Cancel';
            } else {
                fields.style.display = 'none';
                changePasswordBtn.textContent = 'Change Password';
                // Clear password fields
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
            }
        }
    });

    // Add update password functionality
    const updatePasswordBtn = document.querySelector('.password-change-fields button');
    if (updatePasswordBtn) {
        updatePasswordBtn.addEventListener('click', handlePasswordUpdate);
    }
}

function handlePasswordUpdate() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
        showSaveMessage('Please fill in all password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showSaveMessage('New passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 8) {
        showSaveMessage('Password must be at least 8 characters long', 'error');
        return;
    }

    // Verify current password (in a real app, this would be an API call)
    const savedPassword = localStorage.getItem('userPassword');
    if (savedPassword && savedPassword !== currentPassword) {
        showSaveMessage('Current password is incorrect', 'error');
        return;
    }

    // Save new password
    localStorage.setItem('userPassword', newPassword);
    
    // Clear and hide password fields
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    
    const passwordFields = document.querySelector('.password-change-fields');
    if (passwordFields) {
        passwordFields.style.display = 'none';
    }

    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.textContent = 'Change Password';
    }

    showSaveMessage('Password updated successfully!');
}

function validateAndUpdateDisplayName(e) {
    const displayName = e.target.value.trim();
    if (displayName.length < 3) {
        alert('Display name must be at least 3 characters long');
        e.target.value = e.target.defaultValue;
        return;
    }
    e.target.defaultValue = displayName;
}

function validateAndUpdateEmail(e) {
    const email = e.target.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        e.target.value = e.target.defaultValue;
        return;
    }
    e.target.defaultValue = email;
}

function initializeNotificationSettings() {
    const notificationToggles = document.querySelectorAll('.settings-section:nth-child(2) .toggle-switch');
    notificationToggles.forEach(toggle => {
        toggle.addEventListener('click', () => toggleSwitch(toggle));
    });
}

function initializePrivacySettings() {
    const profileVisibilityDropdown = document.querySelector('.settings-section:nth-child(3) .dropdown-btn');
    const dataSharingToggle = document.querySelector('.settings-section:nth-child(3) .toggle-switch');
    const managePermissionsBtn = document.querySelector('.settings-section:nth-child(3) .action-btn');
    
    if (profileVisibilityDropdown) {
    profileVisibilityDropdown.addEventListener('click', handleProfileVisibilityDropdown);
    }
    if (dataSharingToggle) {
    dataSharingToggle.addEventListener('click', () => toggleSwitch(dataSharingToggle));
    }
    if (managePermissionsBtn) {
    managePermissionsBtn.addEventListener('click', handleManagePermissions);
    }
}

function handleProfileVisibilityDropdown(e) {
    const dropdown = e.target.closest('.dropdown');
    const options = ['Public', 'Private', 'Friends Only'];
    
    const existingMenu = document.querySelector('.dropdown-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.innerHTML = options.map(option => `<div class="dropdown-item">${option}</div>`).join('');
    
    dropdown.appendChild(menu);

    menu.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            e.target.textContent = item.textContent;
            menu.remove();
        });
    });
}

function handleManagePermissions() {
    alert('Navigating to permissions management...');
}

function initializeAdvancedSettings() {
    const timeZoneDropdown = document.querySelector('.settings-section:nth-child(4) .dropdown-btn:nth-child(1)');
    const languageDropdown = document.querySelector('.settings-section:nth-child(4) .dropdown-btn:nth-child(2)');
    const exportDataBtn = document.querySelector('.action-btn:not(.danger)');
    const deleteAccountBtn = document.querySelector('.action-btn.danger');
    
    if (timeZoneDropdown) {
    timeZoneDropdown.addEventListener('click', handleTimeZoneDropdown);
    }
    if (languageDropdown) {
    languageDropdown.addEventListener('click', handleLanguageDropdown);
    }
    if (exportDataBtn) {
    exportDataBtn.addEventListener('click', handleDataExport);
    }
    if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', handleAccountDeletion);
    }
}

function handleTimeZoneDropdown(e) {
    const dropdown = e.target.closest('.dropdown');
    const timeZones = [
        '(UTC-08:00) Pacific Time',
        '(UTC-05:00) Eastern Time',
        '(UTC+00:00) GMT',
        '(UTC+01:00) Central European Time',
        '(UTC+08:00) Asia/Singapore'
    ];
    
    showDropdownMenu(dropdown, timeZones, e.target);
}

function handleLanguageDropdown(e) {
    const dropdown = e.target.closest('.dropdown');
    const languages = [
        'English (US)',
        'Spanish (ES)',
        'French (FR)',
        'German (DE)',
        'Japanese (JP)'
    ];
    
    showDropdownMenu(dropdown, languages, e.target);
}

function showDropdownMenu(dropdown, options, button) {
    const existingMenu = document.querySelector('.dropdown-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.innerHTML = options.map(option => `<div class="dropdown-item">${option}</div>`).join('');
    
    dropdown.appendChild(menu);
    
    menu.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            button.textContent = item.textContent;
            menu.remove();
        });
    });
}

function handleDataExport() {
    alert('Preparing your data export...');
    setTimeout(() => {
        const dummyData = {
            profile: { /* user profile data */ },
            posts: [ /* user posts */ ],
            settings: { /* user settings */ }
        };
        const dataStr = JSON.stringify(dummyData);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'user_data_export.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }, 1000);
}

function handleAccountDeletion() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        if (prompt('Please type "DELETE" to confirm account deletion:') === 'DELETE') {
            alert('Account deletion process initiated. You will be logged out.');
            window.location.href = '/';
        }
    }
}

function toggleSwitch(element) {
    element.classList.toggle('active');
}

function saveAllSettings() {
    // Get current settings from localStorage or initialize empty object
    let currentSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    
    const displayNameInput = document.querySelector('input[placeholder="User Name"]') || document.getElementById('display-name');
    const emailInput = document.querySelector('input[placeholder="user.example@gmail.com"]') || document.getElementById('email');
    const twoFactorToggle = document.querySelector('.setting-item:nth-child(4) .toggle-switch');
    
    const newSettings = {
        displayName: displayNameInput ? displayNameInput.value : '',
        email: emailInput ? emailInput.value : '',
        twoFactorEnabled: twoFactorToggle ? twoFactorToggle.classList.contains('active') : false,
        notifications: {
            email: document.querySelector('.settings-section:nth-child(2) .toggle-switch:nth-child(1)')?.classList.contains('active') || false,
            push: document.querySelector('.settings-section:nth-child(2) .toggle-switch:nth-child(2)')?.classList.contains('active') || false,
            performance: document.querySelector('.settings-section:nth-child(2) .toggle-switch:nth-child(3)')?.classList.contains('active') || false,
            engagement: document.querySelector('.settings-section:nth-child(2) .toggle-switch:nth-child(4)')?.classList.contains('active') || false,
            scheduled: document.querySelector('.settings-section:nth-child(2) .toggle-switch:nth-child(5)')?.classList.contains('active') || false
        },
        privacy: {
            profileVisibility: document.querySelector('.settings-section:nth-child(3) .dropdown-btn')?.textContent.trim() || 'Public',
            dataSharing: document.querySelector('.settings-section:nth-child(3) .toggle-switch')?.classList.contains('active') || false
        },
        advanced: {
            timeZone: document.querySelector('.settings-section:nth-child(4) .dropdown-btn:nth-child(1)')?.textContent.trim() || '(UTC+00:00) GMT',
            language: document.querySelector('.settings-section:nth-child(4) .dropdown-btn:nth-child(2)')?.textContent.trim() || 'English (US)'
        },
        lastUpdated: new Date().toISOString()
    };

    // Merge new settings with current settings
    const mergedSettings = { ...currentSettings, ...newSettings };

    // Save to localStorage
    localStorage.setItem('userSettings', JSON.stringify(mergedSettings));

    // Handle display name update
    const displayName = newSettings.displayName.trim();
    if (displayName) {
        localStorage.setItem('userDisplayName', displayName);
        updateDisplayNameInProfile(displayName);
    }

    // Handle email update
    const email = newSettings.email.trim();
    if (email) {
        localStorage.setItem('userEmail', email);
    }

    // Show success message
    showSaveMessage('All settings saved successfully!');
}

function loadSavedProfilePicture() {
    const savedAvatar = localStorage.getItem('userProfileAvatar');
    if (savedAvatar) {
        updateAllProfileAvatars(savedAvatar);
    }
}

function loadSavedProfileData() {
    // Load saved display name
    const savedDisplayName = localStorage.getItem('userDisplayName');
    const displayNameInput = document.getElementById('display-name');
    if (savedDisplayName && displayNameInput) {
        displayNameInput.value = savedDisplayName;
    }

    // Load saved email
    const savedEmail = localStorage.getItem('userEmail');
    const emailInput = document.getElementById('email');
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
    }

    // Load saved profile picture
    const savedAvatar = localStorage.getItem('userProfileAvatar');
    const profileImage = document.getElementById('profile-image');
    if (savedAvatar && profileImage) {
        profileImage.src = savedAvatar;
        }
}

function initializeAdditionalEventListeners() {
    // Handle save changes button
    const saveChangesBtn = document.getElementById('save-changes-btn');
    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', handleSaveChanges);
    }

    // Handle delete account button
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    }

    // Handle logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function handleSaveChanges() {
    const displayNameInput = document.getElementById('display-name');
    const emailInput = document.getElementById('email');
    let hasChanges = false;

    if (displayNameInput && displayNameInput.value.trim()) {
        localStorage.setItem('userDisplayName', displayNameInput.value.trim());
        updateDisplayNameInProfile(displayNameInput.value.trim());
        hasChanges = true;
    }

    if (emailInput && emailInput.value.trim()) {
        localStorage.setItem('userEmail', emailInput.value.trim());
        hasChanges = true;
        }

    if (hasChanges) {
        showSaveMessage('Changes saved successfully!');
    }
}

function handleDeleteAccount() {
        const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.');
        
        if (confirmDelete) {
        // Here you would typically make an API call to delete the account
        showSaveMessage('Account deleted successfully');
        setTimeout(() => {
            window.location.href = '../login/index.html';
        }, 1500);
        }
}

function handleLogout() {
    // Here you would typically clear user session/tokens
    showSaveMessage('Logged out successfully');
    setTimeout(() => {
        window.location.href = '../login/index.html';
    }, 1500);
}

function showSaveMessage(message, type = 'success') {
    // Remove any existing messages first
    const existingMessages = document.querySelectorAll('.save-message');
    existingMessages.forEach(msg => msg.remove());
    
    const saveMessage = document.createElement('div');
    saveMessage.className = 'save-message';
    saveMessage.textContent = message;
    saveMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        color: white;
        background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
    `;
    
    document.body.appendChild(saveMessage);
    
    setTimeout(() => {
        saveMessage.remove();
    }, 3000);
}

function addCustomStyles() {
    // Check if styles already exist
    if (document.getElementById('custom-settings-styles')) {
        return;
    }
    
    const styles = document.createElement('style');
    styles.id = 'custom-settings-styles';
    styles.textContent = `
        .dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 1000;
            max-height: 200px;
            overflow-y: auto;
        }

        .dropdown-item {
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: 1px solid #eee;
        }

        .dropdown-item:last-child {
            border-bottom: none;
        }

        .dropdown-item:hover {
            background-color: #f8f9fa;
        }

        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 24px;
            background-color: #ccc;
            border-radius: 12px;
            cursor: pointer;
            transition: background-color 0.3s;
        }

        .toggle-switch:before {
            content: '';
            position: absolute;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: white;
            top: 2px;
            left: 2px;
            transition: left 0.3s;
        }

        .toggle-switch.active {
            background-color: #4CAF50;
        }

        .toggle-switch.active:before {
            left: 28px;
        }

        .dropdown {
            position: relative;
            display: inline-block;
        }

        .password-change-fields {
            margin-top: 15px;
            display: none;
        }

        .password-change-fields input {
            margin-bottom: 10px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 100%;
        }

        .update-btn {
            background-color: #007bff;
            color: white;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
        }

        .update-btn:hover {
            background-color: #0056b3;
        }
    `;
    document.head.appendChild(styles);
}