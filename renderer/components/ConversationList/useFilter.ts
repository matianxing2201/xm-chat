import { useConversationsStore } from "@renderer/store/conversations";

const searchKey = ref("");
export function useFilter() {
  const conversationsStore = useConversationsStore();

  const filteredConversations = computed(() => {
    return conversationsStore.allConversations;
  });

  return {
    searchKey,
    conversations: filteredConversations,
  };
}
