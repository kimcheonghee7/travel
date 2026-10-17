import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { get, ref, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";
import { auth, database } from "./firebase-init.js";
import { adminAuthEmail } from "./firebase-config.js";

// Firebase Authentication에서 이 이메일의 비밀번호를 검증합니다.
export const ADMIN_LOGIN_EMAIL = adminAuthEmail;

export async function registerMember({ name, phone, email, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const timestamp = serverTimestamp();
  await set(ref(database, `members/${credential.user.uid}`), {
    id: credential.user.uid,
    name,
    email,
    phone: phone || "",
    role: "member",
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return credential.user;
}

export async function signInMember(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInAdmin(username, password) {
  if (username.trim().toLowerCase() !== "admin") {
    const error = new Error("관리자 아이디를 확인해 주세요.");
    error.code = "admin/invalid-username";
    throw error;
  }
  const credential = await signInWithEmailAndPassword(auth, ADMIN_LOGIN_EMAIL, password);
  const adminRecord = await get(ref(database, `admins/${credential.user.uid}`));
  if (!adminRecord.exists() || adminRecord.val() !== true) {
    await signOut(auth);
    const error = new Error("로그인 계정 UID가 관리자 목록에 등록되어 있지 않습니다.");
    error.code = "admin/not-registered";
    throw error;
  }
  return credential.user;
}

export async function isAdministrator(uid) {
  if (!uid) return false;
  if (auth.currentUser?.uid !== uid) return false;
  const adminRecord = await get(ref(database, `admins/${uid}`));
  return adminRecord.exists() && adminRecord.val() === true;
}

export { auth, database, signOut };
