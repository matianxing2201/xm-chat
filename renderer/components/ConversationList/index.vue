<script setup lang="ts">
import { useFilter } from './useFilter';
import { CTX_KEY } from './constants';
import { Conversation } from '@common/types';
import { CONVERSATION_ITEM_MENU_IDS, MENU_IDS } from '@common/constants';

import { useContextMenu } from './useContextMenu';
import { useConversationsStore } from '@renderer/store/conversations';
import { createContextMenu } from '@renderer/utils/contextMenu';

import SearchBar from './SearchBar.vue';
import ListItem from './ListItem.vue';
import OperationBar from './OperationBar.vue';



const conversationItemActionPolicy = new Map([
    [CONVERSATION_ITEM_MENU_IDS.DEL, (item: Conversation) => {
        console.log('删除');
    }],
    [CONVERSATION_ITEM_MENU_IDS.RENAME, (item: Conversation) => {
        editId.value = item.id;
    }],
    [CONVERSATION_ITEM_MENU_IDS.PIN, async (item: Conversation) => {
        if (item.pinned) {
            await conversationsStore.unpinConversation(item.id);
            return;
        }
        await conversationsStore.pinConversation(item.id);
    }],
])

const batchActionPolicy = new Map([
    [CONVERSATION_ITEM_MENU_IDS.DEL, async () => {
        // todo
    }],
    [CONVERSATION_ITEM_MENU_IDS.PIN, async () => {
        // 🔓与🔒
        checkedIds.value.forEach(id => {
            if (conversationsStore.allConversations.find(item => item.id === id)?.pinned) {
                conversationsStore.unpinConversation(id);
            } else {
                conversationsStore.pinConversation(id);
            }
        })
    }]
])

defineOptions({ name: 'ConversationList' });

const props = defineProps<{ width: number }>();
const editId = ref<number | void>();
const checkedIds = ref<number[]>([])


function handleAllSelectChange(checked: boolean) {
    checkedIds.value = checked ? conversations.value.map(item => item.id) : [];
}

function handleBatchOperate(opId: CONVERSATION_ITEM_MENU_IDS) {
    const action = batchActionPolicy.get(opId);
    action && action();
}


provide(CTX_KEY, {
    width: computed(() => props.width),
    editId: computed(() => editId.value),
    checkedIds: computed(() => checkedIds.value),
});



const { conversations } = useFilter();
const { handle: handleListContextMenu, isBatchOperate } = useContextMenu();
const conversationsStore = useConversationsStore();

async function handleItemContextMenu(item: Conversation) {
    const clickItem = await createContextMenu(MENU_IDS.CONVERSATION_ITEM, void 0) as CONVERSATION_ITEM_MENU_IDS;
    const action = conversationItemActionPolicy.get(clickItem);
    action && await action?.(item);
}

function updateTitle(id: number, title: string) {
    const target = conversationsStore.conversations.find(item => item.id === id);
    if (!target) return
    conversationsStore.updateConversation({
        ...target,
        title
    })
    editId.value = void 0
}



</script>

<template>
    <div class="conversation-list px-2 pt-3 h-[100vh] flex flex-col" :style="{ width: 'calc(100% - 57px)' }"
        @contextmenu.prevent.stop="handleListContextMenu">
        <search-bar class="mt-3" />
        <ul class="flex-auto overflow-auto">
            <template v-for="item in conversations" :key="item.id">
                <li v-if="item.type !== 'divider'"
                    class="cursor-pointer p-2 mt-2 rounded-md hover:bg-input flex flex-col items-start gap-2"
                    @contextmenu.prevent.stop="handleItemContextMenu(item)">
                    <list-item v-bind="item" @update-title="updateTitle" />
                </li>
                <li v-else class="divider my-2 h-px bg-input"></li>
            </template>
        </ul>
        <operation-bar v-show="isBatchOperate" @select-all="handleAllSelectChange" @cancel="isBatchOperate = false"
            @op="handleBatchOperate" />
    </div>
</template>
