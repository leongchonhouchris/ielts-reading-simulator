// =============================================================
// DATABASE HELPERS — all Firestore calls go through here
// =============================================================

import { db, collection, doc, getDocs, getDoc, setDoc, deleteDoc, addDoc } from "./firebase-config.js";

const TESTS_COLLECTION   = "tests";
const RESULTS_COLLECTION = "results";
const CONFIG_DOC         = "config/settings";

// ── Tests ──────────────────────────────────────────────────────
export async function getAllTests() {
  const snapshot = await getDocs(collection(db, TESTS_COLLECTION));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getTest(id) {
  const snap = await getDoc(doc(db, TESTS_COLLECTION, id));
  if (!snap.exists()) throw new Error("Test not found: " + id);
  return { id: snap.id, ...snap.data() };
}

export async function saveTest(testData) {
  // If testData has an id, update; otherwise create new
  if (testData.id) {
    const { id, ...data } = testData;
    await setDoc(doc(db, TESTS_COLLECTION, id), data);
    return id;
  } else {
    const ref = await addDoc(collection(db, TESTS_COLLECTION), testData);
    return ref.id;
  }
}

export async function deleteTest(id) {
  await deleteDoc(doc(db, TESTS_COLLECTION, id));
}

// ── Results ────────────────────────────────────────────────────
export async function saveResult(resultData) {
  const ref = await addDoc(collection(db, RESULTS_COLLECTION), resultData);
  return ref.id;
}

export async function getAllResults() {
  const snapshot = await getDocs(collection(db, RESULTS_COLLECTION));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteResult(id) {
  await deleteDoc(doc(db, RESULTS_COLLECTION, id));
}

// ── Config (admin password, class list etc.) ───────────────────
export async function getConfig() {
  const snap = await getDoc(doc(db, CONFIG_DOC));
  if (!snap.exists()) return { adminPassword: "admin123", classList: ["S3C", "S5B"] };
  const data = snap.data();
  if (!data.classList) data.classList = ["S3C", "S5B"];
  return data;
}

export async function saveConfig(configData) {
  // Merge with existing config so partial saves don't wipe other fields
  const existing = await getConfig();
  await setDoc(doc(db, CONFIG_DOC), { ...existing, ...configData });
}

// ── Seed helper: upload sample test if Firestore is empty ──────
export async function seedIfEmpty(sampleTest) {
  const snapshot = await getDocs(collection(db, TESTS_COLLECTION));
  if (snapshot.empty) {
    await addDoc(collection(db, TESTS_COLLECTION), sampleTest);
    console.log("Seeded Firestore with sample test.");
  }
}
