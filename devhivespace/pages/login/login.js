document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  emailInput.classList.remove("error", "success");
  passwordInput.classList.remove("error", "success");

  if (!email || !password) {
    if (!email) emailInput.classList.add("error");
    if (!password) passwordInput.classList.add("error");
    alert("Please fill in all fields");
    return;
  }

  if (!isValidEmail(email)) {
    emailInput.classList.add("error");
    alert("Please enter a valid email address");
    return;
  }

  emailInput.classList.add("success");
  passwordInput.classList.add("success");

  handleLoginLoading(true);

  setTimeout(() => {
    alert("Login successful! Welcome to DevHive.Space");
    handleLoginLoading(false);
    document.getElementById("loginForm").reset();
    emailInput.classList.remove("success");
    passwordInput.classList.remove("success");
  }, 2000);
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

document.querySelector(".google-btn").addEventListener("click", function (e) {
  e.preventDefault();
  alert("Google login integration would be implemented here");
});

document.querySelector(".apple-btn").addEventListener("click", function (e) {
  e.preventDefault();
  alert("Apple login integration would be implemented here");
});

document.querySelector(".forgot-link").addEventListener("click", function (e) {
  e.preventDefault();
  const email = prompt("Enter your email address to reset password:");
  if (email && isValidEmail(email)) {
    alert("Password reset instructions have been sent to " + email);
  } else if (email) {
    alert("Please enter a valid email address");
  }
});

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

function addFloatingHexagon() {
  const hexagon = document.createElement("div");
  hexagon.className = "floating-hexagon";

  const size = Math.random() * 20 + 10;
  hexagon.style.width = size + "px";
  hexagon.style.height = size + "px";
  hexagon.style.left = Math.random() * 100 + "%";
  hexagon.style.top = "100%";

  document.body.appendChild(hexagon);

  setTimeout(() => {
    if (hexagon.parentNode) {
      hexagon.remove();
    }
  }, 8000);
}

setInterval(addFloatingHexagon, 3000);

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".form-group").forEach((group) => {
    group.classList.add("unfocused");
  });
});
