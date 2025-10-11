<template>
    <div class="main-view h-full w-full flex flex-col">
        <title-bar>
            <drag-region class="w-full" />
        </title-bar>
        <main class="flex-auto">
            <!-- <router-view /> -->
            main
        </main>
    </div>
</template>
<script setup lang='ts'>
import TitleBar from '@renderer/components/TitleBar.vue';
import DragRegion from '@renderer/components/DragRegion.vue';
</script>
<style scoped></style>
