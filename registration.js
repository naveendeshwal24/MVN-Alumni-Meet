/*
 * MVN University Alumni Registration - registration.js
 * Purpose: Handle registration form submission, validation, CSV generation, and download functionality.
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('alumniRegistrationForm');
    
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (await validateForm()) {
            // Show loader on submit button
            showButtonLoader();
            
            // Simulate processing time then show success
            setTimeout(() => {
                // Hide loader and show success message
                hideButtonLoader();
                showToastMessage();
                
                // Reset form after toast appears
                setTimeout(() => {
                    form.reset();
                    hideCustomDepartmentField();
                }, 1500);
            }, 2000); // 2 seconds loader time
        }
    });

    // File validation for profile photo
    document.getElementById('photo').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            validateFileSize(file);
        }
    });

    // Department dropdown handler for "Other" option
    document.getElementById('department').addEventListener('change', (e) => {
        if (e.target.value === 'Other') {
            showCustomDepartmentField();
        } else {
            hideCustomDepartmentField();
        }
    });

    /**
     * Validates the entire form
     */
    async function validateForm() {
        const photoFile = document.getElementById('photo').files[0];
        
        // Validate file size if photo is uploaded
        if (photoFile && !validateFileSize(photoFile)) {
            return false;
        }

        // Validate required fields
        const requiredFields = ['name', 'email', 'department', 'passingYear', 'address', 'designation', 'company'];
        for (let field of requiredFields) {
            const element = document.getElementById(field);
            if (!element.value.trim()) {
                alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
                element.focus();
                return false;
            }
        }

        // Validate email format
        const email = document.getElementById('email').value;
        if (!isValidEmail(email)) {
            alert('Please enter a valid email address.');
            document.getElementById('email').focus();
            return false;
        }

        // Validate passing year
        const passingYear = parseInt(document.getElementById('passingYear').value);
        const currentYear = new Date().getFullYear();
        if (passingYear < 1990 || passingYear > currentYear + 5) {
            alert('Please enter a valid passing year.');
            document.getElementById('passingYear').focus();
            return false;
        }

        return true;
    }

    /**
     * Validates file size (max 1MB)
     */
    function validateFileSize(file) {
        const maxSize = 1024 * 1024; // 1MB in bytes
        
        if (file.size > maxSize) {
            alert('Profile photo size must be less than 1MB. Please choose a smaller file.');
            document.getElementById('photo').value = '';
            return false;
        }
        return true;
    }

    /**
     * Validates email format
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Shows loader on submit button
     */
    function showButtonLoader() {
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.style.opacity = '0.7';
    }

    /**
     * Hides loader from submit button
     */
    function hideButtonLoader() {
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Registration';
        submitBtn.style.opacity = '1';
    }

    /**
     * Shows toast message after successful submission
     */
    function showToastMessage() {
        showNotification('Thank you! Your registration has been submitted successfully.', 'success');
    }

    /**
     * Shows custom department input field
     */
    function showCustomDepartmentField() {
        let customField = document.getElementById('customDepartmentField');
        if (!customField) {
            const departmentGroup = document.getElementById('department').closest('.form-group');
            const customDiv = document.createElement('div');
            customDiv.id = 'customDepartmentField';
            customDiv.className = 'form-group';
            customDiv.innerHTML = `
                <label for="customDepartment"><i class="fas fa-edit"></i> Enter Department Name *</label>
                <input type="text" id="customDepartment" name="customDepartment" placeholder="Enter your department name" required>
            `;
            departmentGroup.parentNode.insertBefore(customDiv, departmentGroup.nextSibling);
        }
        document.getElementById('customDepartment').focus();
    }

    /**
     * Hides custom department input field
     */
    function hideCustomDepartmentField() {
        const customField = document.getElementById('customDepartmentField');
        if (customField) {
            customField.remove();
        }
    }

    /**
     * Shows notification message
     */
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
        `;

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Converts registration data to CSV and triggers download
     */
    function downloadCSV() {
        if (registrationData.length === 0) {
            alert('No registration data available to download.');
            return;
        }

        // CSV headers
        const headers = [
            'Student_Name',
            'Email', 
            'Department',
            'Passing_Year',
            'Current_Address',
            'Designation',
            'Company_or_Business',
            'Current_Package',
            'Feedback',
            'Photo_Status',
            'Registration_Date',
            'Registration_Time'
        ];

        // Convert data to CSV format
        let csvContent = headers.join(',') + '\\n';
        
        registrationData.forEach(row => {
            const values = headers.map(header => {
                let value = row[header] || '';
                // Escape commas and quotes in values
                if (value.includes(',') || value.includes('"') || value.includes('\\n')) {
                    value = '"' + value.replace(/"/g, '""') + '"';
                }
                return value;
            });
            csvContent += values.join(',') + '\\n';
        });

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `MVN_Alumni_Registration_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('CSV file downloaded successfully!', 'success');
    }

    /**
     * Auto-resize textarea based on content
     */
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });
});