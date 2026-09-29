const toc = document.querySelector(".toc");
if (toc && window.matchMedia("(max-width: 860px)").matches) {
  toc.open = false;
}

const input = document.querySelector("[data-filter]");
if (input) {
  const items = [...document.querySelectorAll("[data-item]")];
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    for (const item of items) {
      const hay = item.dataset.item.toLowerCase();
      item.hidden = q.length > 0 && !hay.includes(q);
    }
  });
}
