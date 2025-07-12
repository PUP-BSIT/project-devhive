document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('.contact-form');
    
    if (!contactForm) {
        console.error('Contact form not found');
        return;
    }

    // Create form status element
    const formStatus = document.createElement('div');
    formStatus.classList.add('form-status');
    contactForm.appendChild(formStatus);

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset previous status
        formStatus.textContent = '';
        formStatus.classList.remove('error', 'success');

        // Get form inputs
        const nameInput = contactForm.querySelector('input[name="name"]');
        const emailInput = contactForm.querySelector('input[name="email"]');
        const messageInput = contactForm.querySelector('textarea[name="message"]');

        // Validate inputs
        const errors = [];

        if (!nameInput.value.trim()) {
            errors.push('Name is required');
        }

        if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
            errors.push('Please enter a valid email');
        }

        if (!messageInput.value.trim()) {
            errors.push('Message is required');
        }

        // Display errors if any
        if (errors.length > 0) {
            formStatus.classList.add('error');
            formStatus.textContent = errors.join(', ');
            return;
        }

        // Prepare submission data
        const submissionData = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            message: messageInput.value.trim()
        };

        try {
            // Disable submit button during submission
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            // Send submission to API
            const response = await fetch('/api/contact/submit.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(submissionData)
            });

            // Log raw response for debugging
            const responseText = await response.text();
            console.log('Raw Response:', responseText);

            // Try to parse JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON Parsing Error:', parseError);
                throw new Error('Invalid server response: ' + responseText);
            }

            // Check response status
            if (!response.ok) {
                // Handle validation errors or server errors
                if (result.errors) {
                    const errorMessages = Object.values(result.errors);
                    formStatus.classList.add('error');
                    formStatus.textContent = errorMessages.join(', ');
                } else {
                    throw new Error(result.message || 'Submission failed');
                }
                return;
            }

            // Success handling
            formStatus.classList.add('success');
            formStatus.textContent = result.message || 'Message sent successfully!';
            
            // Reset form
            contactForm.reset();

        } catch (error) {
            // Network or unexpected errors
            console.error('Submission error:', error);
            formStatus.classList.add('error');
            formStatus.textContent = error.message || 'Network error. Please try again.';
        } finally {
            // Re-enable submit button
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }
    });

    // Email validation function
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}); 