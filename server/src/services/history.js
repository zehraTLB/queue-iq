import { getDb } from '../firebaseAdmin.js';

const CHUNK_SIZE = 10;

export async function fetchHistories(patientIds) {
  const unique = [...new Set(patientIds)].filter(Boolean);
  const map = new Map(unique.map((id) => [id, []]));
  if (unique.length === 0) return map;

  const chunks = [];
  for (let i = 0; i < unique.length; i += CHUNK_SIZE) {
    chunks.push(unique.slice(i, i + CHUNK_SIZE));
  }

  const snapshots = await Promise.all(
    chunks.map((chunk) => getDb().collection('appointments').where('patientId', 'in', chunk).get())
  );

  for (const snap of snapshots) {
    for (const doc of snap.docs) {
      const appt = doc.data();
      const list = map.get(appt.patientId);
      if (list) list.push({ id: doc.id, ...appt });
    }
  }

  return map;
}
