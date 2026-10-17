import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { get, onValue, push, ref, remove, serverTimestamp, set, update } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js";
import { auth, database, isAdministrator, signOut } from "./auth-service.js";

const message = document.querySelector("#admin-message");
const adminEmail = document.querySelector("#admin-email");
const destinationForm = document.querySelector("#destination-form");
const stayForm = document.querySelector("#stay-form");
let destinations = {};
let stays = {};
let reservations = {};
let members = {};
let booted = false;

document.querySelectorAll(".admin-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach((item) => item.classList.toggle("is-active", item === tab));
    document.querySelectorAll(".admin-panel").forEach((panel) => {
      const active = panel.dataset.panel === tab.dataset.tab;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
  });
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "admin-login.html";
    return;
  }
  try {
    if (!(await isAdministrator(user.uid))) {
      await signOut(auth);
      window.alert("관리자 권한이 확인되지 않았습니다.");
      window.location.href = "admin-login.html";
      return;
    }
    adminEmail.textContent = user.email || "관리자";
    if (booted) return;
    booted = true;
    listenForData();
  } catch {
    window.alert("관리자 권한을 확인하지 못했습니다. Firebase 설정과 Rules를 확인해 주세요.");
    window.location.href = "admin-login.html";
  }
});

document.querySelector("#admin-logout")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.alert("관리자 로그아웃되었습니다.");
    window.location.href = "../index.html";
  } catch {
    showMessage("로그아웃에 실패했습니다.", true);
  }
});

function listenForData() {
  onValue(ref(database, "destinations"), (snapshot) => {
    destinations = snapshot.val() || {};
    renderDestinations();
    populateDestinationSelect();
    updateSummary();
  }, onLoadError);
  onValue(ref(database, "stays"), (snapshot) => {
    stays = snapshot.val() || {};
    renderStays();
    updateSummary();
  }, onLoadError);
  onValue(ref(database, "reservations"), (snapshot) => {
    reservations = snapshot.val() || {};
    renderReservations();
    updateSummary();
  }, onLoadError);
  onValue(ref(database, "members"), (snapshot) => {
    members = snapshot.val() || {};
    renderMembers();
    updateSummary();
  }, onLoadError);
}

destinationForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(destinationForm);
  const id = String(values.get("id") || "");
  const destinationRef = id ? ref(database, `destinations/${id}`) : ref(database, "destinations");
  const record = {
    name: String(values.get("name")).trim(),
    region: String(values.get("region")).trim(),
    address: String(values.get("address")).trim(),
    imageUrl: String(values.get("imageUrl")).trim(),
    summary: String(values.get("summary")).trim(),
    description: String(values.get("description")).trim(),
    isPublished: values.get("isPublished") === "on",
    updatedAt: serverTimestamp(),
  };
  try {
    if (id) {
      record.id = id;
      record.createdAt = destinations[id]?.createdAt || serverTimestamp();
      await set(destinationRef, record);
    } else {
      const newRef = push(destinationRef);
      record.id = newRef.key;
      record.createdAt = serverTimestamp();
      await set(newRef, record);
    }
    destinationForm.reset();
    destinationForm.elements.id.value = "";
    showMessage("여행지 정보를 저장했습니다.");
  } catch (error) { showMessage(firebaseMessage(error), true); }
});

stayForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(stayForm);
  const id = String(values.get("id") || "");
  const stayRef = id ? ref(database, `stays/${id}`) : ref(database, "stays");
  const record = {
    name: String(values.get("name")).trim(),
    destinationId: String(values.get("destinationId")),
    address: String(values.get("address")).trim(),
    imageUrl: String(values.get("imageUrl")).trim(),
    pricePerNight: Number(values.get("pricePerNight")),
    maxGuests: Number(values.get("maxGuests")),
    summary: String(values.get("summary")).trim(),
    description: String(values.get("description")).trim(),
    contact: String(values.get("contact")).trim(),
    isActive: values.get("isActive") === "on",
    updatedAt: serverTimestamp(),
  };
  try {
    if (id) {
      record.id = id;
      record.createdAt = stays[id]?.createdAt || serverTimestamp();
      await set(stayRef, record);
    } else {
      const newRef = push(stayRef);
      record.id = newRef.key;
      record.createdAt = serverTimestamp();
      await set(newRef, record);
    }
    stayForm.reset();
    stayForm.elements.id.value = "";
    showMessage("숙소 정보를 저장했습니다.");
  } catch (error) { showMessage(firebaseMessage(error), true); }
});

document.querySelectorAll(".admin-form").forEach((form) => form.addEventListener("reset", () => {
  queueMicrotask(() => { if (form.elements.id) form.elements.id.value = ""; });
}));

function populateDestinationSelect() {
  const select = stayForm.elements.destinationId;
  const selected = select.value;
  select.replaceChildren(new Option("여행지 선택", ""));
  Object.values(destinations).forEach((item) => select.add(new Option(item.name || "이름 없는 여행지", item.id)));
  if (selected && destinations[selected]) select.value = selected;
}

function renderDestinations() {
  const list = document.querySelector("#destinations-list");
  list.replaceChildren();
  const rows = Object.values(destinations).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  if (!rows.length) return emptyState(list, "등록된 여행지가 없습니다.");
  rows.forEach((item) => {
    const card = recordCard(`${item.name || "이름 없음"} · ${item.region || "지역 미입력"}`, `${item.address || "주소 미입력"}\n${item.summary || "소개 없음"}\n공개 상태: ${item.isPublished ? "공개" : "비공개"}`, [
      actionButton("수정", () => editDestination(item)),
      actionButton("삭제", () => deleteDestination(item), true),
    ]);
    list.append(card);
  });
}

function renderStays() {
  const list = document.querySelector("#stays-list");
  list.replaceChildren();
  const rows = Object.values(stays);
  if (!rows.length) return emptyState(list, "등록된 숙소가 없습니다.");
  rows.forEach((item) => {
    const destination = destinations[item.destinationId];
    list.append(recordCard(`${item.name || "이름 없음"} · ${destination?.name || "연결 여행지 없음"}`, `${item.address || "주소 미입력"}\n${item.summary || "소개 없음"}\n${Number(item.pricePerNight || 0).toLocaleString("ko-KR")}원/박 · 최대 ${item.maxGuests || 1}명 · ${item.isActive ? "활성" : "비활성"}`, [
      actionButton("수정", () => editStay(item)),
      actionButton("삭제", () => deleteStay(item), true),
    ]));
  });
}

function renderReservations() {
  const list = document.querySelector("#reservations-list");
  list.replaceChildren();
  const rows = Object.values(reservations).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  if (!rows.length) return emptyState(list, "예약 신청이 없습니다.");
  rows.forEach((item) => {
    const statusSelect = document.createElement("select");
    statusSelect.setAttribute("aria-label", `${item.id} 예약 상태 변경`);
    ["requested", "confirmed", "cancelled", "completed"].forEach((value) => statusSelect.add(new Option(statusLabel(value), value)));
    statusSelect.value = item.status || "requested";
    const allowed = nextStatuses(item.status || "requested");
    statusSelect.disabled = !allowed.length;
    statusSelect.addEventListener("change", () => {
      const nextStatus = statusSelect.value;
      statusSelect.value = item.status || "requested";
      changeReservationStatus(item, nextStatus);
    });
    list.append(recordCard(`${item.stayNameSnapshot || stays[item.stayId]?.name || "숙소"} · ${statusLabel(item.status)}`, `예약자: ${item.guestName || "-"} (${item.guestPhone || "연락처 없음"})\n여행지: ${item.destinationNameSnapshot || destinations[item.destinationId]?.name || "-"}\n${item.checkIn || "-"} → ${item.checkOut || "-"} · ${item.guestCount || 0}명 · ${Number(item.totalPriceSnapshot || 0).toLocaleString("ko-KR")}원\n이메일: ${members[item.memberId]?.email || "-"}${item.requestNote ? `\n요청: ${item.requestNote}` : ""}`, [statusSelect]));
  });
}

function renderMembers() {
  const list = document.querySelector("#members-list");
  list.replaceChildren();
  const rows = Object.values(members).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  if (!rows.length) return emptyState(list, "가입 회원 정보가 없습니다.");
  rows.forEach((item) => {
    const memberReservations = Object.values(reservations).filter((reservation) => reservation.memberId === item.id).length;
    list.append(recordCard(item.name || "이름 미입력", `이메일: ${item.email || "-"}\n연락처: ${item.phone || "-"}\n상태: ${item.status || "-"} · 유형: ${item.role || "member"}\n예약 내역: ${memberReservations}건\nUID: ${item.id || "-"}`, []));
  });
}

function updateSummary() {
  document.querySelector("#count-destinations").textContent = String(Object.keys(destinations).length);
  document.querySelector("#count-stays").textContent = String(Object.keys(stays).length);
  document.querySelector("#count-members").textContent = String(Object.keys(members).length);
  document.querySelector("#count-pending").textContent = String(Object.values(reservations).filter((item) => item.status === "requested").length);
}

function editDestination(item) {
  const form = destinationForm;
  form.elements.id.value = item.id;
  for (const key of ["name", "region", "address", "imageUrl", "summary", "description"]) form.elements[key].value = item[key] || "";
  form.elements.isPublished.checked = Boolean(item.isPublished);
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function editStay(item) {
  const form = stayForm;
  form.elements.id.value = item.id;
  for (const key of ["name", "destinationId", "address", "imageUrl", "pricePerNight", "maxGuests", "summary", "description", "contact"]) form.elements[key].value = item[key] ?? "";
  form.elements.isActive.checked = Boolean(item.isActive);
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function deleteDestination(item) {
  if (Object.values(stays).some((stay) => stay.destinationId === item.id) || Object.values(reservations).some((reservation) => reservation.destinationId === item.id)) {
    showMessage("숙소 또는 예약에서 사용 중인 여행지는 삭제할 수 없습니다. 비공개로 전환해 주세요.", true);
    return;
  }
  if (!window.confirm(`'${item.name}' 여행지를 삭제할까요?`)) return;
  try { await remove(ref(database, `destinations/${item.id}`)); showMessage("여행지를 삭제했습니다."); }
  catch (error) { showMessage(firebaseMessage(error), true); }
}

async function deleteStay(item) {
  if (Object.values(reservations).some((reservation) => reservation.stayId === item.id)) {
    showMessage("예약 이력이 있는 숙소는 삭제할 수 없습니다. 비활성으로 전환해 주세요.", true);
    return;
  }
  if (!window.confirm(`'${item.name}' 숙소를 삭제할까요?`)) return;
  try { await remove(ref(database, `stays/${item.id}`)); showMessage("숙소를 삭제했습니다."); }
  catch (error) { showMessage(firebaseMessage(error), true); }
}

async function changeReservationStatus(item, nextStatus) {
  if (!nextStatuses(item.status || "requested").includes(nextStatus)) {
    showMessage("허용되지 않은 예약 상태 변경입니다.", true);
    return;
  }
  if (!window.confirm(`예약 상태를 '${statusLabel(nextStatus)}'(으)로 변경할까요?`)) return;
  try {
    const stayId = item.stayId;
    const first = new Date(`${item.checkIn}T00:00:00`);
    const last = new Date(`${item.checkOut}T00:00:00`);
    const updates = { [`reservations/${item.id}/status`]: nextStatus, [`reservations/${item.id}/updatedAt`]: serverTimestamp() };
    for (let date = new Date(first); date < last; date.setDate(date.getDate() + 1)) {
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const lockRef = ref(database, `availability/${stayId}/${dateKey}`);
      const snapshot = await get(lockRef);
      if (snapshot.val()?.reservationId !== item.id) continue;
      updates[`availability/${stayId}/${dateKey}`] = nextStatus === "cancelled" ? null : { reservationId: item.id, status: nextStatus };
    }
    await update(ref(database), updates);
    showMessage("예약 상태를 변경했습니다.");
  } catch (error) { showMessage(firebaseMessage(error), true); }
}

function nextStatuses(status) {
  if (status === "requested") return ["confirmed", "cancelled"];
  if (status === "confirmed") return ["completed", "cancelled"];
  return [];
}

function statusLabel(status) {
  return ({ requested: "신청", confirmed: "확정", cancelled: "취소", completed: "완료" })[status] || "알 수 없음";
}

function recordCard(title, details, actions) {
  const article = document.createElement("article");
  article.className = "admin-record";
  const content = document.createElement("div");
  content.className = "record-main";
  const heading = document.createElement("strong");
  heading.textContent = title;
  const paragraph = document.createElement("p");
  paragraph.textContent = details;
  content.append(heading, paragraph);
  const actionBox = document.createElement("div");
  actionBox.className = "record-actions";
  actions.forEach((action) => actionBox.append(action));
  article.append(content, actionBox);
  return article;
}

function actionButton(label, action, danger = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (danger) button.classList.add("danger-action");
  button.addEventListener("click", action);
  return button;
}

function emptyState(list, text) {
  const empty = document.createElement("p");
  empty.className = "admin-empty";
  empty.textContent = text;
  list.append(empty);
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.hidden = false;
  message.classList.toggle("is-error", isError);
  window.setTimeout(() => { message.hidden = true; }, 5000);
}

function onLoadError(error) { showMessage(firebaseMessage(error), true); }

function firebaseMessage(error) {
  if (error?.code === "PERMISSION_DENIED") return "Firebase 권한이 없습니다. Authentication과 Database Rules 설정을 확인해 주세요.";
  return "요청을 처리하지 못했습니다. Firebase 설정과 네트워크를 확인해 주세요.";
}
