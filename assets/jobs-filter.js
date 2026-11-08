// ==========================================================================
// THIẾT LẬP LOGIC CHẾ ĐỘ SÁNG / TỐI (LIGHT / DARK MODE) & LƯU LOCALSTORAGE
// ==========================================================================
const themeToggleBtn = document.getElementById("themeToggleBtn");

function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (themeToggleBtn) themeToggleBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";
  } else {
    // Mặc định kiểm tra chế độ hệ thống người dùng
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      if (themeToggleBtn) themeToggleBtn.textContent = "☀️";
    }
  }
}

themeToggleBtn?.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  if (themeToggleBtn) {
    themeToggleBtn.textContent = newTheme === "dark" ? "☀️" : "🌙";
  }
});

// Khởi chạy kiểm tra giao diện lập tức
initTheme();

// ==========================================================================
// MOCK DATA VIỆC LÀM & LOGIC BỘ LỌC ĐA TIÊU CHÍ (SIDEBAR FILTER)
// ==========================================================================
const mockJobs = [
  { id: 1, title: "Senior React Developer", company: "FPT Software", location: "hcm", salary: 2200, type: "Full-time", level: "Senior", posted: "2 giờ trước" },
  { id: 2, title: "Java Backend Engineer", company: "VNG Corporation", location: "hcm", salary: 1800, type: "Hybrid", level: "Senior", posted: "5 giờ trước" },
  { id: 3, title: "Data Analyst Intern", company: "Shopee Vietnam", location: "hn", salary: 600, type: "Part-time", level: "Intern/Fresher", posted: "1 ngày trước" },
  { id: 4, title: "Fullstack Node.js / Vue", company: "MISA Corp", location: "dn", salary: 1400, type: "Remote", level: "Junior", posted: "1 ngày trước" },
  { id: 5, title: "DevOps Engineer", company: "Viettel Group", location: "hn", salary: 2500, type: "Full-time", level: "Senior", posted: "3 ngày trước" },
  { id: 6, title: "UI/UX Product Designer", company: "MoMo Wallet", location: "hcm", salary: 1500, type: "Hybrid", level: "Junior", posted: "4 ngày trước" },
];

const jobsGrid = document.getElementById("jobsGrid");
const resultCounter = document.getElementById("resultCounter");
const keywordInput = document.getElementById("keywordInput");
const locationSelect = document.getElementById("locationSelect");
const salaryRange = document.getElementById("salaryRange");
const salaryValue = document.getElementById("salaryValue");
const resetFilterBtn = document.getElementById("resetFilterBtn");
const sortSelect = document.getElementById("sortSelect");

const openFilterBtn = document.getElementById("openFilterBtn");
const closeFilterBtn = document.getElementById("closeFilterBtn");
const sidebarFilter = document.getElementById("sidebarFilter");
const filterOverlay = document.getElementById("filterOverlay");

function toggleDrawer(isOpen) {
  sidebarFilter?.classList.toggle("open", isOpen);
  filterOverlay?.classList.toggle("open", isOpen);
}

openFilterBtn?.addEventListener("click", () => toggleDrawer(true));
closeFilterBtn?.addEventListener("click", () => toggleDrawer(false));
filterOverlay?.addEventListener("click", () => toggleDrawer(false));

function filterJobs() {
  if (!jobsGrid) return;
  const keyword = keywordInput?.value.toLowerCase().trim() || "";
  const selectedLocation = locationSelect?.value || "all";
  const minSalary = parseInt(salaryRange?.value || "500");

  const checkedTypes = Array.from(document.querySelectorAll('input[name="type"]:checked')).map(cb => cb.value);
  const checkedLevels = Array.from(document.querySelectorAll('input[name="level"]:checked')).map(cb => cb.value);

  const filtered = mockJobs.filter(job => {
    const matchKeyword = job.title.toLowerCase().includes(keyword) || job.company.toLowerCase().includes(keyword);
    const matchLocation = selectedLocation === "all" || job.location === selectedLocation;
    const matchSalary = job.salary >= minSalary;
    const matchType = checkedTypes.length === 0 || checkedTypes.includes(job.type);
    const matchLevel = checkedLevels.length === 0 || checkedLevels.includes(job.level);

    return matchKeyword && matchLocation && matchSalary && matchType && matchLevel;
  });

  if (sortSelect?.value === "salaryHigh") {
    filtered.sort((a, b) => b.salary - a.salary);
  }

  renderJobs(filtered);
}

function renderJobs(jobs) {
  if (!jobsGrid) return;
  if (resultCounter) resultCounter.textContent = `Tìm thấy ${jobs.length} việc làm phù hợp`;
  jobsGrid.innerHTML = "";

  if (jobs.length === 0) {
    jobsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--muted);">Không có việc làm nào thỏa mãn bộ lọc.</div>`;
    return;
  }

  jobs.forEach(job => {
    const card = document.createElement("div");
    card.className = "job-card";
    card.innerHTML = `
      <div>
        <div class="job-card-header">
          <div class="company-badge">${job.company.substring(0, 2).toUpperCase()}</div>
        </div>
        <h3 class="job-title">${job.title}</h3>
        <p class="company-name">${job.company}</p>
        <div class="job-meta">
          <span class="badge badge-salary">$${job.salary}/tháng</span>
          <span class="badge badge-loc">${job.location.toUpperCase()}</span>
          <span class="badge badge-type">${job.type}</span>
        </div>
      </div>
      <div class="job-card-footer">
        <span>${job.posted}</span>
        <button class="btn-apply">Ứng tuyển</button>
      </div>
    `;
    jobsGrid.appendChild(card);
  });
}

keywordInput?.addEventListener("input", filterJobs);
locationSelect?.addEventListener("change", filterJobs);
sortSelect?.addEventListener("change", filterJobs);
salaryRange?.addEventListener("input", (e) => {
  if (salaryValue) salaryValue.textContent = `$${e.target.value}+`;
  filterJobs();
});

document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
  cb.addEventListener("change", filterJobs);
});

resetFilterBtn?.addEventListener("click", () => {
  document.getElementById("filterForm")?.reset();
  if (salaryValue) salaryValue.textContent = "$500+";
  filterJobs();
});

filterJobs();