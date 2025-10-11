<script setup lang='ts'>
import { logger } from '../utils/logger'

interface Props {
    content: string
}

defineOptions({ name: 'NativeTooltip' })

const props = defineProps<Props>()
const slots = defineSlots()

if (slots?.default?.().length > 1) {
    logger.warn('NativeTooltip 只支持一个默认插槽.')
}

// 更新 tooltip 内容
function updateTooltipContent(content: string) {
    // 获取默认插槽的内容
    const defaultSlot = slots?.default?.();
    if (defaultSlot) {
        const slotElement = defaultSlot[0]?.el
        // 验证 DOM 节点是否有效（HTMLElement 类型）
        if (slotElement && slotElement instanceof HTMLElement) {
            slotElement.title = content;
        }
    }
}

onMounted(() => updateTooltipContent(props.content))

watch(() => props.content, (val) => updateTooltipContent(val));
</script>

<template>
    <template v-if="slots.default()[0].el">
        <slot></slot>
    </template>
    <template v-else>
        <!-- 如果是 组件 则用 span 包起来 -->
        <span :title="content">
            <slot></slot>
        </span>
    </template>
</template>
<style scoped></style>
