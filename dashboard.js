document.addEventListener('DOMContentLoaded', async () => {
    const basePath = 'client/public/index/';
    const categories = ['cerebrum', 'meditation', 'humanities', 'becoming'];

    const contents = await Promise.all(
        categories.map(async (category) => {
            const path = `${basePath}${category}.csv`;
            const content = await window.api.readFileFromGitHub(path);
            
            return content
                .split('\n')
                .slice(1)
                .map(row => {
                    const cols = row.split(','); 
                    return [...cols, category];
                });
        })
    );

    const rows = contents.flat();

    const itemsContainer = document.querySelector('.items-container');
    const searchInput = document.getElementById('search');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchBtn = document.getElementById('search-btn');

    function render(data) {
        itemsContainer.innerHTML = '';
        data.forEach(row => {
            const div = document.createElement('div')
            div.className = 'item'
            div.innerHTML = `
                <h3>${row[1]}</h3>
                <p class="desc">${row[2]}</p>
                <div class="date-category-box">
                    <p class="date">${row[0]}</p>
                    <p class="category">${row[5]}</p>
                </div>
            `;
            div.onclick = async () => {
                const selectedArticleData = {
                    date: row[0],
                    title: row[1],
                    desc: row[2],
                    src: row[3],
                    credits: row[4],
                    category: row[5]
                };
                await window.state.set('selectedArticleData', selectedArticleData);
                await window.state.set('mode', 'read');
                window.nav.go('article.html');
            };


            itemsContainer.appendChild(div)
        });
    }

    function applyFilters() {
        const query = searchInput.value.toLowerCase();
        const category = categoryFilter.value;

        const filtered = rows.filter(row => {
            const matchesTitle = row[1].toLowerCase().includes(query);
            const matchesCategory = !category || row[3] === category;
            return matchesTitle && matchesCategory;
        });

        render(filtered);
    }

    searchBtn.addEventListener('click', applyFilters);

    render(rows);
});
