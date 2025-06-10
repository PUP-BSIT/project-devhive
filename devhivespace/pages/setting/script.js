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
    saveButton.addEventListener('click', saveAllSettings);

    // Load saved display name
    loadDisplayName();
}

function loadDisplayName() {
    const displayNameInput = document.getElementById('display-name');
    const savedDisplayName = localStorage.getItem('userDisplayName');
    if (savedDisplayName) {
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
    changePhotoBtn.addEventListener('click', handleProfilePhotoChange);
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
                const profileAvatar = document.querySelector('.profile-avatar');
                const avatarImage = profileAvatar.querySelector('img');
                
                // Save avatar to local storage
                localStorage.setItem('userProfileAvatar', e.target.result);
                
                // Update avatar in settings page
                if (avatarImage) {
                    avatarImage.src = e.target.result;
                } else {
                    const newAvatarImg = document.createElement('img');
                    newAvatarImg.src = e.target.result;
                    newAvatarImg.id = 'profile-image';
                    newAvatarImg.alt = 'Profile Avatar';
                    profileAvatar.innerHTML = '';
                    profileAvatar.appendChild(newAvatarImg);
                }
                
                // Update avatar in user profile page if open
                const userProfileAvatar = document.querySelector('#user-profile-avatar');
                if (userProfileAvatar) {
                    userProfileAvatar.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}


function initializeAccountSettings() {
    const displayNameInput = document.getElementById('display-name');
    const emailInput = document.getElementById('email');
    
    // Add real-time display name update
    displayNameInput.addEventListener('input', function() {
        const newDisplayName = this.value;
        updateDisplayNameInProfile(newDisplayName);
        
        // Optionally, save to local storage immediately
        localStorage.setItem('userDisplayName', newDisplayName);
    });
    
    displayNameInput.addEventListener('change', validateAndUpdateDisplayName);
    emailInput.addEventListener('change', validateAndUpdateEmail);
    
    const updatePasswordBtn = document.querySelector('.update-btn');
    updatePasswordBtn.addEventListener('click', handlePasswordUpdate);
    
    const twoFactorToggle = document.querySelector('.setting-item:nth-child(4) .toggle-switch');
    twoFactorToggle.addEventListener('click', () => toggleSwitch(twoFactorToggle));
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

function handlePasswordUpdate() {
    const modal = createPasswordUpdateModal();
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function createPasswordUpdateModal() {
    const modal = document.createElement('div');
    modal.className = 'password-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Update Password</h3>
            <input type="password" placeholder="Current Password" id="currentPassword">
            <input type="password" placeholder="New Password" id="newPassword">
            <input type="password" placeholder="Confirm New Password" id="confirmPassword">
            <div class="modal-buttons">
                <button onclick="updatePassword()">Update</button>
                <button onclick="closePasswordModal()">Cancel</button>
            </div>
        </div>
    `;
    return modal;
}

function updatePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
    if (newPassword.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }
    
    closePasswordModal();
    alert('Password updated successfully');
}

function closePasswordModal() {
    const modal = document.querySelector('.password-modal');
    if (modal) {
        modal.remove();
    }
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
    
    profileVisibilityDropdown.addEventListener('click', handleProfileVisibilityDropdown);
    dataSharingToggle.addEventListener('click', () => toggleSwitch(dataSharingToggle));
    managePermissionsBtn.addEventListener('click', handleManagePermissions);
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
    
    timeZoneDropdown.addEventListener('click', handleTimeZoneDropdown);
    languageDropdown.addEventListener('click', handleLanguageDropdown);
    exportDataBtn.addEventListener('click', handleDataExport);
    deleteAccountBtn.addEventListener('click', handleAccountDeletion);
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
    const settings = {
        displayName: document.querySelector('input[placeholder="User Name"]').value,
        email: document.querySelector('input[placeholder="user.example@gmail.com"]').value,
        twoFactorEnabled: document.querySelector('.setting-item:nth-child(4) .toggle-switch').classList.contains('active'),
        notifications: {
            email: document.querySelector('.settings-section:nth-child(2) .toggle-switch:nth-child(1)').classList.contains('active'),
            push: document.querySelector('.settings-section:nth-child(2) .toggle-switch:nth-child(2)').classList.contains('active'),
            performance: document.querySelector('.settings-section:nth-child(2) .toggle-switch:nth-child(3)').classList.contains('active'),
            engagement: document.querySelector('.settings-section:nth-child(2) .toggle-switch:nth-child(4)').classList.contains('active'),
            scheduled: document.querySelector('.settings-section:nth-child(2) .toggle-switch:nth-child(5)').classList.contains('active')
        },
        privacy: {
            profileVisibility: document.querySelector('.settings-section:nth-child(3) .dropdown-btn').textContent.trim(),
            dataSharing: document.querySelector('.settings-section:nth-child(3) .toggle-switch').classList.contains('active')
        },
        advanced: {
            timeZone: document.querySelector('.settings-section:nth-child(4) .dropdown-btn:nth-child(1)').textContent.trim(),
            language: document.querySelector('.settings-section:nth-child(4) .dropdown-btn:nth-child(2)').textContent.trim()
        }
    };

    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');

    // Existing save logic
    const displayNameInput = document.getElementById('display-name');
    const displayName = displayNameInput.value.trim();

    if (displayName) {
        // Save display name to local storage
        localStorage.setItem('userDisplayName', displayName);
        
        // Update display name in profile
        updateDisplayNameInProfile(displayName);
    }

    // Rest of the existing save logic
    alert('Settings saved successfully!');
}

document.addEventListener('DOMContentLoaded', () => {
    const photoUploadBtn = document.getElementById('change-photo-btn');
    const photoUploadInput = document.getElementById('photo-upload');
    const profileImage = document.getElementById('profile-image');

    photoUploadBtn.addEventListener('click', () => {
        photoUploadInput.click();
    });

    photoUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profileImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    const changePasswordBtn = document.getElementById('change-password-btn');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    changePasswordBtn.addEventListener('click', () => {
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Please fill in all password fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        alert('Password changed successfully');

        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
    });

    const saveChangesBtn = document.getElementById('save-changes-btn');
    const displayNameInput = document.getElementById('display-name');
    const emailInput = document.getElementById('email');

    saveChangesBtn.addEventListener('click', () => {
        const displayName = displayNameInput.value;
        const email = emailInput.value;

        if (!displayName || !email) {
            alert('Please fill in display name and email');
            return;
        }

        alert('Changes saved successfully');
    });

    const deleteAccountBtn = document.getElementById('delete-account-btn');

    deleteAccountBtn.addEventListener('click', () => {
        const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.');
        
        if (confirmDelete) {
            alert('Account deleted successfully');
            window.location.href = '../login/index.html';
        }
    });

    const logoutBtn = document.getElementById('logout-btn');

    logoutBtn.addEventListener('click', () => {
        alert('Logged out successfully');
        window.location.href = '../login/index.html';
    });
}); 