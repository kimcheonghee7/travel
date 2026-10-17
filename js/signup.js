import { auth, registerMember, signOut } from "./auth-service.js";

const form = document.querySelector("#signup-form");
const errorBox = document.querySelector("#form-error");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  errorBox.hidden = true;
  const values = new FormData(form);
  const password = String(values.get("password") || "");
  if (password !== String(values.get("passwordConfirm") || "")) {
    errorBox.textContent = "비밀번호가 서로 일치하지 않습니다.";
    errorBox.hidden = false;
    return;
  }
  try {
    await registerMember({
      name: String(values.get("name")).trim(),
      phone: String(values.get("phone")).trim(),
      email: String(values.get("email")).trim(),
      password,
    });
    await signOut(auth);
    window.alert("가입 완료되었습니다.");
    window.location.href = "login.html";
  } catch (error) {
    if (auth.currentUser) await signOut(auth).catch(() => {});
    errorBox.textContent = error.code === "auth/email-already-in-use"
      ? "이미 가입된 이메일입니다. 로그인해 주세요."
      : error.code === "auth/weak-password"
        ? "비밀번호는 6자 이상으로 입력해 주세요."
        : error.code === "PERMISSION_DENIED"
          ? "계정은 생성됐지만 회원정보 저장 권한이 없습니다. Realtime Database Rules를 설정한 뒤 로그인해 주세요."
          : "회원가입에 실패했습니다. 입력 내용을 확인하고 다시 시도해 주세요.";
    errorBox.hidden = false;
  }
});
