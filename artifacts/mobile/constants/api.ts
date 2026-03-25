export const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export const authEndpoints = {
  login: `${API_BASE}/auth/login`,
  logout: `${API_BASE}/auth/logout`,
  me: `${API_BASE}/auth/me`,
};

export const registrationEndpoints = {
  registerDoctor: `${API_BASE}/registration/doctors/register`,
  registerStudent: `${API_BASE}/registration/students/register`,
  universities: `${API_BASE}/registration/universities`,
  doctors: `${API_BASE}/registration/doctors`,
  students: `${API_BASE}/registration/students`,
  verifyDoctor: (id: number) => `${API_BASE}/registration/doctors/${id}/verify`,
  verifyStudent: (id: number) => `${API_BASE}/registration/students/${id}/verify`,
  adminStats: `${API_BASE}/registration/admin/stats`,
};

export const endpoints = {
  patients: `${API_BASE}/patients`,
  patient: (id: number) => `${API_BASE}/patients/${id}`,
  patientProfile: (id: number) => `${API_BASE}/patients/${id}/profile`,
  patientCases: (id: number) => `${API_BASE}/patients/${id}/cases`,
  cases: `${API_BASE}/cases`,
  case: (id: number) => `${API_BASE}/cases/${id}`,
  caseRos: (id: number) => `${API_BASE}/cases/${id}/ros`,
  caseComplaints: (id: number) => `${API_BASE}/cases/${id}/chief-complaints`,
  interviewStart: (id: number) => `${API_BASE}/cases/${id}/interview/start`,
  interviewMessage: (id: number) => `${API_BASE}/cases/${id}/interview/message`,
  interviewComplete: (id: number) => `${API_BASE}/cases/${id}/interview/complete`,
  generateReport: (id: number) => `${API_BASE}/cases/${id}/generate-report`,
  report: (id: number) => `${API_BASE}/cases/${id}/report`,
  doctorReview: (id: number) => `${API_BASE}/cases/${id}/doctor-review`,
  consultations: `${API_BASE}/consultations`,
};
