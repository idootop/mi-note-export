<script lang="ts">
  import type { NoteDetail } from "@core/node/typing";

  export let notes: NoteDetail[] = [];
  export let folders: Record<string, string> = {};
  export let selectedNoteId: string = "";
  export let selectedFolder: string = "0";

  // 获取所有文件夹列表
  $: folderList = Object.entries(folders).map(([id, name]) => ({ id, name }));

  // 根据选中的文件夹过滤笔记
  $: filteredNotes = notes.filter((note) => note.folderId === selectedFolder);

  // 按修改时间降序排序
  $: sortedNotes = [...filteredNotes].sort(
    (a, b) => b.modifyDate - a.modifyDate
  );

  function selectNote(noteId: string) {
    selectedNoteId = noteId;
  }

  function selectFolder(folderId: string) {
    selectedFolder = folderId;
    // 如果当前选中的笔记不在新文件夹中，清空选择
    const note = notes.find((n) => n.id === selectedNoteId);
    if (note && note.folderId !== folderId) {
      selectedNoteId = "";
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
</script>

<div class="note-list-container">
  <!-- 文件夹选择 -->
  <div class="folder-section">
    <h3>
      <div style="display: flex; align-items: center; gap: 8px;">
        <a href="https://github.com/idootop/mi-note-export" target="_blank">
          <img src="/favicon.ico" style="width: 36px; height: 36px;" />
        </a>
        <div style="display: flex; flex-direction: column;">
          <a
            href="https://github.com/idootop/mi-note-export"
            target="_blank"
            style="text-decoration: none; color: inherit;"
          >
            小米笔记备份助手
            <span style="font-size: 12px; color: #9ca3af;">v1.0.0</span>
          </a>
          <span style="font-size: 12px; color: #9ca3af;">
            Made with ❤️ by
            <a href="https://del.wang" target="_blank" style="color: #2563eb;">
              del.wang
            </a>
          </span>
        </div>
      </div>
    </h3>
    <div class="folder-list">
      {#each folderList as folder}
        <button
          class="folder-item"
          class:active={selectedFolder === folder.id}
          on:click={() => selectFolder(folder.id)}
        >
          <span class="folder-icon">📂</span>
          <span>{folder.name}</span>
          <span class="count"
            >{notes.filter((n) => n.folderId === folder.id).length}</span
          >
        </button>
      {/each}
    </div>
  </div>

  <!-- 笔记列表 -->
  <div class="notes-section">
    <div class="notes-list">
      {#if sortedNotes.length === 0}
        <div class="empty-state">
          <p>暂无笔记</p>
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
                {note.extraInfo?.title || note.subject || "未命名"}
              </h4>
              <span class="note-date">{formatDate(note.modifyDate)}</span>
            </div>
            <p class="note-snippet">
              {truncateText(note.snippet || note.content)}
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

  h3 {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin: 0;
    padding: 16px 20px 12px;
    border-bottom: 1px solid #f3f4f6;
  }

  .folder-section {
    flex-shrink: 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .folder-list {
    padding: 8px;
  }

  .folder-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
    color: #6b7280;
    text-align: left;
  }

  .folder-item:hover {
    background: #f9fafb;
    color: #111827;
  }

  .folder-item.active {
    background: #eff6ff;
    color: #2563eb;
    font-weight: 500;
  }

  .folder-icon {
    font-size: 16px;
  }

  .folder-item span:nth-child(2) {
    flex: 1;
  }

  .count {
    font-size: 12px;
    color: #9ca3af;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 12px;
  }

  .folder-item.active .count {
    background: #dbeafe;
    color: #2563eb;
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
  }

  .note-item:hover {
    background: #f9fafb;
  }

  .note-item.active {
    background: #eff6ff;
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
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.4;
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
