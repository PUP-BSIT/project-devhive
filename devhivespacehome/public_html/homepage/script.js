const storedSessionId = localStorage.getItem('PHPSESSID');
if (storedSessionId) {
  window.location.href = '/dashboard/dashboard.php?PHPSESSID=' + storedSessionId;
}

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.querySelector(".login-btn");
  const signUpBtn = document.querySelector(".signup-btn");

  console.log("Login button:", loginBtn);
  console.log("Signup button:", signUpBtn);

  if (loginBtn) {
    loginBtn.addEventListener("click", (event) => {
      event.preventDefault();
      console.log("Login button clicked");
      window.location.href = "/../login/index.html";
    });
  } else {
    console.error("Login button not found");
  }

  if (signUpBtn) {
    signUpBtn.addEventListener("click", (event) => {
      event.preventDefault();
      console.log("Signup button clicked");
      window.location.href = "/../signup/index.html";
    });
  } else {
    console.error("Signup button not found");
  }

});