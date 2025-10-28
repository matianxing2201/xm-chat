<script setup lang='ts'>
import type { Conversation } from '@common/types'
import { CTX_KEY } from './constants';
import { Icon as IconifyIcon } from '@iconify/vue'
import { NCheckbox } from 'naive-ui';
import { useContextMenu } from './useContextMenu';

import ItemTitle from './ItemTitle.vue';

const _CHECKBOX_STYLE_FIX = {
    translate: '-5px -1px',
    marginLeft: '5px'
}

// 定义置顶图标尺寸常量
const _PIN_ICON_SIZE = 16 as const

defineOptions({ name: 'ConversationListItem' });

// 接收对话数据作为props
const props = defineProps<Conversation>();

// 定义事件发射器
const emit = defineEmits(['updateTitle']);

const ctx = inject(CTX_KEY, void 0);

// 选装状态
const checked = ref(false);

const { isBatchOperate } = useContextMenu();

const isTitleEditable = computed(() => ctx?.editId.value === props.id)


function updateTitle(val: string) {
    emit('updateTitle', props.id, val);
}

watch(checked, (val) => {
    if (val) {
        !ctx?.checkedIds.value.includes(props.id) && ctx?.checkedIds.value.push(props.id);
        return
    }
    const idx = ctx?.checkedIds.value.indexOf(props.id);
    if (idx !== -1 && idx != null) {
        ctx?.checkedIds.value.splice(idx, 1);
    }
});

watch(() => ctx?.checkedIds.value, (val) => {
    if (!val) return;
    checked.value = val.includes(props.id);
})
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
    <div class="w-full flex items-center" v-if="isBatchOperate">
        <n-checkbox :style="_CHECKBOX_STYLE_FIX" v-model:checked="checked" @click.stop />
        <div class="flex-auto">
            <item-title :title="title" :is-editable="isTitleEditable" @update-title="updateTitle" />
        </div>
    </div>

    <item-title v-else :title="title" :is-editable="isTitleEditable" @update-title="updateTitle" />
</template>

<style scoped></style>