function handleGoogleCallback(googleUser) {
  const userData = {
    email: googleUser.email,
    first_name: googleUser.given_name,
    last_name: googleUser.family_name,
    profile_picture: googleUser.picture,
    provider: "google",
    provider_user_id: googleUser.sub,
  };

  fetch("/api/auth/google_oauth/callback.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        sessionStorage.setItem("user_id", data.user_id);
        sessionStorage.setItem("email", data.email);
        window.location.href = "../dashboard/index.html";
      } else {
        alert(data.message || "Failed to complete Google sign up");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred during Google sign up. Please try again.");
    });
}
