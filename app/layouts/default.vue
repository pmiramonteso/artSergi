<template>
  <div class="flex min-h-svh flex-col bg-paper-grain">
    <a
      href="#main"
      class="fixed top-3 left-3 z-50 -translate-y-20 bg-ink px-3 py-2 text-eyebrow text-paper focus:translate-y-0"
    >
      Skip to content
    </a>
    <main id="main" tabindex="-1" class="flex-1 focus:outline-none">
      <slot />
    </main>
  </div>
</template>
