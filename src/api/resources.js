import { apiFetch } from './client';

export const listPatients = () => apiFetch('/api/patients');
export const createPatient = (body) => apiFetch('/api/patients', { method: 'POST', body });
export const updatePatient = (id, body) => apiFetch(`/api/patients/${id}`, { method: 'PATCH', body });
export const deletePatient = (id) => apiFetch(`/api/patients/${id}`, { method: 'DELETE' });

export const listDoctors = () => apiFetch('/api/doctors');
export const createDoctor = (body) => apiFetch('/api/doctors', { method: 'POST', body });
export const updateDoctor = (id, body) => apiFetch(`/api/doctors/${id}`, { method: 'PATCH', body });
export const deleteDoctor = (id) => apiFetch(`/api/doctors/${id}`, { method: 'DELETE' });

export const listAppointments = (date) => apiFetch(`/api/appointments?date=${date}`);
export const createAppointment = (body) => apiFetch('/api/appointments', { method: 'POST', body });
export const updateAppointment = (id, body) => apiFetch(`/api/appointments/${id}`, { method: 'PATCH', body });
export const deleteAppointment = (id) => apiFetch(`/api/appointments/${id}`, { method: 'DELETE' });
