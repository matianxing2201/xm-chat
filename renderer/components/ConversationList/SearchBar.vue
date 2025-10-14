<script setup lang='ts'>
/**
 * 搜索栏组件
 * 提供对话列表的搜索功能，支持国际化
 */
import { NInput, NInputGroup, NInputGroupLabel, NIcon } from 'naive-ui';
import { Icon as IconifyIcon } from '@iconify/vue';
import { useFilter } from './useFilter';

defineOptions({ name: 'SearchBar' });

// 获取搜索关键字状态
const { searchKey } = useFilter();

// 获取国际化函数
const { t } = useI18n();
</script>

<template>
    <!-- 搜索栏容器，阻止右键菜单和点击事件冒泡 -->
    <div class="my-2" @contextmenu.stop @click.stop>
        <n-input-group>
            <!-- 搜索输入框 -->
            <n-input 
                v-model:value="searchKey" 
                size="small" 
                :placeholder="t('main.conversation.searchPlaceholder')"
                clearable
            >
                <!-- 输入框前缀图标 -->
                <template #prefix>
                    <iconify-icon icon="material-symbols:search" />
                </template>
            </n-input>
            
            <!-- 输入组标签，包含菜单图标 -->
            <n-input-group-label class="cursor-pointer flex justify-between items-center">
                <n-icon>
                    <iconify-icon icon="material-symbols:menu" />
                </n-icon>
            </n-input-group-label>
        </n-input-group>
    </div>
</template>

<style scoped>
.n-input-wrapper,
.n-input__input {
    align-items: center;
}

.n-input-group-label,
.n-input__input {
    display: flex;
}

:deep(.n-input__input-el) {
    translate: 0 3px !important;
}
</style>