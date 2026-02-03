// viewer.js — CSP-safe navigation

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("continueBtn");

  btn.addEventListener("click", () => {
    window.location.href = chrome.runtime.getURL("dashboard.html");
  });
});
