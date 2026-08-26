export interface MessageReceivedEvent {
  source: "sms" | "whatsapp";
  sender: string;
  body: string;
}

export type ValityMessagingEvents = {
  onMessageReceived: (event: MessageReceivedEvent) => void;
};
