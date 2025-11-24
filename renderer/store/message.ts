import type { Message, MessageStatus } from "@common/types";
import { cloneDeep, uniqueByKey } from "@common/utils";
import { defineStore } from "pinia";

import { dataBase } from "../dataBase";

import { useConversationsStore } from "./conversations";

export const useMessageStore = defineStore("message", () => {
  const conversationsStore = useConversationsStore();

  // State
  const messages = ref<Message[]>([]);

  // Getter
  const allMessages = computed(() => messages.value);
  const messageByConversationId = computed(
    () => (conversationId: number) =>
      messages.value.filter((item) => item.conversationId === conversationId)
  );

  // Action
  async function initialize(conversationId: number) {
    if (!conversationId) return;

    // 判断当前会话是否已加载
    const isConversationLoaded = messages.value.some(
      (message) => message.conversationId === conversationId
    );

    if (isConversationLoaded) return;

    // 从数据库加载当前会话的消息
    const saved = await dataBase.messages.where({ conversationId }).toArray();

    // 合并已加载的消息和从数据库加载的消息，去重
    messages.value = uniqueByKey([...messages.value, ...saved], "id");
  }

  // 更新会话
  const _updateConversation = async (conversationId: number) => {
    const conversation = await dataBase.conversations.get(conversationId);
    conversation && conversationsStore.updateConversation(conversation);
  };

  // 添加消息
  async function addMessage(message: Omit<Message, "id" | "createdAt">) {
    const newMessage = {
      ...message,
      createdAt: Date.now(),
    };
    const id = await dataBase.messages.add(newMessage);
    _updateConversation(newMessage.conversationId);
    messages.value.push({
      ...newMessage,
      id,
    });
    return id;
  }

  // 发送消息
  async function sendMessage(message: Omit<Message, "id" | "createdAt">) {
    await addMessage(message);
    // TODO 调用大模型
  }

  // 更新消息
  async function updateMessage(id: number, updates: Partial<Message>) {
    let currentMsg = cloneDeep(
      messages.value.find((message) => message.id === id)
    );
    await dataBase.messages.update(id, { ...currentMsg, ...updates });
    messages.value = messages.value.map((message) =>
      message.id === id ? { ...message, ...updates } : message
    );
  }

  // 删除消息
  async function deleteMessage(id: number) {
    let currentMsg = cloneDeep(
      messages.value.find((message) => message.id === id)
    );
    // TODO: stopMessage
    await dataBase.messages.delete(id);
    currentMsg && _updateConversation(currentMsg.conversationId);
    // 从消息列表中移除
    messages.value = messages.value.filter((message) => message.id !== id);
    currentMsg = void 0;
  }

  return {
    messages,
    allMessages,
    messageByConversationId,
    initialize,
    addMessage,
    sendMessage,
    updateMessage,
    deleteMessage,
  };
});
