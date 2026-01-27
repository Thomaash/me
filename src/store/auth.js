import { toRaw } from "vue";

const state = () => ({
  token: null,
  user: null,
});

const mutations = {
  setAuth(state, { token, user }) {
    state.token = token;
    state.user = user || null;
  },
  clearAuth(state) {
    state.token = null;
    state.user = null;
  },
};

const actions = {
  async login({ commit }, { email, password }) {
    const res = await fetch(import.meta.env.VITE_API_URL + "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "login failed");
    }

    commit("setAuth", { token: data.token, user: data.user });
    return data.user;
  },

  async register({ commit }, { email, password, name }) {
    const res = await fetch(import.meta.env.VITE_API_URL + "/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "register failed");
    }

    commit("setAuth", { token: data.token, user: data.user });
    return data.user;
  },

  async init({ state, commit }) {
    // If we have a token, verify it by calling /api/me
    if (!state.token) return;
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + "/api/me", {
        headers: { Authorization: `Bearer ${state.token}` },
      });
      if (!res.ok) throw new Error("invalid token");
      const data = await res.json();
      commit("setAuth", { token: state.token, user: data.user });
    } catch (err) {
      commit("clearAuth");
    }
  },

  logout({ commit }) {
    commit("clearAuth");
  },
};

const getters = {
  isAuthenticated(state) {
    return !!state.token && !!state.user;
  },
  userDisplay(state) {
    if (!state.user) return null;
    return { name: state.user.name || state.user.email, email: state.user.email };
  },
};

export const auth = {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
