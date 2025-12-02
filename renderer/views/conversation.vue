<script setup lang="ts">
import type { SelectValue } from '@renderer/types';
import { MAIN_WIN_SIZE } from '@common/constants';
import { throttle } from '@common/utils';

import { useMessageStore } from '@renderer/store/message';

// import { messages } from '@renderer/testData';


import ResizeDivider from '@renderer/components/ResizeDivider.vue';
import MessageInput from '@renderer/components/MessageInput.vue';
import MessageList from '@renderer/components/ConversationList/MessageList.vue';
import CreateConversation from '@renderer/components/CreateConversation.vue';

import { useConversationsStore } from '@renderer/store/conversations';
import { useProvidersStore } from '@renderer/store/providers';

const listHeight = ref(0);
const listScale = ref(0.7);
const maxListHeight = ref(window.innerHeight * 0.7);
const isStoping = ref(false);
const message = ref('');
const provider = ref<SelectValue>();
const msgInputRef = useTemplateRef<{ selectedProvider: SelectValue }>('msgInputRef');

const route = useRoute();
const router = useRouter();

const messageStore = useMessageStore();
const conversationsStore = useConversationsStore();
const providersStore = useProvidersStore();

const providerId = computed(() => ((provider.value as string)?.split(':')[0] ?? ''));
const selectedModel = computed(() => ((provider.value as string)?.split(':')[1] ?? ''));

const conversationId = computed(() => Number(route.params.id));

const messageInputStatus = computed(() => {
    if (isStoping.value) return 'loading';

    const message = messageStore.messagesByConversationId(conversationId.value as number);
    const last = message[message.length - 1];

    if (last?.status === 'streaming' && last.content?.length === 0) return 'loading';
    if (last?.status === 'loading' || last?.status === 'streaming') return last?.status;
    return 'normal';
})

async function handleCreateConversation(create: (title: string) => Promise<number | void>, _message: string) {
    const id = await create(_message);
    if (!id) return;
    afterCreateConversation(id, _message);
}

function afterCreateConversation(id: number, firstMsg: string) {
    if (!id) return;
    router.push(`/conversation/${id}`);
    messageStore.sendMessage({
        type: 'question',
        content: firstMsg,
        conversationId: id,
    })

    message.value = '';
    messageStore.setMessageInputValue(id, '');
}

/**
 * 处理消息发送的异步函数
 * 实现了完整的消息发送流程，包括安全检查、消息发送和状态重置
 */
async function handleSendMessage() {
    if (!conversationId.value) return;
    const _conversationId = conversationId.value;

    const content = messageStore.messagesInputValueById(_conversationId);

    if (!content?.trim().length) return;

    messageStore.sendMessage({
        type: 'question', // 消息类型为用户提问
        content,          // 用户输入的内容
        conversationId: _conversationId, // 消息所属的会话ID
    })

    // 发送完成后清空输入框内容
    messageStore.setMessageInputValue(_conversationId, '')
}

const canUpdateConversationTime = ref(true)

/**
 * 选择了新的AI服务提供者或模型时，更新会话配置。
 * 它确保提供者ID和模型选择能够正确更新，并通过canUpdateConversationTime标志控制会话时间戳的更新行为。
 */
function handleProviderSelect() {
    const current = conversationsStore.getConversationById(conversationId.value as number);
    if (!conversationId.value || !current) return;

    // 更新会话信息，保留原有属性，同时更新providerId和selectedModel
    conversationsStore.updateConversation({
        ...current,
        providerId: Number(providerId.value),
        selectedModel: selectedModel.value,   // 更新选中的模型
    }, canUpdateConversationTime.value); // 是否更新会话的时间
}

async function handleStopMessage() {
    isStoping.value = true;
    const msgIds = messageStore.loadingMsgIdsByConversationId(conversationId.value as number ?? -1);
    for (const id of msgIds) {
        messageStore.stopMessage(id);
    }
    isStoping.value = false;
}


// 监听窗口大小变化 动态更新列表高度
window.onresize = throttle(async () => {
    if (window.innerHeight < MAIN_WIN_SIZE.minHeight) return;
    listHeight.value = window.innerHeight * listScale.value;
    await nextTick();
    maxListHeight.value = window.innerHeight * 0.7;
    if (listHeight.value > maxListHeight.value) listHeight.value = maxListHeight.value;
}, 40);

onMounted(async () => {
    await nextTick();
    listHeight.value = window.innerHeight * listScale.value;
});

onBeforeRouteUpdate(async (to, from, next) => {
    if (to.params.id === from.params.id) return next()
    await messageStore.initialize(Number(to.params.id));
    next();
})

watch(() => listHeight.value, () => listScale.value = listHeight.value / window.innerHeight);


watch([
    () => conversationId.value,  // 监听当前会话ID的变化
    () => msgInputRef.value      // 监听消息输入框组件引用的变化
], async ([id, msgInput]) => {
    // 空值检查：如果消息输入框未初始化或会话ID不存在，则直接返回
    if (!msgInput || !id) {
        return;
    }
    const current = conversationsStore.getConversationById(id);
    if (!current) return;

    // 临时禁用会话时间更新，避免在更新输入框状态过程中错误地更新会话时间戳
    canUpdateConversationTime.value = false;

    // 设置消息输入框的提供者选择，格式为"providerId:modelId"
    msgInput.selectedProvider = `${current.providerId}:${current.selectedModel}`;

    await nextTick();
    canUpdateConversationTime.value = true;

    message.value = ''
})

</script>
<template>
    <div class="h-full " v-if="!conversationId">
        <div class="h-full pt-[45vh] px-5">
            <div class="text-3xl font-bold text-primary-subtle text-center">
                {{ $t('main.welcome.helloMessage') }}
            </div>

            <div class="bg-bubble-others mt-6 max-w-[800px] h-[200px] mx-auto rounded-md">
                <create-conversation :providerId="providerId" :selectedModel="selectedModel" v-slot="{ create }">
                    <message-input v-model:message="message" v-model:provider="provider"
                        :placeholder="$t('main.conversation.placeholder')"
                        @send="handleCreateConversation(create, message)" />
                </create-conversation>
            </div>
        </div>
    </div>
    <div class="h-full flex flex-col" v-else>
        <div class="w-full min-h-0" :style="{ height: `${listHeight}px` }">
            <message-list :messages="messageStore.messagesByConversationId(conversationId)" />
        </div>
        <div class="input-container bg-bubble-others flex-auto w-full">
            <resize-divider direction="horizontal" v-model:size="listHeight" :max-size="maxListHeight"
                :min-size="100" />

            <message-input class="p-2 pt-0" ref="msgInputRef"
                :message="messageStore.messagesInputValueById(conversationId ?? -1)" v-model:provider="provider"
                :placeholder="$t('main.conversation.placeholder')" :status="messageInputStatus"
                @update:message="messageStore.setMessageInputValue(conversationId ?? -1, $event)"
                @send="handleSendMessage" @select="handleProviderSelect" @stop="handleStopMessage" />
        </div>
    </div>
</template>

<style scoped>
.input-container {
    box-shadow: 5px 1px 20px 0px rgba(101, 101, 101, 0.2);
}
</style>
