import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Stethoscope } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import Modal from '../../components/Modal/Modal';
import { useToast } from '../../components/Toast/ToastProvider';
import { listDoctors, createDoctor, updateDoctor, deleteDoctor } from '../../api/resources';

const EMPTY_FORM = { name: '', specialty: '' };

export default function DoctorsPage() {
  const showToast = useToast();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDoctors(await listDoctors());
    } catch (err) {
      showToast(err.message, false);
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (doctor) => {
    setEditing(doctor);
    setForm({ name: doctor.name, specialty: doctor.specialty || '' });
    setModalOpen(true);
  };

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Doctor name is required.', false);
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateDoctor(editing.id, form);
        showToast('Doctor updated.');
      } else {
        await createDoctor(form);
        showToast('Doctor added.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err.message, false);
    }
    setSaving(false);
  };

  const handleDelete = async (doctor) => {
    if (!window.confirm(`Delete ${doctor.name}? This cannot be undone.`)) return;
    try {
      await deleteDoctor(doctor.id);
      setDoctors((list) => list.filter((d) => d.id !== doctor.id));
      showToast('Doctor deleted.');
    } catch (err) {
      showToast(err.message, false);
    }
  };

  return (
    <DashboardLayout
      title="Doctors"
      actions={(
        <button className="btn btn-blue" onClick={openCreate}>
          <Plus size={16} /> Add Doctor
        </button>
      )}
    >
      <div className="panel">
        {loading ? (
          <div className="empty-state"><p>Loading…</p></div>
        ) : doctors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Stethoscope size={24} /></div>
            <h3>No doctors yet</h3>
            <p>Add the doctors of your clinic so appointments can be booked with them.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Specialty</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id}>
                    <td className="cell-strong">{d.name}</td>
                    <td>{d.specialty || '—'}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(d)}>
                          <Pencil size={15} />
                        </button>
                        <button className="btn-icon danger" title="Delete" onClick={() => handleDelete(d)}>
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
        <Modal title={editing ? 'Edit Doctor' : 'Add Doctor'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="fld">
              <label>Full name</label>
              <input type="text" value={form.name} onChange={setField('name')} placeholder="Dr. Sarah Chen" required />
            </div>
            <div className="fld">
              <label>Specialty</label>
              <input type="text" value={form.specialty} onChange={setField('specialty')} placeholder="Cardiology" />
            </div>
            <div className="modal-form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-blue" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Doctor'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
