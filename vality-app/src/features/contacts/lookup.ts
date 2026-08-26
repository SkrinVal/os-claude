import * as Contacts from "expo-contacts";

export interface ContactMatch {
  name: string;
  phoneNumber: string;
}

export async function hasContactsPermission(): Promise<boolean> {
  const { status } = await Contacts.getPermissionsAsync();
  return status === "granted";
}

export async function requestContactsPermission(): Promise<boolean> {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === "granted";
}

// Ein Kontakt mit mehreren Telefonnummern erzeugt mehrere Treffer - der
// Server fragt sowieso nach, sobald mehr als ein Treffer zurueckkommt,
// das deckt auch diesen Fall ab (keine Rate-Logik noetig).
export async function findContactsByName(name: string): Promise<ContactMatch[]> {
  const granted = await hasContactsPermission();
  if (!granted) return [];

  const results = await Contacts.Contact.getAllDetails(
    [Contacts.ContactField.FULL_NAME, Contacts.ContactField.PHONES],
    { name }
  );

  const matches: ContactMatch[] = [];
  for (const contact of results) {
    const fullName = contact.fullName?.trim();
    if (!fullName) continue;
    for (const phone of contact.phones ?? []) {
      if (phone.number) {
        matches.push({ name: fullName, phoneNumber: phone.number });
      }
    }
  }
  return matches;
}
