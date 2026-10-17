import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { equalTo, get, onValue, orderByChild, query, ref, serverTimestamp, update } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";
import { auth, database, signOut } from "./auth-service.js";

const list = document.querySelector("#my-reservations-list");
const errorBox = document.querySelector("#reservations-error");
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.alert("로그인후 예약을 확인해 주세요.");
    window.location.href = "login.html?returnTo=my-reservations.html";
    return;
  }
  currentUser = user;
  onValue(query(ref(database, "reservations"), orderByChild("memberId"), equalTo(user.uid)), renderReservations, showError);
});

document.querySelector("#member-logout")?.addEventListener("click", async () => {
  await signOut(auth);
  window.alert("로그아웃되었습니다");
  window.location.href = "../index.html";
});

function renderReservations(snapshot) {
  list.replaceChildren();
  const records = Object.values(snapshot.val() || {}).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  if (!records.length) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "아직 예약 내역이 없습니다.";
    list.append(empty);
    return;
  }
  records.forEach((record) => {
    const card = document.createElement("article");
    card.className = "my-reservation-card";
    const heading = document.createElement("h2");
    heading.textContent = record.stayNameSnapshot || "예약 숙소";
    const detail = document.createElement("p");
    detail.textContent = `${record.destinationNameSnapshot || "여행지"} · ${record.checkIn} → ${record.checkOut} · ${record.guestCount}명`;
    const price = document.createElement("p");
    price.textContent = `예상 금액 ${Number(record.totalPriceSnapshot || 0).toLocaleString("ko-KR")}원 · 결제되지 않음`;
    const status = document.createElement("span");
    status.className = `reservation-status status-${record.status}`;
    status.textContent = statusLabel(record.status);
    card.append(heading, detail, price, status);
    if (record.status === "requested") {
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "button button-outline cancel-reservation";
      cancel.textContent = "예약 취소";
      cancel.addEventListener("click", () => cancelReservation(record));
      card.append(cancel);
    }
    list.append(card);
  });
}

async function cancelReservation(record) {
  if (!window.confirm("이 예약 신청을 취소할까요?")) return;
  if (!currentUser) return;
  try {
    const schedule = (await get(ref(database, `availability/${record.stayId}`))).val() || {};
    const updates = {
      [`reservations/${record.id}/status`]: "cancelled",
      [`reservations/${record.id}/updatedAt`]: serverTimestamp(),
    };
    Object.entries(schedule).forEach(([date, lock]) => {
      if (lock?.reservationId === record.id) updates[`availability/${record.stayId}/${date}`] = null;
    });
    await update(ref(database), updates);
    window.alert("예약이 취소되었습니다.");
  } catch {
    showError(new Error("예약을 취소하지 못했습니다. 권한과 네트워크를 확인해 주세요."));
  }
}

function statusLabel(status) {
  return ({ requested: "확인 대기", confirmed: "예약 확정", cancelled: "취소됨", completed: "이용 완료" })[status] || "상태 확인 중";
}

function showError(error) {
  errorBox.textContent = error.message || "예약 내역을 불러오지 못했습니다.";
  errorBox.hidden = false;
}
