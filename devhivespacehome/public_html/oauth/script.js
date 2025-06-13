// Example: Fill values from query params or sessionStorage
document.getElementById("client_name").textContent =
  sessionStorage.getItem("client_name") || "Unknown App";
document.getElementById("user_id").textContent =
  sessionStorage.getItem("user_id") || "";
const scope = sessionStorage.getItem("scope");
if (scope) {
  document.getElementById("scope").textContent = scope;
  document.getElementById("scope_section").style.display = "";
}
// CSRF token should be set by the backend or via secure JS
document.getElementById("csrf_token").value =
  sessionStorage.getItem("csrf_token") || "";
