<script setup lang='ts'>
import { CTX_KEY } from './constants'

import NativeTooltip from '../NativeTooltip.vue';

interface ItemTitleProps {
    title: string;
}

defineOptions({ name: 'ItemTitle' })

const props = defineProps<ItemTitleProps>()

// 注入上下文，获取列表宽度信息
const ctx = inject(CTX_KEY, void 0)

// 标题是否溢出的标志
const isTitleOverflow = ref(false)
// 标题元素的引用
const titleRef = useTemplateRef<HTMLElement>('titleRef')

/**
 * 检查元素内容是否溢出
 * @param element 要检查的HTML元素
 * @returns 如果内容溢出返回true，否则返回false
 */
function checkoutOverflow(element: HTMLElement | null): boolean {
    if (!element) return false

    return element.scrollWidth > element.clientWidth
}

function _updateOverflowStatus() {
    isTitleOverflow.value = checkoutOverflow(titleRef.value)
}

// 防抖处理的更新函数，避免频繁触发
const updateOverflowStatus = useDebounceFn(_updateOverflowStatus, 100)

// 组件挂载时初始化状态并监听窗口大小变化
onMounted(() => {
    updateOverflowStatus();
    window.addEventListener('resize', updateOverflowStatus);
})

// 组件卸载时移除事件监听器
onUnmounted(() => {
    window.removeEventListener('resize', updateOverflowStatus);
})

watch([() => props.title, () => ctx?.width.value], () => updateOverflowStatus());
</script>

<template>
    <h2 ref="titleRef" class="conversation-title w-full text-tx-secondary font-semibold loading-5 truncate">
        <!-- 当标题溢出时，使用tooltip显示完整内容 -->
        <template v-if="isTitleOverflow">
            <native-tooltip :content="title">
                {{ title }}
            </native-tooltip>
        </template>
        <!-- 当标题未溢出时，直接显示 -->
        <template v-else>
            {{ title }}
        </template>
    </h2>
</template>
<style scoped></style>