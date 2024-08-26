const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Serve index.html for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin.html for the admin panel URL
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Upload endpoint
app.post('/upload', upload.single('photo'), (req, res) => {
    const { religion, textbook, chapter, content, tags, reference } = req.body;
    const photoPath = `images/${religion}/${textbook}/${chapter}/${req.file.filename}`;

    // Move uploaded file to the correct directory
    const dir = path.join(__dirname, 'public', 'images', religion, textbook, chapter);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, req.file.originalname);
    fs.renameSync(req.file.path, filePath);

    // Update proofs.json
    const jsonPath = path.join(__dirname, 'data', 'proofs.json');
    const proofsData = JSON.parse(fs.readFileSync(jsonPath));

    const newProof = {
        id: Date.now(),
        content: content,
        photo: filePath.replace('public/', ''),
        reference: reference,
        tags: tags.split(',')
    };

    if (!proofsData.religions[religion]) {
        proofsData.religions[religion] = { texts: {} };
    }

    if (!proofsData.religions[religion].texts[textbook]) {
        proofsData.religions[religion].texts[textbook] = {};
    }

    if (!proofsData.religions[religion].texts[textbook][chapter]) {
        proofsData.religions[religion].texts[textbook][chapter] = { proofs: [] };
    }

    proofsData.religions[religion].texts[textbook][chapter].proofs.push(newProof);

    fs.writeFileSync(jsonPath, JSON.stringify(proofsData, null, 2));

    res.json({ success: true, message: 'Proof added successfully!' });
});

// Fetch all proofs
app.get('/proofs', (req, res) => {
    const jsonPath = path.join(__dirname, 'data', 'proofs.json');
    const proofsData = JSON.parse(fs.readFileSync(jsonPath));

    const allProofs = [];
    Object.keys(proofsData.religions).forEach(religion => {
        Object.keys(proofsData.religions[religion].texts).forEach(textbook => {
            Object.keys(proofsData.religions[religion].texts[textbook]).forEach(chapter => {
                allProofs.push(...proofsData.religions[religion].texts[textbook][chapter].proofs.map(proof => ({
                    id: proof.id,
                    religion: religion,
                    textbook: textbook,
                    chapter: chapter,
                    content: proof.content,
                    photo: proof.photo,
                    reference: proof.reference,
                    tags: proof.tags
                })));
            });
        });
    });

    res.json(allProofs);
});

// Fetch a single proof by ID
app.get('/proof/:id', (req, res) => {
    const jsonPath = path.join(__dirname, 'data', 'proofs.json');
    const proofsData = JSON.parse(fs.readFileSync(jsonPath));
    const proofId = parseInt(req.params.id, 10);

    let foundProof = null;
    Object.keys(proofsData.religions).some(religion => {
        return Object.keys(proofsData.religions[religion].texts).some(textbook => {
            return Object.keys(proofsData.religions[religion].texts[textbook]).some(chapter => {
                foundProof = proofsData.religions[religion].texts[textbook][chapter].proofs.find(proof => proof.id === proofId);
                return foundProof;
            });
        });
    });

    if (foundProof) {
        res.json({
            id: foundProof.id,
            religion: foundProof.religion,
            textbook: foundProof.textbook,
            chapter: foundProof.chapter,
            content: foundProof.content,
            photo: foundProof.photo,
            reference: foundProof.reference,
            tags: foundProof.tags
        });
    } else {
        res.status(404).json({success: false, message: 'Proof not found' });
    }
});




// Route for deleting proofs
app.delete('/proof/:id', (req, res) => {
    const proofId = parseInt(req.params.id, 10);

    // Load the JSON file
    const jsonPath = path.join(__dirname, 'data', 'proofs.json');
    const proofsData = JSON.parse(fs.readFileSync(jsonPath));

    let proofToDelete = null;

    // Find and delete the proof
    Object.keys(proofsData.religions).forEach(religion => {
        Object.keys(proofsData.religions[religion].texts).forEach(textbook => {
            Object.keys(proofsData.religions[religion].texts[textbook]).forEach(chapter => {
                proofsData.religions[religion].texts[textbook][chapter].proofs.some((proof, index) => {
                    if (proof.id === proofId) {
                        proofToDelete = proof;
                        proofsData.religions[religion].texts[textbook][chapter].proofs.splice(index, 1);
                        return true; // Break the loop
                    }
                    return false; // Continue the loop
                });
            });
        });
    });

    if (!proofToDelete) {
        return res.status(404).json({success: false, message: 'Proof not found' });
    }

    // Write the updated data back to the JSON file
    fs.writeFileSync(jsonPath, JSON.stringify(proofsData, null, 2));

    // Delete the associated file if it exists
    const photoPath = path.join(__dirname, 'public', 'images', proofToDelete.photo);
    if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
    }

    res.status(200).json({success: true, message: 'Proof deleted successfully' });
});

// Add this route to handle search requests
app.post('/search', (req, res) => {
    const { query, filters } = req.body;
    const jsonPath = path.join(__dirname, 'data', 'proofs.json');
    const proofsData = JSON.parse(fs.readFileSync(jsonPath));

    let filteredProofs = [];

    // Filter by religion, textbook, and tags
    Object.keys(proofsData.religions).forEach(religion => {
        if (filters.religion.length === 0 || filters.religion.includes(religion)) {
            Object.keys(proofsData.religions[religion].texts).forEach(textbook => {
                if (filters.textbook.length === 0 || filters.textbook.includes(textbook)) {
                    Object.keys(proofsData.religions[religion].texts[textbook]).forEach(chapter => {
                        proofsData.religions[religion].texts[textbook][chapter].proofs.forEach(proof => {
                            // Check if proof matches the query
                            if (
                                proof.content.toLowerCase().includes(query.toLowerCase()) ||
                                proof.tags.some(tag => filters.tag.includes(tag))
                            ) {
                                filteredProofs.push({
                                    id: proof.id,
                                    religion: religion,
                                    textbook: textbook,
                                    chapter: chapter,
                                    content: proof.content,
                                    photo: proof.photo,
                                    reference: proof.reference,
                                    tags: proof.tags
                                });
                            }
                        });
                    });
                }
            });
        }
    });

    res.json(filteredProofs);
});


app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
