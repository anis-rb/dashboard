/**
 * RefBuddy Dashboard - Main Application
 */
let currentPage = 1;
let currentFilters = {};
let metricsCache = null;
let leadsCache = [];
let totalLeads = 0;

document.addEventListener("DOMContentLoaded", () => {
  if (auth.isLoggedIn()) {
    showDashboard();
  } else {
    showLogin();
  }
  bindGlobalEvents();
});

/* ==================== VIEWS ==================== */
function showLogin() {
  document.getElementById("app").innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800">RefBuddy</h1>
          <p class="text-gray-500 mt-1">Lead Management Dashboard</p>
        </div>

        <div id="loginForm">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" id="loginEmail" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="you@example.com">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" id="loginPassword" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="••••••••">
            </div>
            <button onclick="handleLogin()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition">
              Sign In
            </button>
          </div>
          <p class="text-center text-sm text-gray-500 mt-6">
            New user? <a href="#" onclick="showRegister()" class="text-blue-600 hover:underline">Register</a>
          </p>
        </div>

        <div id="registerForm" class="hidden">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" id="regName" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" id="regEmail" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" id="regPhone" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" id="regPassword" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select id="regRole" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="Champion">Champion</option>
                <option value="Partner">Partner</option>
                <option value="City Head">City Head</option>
              </select>
            </div>
            <button onclick="handleRegister()" class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition">
              Register
            </button>
          </div>
          <p class="text-center text-sm text-gray-500 mt-6">
            Already have account? <a href="#" onclick="showLoginForm()" class="text-blue-600 hover:underline">Sign In</a>
          </p>
        </div>

        <div id="authMessage" class="mt-4 text-center text-sm hidden"></div>
      </div>
    </div>
  `;
}

function showLoginForm() {
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("registerForm").classList.add("hidden");
  document.getElementById("authMessage").classList.add("hidden");
}

function showRegister() {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.remove("hidden");
  document.getElementById("authMessage").classList.add("hidden");
}

async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const msg = document.getElementById("authMessage");

  if (!email || !password) {
    showAuthMsg("Please enter email and password", "error");
    return;
  }

  showAuthMsg("Signing in...", "info");
  const res = await api.login(email, password);

  if (res.success) {
    auth.saveSession(res.token, res.user);
    showDashboard();
  } else {
    showAuthMsg(res.message || "Login failed", "error");
  }
}

async function handleRegister() {
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const password = document.getElementById("regPassword").value;
  const role = document.getElementById("regRole").value;

  if (!name || !email || !password) {
    showAuthMsg("Name, email and password are required", "error");
    return;
  }

  showAuthMsg("Submitting registration...", "info");
  const res = await api.register({ name, email, phone, password, role });

  if (res.success) {
    showAuthMsg(res.message, "success");
    setTimeout(() => showLoginForm(), 2500);
  } else {
    showAuthMsg(res.message || "Registration failed", "error");
  }
}

function showAuthMsg(text, type) {
  const el = document.getElementById("authMessage");
  el.textContent = text;
  el.className = "mt-4 text-center text-sm " + (
    type === "error" ? "text-red-600" :
    type === "success" ? "text-green-600" : "text-blue-600"
  );
  el.classList.remove("hidden");
}

/* ==================== DASHBOARD ==================== */
async function showDashboard() {
  const user = auth.getUser();
  document.getElementById("app").innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <!-- Top Nav -->
      <nav class="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-bold text-blue-700">RefBuddy</h1>
              <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">${user.role}</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-600 hidden sm:block">${user.name}</span>
              <button onclick="auth.logout()" class="text-sm text-red-600 hover:text-red-800 font-medium">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Metric Cards -->
        <div id="metricCards" class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <!-- filled by JS -->
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div class="flex flex-wrap gap-3 items-end">
            <div class="flex-1 min-w-[200px]">
              <label class="block text-xs font-medium text-gray-500 mb-1">Search</label>
              <input type="text" id="searchInput" placeholder="Name, Phone, Lead ID..." 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                onkeyup="debounceSearch()">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
              <select id="dateRange" onchange="applyFilters()" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div id="customDateWrap" class="hidden flex gap-2">
              <input type="date" id="dateFrom" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <input type="date" id="dateTo" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select id="statusFilter" multiple class="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[140px]">
                <option value="New Enquiry">New Enquiry</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Deposited">Deposited</option>
                <option value="Completed">Completed</option>
                <option value="Lost">Lost</option>
                <option value="Failed">Failed</option>
                <option value="Hold">Hold</option>
                <option value="Assigned">Assigned</option>
              </select>
            </div>
            <button onclick="applyFilters()" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              Apply
            </button>
            <button onclick="resetFilters()" class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
              Reset
            </button>
          </div>
        </div>

        <!-- Tabs for Admin -->
        ${auth.isAdmin() ? `
        <div class="flex gap-2 mb-4 overflow-x-auto">
          <button onclick="switchTab('leads')" id="tab-leads" class="tab-btn active px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white">Leads</button>
          <button onclick="switchTab('users')" id="tab-users" class="tab-btn px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">User Approvals</button>
          <button onclick="switchTab('balance')" id="tab-balance" class="tab-btn px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">Balance Sheet</button>
        </div>
        ` : `
        <div class="flex gap-2 mb-4">
          <button onclick="switchTab('leads')" id="tab-leads" class="tab-btn active px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white">Leads</button>
          <button onclick="switchTab('balance')" id="tab-balance" class="tab-btn px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">My Balance</button>
        </div>
        `}

        <!-- Content Area -->
        <div id="tabContent">
          <!-- Leads Table -->
          <div id="leadsTab">
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lead ID</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Service</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">City</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Owner</th>
                    </tr>
                  </thead>
                  <tbody id="leadsTableBody" class="bg-white divide-y divide-gray-100">
                    <tr><td colspan="8" class="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                  </tbody>
                </table>
              </div>
              <!-- Pagination -->
              <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <div id="pageInfo" class="text-sm text-gray-500"></div>
                <div class="flex gap-2">
                  <button onclick="changePage(-1)" id="prevBtn" class="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40">Previous</button>
                  <button onclick="changePage(1)" id="nextBtn" class="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40">Next</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Users Tab (Admin) -->
          <div id="usersTab" class="hidden">
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody id="usersTableBody" class="bg-white divide-y divide-gray-100"></tbody>
              </table>
            </div>
          </div>

          <!-- Balance Tab -->
          <div id="balanceTab" class="hidden">
            <div id="balanceContent" class="space-y-4"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lead Modal -->
    <div id="leadModal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 class="text-lg font-semibold" id="modalTitle">Lead Details</h3>
          <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div id="modalBody" class="p-6 space-y-4"></div>
        <div class="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
          <button onclick="closeModal()" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100">Cancel</button>
          <button onclick="saveLead()" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
        </div>
      </div>
    </div>
  `;

  // Load data
  await Promise.all([loadMetrics(), loadLeads()]);
  if (auth.isAdmin()) loadUsers();
}

/* ==================== METRICS ==================== */
async function loadMetrics() {
  const res = await api.getMetrics();
  if (!res.success) return;
  metricsCache = res.data;

  const colors = {
    "New Enquiry": "bg-blue-500",
    "In Progress": "bg-yellow-500",
    "Pending": "bg-orange-500",
    "Deposited": "bg-purple-500",
    "Completed": "bg-green-500",
    "Lost": "bg-red-500",
    "Failed": "bg-gray-500",
    "Other": "bg-slate-400"
  };

  const container = document.getElementById("metricCards");
  container.innerHTML = Object.entries(metricsCache).map(([status, count]) => `
    <button onclick="filterByStatus('${status}')" 
      class="bg-white rounded-xl border border-gray-100 p-3 text-left hover:shadow-md transition cursor-pointer group">
      <div class="text-2xl font-bold text-gray-800 group-hover:text-blue-600">${count}</div>
      <div class="text-xs text-gray-500 mt-0.5 truncate">${status}</div>
      <div class="h-1 rounded-full mt-2 ${colors[status] || "bg-gray-300"} opacity-70"></div>
    </button>
  `).join("");
}

function filterByStatus(status) {
  currentFilters.status = status;
  currentPage = 1;
  loadLeads();
}

/* ==================== LEADS ==================== */
let searchTimeout = null;
function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentFilters.search = document.getElementById("searchInput").value.trim();
    currentPage = 1;
    loadLeads();
  }, 350);
}

function applyFilters() {
  const range = document.getElementById("dateRange").value;
  const customWrap = document.getElementById("customDateWrap");

  if (range === "custom") {
    customWrap.classList.remove("hidden");
  } else {
    customWrap.classList.add("hidden");
  }

  // Date calculation
  const now = new Date();
  let dateFrom = null, dateTo = null;

  if (range === "today") {
    dateFrom = dateTo = formatDate(now);
  } else if (range === "yesterday") {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    dateFrom = dateTo = formatDate(y);
  } else if (range === "7") {
    const d = new Date(now); d.setDate(d.getDate() - 7);
    dateFrom = formatDate(d);
  } else if (range === "30") {
    const d = new Date(now); d.setDate(d.getDate() - 30);
    dateFrom = formatDate(d);
  } else if (range === "thisMonth") {
    dateFrom = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
  } else if (range === "lastMonth") {
    dateFrom = formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    dateTo = formatDate(new Date(now.getFullYear(), now.getMonth(), 0));
  } else if (range === "custom") {
    dateFrom = document.getElementById("dateFrom").value;
    dateTo = document.getElementById("dateTo").value;
  }

  // Multi status
  const statusSelect = document.getElementById("statusFilter");
  const selected = Array.from(statusSelect.selectedOptions).map(o => o.value);

  currentFilters = {
    search: document.getElementById("searchInput").value.trim(),
    status: selected.length ? selected.join(",") : undefined,
    dateFrom,
    dateTo
  };
  currentPage = 1;
  loadLeads();
}

function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("dateRange").value = "";
  document.getElementById("customDateWrap").classList.add("hidden");
  document.getElementById("statusFilter").selectedIndex = -1;
  currentFilters = {};
  currentPage = 1;
  loadLeads();
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

async function loadLeads() {
  const tbody = document.getElementById("leadsTableBody");
  tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-8 text-center text-gray-400">Loading leads...</td></tr>`;

  const res = await api.getLeads({
    page: currentPage,
    limit: 50,
    ...currentFilters
  });

  if (!res.success) {
    tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-8 text-center text-red-500">${res.message}</td></tr>`;
    return;
  }

  leadsCache = res.data;
  totalLeads = res.total;

  if (leadsCache.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-8 text-center text-gray-400">No leads found</td></tr>`;
  } else {
    tbody.innerHTML = leadsCache.map(l => `
      <tr class="hover:bg-blue-50 cursor-pointer transition" onclick='openLeadModal(${JSON.stringify(l).replace(/'/g, "&#39;")})'>
        <td class="px-4 py-3 text-sm font-medium text-blue-600">${l.LEAD_ID || "-"}</td>
        <td class="px-4 py-3 text-sm text-gray-800">${l.LEAD_NAME || "-"}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${l.LEAD_MOBILE || "-"}</td>
        <td class="px-4 py-3"><span class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColor(l.LEAD_STATUS)}">${l.LEAD_STATUS || "-"}</span></td>
        <td class="px-4 py-3 text-sm text-gray-600">${l.SERVICE_ID || "-"}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${l.LEAD_CITY || "-"}</td>
        <td class="px-4 py-3 text-sm text-gray-500">${formatDisplayDate(l.Lead_Date || l.CREATED_AT)}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${l.LEAD_OWNER || "-"}</td>
      </tr>
    `).join("");
  }

  // Pagination info
  const start = (currentPage - 1) * 50 + 1;
  const end = Math.min(currentPage * 50, totalLeads);
  document.getElementById("pageInfo").textContent = totalLeads ? `Showing ${start}-${end} of ${totalLeads}` : "";
  document.getElementById("prevBtn").disabled = currentPage <= 1;
  document.getElementById("nextBtn").disabled = end >= totalLeads;
}

function statusColor(s) {
  const lower = (s || "").toLowerCase();
  if (lower.includes("new") || lower === "enquiry") return "bg-blue-100 text-blue-700";
  if (lower.includes("progress") || lower === "assigned" || lower === "hold") return "bg-yellow-100 text-yellow-800";
  if (lower === "pending") return "bg-orange-100 text-orange-700";
  if (lower === "deposited") return "bg-purple-100 text-purple-700";
  if (lower === "completed") return "bg-green-100 text-green-700";
  if (lower === "lost") return "bg-red-100 text-red-700";
  if (lower === "failed" || lower === "junk") return "bg-gray-100 text-gray-700";
  return "bg-slate-100 text-slate-700";
}

function formatDisplayDate(val) {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function changePage(dir) {
  currentPage += dir;
  if (currentPage < 1) currentPage = 1;
  loadLeads();
}

/* ==================== LEAD MODAL ==================== */
let currentLead = null;

function openLeadModal(lead) {
  currentLead = lead;
  document.getElementById("modalTitle").textContent = `Lead: ${lead.LEAD_ID || ""}`;
  const isPartner = auth.isPartner() || auth.isChampion();

  document.getElementById("modalBody").innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Name</label>
        <input type="text" id="m_name" value="${esc(lead.LEAD_NAME)}" class="w-full px-3 py-2 border rounded-lg text-sm" ${isPartner ? "readonly" : ""}>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Phone</label>
        <input type="text" id="m_phone" value="${esc(lead.LEAD_MOBILE)}" class="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" readonly>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Status</label>
        <select id="m_status" class="w-full px-3 py-2 border rounded-lg text-sm">
          ${["New Enquiry","Enquiry","In Progress","Assigned","Hold","Pending","Deposited","Completed","Lost","Failed","Junk","Unqualified"].map(s =>
            `<option value="${s}" ${lead.LEAD_STATUS === s ? "selected" : ""}>${s}</option>`
          ).join("")}
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Service</label>
        <input type="text" id="m_service" value="${esc(lead.SERVICE_ID)}" class="w-full px-3 py-2 border rounded-lg text-sm" ${isPartner ? "readonly" : ""}>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">City</label>
        <input type="text" id="m_city" value="${esc(lead.LEAD_CITY)}" class="w-full px-3 py-2 border rounded-lg text-sm" ${isPartner ? "readonly" : ""}>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Deal Value</label>
        <input type="number" id="m_deal" value="${lead.DEAL_VALUE || ""}" class="w-full px-3 py-2 border rounded-lg text-sm" ${isPartner ? "readonly" : ""}>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Commission</label>
        <input type="number" id="m_comm" value="${lead.COMMISSION_AMOUNT || ""}" class="w-full px-3 py-2 border rounded-lg text-sm" ${isPartner ? "readonly" : ""}>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Owner</label>
        <input type="text" id="m_owner" value="${esc(lead.LEAD_OWNER)}" class="w-full px-3 py-2 border rounded-lg text-sm" ${isPartner ? "readonly" : ""}>
      </div>
      <div class="sm:col-span-2">
        <label class="block text-xs font-medium text-gray-500 mb-1">Requirement</label>
        <textarea id="m_req" rows="3" class="w-full px-3 py-2 border rounded-lg text-sm" ${isPartner ? "readonly" : ""}>${esc(lead.LEAD_REQUIREMENT)}</textarea>
      </div>
      <div class="sm:col-span-2">
        <label class="block text-xs font-medium text-gray-500 mb-1">Partner Remark</label>
        <textarea id="m_premark" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm">${esc(lead.PARTNER_REMARK)}</textarea>
      </div>
      <div class="sm:col-span-2">
        <label class="block text-xs font-medium text-gray-500 mb-1">Admin Remark</label>
        <textarea id="m_aremark" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm" ${!auth.isAdmin() ? "readonly" : ""}>${esc(lead.ADMIN_REMARK)}</textarea>
      </div>
    </div>
  `;
  document.getElementById("leadModal").classList.remove("hidden");
}

function esc(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function closeModal() {
  document.getElementById("leadModal").classList.add("hidden");
  currentLead = null;
}

async function saveLead() {
  if (!currentLead) return;
  const fields = {
    LEAD_STATUS: document.getElementById("m_status").value,
    PARTNER_REMARK: document.getElementById("m_premark").value
  };

  if (auth.isAdmin()) {
    fields.LEAD_NAME = document.getElementById("m_name").value;
    fields.SERVICE_ID = document.getElementById("m_service").value;
    fields.LEAD_CITY = document.getElementById("m_city").value;
    fields.DEAL_VALUE = document.getElementById("m_deal").value;
    fields.COMMISSION_AMOUNT = document.getElementById("m_comm").value;
    fields.LEAD_OWNER = document.getElementById("m_owner").value;
    fields.LEAD_REQUIREMENT = document.getElementById("m_req").value;
    fields.ADMIN_REMARK = document.getElementById("m_aremark").value;
  }

  const res = await api.updateLead(currentLead.LEAD_ID, fields);
  if (res.success) {
    closeModal();
    loadLeads();
    loadMetrics();
  } else {
    alert(res.message || "Update failed");
  }
}

/* ==================== USERS (Admin) ==================== */
async function loadUsers() {
  const res = await api.getUsers();
  if (!res.success) return;
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = res.data.map(u => `
    <tr>
      <td class="px-4 py-3 text-sm">${u.Name || "-"}</td>
      <td class="px-4 py-3 text-sm">${u.Email || "-"}</td>
      <td class="px-4 py-3 text-sm">${u.Role || "-"}</td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 text-xs rounded-full ${u.Status === "Approved" ? "bg-green-100 text-green-700" : u.Status === "Rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800"}">${u.Status || "Pending"}</span></td>
      <td class="px-4 py-3 text-sm space-x-2">
        ${u.Status !== "Approved" ? `<button onclick="approve('${u.User_ID}','Approved')" class="text-green-600 hover:underline">Approve</button>` : ""}
        ${u.Status !== "Rejected" ? `<button onclick="approve('${u.User_ID}','Rejected')" class="text-red-600 hover:underline">Reject</button>` : ""}
      </td>
    </tr>
  `).join("") || `<tr><td colspan="5" class="px-4 py-6 text-center text-gray-400">No users</td></tr>`;
}

async function approve(userId, status) {
  const res = await api.approveUser(userId, status);
  if (res.success) loadUsers();
  else alert(res.message);
}

/* ==================== BALANCE ==================== */
async function loadBalance() {
  const res = await api.getBalance();
  const container = document.getElementById("balanceContent");
  if (!res.success) {
    container.innerHTML = `<p class="text-red-500">${res.message}</p>`;
    return;
  }
  const d = res.data;
  container.innerHTML = `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border p-4">
        <div class="text-sm text-gray-500">Leads Given</div>
        <div class="text-2xl font-bold">${d.totalGiven}</div>
      </div>
      <div class="bg-white rounded-xl border p-4">
        <div class="text-sm text-gray-500">Leads Taken</div>
        <div class="text-2xl font-bold">${d.totalTaken}</div>
      </div>
      <div class="bg-white rounded-xl border p-4">
        <div class="text-sm text-gray-500">Commission (Given)</div>
        <div class="text-2xl font-bold text-green-600">₹${d.totalCommissionGiven.toLocaleString()}</div>
      </div>
      <div class="bg-white rounded-xl border p-4">
        <div class="text-sm text-gray-500">Commission (Taken)</div>
        <div class="text-2xl font-bold text-blue-600">₹${d.totalCommissionTaken.toLocaleString()}</div>
      </div>
    </div>
    <div class="bg-white rounded-xl border overflow-hidden mt-4">
      <div class="px-4 py-3 border-b font-medium">Recent Transactions</div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left">Type</th>
              <th class="px-4 py-2 text-left">Lead</th>
              <th class="px-4 py-2 text-left">Status</th>
              <th class="px-4 py-2 text-left">Deal</th>
              <th class="px-4 py-2 text-left">Commission</th>
              <th class="px-4 py-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            ${d.transactions.slice(0, 50).map(t => `
              <tr class="border-t">
                <td class="px-4 py-2"><span class="px-2 py-0.5 text-xs rounded ${t.type === "GIVE" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}">${t.type}</span></td>
                <td class="px-4 py-2">${t.leadId} - ${t.name || ""}</td>
                <td class="px-4 py-2">${t.status || "-"}</td>
                <td class="px-4 py-2">₹${(t.dealValue || 0).toLocaleString()}</td>
                <td class="px-4 py-2">₹${(t.commission || 0).toLocaleString()}</td>
                <td class="px-4 py-2">${formatDisplayDate(t.date)}</td>
              </tr>
            `).join("") || `<tr><td colspan="6" class="px-4 py-6 text-center text-gray-400">No transactions</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ==================== TABS ==================== */
function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach(b => {
    b.classList.remove("bg-blue-600", "text-white");
    b.classList.add("bg-gray-100", "text-gray-700");
  });
  document.getElementById("tab-" + tab).classList.add("bg-blue-600", "text-white");
  document.getElementById("tab-" + tab).classList.remove("bg-gray-100", "text-gray-700");

  document.getElementById("leadsTab").classList.add("hidden");
  document.getElementById("usersTab")?.classList.add("hidden");
  document.getElementById("balanceTab").classList.add("hidden");

  if (tab === "leads") {
    document.getElementById("leadsTab").classList.remove("hidden");
  } else if (tab === "users") {
    document.getElementById("usersTab").classList.remove("hidden");
    loadUsers();
  } else if (tab === "balance") {
    document.getElementById("balanceTab").classList.remove("hidden");
    loadBalance();
  }
}

function bindGlobalEvents() {
  // Escape closes modal
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });
}
