// import type { Conversation } from '@common/types';
import { useConversationsStore } from "@renderer/store/conversations";

const searchKey = ref("");
// const _searchKey = ref('');
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
