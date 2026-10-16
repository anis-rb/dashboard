/**
 * Auth helpers
 */
const auth = {
  saveSession(token, user) {
    localStorage.setItem("rb_token", token);
    localStorage.setItem("rb_user", JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem("rb_token");
    localStorage.removeItem("rb_user");
  },

  getToken() {
    return localStorage.getItem("rb_token");
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem("rb_user") || "null");
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },

  isAdmin() {
    const u = this.getUser();
    return u && u.role === "Admin";
  },

  isPartner() {
    const u = this.getUser();
    return u && u.role === "Partner";
  },

  isChampion() {
    const u = this.getUser();
    return u && (u.role === "Champion" || u.role === "City Head");
  },

  logout() {
    this.clearSession();
    window.location.reload();
  }
};
