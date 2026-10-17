import { signInAdmin } from "./auth-service.js";

const form = document.querySelector("#admin-login-form");
const errorBox = document.querySelector("#form-error");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  errorBox.hidden = true;
  const values = new FormData(form);
  try {
    await signInAdmin(String(values.get("username")), String(values.get("password")));
    window.alert("관리자 로그인 성공");
    window.location.href = "admin.html";
  } catch (error) {
    window.alert("관리자 로그인 실패되었습니다.");
    errorBox.textContent = adminLoginError(error);
    errorBox.hidden = false;
  }
});

function adminLoginError(error) {
  if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
    return "Firebase Authentication에 등록된 관리자 이메일과 비밀번호를 확인해 주세요. 관리자 이메일은 js/firebase-config.js의 adminAuthEmail 값입니다.";
  }
  if (error.code === "PERMISSION_DENIED" || error.code === "database/permission-denied") {
    return "로그인 후 관리자 UID 권한을 확인할 수 없습니다. Rules를 게시하고 Authentication 사용자 UID를 /admins/{UID}=true로 등록했는지 확인해 주세요.";
  }
  if (error.code === "auth/network-request-failed") {
    return "Firebase에 연결할 수 없습니다. 인터넷 연결과 Firebase Authentication 설정을 확인해 주세요.";
  }
  if (error.code === "admin/invalid-username") return "관리자 아이디는 admin이어야 합니다.";
  if (error.code === "admin/not-registered") {
    return "Authentication 로그인은 성공했지만 관리자 UID가 등록되지 않았습니다. Firebase Console에서 /admins/{UID} 값을 boolean true로 추가해 주세요.";
  }
  return "관리자 로그인 설정을 확인해 주세요. Authentication 이메일, 비밀번호, 관리자 UID 등록을 점검하세요.";
}
