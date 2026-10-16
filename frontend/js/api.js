/**
 * RefBuddy API Client
 * Change API_BASE to your deployed Google Apps Script Web App URL
 */
const API_BASE = "https://script.google.com/macros/s/AKfycbzKBPbd94DfTaIwWneMBqFZ1Oqm-UJkMHpe-fk2ldyHm8_1Q5x7b3U4IMB5EXWmDM93jw/exec";

const api = {
  async request(action, data = {}, method = "POST") {
    const token = localStorage.getItem("rb_token");
    const payload = { action, token, ...data };

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" } // required for Apps Script
      });
      const json = await res.json();
      return json;
    } catch (err) {
      console.error("API Error:", err);
      return { success: false, message: "Network error. Please try again." };
    }
  },

  login(email, password) {
    return this.request("login", { email, password });
  },

  register(payload) {
    return this.request("register", payload);
  },

  getLeads(params = {}) {
    return this.request("getLeads", params);
  },

  updateLead(leadId, fields) {
    return this.request("updateLead", { leadId, ...fields });
  },

  getMetrics() {
    return this.request("getMetrics");
  },

  getUsers() {
    return this.request("getUsers");
  },

  approveUser(userId, status) {
    return this.request("approveUser", { userId, status });
  },

  getBalance() {
    return this.request("getBalance");
  },

  getTheme() {
    return this.request("getTheme");
  },

  health() {
    return this.request("health");
  }
};
