import type { Conversation } from "@common/constants";
import { conversations as testConversations } from "../testData";

export const useConversationStore = defineStore("conversations", () => {
  const conversations = ref<Conversation[]>(testConversations);

  const allConversations = computed(() => conversations.value);

  return {
    conversations,
    allConversations,
  };
});
