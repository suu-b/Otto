const STORAGE_KEY = "simple_md_editor_content_v1";
const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const charcount = document.getElementById("charcount");
const appEl = document.querySelector(".app");
const splitter = document.querySelector(".split-resize");

editor.value = localStorage.getItem(STORAGE_KEY) || "# Title\n";
render();

function render() {
  const raw = editor.value || "";
  const html = marked.parse(raw, { gfm: true, breaks: true });
  preview.innerHTML = DOMPurify.sanitize(html);
  charcount.textContent = `${raw.length} chars`;
}

let saveTimer;
editor.addEventListener("input", () => {
  render();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, editor.value);
  }, 700);
});

function wrapSelection(before, after) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const selected = editor.value.slice(start, end) || "text";
  editor.value =
    editor.value.slice(0, start) +
    before +
    selected +
    after +
    editor.value.slice(end);
  editor.focus();
  editor.setSelectionRange(start + before.length, start + before.length + selected.length);
  render();
}


const deployBtn = document.getElementById("deployBtn");
const deployModal = document.getElementById("deployModal");
const closeDeploy = document.getElementById("closeDeploy");
const confirmDeploy = document.getElementById("confirmDeploy");

deployBtn.addEventListener("click", () => {
  deployModal.style.display = "flex";
});

closeDeploy.addEventListener("click", () => {
  deployModal.style.display = "none";
});

confirmDeploy.addEventListener("click", () => {
  const title = document.getElementById("deployTitle").value;
  const date = document.getElementById("deployDate").value;
  const desc = document.getElementById("deployDesc").value;
  const img = document.getElementById("deployImg").value;

  console.log({ title, date, desc, img });
  deployModal.style.display = "none";
});
