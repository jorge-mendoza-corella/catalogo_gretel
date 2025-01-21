<template>
  <div>
    <div class="loading">
      <ProgressSpinner aria-label="Basic ProgressSpinner" />
    </div>
  </div>
</template>

<style>
  .loading {
    position: absolute;
    background: white;
    width: 100vw;
    height: 100%;
    z-index: 10000000;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
