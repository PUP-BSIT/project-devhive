
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
