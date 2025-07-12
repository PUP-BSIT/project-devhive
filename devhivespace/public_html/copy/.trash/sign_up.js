document.getElementById("signup-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const form = e.target;
  const userData = {
    email: form.querySelector('input[name="email"]').value,
    username: form.querySelector('input[name="username"]').value,
    first_name: form.querySelector('input[name="first_name"]').value,
    middle_name: form.querySelector('input[name="middle_name"]').value || null,
    last_name: form.querySelector('input[name="last_name"]').value,
    birthday: form.querySelector('input[name="birthday"]').value,
    password: form.querySelector('input[name="password"]').value,
    confirm_password: form.querySelector('input[name="confirm_password"]')
      .value,
  };

  console.log(userData);
  // Validate password match
  if (userData.password !== userData.confirm_password) {
    alert("Passwords do not match!");
    return;
  }

  // Validate password length
  if (userData.password.length < 8) {
    alert("Password must be at least 8 characters long!");
    return;
  }

  fetch("/api/auth/register.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          try {
            return JSON.parse(text);
          } catch (e) {
            throw new Error("Server returned non-JSON response: " + text);
          }
        });
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        alert(
          "Registration successful! Please check your email for verification."
        );
        window.location.href = "emailVerify.html";
      } else {
        alert(data.message || "Registration failed. Please try again.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred during registration. Please try again.");
    });
});

function handleGoogleSignUp() {
  fetch("/api/auth/google.php")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        window.location.href = data.auth_url;
      } else {
        alert(data.message || "Failed to initialize Google sign up");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred during Google sign-up. Please try again.");
    });
}
