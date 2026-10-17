import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { equalTo, get, onValue, orderByChild, push, query, ref, remove, runTransaction, serverTimestamp, set } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";
import { auth, database } from "./firebase-init.js";

const form = document.querySelector("#reservation-form");
const staySelect = document.querySelector("#stay");
const stayNote = document.querySelector("#stay-note");
const errorBox = document.querySelector("#form-error");
const stayRecords = new Map();
let currentUser = null;
let destinationNames = new Map();
let stayData = {};

const today = new Date();
const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
form.elements.checkIn.min = todayKey;
form.elements.checkOut.min = todayKey;

form.elements.checkIn.addEventListener("change", () => {
  const checkIn = new Date(`${form.elements.checkIn.value}T00:00:00`);
  checkIn.setDate(checkIn.getDate() + 1);
  const nextDay = `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, "0")}-${String(checkIn.getDate()).padStart(2, "0")}`;
  form.elements.checkOut.min = nextDay;
  if (form.elements.checkOut.value && form.elements.checkOut.value <= form.elements.checkIn.value) form.elements.checkOut.value = "";
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.alert("로그인후 예약하시오");
    window.location.href = "login.html?returnTo=reservation.html";
    return;
  }
  currentUser = user;
  try {
    const memberSnapshot = await get(ref(database, `members/${user.uid}`));
    const member = memberSnapshot.val() || {};
    form.elements.guestName.value = member.name || user.displayName || "";
    form.elements.guestPhone.value = member.phone || "";
  } catch (error) { showError(error); }
});

onValue(query(ref(database, "destinations"), orderByChild("isPublished"), equalTo(true)), (snapshot) => {
  const destinations = snapshot.val() || {};
  const available = Object.values(destinations).filter((item) => item?.isPublished);
  destinationNames = new Map(available.map((item) => [item.id, item.name]));
  refreshStayOptions();
}, (error) => showError(error));

onValue(query(ref(database, "stays"), orderByChild("isActive"), equalTo(true)), (snapshot) => {
  stayData = snapshot.val() || {};
  refreshStayOptions();
}, (error) => showError(error));

function refreshStayOptions() {
  const options = Object.values(stayData).filter((stay) => stay?.isActive && destinationNames.has(stay.destinationId));
  staySelect.replaceChildren(new Option(options.length ? "숙소를 선택하세요" : "예약 가능한 숙소가 없습니다", ""));
  stayRecords.clear();
  options.forEach((stay) => {
    stayRecords.set(stay.id, stay);
    const option = new Option(`${stay.name} · ${destinationNames.get(stay.destinationId)} · ${Number(stay.pricePerNight || 0).toLocaleString("ko-KR")}원/박`, stay.id);
    staySelect.add(option);
  });
}

staySelect?.addEventListener("change", () => {
  const stay = stayRecords.get(staySelect.value);
  stayNote.textContent = stay ? `최대 ${stay.maxGuests || 1}명 · 1박 ${Number(stay.pricePerNight || 0).toLocaleString("ko-KR")}원` : "";
  form.elements.guestCount.max = String(stay?.maxGuests || 1);
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  errorBox.hidden = true;
  if (!currentUser) return;
  const values = new FormData(form);
  const stay = stayRecords.get(String(values.get("stayId")));
  const checkIn = String(values.get("checkIn"));
  const checkOut = String(values.get("checkOut"));
  const guestCount = Number(values.get("guestCount"));
  if (!stay) return showError(new Error("예약 가능한 숙소를 선택해 주세요."));
  if (!(checkIn && checkOut && checkOut > checkIn)) return showError(new Error("체크아웃 날짜는 체크인 날짜 이후여야 합니다."));
  if (checkIn < todayKey) return showError(new Error("체크인은 오늘 또는 이후 날짜로 선택해 주세요."));
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > Number(stay.maxGuests || 1)) return showError(new Error("숙소의 최대 인원 범위에서 선택해 주세요."));
  try {
    const destinationSnapshot = await get(ref(database, `destinations/${stay.destinationId}`));
    const destination = destinationSnapshot.val();
    if (!stay.isActive || !destination?.isPublished) throw new Error("현재 예약할 수 없는 숙소입니다.");
    const nights = Math.round((new Date(`${checkOut}T00:00:00`) - new Date(`${checkIn}T00:00:00`)) / 86400000);
    const recordRef = push(ref(database, "reservations"));
    const reservation = {
      id: recordRef.key,
      memberId: currentUser.uid,
      destinationId: stay.destinationId,
      stayId: stay.id,
      destinationNameSnapshot: destination.name || "",
      stayNameSnapshot: stay.name || "",
      checkIn,
      checkOut,
      guestCount,
      nights,
      pricePerNightSnapshot: Number(stay.pricePerNight || 0),
      totalPriceSnapshot: nights * Number(stay.pricePerNight || 0),
      status: "requested",
      guestName: String(values.get("guestName")).trim(),
      guestPhone: String(values.get("guestPhone")).trim(),
      requestNote: String(values.get("requestNote")).trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const lockedNights = [];
    try {
      await set(recordRef, reservation);
      for (let offset = 0; offset < nights; offset += 1) {
        const date = new Date(`${checkIn}T00:00:00`);
        date.setDate(date.getDate() + offset);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const lockRef = ref(database, `availability/${stay.id}/${dateKey}`);
        const result = await runTransaction(lockRef, (current) => {
          if (current && ["requested", "confirmed"].includes(current.status)) return;
          return { reservationId: recordRef.key, status: "requested" };
        }, { applyLocally: false });
        if (!result.committed) throw new Error("선택한 날짜에 이미 예약이 있어 다른 날짜를 선택해 주세요.");
        lockedNights.push(lockRef);
      }
    } catch (error) {
      await Promise.all(lockedNights.map((lockRef) => remove(lockRef).catch(() => {})));
      await remove(recordRef).catch(() => {});
      throw error;
    }
    window.alert("예약 신청이 접수되었습니다. 결제는 진행되지 않았습니다.");
    window.location.href = "../index.html";
  } catch (error) {
    showError(error);
  }
});

function showError(error) {
  errorBox.textContent = error?.message || "정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  errorBox.hidden = false;
}
