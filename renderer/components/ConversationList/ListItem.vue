<script setup lang='ts'>

import type { Conversation } from '@common/types'
import { Icon as IconifyIcon } from '@iconify/vue'
import ItemTitle from './ItemTitle.vue';

// 定义置顶图标尺寸常量
const _PIN_ICON_SIZE = 16 as const

defineOptions({ name: 'ConversationListItem' });

// 接收对话数据作为props
defineProps<Conversation>();

// 定义事件发射器
const emit = defineEmits(['updateTitle']);
</script>


<template>
    <!-- 对话描述信息，显示模型名称和置顶状态 -->
    <div class="conversation-desc text-tx-secondary flex justify-between items-center text-sm loading-5">
        <span>
            <!-- 显示选中的模型 -->
            {{ selectedModel }}

            <!-- 如果对话被置顶，则显示置顶图标 -->
            <iconify-icon class="inline-block" v-if="pinned" icon="material-symbols:keep-rounded"
                :width="_PIN_ICON_SIZE" :height="_PIN_ICON_SIZE" />
        </span>
    </div>

    <!-- 对话标题区域 -->
    <div class="w-full flex items-center">
        <!-- 复选框预留区域 -->
        <item-title :title="title" />
    </div>
</template>

<style scoped></style>