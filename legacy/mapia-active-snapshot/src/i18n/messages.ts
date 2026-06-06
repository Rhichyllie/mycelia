import messages from "@/messages/pt-BR.json";

export type AppMessages = typeof messages;

export async function loadMessages(_locale?: string): Promise<AppMessages> {
  void _locale;
  return messages;
}
