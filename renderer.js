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

confirmDeploy.addEventListener("click", async () => {
  try {
    const title = document.getElementById("deployTitle").value.trim();
    const date = document.getElementById("deployDate").value.trim();
    const desc = document.getElementById("deployDesc").value.trim();
    const category = document.getElementById("deployCategory").value.trim();
    const content = editor.value.trim();

    if (!title || !date || !desc || !category || !content) {
      throw new Error("All fields are required");
    }

    const slug = `${date}-${title.replace(/[^a-zA-Z0-9]/g, '-')}.md`;
    const contentPath = `client/public/content/${category}/${slug}`;
    const indexFilePath = `client/public/index/${category}.csv`;
    
    const contentMessage = `OTTO Commit: ${title} published`;
    const indexMessage = `OTTO Commit: ${title} logged`;

    confirmDeploy.disabled = true;
    confirmDeploy.textContent = "Deploying...";

    try {
      const indexedContent = await window.api.readFileFromGitHub(indexFilePath);
      if (!indexedContent) {
        throw new Error("Failed to read index file");
      }
      
      const updatedContent = `${indexedContent}\n${date},${title},${desc}`;
      await window.api.updateOnGitHub(indexFilePath, indexMessage, updatedContent);
      console.log("Index updated successfully");
    } catch (error) {
      console.error("Failed to update index:", error);
      throw new Error("Failed to update index file");
    }

    try {
      await window.api.pushToGitHub(contentPath, contentMessage, content);
      console.log(`Deployed ${contentPath} successfully!`);
      
      showNotification("Deployment successful!", "success");
      deployModal.style.display = "none";
      resetDeployForm();
      
    } catch (error) {
      console.error("Failed to deploy content:", error);
      throw new Error("Failed to deploy content file");
    }

  } catch (error) {
    console.error("Deployment failed:", error);
    showNotification(`Deployment failed: ${error.message}`, "error");
  } finally {
    confirmDeploy.disabled = false;
    confirmDeploy.textContent = "Deploy";
  }
});

function showNotification(message, type = "info") {
  alert(`${type.toUpperCase()}: ${message}`);
}

function resetDeployForm() {
  document.getElementById("deployTitle").value = "";
  document.getElementById("deployDate").value = "";
  document.getElementById("deployDesc").value = "";
  document.getElementById("deployCategory").value = "";
  if (editor && editor.value) {
    editor.value = "";
  }
}
