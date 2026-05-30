document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('report-form');
    const photoUpload = document.getElementById('photo-upload');
    const dropZone = document.getElementById('drop-zone');
    const imagePreview = document.getElementById('image-preview');
    const successMessage = document.getElementById('success-message');
    const newReportBtn = document.getElementById('new-report-btn');
    const geoBtn = document.getElementById('geo-btn');
    const locationInput = document.getElementById('location');

    let currentImageDataUrl = null;

    // Handle Geolocation
    if (geoBtn) {
        geoBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                geoBtn.innerHTML = '<span style="font-size: 12px;">...</span>';
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        locationInput.value = `Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`;
                        geoBtn.innerHTML = `
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        `;
                    },
                    (error) => {
                        alert('Unable to retrieve your location. Please enter it manually.');
                        geoBtn.innerHTML = `
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                            </svg>
                        `;
                    }
                );
            } else {
                alert('Geolocation is not supported by your browser.');
            }
        });
    }

    // Handle drag and drop for file upload
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
    });

    photoUpload.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files && files[0]) {
            const file = files[0];
            
            // Ensure it's an image
            if (!file.type.match('image.*')) {
                alert('Please upload an image file.');
                return;
            }

            const reader = new FileReader();
            
            reader.onload = function(e) {
                currentImageDataUrl = e.target.result;
                imagePreview.src = currentImageDataUrl;
                imagePreview.style.display = 'block';
                // Hide icon and text
                dropZone.querySelector('svg').style.display = 'none';
                dropZone.querySelector('p').style.display = 'none';
            }
            
            reader.readAsDataURL(file);
        }
    }

    // Handle form submission
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentImageDataUrl) {
            alert('Please provide a photo of the issue.');
            return;
        }

        const location = document.getElementById('location').value;
        const wasteType = document.getElementById('waste-type').value;
        const description = document.getElementById('description').value;

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Submitting...</span>';

        const newComplaint = {
            id: 'COMP-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            location: location,
            wasteType: wasteType,
            description: description,
            image: currentImageDataUrl,
            status: 'pending',
            date: new Date().toISOString()
        };

        try {
            // Save to backend API
            const response = await fetch('/api/complaints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newComplaint)
            });

            if (!response.ok) throw new Error('Failed to submit report');

            // Show success message
            reportForm.style.display = 'none';
            successMessage.style.display = 'block';
            reportForm.reset();
            
            // Reset preview
            imagePreview.style.display = 'none';
            currentImageDataUrl = null;
            dropZone.querySelector('svg').style.display = 'block';
            dropZone.querySelector('p').style.display = 'block';
        } catch (error) {
            alert('Error submitting report. Please try again.');
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <span>Submit Report</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            `;
        }
    });

    // Handle "Report Another Issue" button
    newReportBtn.addEventListener('click', () => {
        successMessage.style.display = 'none';
        reportForm.style.display = 'block';
    });
});
