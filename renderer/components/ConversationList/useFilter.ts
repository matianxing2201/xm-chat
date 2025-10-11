import { useConversationStore } from "@renderer/store/conversations";

const searchKey = ref("");

export function useFilter() {
  const conversationStore = useConversationStore();

  const filteredConversations = computed(() => {
    return conversationStore.allConversations;
  });

  return {
    searchKey,
    conversations: filteredConversations,
  };
}
