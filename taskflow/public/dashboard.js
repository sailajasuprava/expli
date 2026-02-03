const displayBtn = document.getElementById("displayBtn");
const displayPanel = document.getElementById("displayPanel");
const taskList = document.getElementById("taskList");
const listViewBtn = document.getElementById("listViewBtn");
const boardViewBtn = document.getElementById("boardViewBtn");

// Toggle the Right Sidebar
displayBtn.addEventListener("click", () => {
  displayPanel.classList.toggle("open");
});

// Switch to Board View
boardViewBtn.addEventListener("click", () => {
  taskList.classList.add("view-board");
  boardViewBtn.classList.add("active");
  listViewBtn.classList.remove("active");
});

// Switch to List View (Default)
listViewBtn.addEventListener("click", () => {
  taskList.classList.remove("view-board");
  listViewBtn.classList.add("active");
  boardViewBtn.classList.remove("active");
});

// State Management
let selectedDate = null;
let selectedPrio = null;
let currentViewDate = new Date();

const showFormBtn = document.getElementById("showFormBtn");
const quickAddForm = document.getElementById("quickAddForm");
const calendarPopup = document.getElementById("calendarPopup");
const priorityPopup = document.getElementById("priorityPopup");

// 1. Form Toggling
showFormBtn.onclick = () => {
  showFormBtn.classList.add("hidden");
  quickAddForm.classList.remove("hidden");
};

const closeForm = () => {
  quickAddForm.classList.add("hidden");
  showFormBtn.classList.remove("hidden");
  // Reset inputs
  document.getElementById("taskTitleInput").value = "";
  document.getElementById("taskDescInput").value = "";
  selectedDate = null;
  selectedPrio = null;
  updateTags();
};

document.getElementById("closeFormBtn").onclick = closeForm;
document.getElementById("cancelFormBtn").onclick = closeForm;

// 2. Calendar Logic
const renderCalendar = () => {
  const grid = document.getElementById("calendarGrid");
  const label = document.getElementById("calMonthYear");
  grid.innerHTML = "";

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();
  const monthName = currentViewDate.toLocaleString("default", {
    month: "long",
  });
  label.innerText = `${monthName} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < offset; i++) grid.innerHTML += "<div></div>";

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday =
      new Date().toDateString() === new Date(year, month, d).toDateString();
    grid.innerHTML += `<div class="cal-day ${isToday ? "today" : ""}" onclick="selectDate(${d})">${d}</div>`;
  }
};

window.selectDate = (day) => {
  selectedDate = `${day} ${currentViewDate.toLocaleString("default", { month: "short" })}`;
  calendarPopup.classList.add("hidden");
  updateTags();
};

document.getElementById("calBtn").onclick = (e) => {
  e.stopPropagation();
  calendarPopup.classList.toggle("hidden");
  priorityPopup.classList.add("hidden");
  renderCalendar();
};

// 3. Priority Logic
// 1. The Click Listener
document.getElementById("prioBtn").onclick = (e) => {
  e.stopPropagation();

  // Toggle the hidden class
  const isHidden = priorityPopup.classList.toggle("hidden");

  // Close calendar if it's open
  calendarPopup.classList.add("hidden");

  // 2. Call the function ONLY when opening the menu
  if (!isHidden) {
    updatePriorityPopup();
  }
};

document.querySelectorAll(".prio-item").forEach((item) => {
  item.onclick = () => {
    selectedPrio = item.getAttribute("data-prio");
    priorityPopup.classList.add("hidden");
    updateTags();
  };
});

// 4. Update UI Tags
const updateTags = () => {
  const container = document.getElementById("selectedTags");
  container.innerHTML = "";
  if (selectedDate)
    container.innerHTML += `<div class="tag">📅 ${selectedDate}</div>`;
  if (selectedPrio)
    container.innerHTML += `<div class="tag">🚩 P${selectedPrio}</div>`;
};

// Next/Prev Month logic
document.getElementById("prevMonth").onclick = () => {
  currentViewDate.setMonth(currentViewDate.getMonth() - 1);
  renderCalendar();
};
document.getElementById("nextMonth").onclick = () => {
  currentViewDate.setMonth(currentViewDate.getMonth() + 1);
  renderCalendar();
};

// Function to update Priority Popup content
function updatePriorityPopup() {
  const priorities = [
    { id: 1, label: "Priority 1", color: "#ef4444" },
    { id: 2, label: "Priority 2", color: "#f97316" },
    { id: 3, label: "Priority 3", color: "#3b82f6" },
    { id: 4, label: "Priority 4", color: "#a3a3a3" },
  ];

  const popup = document.getElementById("priorityPopup");
  popup.innerHTML = priorities
    .map(
      (p) => `
        <div class="prio-item" data-prio="${p.id}" onclick="setTaskPriority(${p.id})">
            <span class="p-icon">🚩</span>
            <span class="p-label">${p.label}</span>
            ${selectedPrio === p.id ? '<span class="check-icon" style="color:#ef4444">✓</span>' : ""}
        </div>
    `,
    )
    .join("");
}

// 4. The Selection Logic
window.setTaskPriority = (id) => {
  selectedPrio = id;
  priorityPopup.classList.add("hidden"); // Close menu after selection
  updateTags(); // Update the tags shown in the main form
};
