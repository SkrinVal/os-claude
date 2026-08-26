export interface Reminder {
  id: string;
  text: string;
  /** ISO-8601, wann die Erinnerung faellig wird. */
  dueAt: string;
  createdAt: string;
  fired: boolean;
  firedAt?: string;
}
