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
        // Optionally store the user's email for the verification page
        sessionStorage.setItem("user_email", userData.email);
        window.location.href = "email_verify.html";
      } else {
        alert(data.message || "Registration failed. Please try again.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred during registration. Please try again.");
    });
});

