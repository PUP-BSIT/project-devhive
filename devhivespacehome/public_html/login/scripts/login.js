document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const identifier = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    emailInput.classList.remove("error", "success");
    passwordInput.classList.remove("error", "success");

    if (!identifier || !password) {
      if (!identifier) emailInput.classList.add("error");
      if (!password) passwordInput.classList.add("error");
      alert("Please fill in all fields");
      return;
    }

    if (!isValidEmail(identifier)) {
      emailInput.classList.add("error");
      alert("Please enter a valid email address");
      return;
    }

    emailInput.classList.add("success");
    passwordInput.classList.add("success");

    handleLoginLoading(true);

    fetch("/api/auth/login.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        handleLoginLoading(false);
        if (data.success) {
          // Optionally redirect if backend provides a URL
          if (data.redirect_url) {
            // Extract session ID from redirect_url
            const match = data.redirect_url.match(/PHPSESSID=([a-zA-Z0-9]+)/);
            if (match) {
              localStorage.setItem("PHPSESSID", match[1]);
            }
            window.location.href = data.redirect_url;
          } else {
            // After successful login and you have the sessionId from the server:
            localStorage.setItem("PHPSESSID", data.sessionId);
            window.location.href =
              "/dashboard/dashboard.php?PHPSESSID=" + data.sessionId;
          }
        } else {
          alert(data.message || "Login failed. Please try again.");
        }
      })
      .catch((error) => {
        handleLoginLoading(false);
        console.error("Error:", error);
        alert("An error occurred during login. Please try again.");
      });
  });

  function handleLoginLoading(isLoading) {
    const btn = document.querySelector(".login-btn");

    if (isLoading) {
      btn.classList.add("loading");
      btn.textContent = "Accessing Your Hive...";
      btn.disabled = true;
    } else {
      btn.classList.remove("loading");
      btn.textContent = "Access Your Hive";
      btn.disabled = false;
    }
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  const forgotLink = document.querySelector(".forgot-link");
  if (forgotLink) {
    forgotLink.addEventListener("click", function (e) {
      e.preventDefault();
      const email = prompt("Enter your email address to reset password:");
      if (email && isValidEmail(email)) {
        alert("Password reset instructions have been sent to " + email);
      } else if (email) {
        alert("Please enter a valid email address");
      }
    });
  }

  document.querySelectorAll(".form-input").forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentElement.classList.add("focused");
      this.parentElement.classList.remove("unfocused");
    });

    input.addEventListener("blur", function () {
      this.parentElement.classList.add("unfocused");
      this.parentElement.classList.remove("focused");
    });
  });

  document.querySelectorAll(".form-group").forEach((group) => {
    group.classList.add("unfocused");
  });
});
