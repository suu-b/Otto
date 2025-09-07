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
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("deployDate").value = today;
  deployModal.style.display = "flex";
});

closeDeploy.addEventListener("click", () => {
  deployModal.style.display = "none";
});

confirmDeploy.addEventListener("click", async () => {
  try {
    const title = document.getElementById("deployTitle").value.trim();
    const date = document.getElementById("deployDate").value.trim();
    const desc = document.getElementById("deployDesc").value.trim();
    const thumbnail = document.getElementById("deployImg").value.trim();
    const credits = document.getElementById("deployCredits").value.trim();
    const category = document.getElementById("deployCategory").value.trim();
    const content = editor.value.trim();

    if (!title || !date || !desc || !category || !content) {
      throw new Error("Title, date, description, category and content are required!");
    }

    const slug = `${date}-${slugify(title)}.md`;
    const contentPath = `client/public/content/${category}/${slug}`;
    const indexFilePath = `client/public/index/${category}.csv`;
    
    const contentMessage = `OTTO Commit: ${title} published`;

    confirmDeploy.disabled = true;
    confirmDeploy.textContent = "Deploying...";

    try {
      const indexedContent = await window.api.readFileFromGitHub(indexFilePath);
      const updatedContent = indexedContent ? `${indexedContent}\n${date},${title},${desc},${thumbnail},${credits}` : `${date},${title},${desc},${thumbnail},${credits}`;
      
      await window.api.deployToGitHub(contentPath, indexFilePath, content, updatedContent, contentMessage);
      console.log("Deployed successfully in single commit!");
      
      showNotification("Deployment successful!", "success");
      deployModal.style.display = "none";
      resetDeployForm();
      
    } catch (error) {
      console.error("Failed to deploy:", error);
      throw new Error("Failed to deploy files");
    }

  } catch (error) {
    console.error("Deployment failed:", error);
    showNotification(`Deployment failed: ${error.message}`, "error");
  } finally {
    confirmDeploy.disabled = false;
    confirmDeploy.textContent = "Deploy";
  }
});

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") 
    .trim();
}

function showNotification(message, type = "info") {
  alert(`${type.toUpperCase()}: ${message}`);
}

function resetDeployForm() {
  document.getElementById("deployTitle").value = "";
  document.getElementById("deployDate").value = "";
  document.getElementById("deployDesc").value = "";
  document.getElementById("deployCredits").value = "";
  document.getElementById("deployImg").value = "";
  document.getElementById("deployCategory").value = "";
  if (editor && editor.value) {
    editor.value = "";
  }
}
