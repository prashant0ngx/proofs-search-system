document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('upload-form');
    const messageDiv = document.getElementById('message');
    const tableBody = document.querySelector('#proofs-table tbody');

    // Fetch and display existing proofs
    fetchProofs();

    // Handle form submission
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        const formData = new FormData(this);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                messageDiv.innerText = data.message;
                form.reset();
                fetchProofs(); // Refresh the table
            } else {
                messageDiv.innerText = 'Error: ' + data.message;
            }
        })
        .catch(error => {
            messageDiv.innerText = 'Error: ' + error.message;
        });
    });

    // Fetch proofs and display in the table
    function fetchProofs() {
        fetch('/proofs')
        .then(response => response.json())
        .then(data => {
            tableBody.innerHTML = ''; // Clear existing table rows
            data.forEach(proof => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${proof.id}</td>
                    <td>${proof.religion}</td>
                    <td>${proof.textbook}</td>
                    <td>${proof.chapter}</td>
                    <td>${proof.content}</td>
                    <td><img src="${proof.photo}" alt="Photo" style="width: 100px;"></td>
                    <td><a href="${proof.reference}" target="_blank">${proof.reference}</a></td>
                    <td>${proof.tags.join(', ')}</td>
                    <td>
                        <button onclick="editProof(${proof.id})">Edit</button>
                        <button onclick="deleteProof(${proof.id})">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        });
    }

    // Edit proof
    window.editProof = function(id) {
        // Fetch proof data and populate form for editing
        fetch(`/proof/${id}`)
        .then(response => response.json())
        .then(proof => {
            document.getElementById('religion').value = proof.religion;
            document.getElementById('textbook').value = proof.textbook;
            document.getElementById('chapter').value = proof.chapter;
            document.getElementById('content').value = proof.content;
            document.getElementById('tags').value = proof.tags.join(', ');
            document.getElementById('reference').value = proof.reference;
            // Handle photo in edit mode if needed
        });
    };

    // Delete proof
    window.deleteProof = function(id) {
        if (!confirm('Are you sure you want to delete this proof?')) {
            return; // Abort if the user cancels
        }
    
        fetch(`/proof/${id}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showMessage('Success: ' + data.message);
                fetchProofs(); // Refresh the table
            } else {
               
                showMessage('Error: ' + data.message);
            }
        })
        .catch(error => {
            showMessage('Error: ' + error.message);
        });
    };
    
    function showMessage(message) {
        const messageDiv = document.getElementById('message');
        if (messageDiv) {
            messageDiv.innerText = message;
        }
    }
    
});
