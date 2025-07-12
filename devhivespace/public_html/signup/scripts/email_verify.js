function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

function verifyEmail(token) {
  fetch("/api/auth/verify_email.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const lockIcon = document.querySelector(".lock-icon");
        if (lockIcon) lockIcon.src = "../assets/unlocked.png";
        document.querySelector("h1").textContent =
          "Email Verified Successfully!";
        document.querySelector("p").textContent =
          "Congratulations! You can now start using DevHiveSpace and have fun!";
        const btn = document.querySelector("#verifyBtn");
        btn.textContent = "Continue to Login";
        btn.classList.add("success");
        sessionStorage.removeItem("verification_token");
        btn.onclick = function () {
          window.location.href = "../login/index.html";
        };
      } else {
        document.querySelector("p").textContent =
          "Verification failed. Please try again or contact support.";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      document.querySelector("p").textContent =
        "An error occurred. Please try again later.";
    });
}

document.addEventListener("DOMContentLoaded", function () {
  // "Open My Email" button logic
  const openEmailBtn = document.getElementById("openEmailBtn");
  if (openEmailBtn) {
    openEmailBtn.addEventListener("click", function () {
      const email = sessionStorage.getItem("user_email");
      if (!email) {
        alert("Email not found. Please open your inbox manually.");
        return;
      }
      let url = "";
      if (email.endsWith("@gmail.com")) {
        url = "https://mail.google.com/";
      } else if (email.endsWith("@yahoo.com")) {
        url = "https://mail.yahoo.com/";
      } else if (
        email.endsWith("@outlook.com") ||
        email.endsWith("@hotmail.com") ||
        email.endsWith("@live.com")
      ) {
        url = "https://outlook.live.com/";
      } else {
        url = "https://mail." + email.split("@")[1].split(".")[0] + ".com";
      }
      window.open(url, "_blank");
    });
  }

  // If token is in URL, verify automatically
  const urlToken = getTokenFromUrl();
  if (urlToken) {
    verifyEmail(urlToken);
    const verifyBtn = document.getElementById("verifyBtn");
    if (verifyBtn) verifyBtn.style.display = "none";
  }
});
