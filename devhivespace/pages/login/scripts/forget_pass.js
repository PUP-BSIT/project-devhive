document.addEventListener("DOMContentLoaded", function () {
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");

  forgotPasswordForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;

    alert(
      "If an account exists with this email, you will receive a password reset link shortly."
    );

    forgotPasswordForm.reset();

    setTimeout(() => {
      window.location.href = "login.html";
    }, 3000);
  });
});
