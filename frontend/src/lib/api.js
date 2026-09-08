import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = {
  scenarios: () => axios.get(`${API}/scenarios`).then(r => r.data.scenarios),
  scenario: (slug) => axios.get(`${API}/scenarios/${slug}`).then(r => r.data.scenario),
  frameworks: () => axios.get(`${API}/frameworks`).then(r => r.data.frameworks),
  analyzePrep: (payload) => axios.post(`${API}/prep/analyze`, payload).then(r => r.data.preparation),
  createNeg: (payload) => axios.post(`${API}/negotiations`, payload).then(r => r.data.negotiation),
  listNeg: () => axios.get(`${API}/negotiations`).then(r => r.data.negotiations),
  getNeg: (id) => axios.get(`${API}/negotiations/${id}`).then(r => r.data.negotiation),
  sendMsg: (id, content) => axios.post(`${API}/negotiations/${id}/message`, { content }).then(r => r.data),
  endNeg: (id, action) => axios.post(`${API}/negotiations/${id}/end`, { action }).then(r => r.data.negotiation),
  stats: () => axios.get(`${API}/users/me/stats`).then(r => r.data),
  recommended: () => axios.get(`${API}/users/me/recommended`).then(r => r.data),
  frameworkStats: () => axios.get(`${API}/users/me/framework-stats`).then(r => r.data),
  coachHint: (negId) => axios.post(`${API}/coach/hint`, { negotiation_id: negId }).then(r => r.data),
};
