/**
 * 对话列表过滤功能组合式函数
 * 提供对话列表的搜索和过滤功能
 */

import { useConversationStore } from "@renderer/store/conversations";

// 搜索关键字状态
const searchKey = ref("");

export function useFilter() {
  // 获取对话存储实例
  const conversationStore = useConversationStore();

  // 计算属性：过滤后的对话列表
  // 当前实现返回所有对话，未来可以扩展搜索过滤逻辑
  const filteredConversations = computed(() => {
    // TODO: 根据searchKey实现真正的过滤逻辑
    return conversationStore.allConversations;
  });

  // 返回搜索关键字和过滤后的对话列表
  return {
    searchKey,
    conversations: filteredConversations,
  };
}