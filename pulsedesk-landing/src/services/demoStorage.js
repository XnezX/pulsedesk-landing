const KEY = "pulsedesk_demo_contacts_v1";

export function loadContacts(defaultContacts) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultContacts;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultContacts;
  } catch {
    return defaultContacts;
  }
}

export function saveContacts(contacts) {
  localStorage.setItem(KEY, JSON.stringify(contacts));
}

export function resetContacts() {
  localStorage.removeItem(KEY);
}
