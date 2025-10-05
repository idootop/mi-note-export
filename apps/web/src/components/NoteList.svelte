<script lang="ts">
  import type { NoteDetail } from "@core/node/typing";
  import { createEventDispatcher } from "svelte";

  export let notes: NoteDetail[] = [];
  export let folders: Record<string, string> = {};
  export let selectedNoteId: string = "";
  export let selectedFolder: string = "all";

  let searchQuery: string = "";
  const dispatch = createEventDispatcher();

  // 获取所有文件夹列表
  $: folderList = [
    { id: "all", name: "全部笔记" },
    ...Object.entries(folders).map(([id, name]) => ({ id, name })),
  ];

  // 根据选中的文件夹过滤笔记
  $: filteredNotes =
    selectedFolder === "all"
      ? notes
      : notes.filter((note) => note.folderId === selectedFolder);

  // 根据搜索关键词过滤笔记
  $: searchedNotes = searchQuery.trim()
    ? filteredNotes.filter((note) => {
        const query = searchQuery.toLowerCase();
        const title = (
          note.extraInfo?.title ||
          note.subject ||
          ""
        ).toLowerCase();
        const content = (note.content || "").toLowerCase();
        const snippet = (note.snippet || "").toLowerCase();
        return (
          title.includes(query) ||
          content.includes(query) ||
          snippet.includes(query)
        );
      })
    : filteredNotes;

  // 按修改时间降序排序
  $: sortedNotes = [...searchedNotes].sort(
    (a, b) => b.modifyDate - a.modifyDate
  );

  function selectNote(noteId: string) {
    selectedNoteId = noteId;
    // 触发笔记选择事件，即使 ID 没有变化也会触发
    dispatch("noteSelected", { noteId });
  }

  function selectFolder(folderId: string) {
    selectedFolder = folderId;
    // 如果当前选中的笔记不在新文件夹中，清空选择
    if (folderId !== "all") {
      const note = notes.find((n) => n.id === selectedNoteId);
      if (note && note.folderId !== folderId) {
        selectedNoteId = "";
      }
    }
  }

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  function truncateText(text: string, maxLength: number = 100): string {
    if (!text) return "";
    // 移除HTML标签
    const plainText = text.replace(/<[^>]+>/g, "");
    if (plainText.length <= maxLength) return plainText;
    return plainText.slice(0, maxLength) + "...";
  }

  // 高亮匹配的文字
  function highlightText(text: string, query: string): string {
    if (!query.trim() || !text) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    return text.replace(regex, "<mark>$1</mark>");
  }
</script>

<div class="note-list-container">
  <!-- 文件夹选择 -->
  <div class="folder-section">
    <div class="folder-select-wrapper">
      <select
        class="folder-select"
        bind:value={selectedFolder}
        on:change={() => selectFolder(selectedFolder)}
      >
        {#each folderList as folder}
          <option value={folder.id}>
            📂&nbsp;&nbsp;{folder.name} ({folder.id === "all"
              ? notes.length
              : notes.filter((n) => n.folderId === folder.id).length})
          </option>
        {/each}
      </select>
    </div>
  </div>

  <!-- 搜索框 -->
  <div class="search-section">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        placeholder="搜索笔记..."
        bind:value={searchQuery}
        class="search-input"
      />
      {#if searchQuery}
        <button class="clear-button" on:click={() => (searchQuery = "")}>
          ✕
        </button>
      {/if}
    </div>
  </div>

  <!-- 笔记列表 -->
  <div class="notes-section">
    <div class="notes-list">
      {#if sortedNotes.length === 0}
        <div class="empty-state">
          <p>{searchQuery ? "未找到匹配的笔记" : "暂无笔记"}</p>
        </div>
      {:else}
        {#each sortedNotes as note}
          <button
            class="note-item"
            class:active={selectedNoteId === note.id}
            on:click={() => selectNote(note.id)}
          >
            <div class="note-header">
              <h4 class="note-title">
                {@html highlightText(
                  note.extraInfo?.title || note.subject || "未命名",
                  searchQuery
                )}
              </h4>
              <span class="note-date">{formatDate(note.modifyDate)}</span>
            </div>
            <p class="note-snippet">
              {@html highlightText(
                truncateText(note.snippet || note.content),
                searchQuery
              )}
            </p>
          </button>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .note-list-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-right: 1px solid #e5e7eb;
  }

  .folder-section {
    flex-shrink: 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .folder-select-wrapper {
    position: relative;
    padding: 16px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  @media (max-width: 768px) {
    .folder-select-wrapper {
      padding: 12px;
    }
  }

  .folder-select {
    width: 100%;
    flex: 1;
    padding: 10px 12px;
    font-size: 14px;
    color: #111827;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    outline: none;
    transition: all 0.2s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
  }

  .search-section {
    flex-shrink: 0;
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
    background: #fff;
  }

  @media (max-width: 768px) {
    .search-section {
      padding: 8px 12px;
    }
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px 12px;
    transition: all 0.2s;
    gap: 8px;
  }

  .search-box:focus-within {
    background: #fff;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .search-icon {
    font-size: 15px;
    opacity: 0.5;
  }

  .search-input {
    flex: 1;
    width: 100%;
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    color: #111827;
  }

  .search-input::placeholder {
    color: #9ca3af;
  }

  .clear-button {
    border: none;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    transition: color 0.2s;
  }

  .clear-button:hover {
    color: #111827;
  }

  .notes-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .notes-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    -webkit-overflow-scrolling: touch;
  }

  @media (max-width: 768px) {
    .notes-list {
      padding: 4px 8px;
    }
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #9ca3af;
  }

  .note-item {
    width: 100%;
    display: block;
    padding: 14px 12px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    margin-bottom: 4px;
    -webkit-tap-highlight-color: transparent;
  }

  .note-item:hover {
    background: #f9fafb;
  }

  .note-item.active {
    background: #f9fafb;
  }

  @media (max-width: 768px) {
    .note-item {
      padding: 12px 10px;
      border-radius: 6px;
    }

    .note-item:active {
      background: #f3f4f6;
    }

    .note-item.active:active {
      background: #dbeafe;
    }
  }

  .note-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    gap: 8px;
  }

  .note-title {
    font-size: 14px;
    font-weight: 500;
    color: #111827;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .note-date {
    font-size: 12px;
    color: #9ca3af;
    white-space: nowrap;
  }

  .note-snippet {
    font-size: 13px;
    color: #6b7280;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    line-height: 1.4;
  }

  /* 高亮样式 */
  :global(mark) {
    background-color: #fef08a;
    padding: 2px 4px;
    border-radius: 3px;
    font-weight: 500;
  }

  .note-item.active :global(mark) {
    background-color: #fde047;
  }

  /* 滚动条样式 */
  .notes-list::-webkit-scrollbar {
    width: 6px;
  }

  .notes-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .notes-list::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }

  .notes-list::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
</style>
