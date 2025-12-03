<template>
    <div class=" flex flex-col h-full">
        <n-scrollbar class="message-list px-5 pt-6">
            <div class="message-list-item mt-3 pb-5 flex items-center" v-for="message in messages" :key="message.id">
                <div class="pr-5" v-show="false">
                    <!-- 多选 checkbox -->
                </div>
                <div class="flex flex-auto"
                    :class="{ 'justify-end': message.type === 'question', 'justify-start': message.type === 'answer' }">
                    <span>
                        <div class="text-sm text-gray-500 mb-2"
                            :style="{ textAlign: message.type === 'question' ? 'end' : 'start' }">
                            <!-- timeAgo -->
                            {{ formatTimeAgo(message.createdAt) }}
                        </div>
                        <div class="msg-shadow p-2 rounded-md bg-bubble-self text-white"
                            v-if="message.type === 'question'">
                            <message-render :msg-id="message.id" :content="message.content"
                                :is-streaming="message.status === 'streaming'" />
                        </div>
                        <div v-else class="msg-shadow p-2 px-6 rounded-md bg-bubble-others" :class="{
                            'bg-bubble-others': message.status !== 'error',
                            'text-tx-primary': message.status !== 'error',
                            'text-red-300': message.status === 'error',
                            'font-bold': message.status === 'error'
                        }">
                            <template v-if="message.status === 'loading'">
                                ...
                            </template>
                            <template v-else>
                                <message-render :msg-id="message.id" :content="message.content"
                                    :is-streaming="message.status === 'streaming'" />
                            </template>
                        </div>
                    </span>
                </div>
            </div>
        </n-scrollbar>
    </div>
</template>
<script setup lang='ts'>
import type { Message } from '@common/types'

import { NScrollbar } from 'naive-ui'
import { useBatchTimeAgo } from '@renderer/hooks/useTimeAgo'
import MessageRender from './ConversationList/MessageRender.vue';

const MESSAGE_LIST_CLASS_NAME = 'message-list';
const SCROLLBAR_CONTENT_CLASS_NAME = 'n-scrollbar-content';

defineOptions({
    name: 'MessageList'
})
const props = defineProps<{
    messages: Message[]
}>()

const route = useRoute();

const { formatTimeAgo } = useBatchTimeAgo();

/**
 * 获取滚动容器DOM元素
 * @returns 滚动容器DOM元素或undefined
 */
function _getScrollDOM() {
    const msgListDOM = document.getElementsByClassName(MESSAGE_LIST_CLASS_NAME)[0];
    if (!msgListDOM) return;
    return msgListDOM.getElementsByClassName(SCROLLBAR_CONTENT_CLASS_NAME)[0];
}

/**
 * 滚动到列表底部
 * @param behavior 滚动行为，默认值为'smooth'
 */
async function scrollToBottom(behavior: ScrollIntoViewOptions['behavior'] = 'smooth') {
    await nextTick();
    const scrollDOM = _getScrollDOM();
    if (!scrollDOM) return;
    scrollDOM.scrollIntoView({
        behavior,
        block: 'end',
    })
}

let currentHeight = 0;

// 监听 模型切换 / 内容更新  滚动到底部
watch([() => route.params.id, () => props.messages.length], () => {
    scrollToBottom('instant');
    currentHeight = 0
})

// 监听消息列表长度变化 滚动到底部 
watch(() => props.messages[props.messages.length - 1], () => {
    const scrollDOM = _getScrollDOM();
    if (!scrollDOM) return;
    const height = scrollDOM.scrollHeight;
    if (height > currentHeight) {
        currentHeight = height
        scrollToBottom();
    }
}, {
    immediate: true,
    deep: true
})


onMounted(() => {
    scrollToBottom('instant');
})

</script>
<style scoped>
.msg-shadow {
    box-shadow: 0 0 10px var(--input-bg);
}
</style>
