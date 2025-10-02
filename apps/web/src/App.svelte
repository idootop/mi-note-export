<script lang="ts">
  import type { NoteDetail } from "@core/node/typing";
  import { onMount } from "svelte";
  import NoteList from "./components/NoteList.svelte";
  import NotePreview from "./components/NotePreview.svelte";

  let notes: NoteDetail[] = [];
  let folders: Record<string, string> = {};
  let selectedNoteId: string = "";

  onMount(async () => {
    const response = await fetch("/data/notes.json");
    const data = await response.json();
    folders = data.folders || {};
    notes = data.notes || [];
  });

  // 当选中的笔记ID变化时，更新选中的笔记对象
  $: selectedNote = notes.find((note) => note.id === selectedNoteId) || null;
</script>

<main class="app-container">
  <aside class="sidebar">
    <NoteList {notes} {folders} bind:selectedNoteId />
  </aside>
  <section class="content">
    <NotePreview note={selectedNote} />
  </section>
</main>

<style>
  .app-container {
    display: flex;
    height: 100vh;
    width: 100%;
    overflow: hidden;
    background: #f9fafb;
  }

  .sidebar {
    width: 320px;
    flex-shrink: 0;
    background: #fff;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
    z-index: 10;
  }

  .content {
    flex: 1;
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 280px;
    }
  }
</style>
