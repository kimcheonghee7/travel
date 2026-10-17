import { signInMember } from "./auth-service.js";

const form = document.querySelector("#login-form");
const errorBox = document.querySelector("#form-error");
const params = new URLSearchParams(window.location.search);
const returnTo = params.get("returnTo");
const safeReturnTo = returnTo && /^[a-z0-9-]+\.html$/i.test(returnTo) ? returnTo : null;

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  errorBox.hidden = true;
  const values = new FormData(form);
  try {
    await signInMember(String(values.get("email")).trim(), String(values.get("password")));
    window.alert("로그인 되었습니다.");
    window.location.href = safeReturnTo || "../index.html";
  } catch {
    window.alert("로그인 실패되었습니다.");
    errorBox.textContent = "이메일과 비밀번호를 확인해 주세요.";
    errorBox.hidden = false;
  }
});
