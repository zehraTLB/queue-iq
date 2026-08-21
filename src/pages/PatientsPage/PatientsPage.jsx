import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../components/Toast/ToastProvider';
import { listPatients, createPatient, updatePatient, deletePatient } from '../../api/resources';
import './PatientsPage.scss';

const EMPTY_FORM = { firstName: '', lastName: '', phone: '', email: '', dateOfBirth: '', notes: '' };

function AttendanceCell({ reliability }) {
  if (!reliability || reliability.visits === 0) {
    return <span className="attendance-new">No history</span>;
  }

  const { attended, noShows, visits, noShowRate } = reliability;
  const tone = noShowRate === null || noShowRate < 15 ? 'good' : noShowRate < 35 ? 'fair' : 'poor';

  return (
    <span className={`attendance attendance-${tone}`}>
      <span className="attendance-rate">{attended}/{visits} attended</span>
      {noShows > 0 && <span className="attendance-sub">{noShows} missed</span>}
    </span>
  );
}

export default function PatientsPage() {
  const showToast = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPatients(await listPatients());
    } catch (err) {
      showToast(err.message, false);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      `${p.firstName} ${p.lastName} ${p.email} ${p.phone}`.toLowerCase().includes(q)
    );
  }, [patients, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (patient) => {
    setEditing(patient);
    setForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone || '',
      email: patient.email || '',
      dateOfBirth: patient.dateOfBirth || '',
      notes: patient.notes || '',
    });
    setModalOpen(true);
  };

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      showToast('First and last name are required.', false);
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updatePatient(editing.id, form);
        showToast('Patient updated.');
      } else {
        await createPatient(form);
        showToast('Patient added.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err.message, false);
    }
    setSaving(false);
  };

  const handleDelete = async (patient) => {
    if (!window.confirm(`Delete ${patient.firstName} ${patient.lastName}? This cannot be undone.`)) return;
    try {
      await deletePatient(patient.id);
      setPatients((list) => list.filter((p) => p.id !== patient.id));
      showToast('Patient deleted.');
    } catch (err) {
      showToast(err.message, false);
    }
  };

  return (
    <DashboardLayout
      title="Patients"
      actions={(
        <button className="btn btn-blue" onClick={openCreate}>
          <Plus size={16} /> Add Patient
        </button>
      )}
    >
      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone…"
        />
      </div>

      <div className="panel">
        {loading ? (
          <div className="empty-state"><p>Loading…</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Users size={24} /></div>
            <h3>{search ? 'No matches' : 'No patients yet'}</h3>
            <p>
              {search
                ? 'No patients match your search.'
                : 'Add your first patient to start booking appointments.'}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Attendance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-strong">{p.firstName} {p.lastName}</td>
                    <td>{p.phone || '—'}</td>
                    <td>{p.email || '—'}</td>
                    <td><AttendanceCell reliability={p.reliability} /></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(p)}>
                          <Pencil size={15} />
                        </button>
                        <button className="btn-icon danger" title="Delete" onClick={() => handleDelete(p)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit Patient' : 'Add Patient'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="fld-row">
              <div className="fld">
                <label>First name</label>
                <input type="text" value={form.firstName} onChange={setField('firstName')} placeholder="Jane" required />
              </div>
              <div className="fld">
                <label>Last name</label>
                <input type="text" value={form.lastName} onChange={setField('lastName')} placeholder="Smith" required />
              </div>
            </div>
            <div className="fld-row">
              <div className="fld">
                <label>Phone</label>
                <input type="tel" value={form.phone} onChange={setField('phone')} placeholder="+1 555 000 0000" />
              </div>
              <div className="fld">
                <label>Date of birth</label>
                <input type="date" value={form.dateOfBirth} onChange={setField('dateOfBirth')} />
              </div>
            </div>
            <div className="fld">
              <label>Email</label>
              <input type="email" value={form.email} onChange={setField('email')} placeholder="jane@example.com" />
            </div>
            <div className="fld">
              <label>Notes</label>
              <textarea value={form.notes} onChange={setField('notes')} placeholder="Allergies, preferences…" />
            </div>
            <div className="modal-form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-blue" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Patient'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
