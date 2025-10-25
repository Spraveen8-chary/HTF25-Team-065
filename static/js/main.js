// State management
let state = {
    uploadedFile: null,
    uploadedFilename: null,
    selectedStyle: 'meme',
    selectedLanguage: 'en',
    srtFilename: null
};

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const videoInput = document.getElementById('videoInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const changeFileBtn = document.getElementById('changeFileBtn');

const styleSection = document.getElementById('styleSection');
const styleCards = document.querySelectorAll('.style-card');
const styleRadios = document.querySelectorAll('input[name="captionStyle"]');

const languageSection = document.getElementById('languageSection');
const languageSelect = document.getElementById('languageSelect');

const actionSection = document.getElementById('actionSection');
const generateBtn = document.getElementById('generateBtn');

const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressTitle = document.getElementById('progressTitle');
const progressText = document.getElementById('progressText');

const resultsSection = document.getElementById('resultsSection');
const totalCaptions = document.getElementById('totalCaptions');
const selectedStyle = document.getElementById('selectedStyle');
const selectedLanguage = document.getElementById('selectedLanguage');
const previewList = document.getElementById('previewList');
const downloadBtn = document.getElementById('downloadBtn');
const newVideoBtn = document.getElementById('newVideoBtn');

const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

// Event listeners
selectFileBtn.addEventListener('click', () => videoInput.click());
uploadArea.addEventListener('click', () => videoInput.click());
videoInput.addEventListener('change', handleFileSelect);
changeFileBtn.addEventListener('click', () => videoInput.click());

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// Style selection
styleCards.forEach(card => {
    card.addEventListener('click', () => {
        const style = card.dataset.style;
        const radio = card.querySelector('input[type="radio"]');
        
        // Update UI
        styleCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        radio.checked = true;
        
        // Update state
        state.selectedStyle = style;
    });
});

// Language selection
languageSelect.addEventListener('change', (e) => {
    state.selectedLanguage = e.target.value;
});

// Generate button
generateBtn.addEventListener('click', processVideo);

// Download button
downloadBtn.addEventListener('click', downloadSRT);

// New video button
newVideoBtn.addEventListener('click', reset);

// Retry button
retryBtn.addEventListener('click', reset);

// Functions
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
    if (!validTypes.includes(file.type)) {
        showError('Invalid file type. Please upload MP4, MOV, AVI, MKV, or WebM.');
        return;
    }
    
    // Validate file size (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('File too large. Maximum size is 100MB.');
        return;
    }
    
    // Store file
    state.uploadedFile = file;
    
    // Update UI
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'flex';
    
    // Show next sections
    styleSection.style.display = 'block';
    languageSection.style.display = 'block';
    actionSection.style.display = 'block';
    
    // Hide upload area
    uploadArea.style.display = 'none';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function processVideo() {
    try {
        // Disable button
        generateBtn.disabled = true;
        
        // Hide previous sections
        actionSection.style.display = 'none';
        errorSection.style.display = 'none';
        
        // Show progress
        progressSection.style.display = 'block';
        updateProgress(0, 'Uploading video...');
        
        // Step 1: Upload video
        const formData = new FormData();
        formData.append('video', state.uploadedFile);
        
        const uploadResponse = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            throw new Error(error.error || 'Upload failed');
        }
        
        const uploadData = await uploadResponse.json();
        state.uploadedFilename = uploadData.filename;
        
        updateProgress(33, 'Video uploaded. Processing...');
        
        // Step 2: Process video
        const processResponse = await fetch('/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: state.uploadedFilename,
                style: state.selectedStyle,
                language: state.selectedLanguage
            })
        });
        
        if (!processResponse.ok) {
            const error = await processResponse.json();
            throw new Error(error.error || 'Processing failed');
        }
        
        const processData = await processResponse.json();
        state.srtFilename = processData.srt_filename;
        
        updateProgress(100, 'Complete!');
        
        // Wait a moment then show results
        setTimeout(() => {
            showResults(processData);
        }, 500);
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
        generateBtn.disabled = false;
    }
}

function updateProgress(percent, text) {
    progressBar.style.width = percent + '%';
    progressText.textContent = text;
}

function showResults(data) {
    // Hide progress
    progressSection.style.display = 'none';
    
    // Update results data
    totalCaptions.textContent = data.total_captions;
    selectedStyle.textContent = state.selectedStyle.charAt(0).toUpperCase() + state.selectedStyle.slice(1);
    selectedLanguage.textContent = languageSelect.options[languageSelect.selectedIndex].text;
    
    // Show preview
    previewList.innerHTML = '';
    const previewCaptions = data.captions.slice(0, 5);
    previewCaptions.forEach((caption, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.textContent = `${index + 1}. ${caption.text}`;
        previewList.appendChild(item);
    });
    
    // Show results section
    resultsSection.style.display = 'block';
}

function downloadSRT() {
    if (state.srtFilename) {
        window.location.href = `/download/${state.srtFilename}`;
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    progressSection.style.display = 'none';
    actionSection.style.display = 'block';
}

function reset() {
    // Reset state
    state = {
        uploadedFile: null,
        uploadedFilename: null,
        selectedStyle: 'meme',
        selectedLanguage: 'en',
        srtFilename: null
    };
    
    // Reset UI
    videoInput.value = '';
    fileInfo.style.display = 'none';
    uploadArea.style.display = 'block';
    styleSection.style.display = 'none';
    languageSection.style.display = 'none';
    actionSection.style.display = 'none';
    progressSection.style.display = 'none';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
    
    generateBtn.disabled = false;
    
    // Reset style selection
    styleCards.forEach(card => card.classList.remove('selected'));
    styleCards[0].classList.add('selected');
    styleRadios[0].checked = true;
    
    // Reset language
    languageSelect.value = 'en';
}
