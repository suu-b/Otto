document.addEventListener('DOMContentLoaded', async() => {

    function makeReadOnly() {
        document
            .querySelectorAll('[contenteditable="true"]')
            .forEach(el => el.setAttribute('contenteditable', 'false'));

        document
            .querySelectorAll('input, textarea, select')
            .forEach(el => {
                el.setAttribute('disabled', 'true');
                el.classList.add('readonly');
            });
    }

    const mode = await window.state.get('mode');
    if (mode === 'read') {
        const article = await window.state.get('selectedArticleData');

        document.getElementById('articleHeading').textContent = article.title;
        document.querySelector('.article-description').value = article.desc;
        document.querySelector('.date').textContent = article.date;
        document.querySelector('.category').value = article.category;
        
        const thumbnail = document.querySelector('.thumbnail')
        const thumbnailImage = document.createElement('img')
        thumbnailImage.src = article.src
        thumbnailImage.alt = article.credits
        const thumbnailImageCredits = document.createElement('p')
        thumbnailImageCredits.textContent = article.credits
        thumbnail.append(thumbnailImage, thumbnailImageCredits)
        thumbnail.style.display = 'flex'

        const slug = `${article.date}-${slugify(article.title)}.md`;
        const contentPath = `client/public/content/${article.category}/${slug}`;

        const content = await window.api.readFileFromGitHub(contentPath)
        const dirty = marked.parse(content, { gfm: true, breaks: true });
        const cleanHTML = DOMPurify.sanitize(dirty, {
            ADD_ATTR: ["href", "target", "rel", "allow", "allowfullscreen", "frameborder", "scrolling", "src"],
            ADD_TAGS: ["iframe"],
            ALLOWED_URI_REGEXP: /^https?:\/\//
        });

        const box = document.querySelector('.content'); 
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content readonly';
        contentDiv.innerHTML = cleanHTML;

        box.parentNode.replaceChild(contentDiv, box);

        contentDiv.innerHTML = cleanHTML;
        if (window.MathJax && window.MathJax.typesetPromise) {
           await window.MathJax.typesetPromise([contentDiv]);
        }

        makeReadOnly();
        return;
    }


    let previewMode = false;
    let oldContent = "";

    const article = document.querySelector('.article');
    const box = document.querySelector('.article .content');
    const heading = document.querySelector('.article-heading');
    const dialog = document.querySelector('.dialog');

    const previewBtn = document.getElementById('previewBtn');
    const publishBtn = document.getElementById('publishBtn');
    const saveBtn = document.getElementById('saveBtn');

    previewBtn.style.display = 'block'
    publishBtn.style.display = 'block'
    saveBtn.style.display = 'block'

    const deployBtn = document.getElementById('deployBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const errorP = document.getElementById('error');

    const date = document.querySelector('.date')
    const inputDate = document.createElement('input')
    inputDate.type = 'date'
    inputDate.className = 'date'
    date.parentNode.replaceChild(inputDate, date)
    function autoGrow(el) {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    }

    autoGrow(box);
    autoGrow(heading);

    box.addEventListener('input', () => autoGrow(box));
    heading.addEventListener('input', () => autoGrow(heading));

    window.addEventListener('resize', () => {
        autoGrow(box);
        autoGrow(heading);
    });

    box.placeholder = "Start writing from here..Write in markdown. Use the button on the top to convert it to rich-text";

    const preview = document.createElement('div');
    preview.className = 'content';
    preview.style.display = 'none';
    box.parentNode.insertBefore(preview, box.nextSibling);

    loadFromLocal();

    setInterval(() => {
        saveToLocal();
        console.log("Draft auto-saved to localStorage.");
    }, 60000); 

    saveBtn.addEventListener('click', () => {
        saveToLocal();
        showNotification("Draft saved locally", "success");
    });

    previewBtn.addEventListener('click', async () => {
        previewMode = !previewMode;
        if (previewMode) {
            previewBtn.textContent = "Edit";
            oldContent = box.value;

            const dirty = marked.parse(oldContent, { gfm: true, breaks: true });
            const cleanHTML = DOMPurify.sanitize(dirty, {
                ADD_ATTR: ["href", "target", "rel", "allow", "allowfullscreen", "frameborder", "scrolling", "src"],
                ADD_TAGS: ["iframe"],
                ALLOWED_URI_REGEXP: /^https?:\/\//
            });

            preview.innerHTML = cleanHTML;
            if (window.MathJax && window.MathJax.typesetPromise) {
                await window.MathJax.typesetPromise([preview]);
            }

            box.style.display = 'none';
            preview.style.display = 'block';
        } else {
            previewBtn.textContent = "Preview";
            box.style.display = 'block';
            preview.style.display = 'none';
            box.value = oldContent;
            autoGrow(box);
        }
    });

    publishBtn.addEventListener('click', () => {
        article.style.display = 'none';
        dialog.style.display = 'flex';
    });

    deployBtn.addEventListener('click', async () => {
        const title = heading.textContent;
        const description = document.querySelector('.article-description').value;
        const date = document.querySelector('.date').value;
        const category = document.querySelector('.category').value;
        const content = box.value;
        const thumbnail = document.querySelector('.thumbnail-src').value;
        const credits = document.querySelector('.thumbnail-credits').value;

        const payload = { title, description, date, category, content, thumbnail, credits };
        const emptyFields = Object.entries(payload).filter(([_, v]) => !v).map(([k]) => k);

        if (emptyFields.length > 0) {
            errorP.textContent = "Missing: " + emptyFields.join(", ");
            errorP.style.display = "block";
            return;
        }

        const slug = `${date}-${slugify(title)}.md`;
        const contentPath = `client/public/content/${category}/${slug}`;
        const indexFilePath = `client/public/index/${category}.csv`;
        const commitMessage = `OTTO Commit: ${title} published`;

        errorP.style.display = "none";
        deployBtn.textContent = "Deploying...";
        deployBtn.disabled = true;

        try {
            const indexedContent = await window.api.readFileFromGitHub(indexFilePath);
            const updatedContent = indexedContent
                ? `${indexedContent}\n${date},${title},${description},${thumbnail},${credits}`
                : `${date},${title},${description},${thumbnail},${credits}`;

            await window.api.deployToGitHub(
                contentPath,
                indexFilePath,
                content,
                updatedContent,
                commitMessage
            );

            console.log("Deployed successfully!");
            showNotification("Deployed Successfully :D")
            localStorage.removeItem('ottoDraft'); 
            window.nav.go('dashboard.html')
        } catch (error) {
            console.error("Failed to deploy:", error);
            showNotification("Failed to deploy :C")
        } finally {
            deployBtn.disabled = false;
            deployBtn.textContent = "Deploy";
        }
    });

    cancelBtn.addEventListener('click', () => {
        article.style.display = 'block';
        dialog.style.display = 'none';
        errorP.textContent = "";
    });

    function saveToLocal() {
        const draft = {
            heading: heading.textContent,
            description: document.querySelector('.article-description').value,
            date: document.querySelector('.date').value,
            category: document.querySelector('.category').value,
            content: box.value,
            thumbnail: document.querySelector('.thumbnail-src').value,
            credits: document.querySelector('.thumbnail-credits').value
        };
        localStorage.setItem('ottoDraft', JSON.stringify(draft));
    }

    function loadFromLocal() {
        const draftStr = localStorage.getItem('ottoDraft');
        if (!draftStr) return;
        try {
            const draft = JSON.parse(draftStr);
            if (draft.heading) heading.textContent = draft.heading;
            if (draft.description) document.querySelector('.article-description').value = draft.description;
            if (draft.date) document.querySelector('.date').value = draft.date;
            if (draft.category) document.querySelector('.category').value = draft.category;
            if (draft.content) box.value = draft.content;
            if (draft.thumbnail) document.querySelector('.thumbnail-src').value = draft.thumbnail;
            if (draft.credits) document.querySelector('.thumbnail-credits').value = draft.credits;

            autoGrow(box);
            autoGrow(heading);
        } catch (err) {
            console.error("Failed to parse local draft", err);
        }
    }

function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

function showNotification(message, type = "info") {
    alert(`${type.toUpperCase()}: ${message}`);
}
});
