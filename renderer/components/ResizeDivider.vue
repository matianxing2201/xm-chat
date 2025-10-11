<script setup lang='ts'>
interface Props {
    direction: 'horizontal' | 'vertical'; // 拖拽方向：水平或垂直
    valIsNagetive?: boolean; // 是否反向计算尺寸变化
    size: number; // 当前尺寸
    maxSize: number; // 最大尺寸限制
    minSize: number; // 最小尺寸限制
}

interface Emits {
    (e: 'update:size', size: number): void;
}

defineOptions({ name: 'ResizeDivider' })

const props = withDefaults(defineProps<Props>(), {
    valIsNagetive: false,
})

const emit = defineEmits<Emits>();

const size = ref(props.size);

let isDragging = false;
let startSize = 0;
let startPoint = { x: 0, y: 0 }

// 开始拖拽
function startDrag(e: MouseEvent) {
    isDragging = true;

    startPoint.x = e.clientX;
    startPoint.y = e.clientY;

    startSize = size.value;

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
}

// 结束拖拽
function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
}

// 拖拽中
function handleDrag(e: MouseEvent) {
    if (!isDragging) return;
    debugger

    const diffX = props.valIsNagetive ? startPoint.x - e.clientX : e.clientX - startPoint.x;
    const diffY = props.valIsNagetive ? startPoint.y - e.clientY : e.clientY - startPoint.y;

    if (props.direction === 'horizontal') {
        // 水平 size = startSize + 垂直方向移动距离（diffY）
        size.value = Math.max(props.minSize, Math.min(props.maxSize, startSize + diffY));
        emit('update:size', size.value);
        return
    }
    // 垂直 size = startSize + 水平方向移动距离（diffX）
    size.value = Math.max(props.minSize, Math.min(props.maxSize, startSize + diffX));
    emit('update:size', size.value);
}

watchEffect(() => size.value = props.size);
</script>
<template>
    <div class="bg-transparent z-[999]" :class="direction" @click.stop @mousedown="startDrag"></div>
</template>

<style scoped>
.vertical {
    width: 5px;
    height: 100%;
    cursor: ew-resize;
}

.horizontal {
    width: 100%;
    height: 5px;
    cursor: ns-resize;
}
</style>
