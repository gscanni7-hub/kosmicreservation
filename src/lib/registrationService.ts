import {
  collection, doc, addDoc, updateDoc, getDocs, query,
  where, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Registration } from '../types';

const COL = 'registrations';

export async function createRegistration(
  data: Omit<Registration, 'id' | 'registeredAt' | 'checkedIn'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    checkedIn: false,
    registeredAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getRegistrationsByEvent(eventId: string): Promise<Registration[]> {
  const q = query(collection(db, COL), where('eventId', '==', eventId));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    const ts = data.registeredAt;
    return {
      ...data,
      id: d.id,
      registeredAt: ts instanceof Timestamp ? ts.toDate().toISOString() : String(ts ?? ''),
    } as Registration;
  });
}

export async function getRegistrationsByPr(prId: string): Promise<Registration[]> {
  const q = query(collection(db, COL), where('prId', '==', prId));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    const ts = data.registeredAt;
    return {
      ...data,
      id: d.id,
      registeredAt: ts instanceof Timestamp ? ts.toDate().toISOString() : String(ts ?? ''),
    } as Registration;
  });
}

export async function getRegistrationById(id: string): Promise<Registration | null> {
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  const data = snap.data();
  const ts = data.registeredAt;
  return {
    ...data,
    id: snap.id,
    registeredAt: ts instanceof Timestamp ? ts.toDate().toISOString() : String(ts ?? ''),
  } as Registration;
}

export async function getRegistrationByToken(token: string): Promise<Registration | null> {
  const q = query(collection(db, COL), where('token', '==', token));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  const ts = data.registeredAt;
  return {
    ...data,
    id: d.id,
    registeredAt: ts instanceof Timestamp ? ts.toDate().toISOString() : String(ts ?? ''),
  } as Registration;
}

export async function checkInRegistration(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    checkedIn: true,
    checkedInAt: new Date().toISOString(),
  });
}

export async function undoCheckInRegistration(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    checkedIn: false,
    checkedInAt: null,
  });
}
