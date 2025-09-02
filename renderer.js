const STORAGE_KEY = "simple_md_editor_content_v1";
const editor = document.getElementById("editor");
const preview = document.getElementById("preview");
const charcount = document.getElementById("charcount");

editor.value = localStorage.getItem(STORAGE_KEY) || "";
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
  const title = document.getElementById("deployTitle").value.trim();
  const date = document.getElementById("deployDate").value.trim();
  const desc = document.getElementById("deployDesc").value.trim();
  const category = document.getElementById("deployCategory").value.trim(); 
  const content = editor.value;
  const slug = date + "-" + title + ".md";
  const path = `client/public/content/${category}/${slug}`;
  const message = `OTTO Commit: ${title} published.`;

  window.api.pushToGitHub(path, message, content)
    .then(() => console.log(`Deployed ${path} successfully!`))
    .catch(err => console.error(err));

  deployModal.style.display = "none";
});
