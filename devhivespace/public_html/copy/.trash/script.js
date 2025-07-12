document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.querySelector(".login-btn");
  const signUpBtn = document.querySelector(".signup-btn");

  if (loginBtn) {
    loginBtn.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "../login/index.html";
    });
  } else {
    console.error("Login button not found");
  }

  if (signUpBtn) {
    signUpBtn.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "../signup/index.html";
    });
  } else {
    console.error("Signup button not found");
  }
});