const express = require('express');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// Setup Express server
const app = express();
const port = 4000;

app.get("/", (req, res)=>{
    res.send("server is listening")
})
// Endpoint to handle signature verification with pre-existing files in the uploads folder
app.post('/verify-signature', async (req, res) => {
    try {
        // Define the paths to the pre-existing files in the 'uploads/' folder
        const originalSignaturePath = path.join('uploads', 's1.jpg'); // Original signature
        const verificationSignaturePath = path.join('uploads', 's2.jpg'); // Verification signature

        // Check if the files exist
        if (!fs.existsSync(originalSignaturePath) || !fs.existsSync(verificationSignaturePath)) {
            return res.status(400).json({ error: 'Both sign.jpg and sign2.jpg must be present in the uploads folder' });
        }

        // Log the paths for debugging purposes
        console.log('Original Signature Path:', originalSignaturePath);
        console.log('Verification Signature Path:', verificationSignaturePath);

        // Create FormData object to send to FastAPI
        const form = new FormData();
        form.append('original_signature', fs.createReadStream(originalSignaturePath));
        form.append('verification_signature', fs.createReadStream(verificationSignaturePath));

        // Send the form data to FastAPI
        const response = await axios.post('http://127.0.0.1:8000/verify-signature/', form, {
            headers: form.getHeaders(),
        });

        // Return the result from FastAPI to the client
        res.json(response.data);
    } catch (error) {
        console.error('Error verifying signature:', error.response ? error.response.data : error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Start Node.js server
app.listen(port, () => {
    console.log(`Node.js server running at http://localhost:${port}`);
});
