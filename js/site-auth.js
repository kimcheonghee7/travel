import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { auth, signOut } from "./auth-service.js";

const signupLink = document.querySelector("[data-auth-signup]");
const loginLink = document.querySelector("[data-auth-login]");
const adminLink = document.querySelector("[data-auth-admin]");
const logoutButton = document.querySelector("[data-auth-logout]");
const reservationButton = document.querySelector("[data-reservation-action]");
const myReservationsLink = document.querySelector("[data-auth-my-reservations]");

onAuthStateChanged(auth, (user) => {
  if (signupLink) signupLink.hidden = Boolean(user);
  if (loginLink) loginLink.hidden = Boolean(user);
  if (adminLink) adminLink.hidden = Boolean(user);
  if (logoutButton) logoutButton.hidden = !user;
  if (myReservationsLink) myReservationsLink.hidden = !user;
});

logoutButton?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.alert("로그아웃되었습니다");
    window.location.reload();
  } catch {
    window.alert("로그아웃에 실패했습니다.");
  }
});

reservationButton?.addEventListener("click", () => {
  if (!auth.currentUser) {
    window.alert("로그인후 예약하시오");
    window.location.href = "html/login.html?returnTo=reservation.html";
    return;
  }
  window.location.href = "html/reservation.html";
});
