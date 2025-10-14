<script setup lang='ts'>

import { useFilter } from './useFilter'
import { CTX_KEY } from './constants';
import SearchBar from './SearchBar.vue';
import ListItem from './ListItem.vue';

defineOptions({ name: 'ConversationList' });

const props = defineProps<{ width: number }>();

provide(CTX_KEY, {
    width: computed(() => props.width),
});

// 使用过滤功能获取对话列表数据
const { conversations } = useFilter();

</script>

<template>
    <!-- 会话列表容器 -->
    <div class="conversation-list px-2 pt-3 h-[100vh] flex flex-col" :style="{ width: 'calc(100% - 57px)' }">
        <!-- 搜索栏组件 -->
        <search-bar class="mt-3" />

        <!-- 对话列表容器，支持滚动 -->
        <ul class="flex-auto overflow-auto">
            <!-- 遍历所有对话项 -->
            <template v-for="item in conversations" :key="item.id">
                <!-- 普通对话项 -->
                <li v-if="item.type !== 'divider'"
                    class="abcitem cursor-pointer p-2 mt-2 rounded-md hover:bg-input flex flex-col items-start gap-2">
                    <!-- 单个对话列表项组件 -->
                    <list-item v-bind="item" />
                </li>

                <!-- 分隔符项 -->
                <li v-else class="divider my-2 h-px bg-input"></li>
            </template>
        </ul>
    </div>
</template>

<style scoped></style>