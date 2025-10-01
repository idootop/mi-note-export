<script lang="ts">
  import type { NoteDetail } from "../core/typing";
  import { note2html } from "../core/utils";

  export let note: NoteDetail | null = null;

  $: htmlContent = note ? note2html(note) : "";

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<div class="note-preview-container">
  {#if !note}
    <div class="empty-state">
      <div class="empty-icon">📝</div>
      <p>选择一条笔记查看详情</p>
    </div>
  {:else}
    <div class="note-header">
      <h1 class="note-title">
        {note.extraInfo?.title || note.subject || "未命名"}
      </h1>
      <div class="note-meta">
        <span class="meta-item">创建时间: {formatDate(note.createDate)}</span>
        <span class="meta-divider">·</span>
        <span class="meta-item">修改时间: {formatDate(note.modifyDate)}</span>
        {#if note.folderName}
          <span class="meta-divider">·</span>
          <span class="meta-item folder">📂 {note.folderName}</span>
        {/if}
      </div>
    </div>

    <div class="note-content">
      {@html htmlContent}
    </div>
  {/if}
</div>

<style>
  .note-preview-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #fff;
    overflow: hidden;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
  }

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-state p {
    font-size: 14px;
    margin: 0;
  }

  .note-header {
    flex-shrink: 0;
    padding: 32px 40px 24px;
    border-bottom: 1px solid #e5e7eb;
  }

  .note-title {
    font-size: 28px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 16px 0;
    line-height: 1.3;
  }

  .note-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #6b7280;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
  }

  .meta-item.folder {
    background: #f3f4f6;
    padding: 4px 10px;
    border-radius: 12px;
  }

  .meta-divider {
    color: #d1d5db;
  }

  .note-content {
    flex: 1;
    overflow-y: auto;
    padding: 32px 40px;
    line-height: 1.8;
    color: #374151;
  }

  /* 笔记内容样式 */
  .note-content :global(h1) {
    font-size: 24px;
    font-weight: 600;
    color: #111827;
    margin: 24px 0 16px 0;
    line-height: 1.3;
  }

  .note-content :global(h2) {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin: 20px 0 12px 0;
    line-height: 1.4;
  }

  .note-content :global(h3) {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 16px 0 12px 0;
    line-height: 1.4;
  }

  .note-content :global(p) {
    margin: 12px 0;
  }

  .note-content :global(b),
  .note-content :global(strong) {
    font-weight: 600;
    color: #111827;
  }

  .note-content :global(i),
  .note-content :global(em) {
    font-style: italic;
  }

  .note-content :global(u) {
    text-decoration: underline;
  }

  .note-content :global(del) {
    text-decoration: line-through;
    opacity: 0.6;
  }

  .note-content :global(blockquote) {
    margin: 16px 0;
    padding: 12px 20px;
    border-left: 4px solid #e5e7eb;
    background: #f9fafb;
    color: #6b7280;
  }

  .note-content :global(hr) {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 24px 0;
  }

  .note-content :global(li) {
    margin: 6px 0;
  }

  .note-content :global(input[type="checkbox"]) {
    margin-right: 8px;
    cursor: pointer;
  }

  .note-content :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 16px 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .note-content :global(audio),
  .note-content :global(video) {
    max-width: 100%;
    margin: 16px 0;
    border-radius: 8px;
  }

  .note-content :global(a) {
    color: #2563eb;
    text-decoration: none;
  }

  .note-content :global(a:hover) {
    text-decoration: underline;
  }

  .note-content :global(center) {
    text-align: center;
  }

  .note-content :global(div[align="left"]) {
    text-align: left;
  }

  .note-content :global(div[align="right"]) {
    text-align: right;
  }

  /* 滚动条样式 */
  .note-content::-webkit-scrollbar {
    width: 8px;
  }

  .note-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .note-content::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;
  }

  .note-content::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
</style>
