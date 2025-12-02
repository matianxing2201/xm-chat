import type { Message, MessageStatus } from "@common/types";
import { cloneDeep, uniqueByKey } from "@common/utils";
import { listenDialogueBack } from "../utils/dialogue";
import { defineStore } from "pinia";

import { dataBase } from "../dataBase";

import { useConversationsStore } from "./conversations";
import { useProvidersStore } from "./providers";
import i18n from "../i18n";

const msgContentMap = new Map<number, string>();
export const stopMethods = new Map<number, () => void>();

export const useMessageStore = defineStore("message", () => {
  const conversationsStore = useConversationsStore();
  const providersStore = useProvidersStore();

  // State
  const messages = ref<Message[]>([]);

  const messageInputValue = ref(new Map());

  // Getter
  const allMessages = computed(() => messages.value);
  const messagesByConversationId = computed(
    () => (conversationId: number) =>
      messages.value.filter((item) => item.conversationId === conversationId)
  );
  /**
   * 根据会话ID获取对应会话的输入框内容
   */
  const messagesInputValueById = computed(
    () => (conversationId: number) =>
      messageInputValue.value.get(conversationId)
  );

  // 获取指定会话中所有处于加载状态的消息ID (状态为loading或streaming(流式传输中)的消息)
  const loadingMsgIdsByConversationId = computed(
    () => (conversationId: number) =>
      messagesByConversationId
        .value(conversationId)
        .filter(
          (message) =>
            message.status === "loading" || message.status === "streaming"
        )
        .map((message) => message.id)
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

  function setMessageInputValue(conversationId: number, value: string) {
    messageInputValue.value.set(conversationId, value);
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

    const loadingMsgId = await addMessage({
      conversationId: message.conversationId,
      type: "answer",
      content: "",
      status: "loading",
    });

    const conversation = conversationsStore.getConversationById(
      message.conversationId
    );

    if (!conversation) return loadingMsgId;

    const provider = providersStore.allProviders.find(
      (item) => item.id === conversation.providerId
    );

    if (!provider) return loadingMsgId;

    msgContentMap.set(loadingMsgId, "");

    let streamCallback:
      | ((stream: DialogueBackStream) => Promise<void>)
      | void = async (stream) => {
      const { data, messageId } = stream;

      const getStatus = (data: DialogueBackStream["data"]): MessageStatus => {
        if (data.isError) return "error";
        if (data.isEnd) return "success";
        return "streaming";
      };

      msgContentMap.set(messageId, msgContentMap.get(messageId) + data.result);

      const _update = {
        content: msgContentMap.get(messageId) || "",
        status: getStatus(data),
        updatedAt: Date.now(),
      } as Message;

      await nextTick();
      updateMessage(messageId, _update);
      if (data.isEnd) {
        console.log(msgContentMap.get(messageId));

        msgContentMap.delete(messageId);
        streamCallback = void 0;
      }
    };
    stopMethods.set(
      loadingMsgId,
      listenDialogueBack(streamCallback, loadingMsgId)
    );
    const messages = messagesByConversationId
      .value(message.conversationId)
      .filter((item) => item.status !== "loading")
      .map((item) => ({
        role:
          item.type === "question"
            ? "user"
            : ("assistant" as DialogueMessageRole),
        content: item.content,
      }));

    await window.api.startADialogue({
      messageId: loadingMsgId,
      providerName: provider.name,
      selectedModel: conversation.selectedModel,
      conversationId: message.conversationId,
      messages,
    });

    return loadingMsgId;
  }

  /**
   * 停止指定ID的消息生成（中断流式响应）
   *
   * @param id 要停止的消息ID
   * @param update 是否更新消息状态和内容（默认为true）
   */
  async function stopMessage(id: number, update: boolean = true) {
    const stopMethod = stopMethods.get(id);
    stopMethod && stopMethod();

    if (update) {
      const msgContent =
        messages.value.find((message) => message.id === id)?.content || "";
      await updateMessage(id, {
        status: "success",
        updatedAt: Date.now(),
        content: msgContent
          ? msgContent + i18n.global.t("main.message.stoppedGeneration")
          : void 0,
      });
    }
    stopMethods.delete(id);
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
    messagesByConversationId,
    messagesInputValueById,
    loadingMsgIdsByConversationId,
    setMessageInputValue,
    initialize,
    addMessage,
    sendMessage,
    updateMessage,
    deleteMessage,
    stopMessage,
  };
});
