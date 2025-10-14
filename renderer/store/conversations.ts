/**
 * 对话存储模块
 * 管理应用中的所有对话记录状态
 */

import type { Conversation } from "@common/constants";
import { conversations as testConversations } from "../testData";

// 定义对话存储
export const useConversationStore = defineStore("conversations", () => {
  // 对话列表状态，当前使用测试数据
  const conversations = ref<Conversation[]>(testConversations);

  // 计算属性：返回所有对话
  const allConversations = computed(() => conversations.value);

  // 返回状态和计算属性
  return {
    conversations,
    allConversations,
  };
});