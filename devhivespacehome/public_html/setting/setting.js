function handlePasswordUpdate() {
  const currentPassword = document.getElementById("current-password").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    showNotification("Please fill in all password fields", "error");
    return;
  }

  if (newPassword !== confirmPassword) {
    showNotification("New passwords do not match", "error");
    document.getElementById("confirm-password").value = "";
    document.getElementById("confirm-password").focus();
    return;
  }

  if (newPassword.length < 8) {
    showNotification("Password must be at least 8 characters long", "error");
    document.getElementById("new-password").value = "";
    document.getElementById("confirm-password").value = "";
    document.getElementById("new-password").focus();
    return;
  }

  updatePasswordOnServer(currentPassword, newPassword);
}

function updatePasswordOnServer(currentPassword, newPassword) {
  const userToken = localStorage.getItem('user_token') || sessionStorage.getItem('user_token');
  
  if (!userToken) {
    showNotification("Please log in again to update password", "error");
    return;
  }

  const updateData = {
    token: userToken,
    current_password: currentPassword,
    new_password: newPassword
  };

  fetch('../api/users/update-password.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showNotification("Password updated successfully", "success");
      document.getElementById("current-password").value = "";
      document.getElementById("new-password").value = "";
      document.getElementById("confirm-password").value = "";
    } else {
      showNotification(data.message || "Failed to update password", "error");
      // Clear only the current password field if it's wrong
      if (data.error === "incorrect_current_password") {
        document.getElementById("current-password").value = "";
        document.getElementById("current-password").focus();
      }
    }
  })
  .catch(error => {
    console.error('Error updating password:', error);
    showNotification("An error occurred while updating password", "error");
  });
}

function showNotification(message, type = "info") {
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button class="notification-close" onclick="this.parentElement.remove()">×</button>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  const changePasswordBtn = document.getElementById("change-password-btn");
  if (changePasswordBtn) {
    changePasswordBtn.replaceWith(changePasswordBtn.cloneNode(true));
    
    const newChangePasswordBtn = document.getElementById("change-password-btn");
    newChangePasswordBtn.addEventListener("click", handlePasswordUpdate);
  }

  const updatePasswordBtn = document.querySelector(".update-btn");
  if (updatePasswordBtn) {
    updatePasswordBtn.replaceWith(updatePasswordBtn.cloneNode(true));
    const newUpdatePasswordBtn = document.querySelector(".update-btn");
    newUpdatePasswordBtn.addEventListener("click", handlePasswordUpdate);
  }

  // Add logout button event listener
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      fetch("../api/auth/logout.php", {
        method: "POST",
        credentials: "include"
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            // Optionally clear local/session storage
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = data.redirect || "/login/index.html";
          } else {
            showNotification(data.message || "Logout failed", "error");
          }
        })
        .catch(() => {
          showNotification("Logout error", "error");
        });
    });
  }

  // Add logic for saving display name
  const saveChangesBtn = document.getElementById("save-changes-btn");
  if (saveChangesBtn) {
    saveChangesBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const displayNameInput = document.getElementById("display-name");
      if (displayNameInput) {
        const newDisplayName = displayNameInput.value.trim();
        if (newDisplayName.length === 0) {
          showNotification("Display name cannot be empty", "error");
          return;
        }
        // Save to localStorage
        localStorage.setItem("userDisplayName", newDisplayName);
        // Trigger storage event for other tabs/pages
        window.dispatchEvent(new StorageEvent('storage', { key: 'userDisplayName', newValue: newDisplayName }));
        showNotification("Display name updated!", "success");
      }
    });
  }

  // Profile photo change logic
  const changePhotoBtn = document.getElementById("change-photo-btn");
  const photoUploadInput = document.getElementById("photo-upload");
  const profileImage = document.getElementById("profile-image");

  if (changePhotoBtn && photoUploadInput && profileImage) {
    changePhotoBtn.addEventListener("click", function () {
      photoUploadInput.click();
    });

    photoUploadInput.addEventListener("change", function () {
      const file = this.files[0];
      if (!file) return;

      // Optionally: validate file type/size here

      const formData = new FormData();
      formData.append("avatar", file);

      // Add user token if needed for authentication
      const userToken = localStorage.getItem('user_token') || sessionStorage.getItem('user_token');
      if (userToken) {
        formData.append("token", userToken);
      }

      fetch("../api/users/upload-avatar.php", {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.avatar_url) {
            profileImage.src = data.avatar_url;
            showNotification("Profile photo updated!", "success");
          } else {
            showNotification(data.message || "Failed to update photo", "error");
          }
        })
        .catch(() => {
          showNotification("Error uploading photo", "error");
        });
    });
  }
});

function createPasswordUpdateModal() {
  return null;
}

function updatePassword() {
  return;
}

function closePasswordModal() {
  return;
}
