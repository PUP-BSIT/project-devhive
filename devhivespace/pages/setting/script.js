// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    initializeSettingsPage();
});

function initializeSettingsPage() {
    // Initialize all event listeners
    initializeProfileSection();
    initializeAccountSettings();
    initializeNotificationSettings();
    initializePrivacySettings();
    initializeAdvancedSettings();
    
    // Initialize save button
    const saveButton = document.querySelector('.save-btn');
    saveButton.addEventListener('click', saveAllSettings);
}

// Profile Section Functions
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
                profileAvatar.innerHTML = ''; // Clear the default emoji
                profileAvatar.style.backgroundImage = `url(${e.target.result})`;
                profileAvatar.style.backgroundSize = 'cover';
                profileAvatar.style.backgroundPosition = 'center';
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// Account Settings Functions
function initializeAccountSettings() {
    // Display Name and Email Input Handlers
    const displayNameInput = document.querySelector('input[placeholder="User Name"]');
    const emailInput = document.querySelector('input[placeholder="user.example@gmail.com"]');
    
    displayNameInput.addEventListener('change', validateAndUpdateDisplayName);
    emailInput.addEventListener('change', validateAndUpdateEmail);
    
    // Password Update Button
    const updatePasswordBtn = document.querySelector('.update-btn');
    updatePasswordBtn.addEventListener('click', handlePasswordUpdate);
    
    // Two-Factor Authentication Toggle
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
    // Here you would typically make an API call to update the display name
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
    // Here you would typically make an API call to update the email
    e.target.defaultValue = email;
}

function handlePasswordUpdate() {
    // Create and show password update modal
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
    
    // Here you would typically make an API call to update the password
    closePasswordModal();
    alert('Password updated successfully');
}

function closePasswordModal() {
    const modal = document.querySelector('.password-modal');
    if (modal) {
        modal.remove();
    }
}

// Notification Settings Functions
function initializeNotificationSettings() {
    const notificationToggles = document.querySelectorAll('.settings-section:nth-child(2) .toggle-switch');
    notificationToggles.forEach(toggle => {
        toggle.addEventListener('click', () => toggleSwitch(toggle));
    });
}

// Privacy Settings Functions
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
    
    // Remove existing dropdown menu if it exists
    const existingMenu = document.querySelector('.dropdown-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    // Create and show dropdown menu
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.innerHTML = options.map(option => `<div class="dropdown-item">${option}</div>`).join('');
    
    dropdown.appendChild(menu);
    
    // Add click events to dropdown items
    menu.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            e.target.textContent = item.textContent;
            menu.remove();
        });
    });
}

function handleManagePermissions() {
    // Here you would typically navigate to a permissions management page
    alert('Navigating to permissions management...');
}

// Advanced Settings Functions
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
    // Remove existing dropdown menu if it exists
    const existingMenu = document.querySelector('.dropdown-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    // Create and show dropdown menu
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.innerHTML = options.map(option => `<div class="dropdown-item">${option}</div>`).join('');
    
    dropdown.appendChild(menu);
    
    // Add click events to dropdown items
    menu.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            button.textContent = item.textContent;
            menu.remove();
        });
    });
}

function handleDataExport() {
    // Here you would typically trigger a data export process
    alert('Preparing your data export...');
    // Simulate export process
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
            // Here you would typically make an API call to delete the account
            alert('Account deletion process initiated. You will be logged out.');
            // Redirect to logout or home page
            window.location.href = '/';
        }
    }
}

// Utility Functions
function toggleSwitch(element) {
    element.classList.toggle('active');
    // Here you would typically make an API call to update the setting
}

function saveAllSettings() {
    // Collect all settings
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
    
    // Here you would typically make an API call to save all settings
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
} 