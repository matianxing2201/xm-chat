import { Conversation } from "@common/constants";
import { useConversationsStore } from "@renderer/store/conversations";
import { debounce } from "@common/utils";

const searchKey = ref("");
const _searchKey = ref(""); // 用于节流 实际参数
export function useFilter() {
  const conversationsStore = useConversationsStore();

  const sortConversations = computed(() => {
    const { sortOrder, sortBy } = conversationsStore.sortMode;

    // 冻结 无法修改/删除
    const divider = Object.freeze({
      type: "divider",
      id: -1,
    }) as Conversation;

    // 置顶
    const pinned: Conversation[] = conversationsStore.allConversations
      .filter((item) => item.pinned)
      .map((item) => ({ type: "conversation", ...item }));

    // 添加 分割线
    if (pinned.length) {
      pinned.push(divider);
    }

    const unPinned: Conversation[] = conversationsStore.allConversations
      .filter((item) => !item.pinned)
      .map((item) => ({ type: "conversation", ...item }));

    const handleSortOrder = <T = number | string>(a?: T, b?: T) => {
      if (typeof a === "number" && typeof b === "number") {
        return sortOrder === "desc" ? b - a : a - b;
      }

      if (typeof a === "string" && typeof b === "string") {
        return sortOrder === "desc" ? b.localeCompare(a) : a.localeCompare(b);
      }

      return 0;
    };

    // 按照 排序字段 排序
    if (sortBy === "createAt") {
      return [
        ...pinned.sort((a, b) => handleSortOrder(a.createdAt, b.createdAt)),
        ...unPinned.sort((a, b) => handleSortOrder(a.createdAt, b.createdAt)),
      ];
    }

    if (sortBy === "updatedAt") {
      return [
        ...pinned.sort((a, b) => handleSortOrder(a.updatedAt, b.updatedAt)),
        ...unPinned.sort((a, b) => handleSortOrder(a.updatedAt, b.updatedAt)),
      ];
    }

    if (sortBy === "name") {
      return [
        ...pinned.sort((a, b) => handleSortOrder(a.title, b.title)),
        ...unPinned.sort((a, b) => handleSortOrder(a.title, b.title)),
      ];
    }

    // 默认按照模型排序
    return [
      ...pinned.sort((a, b) =>
        handleSortOrder(a.selectedModel, b.selectedModel)
      ),
      ...unPinned.sort((a, b) =>
        handleSortOrder(a.selectedModel, b.selectedModel)
      ),
    ];
  });

  const filteredConversations = computed(() => {
    if (!_searchKey.value) return sortConversations.value;
    return sortConversations.value.filter(
      (item) => item?.title && item?.title.includes(_searchKey.value)
    );
  });

  const updateSearchKey = debounce((val) => {
    _searchKey.value = val;
  }, 200);

  watch(
    () => searchKey.value,
    (val) => updateSearchKey(val)
  );

  return {
    searchKey,
    conversations: filteredConversations,
  };
}
