document.addEventListener('DOMContentLoaded', function() {
    const searchBar = document.getElementById('search-bar');
    const filterSidebar = document.querySelector('.filter-sidebar');
    const resultsContainer = document.getElementById('results-container');

    function getSelectedFilters() {
        const filters = {
            religion: Array.from(filterSidebar.querySelectorAll('input[name="religion"]:checked')).map(input => input.value),
            textbook: Array.from(filterSidebar.querySelectorAll('input[name="textbook"]:checked')).map(input => input.value),
            tag: Array.from(filterSidebar.querySelectorAll('input[name="tag"]:checked')).map(input => input.value),
        };
        return filters;
    }

    function fetchResults(query, filters) {
        fetch('/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query, filters })
        })
        .then(response => response.json())
        .then(data => {
            resultsContainer.innerHTML = ''; // Clear previous results
            if (data.length > 0) {
                data.forEach(proof => {
                    const proofElement = document.createElement('div');
                    proofElement.classList.add('proof-item');
                    proofElement.innerHTML = `
                        <h4>${proof.religion} - ${proof.textbook} - ${proof.chapter}</h4>
                        <p>${proof.content}</p>
                        <img src="${proof.photo}" alt="Proof Photo" style="width: 100px;">
                        <a href="${proof.reference}" target="_blank">${proof.reference}</a>
                        <p>Tags: ${proof.tags.join(', ')}</p>
                    `;
                    resultsContainer.appendChild(proofElement);
                });
            } else {
                resultsContainer.innerHTML = '<p>No results found.</p>';
            }
        });
    }

    searchBar.addEventListener('input', function() {
        const query = searchBar.value;
        const filters = getSelectedFilters();
        fetchResults(query, filters);
    });

    filterSidebar.addEventListener('change', function() {
        const query = searchBar.value;
        const filters = getSelectedFilters();
        fetchResults(query, filters);
    });
});
