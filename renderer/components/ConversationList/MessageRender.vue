<script setup lang="ts">
import VueMarkdown from 'vue-markdown-render';
import markdownItHighlightjs from 'markdown-it-highlightjs';

defineOptions({ name: 'MessageRender' });
const props = defineProps<{
    msgId: number;
    content: string;
    isStreaming: boolean;
}>();

const { t } = useI18n();

const renderId = computed(() => `msg-render-${props.msgId}`)


/**
 * @param target 要查找的目标DOM元素
 * @returns 找到的最后一个元素，如果没有找到则返回undefined
 * 
 */
const _findLastElement = (target: HTMLElement): Element | void => {
    const isList = (el: Element) => el.tagName === 'OL' || el.tagName === 'UL'

    if (!target) return;

    let lastElement: Element | void = target.lastElementChild ?? target;

    // TODO: 待实现：处理代码块元素(pre标签)的情况

    // 如果最后一个元素是列表，递归查找该列表的最后一个元素
    if (lastElement && isList(lastElement)) {
        lastElement = _findLastElement(lastElement as HTMLElement);
    }

    // 如果最后一个元素是列表项(LI)，检查它是否包含嵌套列表
    if (lastElement && lastElement.tagName === 'LI') {
        // 获取嵌套的无序列表和有序列表
        const _uls = lastElement.getElementsByTagName('ul');
        const _ols = lastElement.getElementsByTagName('ol');

        // 查询 ul  ol 是否包含嵌套列表
        if (_uls.length) lastElement = _findLastElement(_uls[0]);
        if (_ols.length) lastElement = _findLastElement(_ols[0]);
    }

    return lastElement;
}


function addCursor(target: HTMLElement) {
    const lastEl = _findLastElement(target);
    if (!lastEl) return;
    lastEl.classList.add('_cursor');
}

function removeCursor() {
    const target = document.getElementById(renderId.value);
    if (!target) return;
    const lastEl = _findLastElement(target);
    lastEl?.classList.remove('_cursor');
}

async function handlerCursor() {
    if (!props.isStreaming) return;
    await nextTick();
    const target = document.getElementById(renderId.value);
    target && addCursor(target);
}

/**
 * 监听消息内容变化
 */
watch(() => props.content, () => handlerCursor());

/**
 * 监听流式传输状态变化
 */
watch(() => props.isStreaming, async (newVal, oldVal) => {
    // 仅当流式传输结束时（从true变为false）执行操作
    if (!newVal && oldVal) {
        await nextTick();
        // 移除光标指示器
        removeCursor();
    }
})

</script>
<template>
    <template v-if="content?.trim()?.length">
        <VueMarkdown class="prose dark:prose-invert prose-slate prose-pre:p-0 prose-headings:pt-3 text-inherit"
            :source="content" :id="renderId" :plugins="[markdownItHighlightjs]" />
    </template>
    <span v-else class="_cursor">{{ t('main.message.rendering') }}</span>
</template>

<style scoped>
.prose {
    font-size: inherit;
}
</style>

<style>
._cursor::after {
    content: '';
    display: inline-block;
    width: 0.5em;
    height: 1.2em;
    transform: translateX(0.6em);
    background-color: currentColor;
    animation: cursor-blink 1s infinite;
    margin-left: 2px;
    vertical-align: text-bottom;
    line-height: 1;
}

@keyframes cursor-blink {

    0%,
    49% {
        opacity: 1;
    }

    50%,
    100% {
        opacity: 0;
    }
}
</style>