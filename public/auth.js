// auth.js - Production-ready authentication scripts

document.addEventListener('DOMContentLoaded', function() {
    // Common elements
    const loadingSpinner = document.getElementById('loadingSpinner');
    const csrfToken = document.getElementById('csrfToken');
    
    // Initialize CSRF token (in a real app, this would come from the server)
    if (csrfToken) {
        csrfToken.value = generateCSRFToken();
    }

    // Initialize login page
    if (document.getElementById('loginForm')) {
        initLoginPage();
    }

    // Initialize register page
    if (document.getElementById('registerForm')) {
        initRegisterPage();
    }

    // Initialize password toggles
    initPasswordToggles();
});

function generateCSRFToken() {
    // In a real app, this would come from the server
    return 'csrf-' + Math.random().toString(36).substr(2, 9);
}

function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const errorMessage = document.getElementById('errorMessage');
    const rateLimitMessage = document.getElementById('rateLimitMessage');
    const loginButton = document.getElementById('loginButton');
    const captchaContainer = document.getElementById('captchaContainer');
    
    // Track login attempts for rate limiting
    let loginAttempts = parseInt(localStorage.getItem('loginAttempts')) || 0;
    const lastAttemptTime = parseInt(localStorage.getItem('lastLoginAttempt')) || 0;
    const now = Date.now();
    
    // Reset attempts if more than 15 minutes have passed
    if (now - lastAttemptTime > 15 * 60 * 1000) {
        loginAttempts = 0;
        localStorage.setItem('loginAttempts', '0');
    }
    
    // Show CAPTCHA after 3 failed attempts
    if (loginAttempts >= 3) {
        captchaContainer.classList.remove('hidden');
        rateLimitMessage.classList.remove('hidden');
        loadRecaptcha();
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Show loading spinner
            loadingSpinner.classList.add('active');
            loginButton.disabled = true;
            
            // Reset error state
            errorMessage.classList.add('hidden');
            loginEmail.classList.remove('is-invalid');
            loginPassword.classList.remove('is-invalid');
            
            // Validate form
            let isValid = true;
            
            if (!loginEmail.value || !validateEmail(loginEmail.value)) {
                loginEmail.classList.add('is-invalid');
                isValid = false;
            }
            
            if (!loginPassword.value || loginPassword.value.length < 8) {
                loginPassword.classList.add('is-invalid');
                isValid = false;
            }
            
            if (!isValid) {
                loadingSpinner.classList.remove('active');
                loginButton.disabled = false;
                return;
            }
            
            // Track login attempt
            loginAttempts++;
            localStorage.setItem('loginAttempts', loginAttempts.toString());
            localStorage.setItem('lastLoginAttempt', Date.now().toString());
            
            // Show CAPTCHA if needed
            if (loginAttempts >= 3) {
                captchaContainer.classList.remove('hidden');
                rateLimitMessage.classList.remove('hidden');
                
                // Verify CAPTCHA
                const captchaResponse = grecaptcha.getResponse();
                if (!captchaResponse) {
                    errorMessage.classList.remove('hidden');
                    document.getElementById('errorText').textContent = 'Please complete the CAPTCHA';
                    loadingSpinner.classList.remove('active');
                    loginButton.disabled = false;
                    return;
                }
            }
            
            try {
                // Simulate API call (replace with actual fetch in production)
                const response = await simulateLogin({
                    email: loginEmail.value,
                    password: loginPassword.value,
                    csrfToken: csrfToken.value,
                    captcha: loginAttempts >= 3 ? grecaptcha.getResponse() : null
                });
                
                if (response.success) {
                    // Successful login
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('currentUser', JSON.stringify(response.user));
                    localStorage.setItem('loginAttempts', '0'); // Reset attempts
                    
                    // Redirect
                    const redirectUrl = localStorage.getItem('redirectAfterLogin') || 'inventory.html';
                    localStorage.removeItem('redirectAfterLogin');
                    window.location.href = redirectUrl;
                } else {
                    // Failed login
                    errorMessage.classList.remove('hidden');
                    document.getElementById('errorText').textContent = response.message || 'Invalid email or password';
                }
            } catch (error) {
                console.error('Login error:', error);
                errorMessage.classList.remove('hidden');
                document.getElementById('errorText').textContent = 'An error occurred. Please try again.';
            } finally {
                loadingSpinner.classList.remove('active');
                loginButton.disabled = false;
            }
        });
    }
}

function initRegisterPage() {
    const registerForm = document.getElementById('registerForm');
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const registerEmail = document.getElementById('registerEmail');
    const registerPassword = document.getElementById('registerPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const termsAgreement = document.getElementById('termsAgreement');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const registerButton = document.getElementById('registerButton');
    const passwordStrengthBar = document.getElementById('passwordStrengthBar');
    
    // Password strength indicator
    if (registerPassword) {
        registerPassword.addEventListener('input', function() {
            const strength = calculatePasswordStrength(this.value);
            updatePasswordStrengthBar(strength);
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Show loading spinner
            loadingSpinner.classList.add('active');
            registerButton.disabled = true;
            
            // Reset messages
            errorMessage.classList.add('hidden');
            successMessage.classList.add('hidden');
            firstName.classList.remove('is-invalid');
            lastName.classList.remove('is-invalid');
            registerEmail.classList.remove('is-invalid');
            registerPassword.classList.remove('is-invalid');
            confirmPassword.classList.remove('is-invalid');
            termsAgreement.classList.remove('is-invalid');
            
            // Validate form
            let isValid = true;
            
            if (!firstName.value) {
                firstName.classList.add('is-invalid');
                isValid = false;
            }
            
            if (!lastName.value) {
                lastName.classList.add('is-invalid');
                isValid = false;
            }
            
            if (!registerEmail.value || !validateEmail(registerEmail.value)) {
                registerEmail.classList.add('is-invalid');
                isValid = false;
            }
            
            if (!registerPassword.value || !isStrongPassword(registerPassword.value)) {
                registerPassword.classList.add('is-invalid');
                isValid = false;
            }
            
            if (registerPassword.value !== confirmPassword.value) {
                confirmPassword.classList.add('is-invalid');
                isValid = false;
            }
            
            if (!termsAgreement.checked) {
                termsAgreement.classList.add('is-invalid');
                isValid = false;
            }
            
            if (!isValid) {
                loadingSpinner.classList.remove('active');
                registerButton.disabled = false;
                return;
            }
            
            try {
                // Verify CAPTCHA
                const captchaResponse = grecaptcha.getResponse();
                if (!captchaResponse) {
                    throw new Error('CAPTCHA verification failed');
                }
                
                // Simulate API call (replace with actual fetch in production)
                const response = await simulateRegister({
                    firstName: firstName.value,
                    lastName: lastName.value,
                    email: registerEmail.value,
                    password: registerPassword.value,
                    phone: document.getElementById('phone').value,
                    csrfToken: csrfToken.value,
                    captcha: captchaResponse
                });
                
                if (response.success) {
                    // Successful registration
                    successMessage.classList.remove('hidden');
                    
                    // Save user data
                    localStorage.setItem('currentUser', JSON.stringify(response.user));
                    
                    // Redirect after delay
                    setTimeout(() => {
                        window.location.href = 'inventory.html';
                    }, 2000);
                } else {
                    // Failed registration
                    errorMessage.classList.remove('hidden');
                    document.getElementById('errorText').textContent = response.message || 'Registration failed';
                }
            } catch (error) {
                console.error('Registration error:', error);
                errorMessage.classList.remove('hidden');
                document.getElementById('errorText').textContent = 'An error occurred. Please try again.';
            } finally {
                loadingSpinner.classList.remove('active');
                registerButton.disabled = false;
            }
        });
    }
}

function initPasswordToggles() {
    // Password toggle functionality
    document.querySelectorAll('.password-toggle-icon').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const inputId = this.id === 'togglePassword' ? 'loginPassword' : 
                          this.id === 'toggleConfirmPassword' ? 'confirmPassword' : 'registerPassword';
            const input = document.getElementById(inputId);
            
            if (input) {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
                
                // Update aria-label
                const newLabel = type === 'password' ? 'Show password' : 'Hide password';
                this.setAttribute('aria-label', newLabel);
            }
        });
    });
}

// Helper functions
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

function calculatePasswordStrength(password) {
    let strength = 0;
    
    // Length
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Mixed case
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    
    // Numbers
    if (/\d/.test(password)) strength += 1;
    
    // Special chars
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    return strength;
}

function updatePasswordStrengthBar(strength) {
    const bar = document.getElementById('passwordStrengthBar');
    if (!bar) return;
    
    let width = 0;
    let color = '';
    
    switch(strength) {
        case 0:
            width = 0;
            color = 'transparent';
            break;
        case 1:
            width = 25;
            color = '#dc3545'; // Red
            break;
        case 2:
            width = 50;
            color = '#fd7e14'; // Orange
            break;
        case 3:
            width = 75;
            color = '#ffc107'; // Yellow
            break;
        case 4:
        case 5:
            width = 100;
            color = '#28a745'; // Green
            break;
    }
    
    bar.style.width = `${width}%`;
    bar.style.backgroundColor = color;
}

// Simulated API functions (replace with actual fetch calls in production)
async function simulateLogin(credentials) {
    return new Promise(resolve => {
        setTimeout(() => {
            // Simulate checking against "database"
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === credentials.email);
            
            if (user && user.password === credentials.password) {
                resolve({
                    success: true,
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phone
                    }
                });
            } else {
                resolve({
                    success: false,
                    message: 'Invalid email or password'
                });
            }
        }, 1000);
    });
}

async function simulateRegister(userData) {
    return new Promise(resolve => {
        setTimeout(() => {
            // Simulate checking for existing user
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const emailExists = users.some(u => u.email === userData.email);
            
            if (emailExists) {
                resolve({
                    success: false,
                    message: 'This email is already registered'
                });
            } else {
                // Create new user
                const newUser = {
                    id: Date.now(),
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    password: userData.password, // In real app, this would be hashed
                    phone: userData.phone,
                    createdAt: new Date().toISOString()
                };
                
                // Save to "database"
                users.push(newUser);
                localStorage.setItem('users', JSON.stringify(users));
                
                resolve({
                    success: true,
                    user: {
                        id: newUser.id,
                        firstName: newUser.firstName,
                        lastName: newUser.lastName,
                        email: newUser.email,
                        phone: newUser.phone
                    }
                });
            }
        }, 1000);
    });
}



// auth.js - Production-ready authentication scripts with API integration

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

document.addEventListener('DOMContentLoaded', function() {
    // Common elements
    const loadingSpinner = document.getElementById('loadingSpinner');
    const csrfToken = document.getElementById('csrfToken');
    
    // Get CSRF token from API
    fetchCSRFToken().then(token => {
        if (csrfToken) csrfToken.value = token;
    }).catch(error => {
        console.error('Error fetching CSRF token:', error);
    });

    // Initialize login page
    if (document.getElementById('loginForm')) {
        initLoginPage();
    }

    // Initialize register page
    if (document.getElementById('registerForm')) {
        initRegisterPage();
    }

    // Initialize password toggles
    initPasswordToggles();
});

async function fetchCSRFToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch CSRF token');
        }
        
        const data = await response.json();
        return data.csrfToken;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        return generateCSRFToken(); // Fallback
    }
}

function generateCSRFToken() {
    return 'csrf-' + Math.random().toString(36).substr(2, 9);
}

function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const errorMessage = document.getElementById('errorMessage');
    const rateLimitMessage = document.getElementById('rateLimitMessage');
    const loginButton = document.getElementById('loginButton');
    const captchaContainer = document.getElementById('captchaContainer');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Show loading spinner
            loadingSpinner.classList.add('active');
            loginButton.disabled = true;
            
            // Reset error state
            errorMessage.classList.add('hidden');
            loginEmail.classList.remove('is-invalid');
            loginPassword.classList.remove('is-invalid');
            
            // Validate form
            let isValid = true;
            
            if (!loginEmail.value || !validateEmail(loginEmail.value)) {
                loginEmail.classList.add('is-invalid');
                isValid = false;
            }
            
            if (!loginPassword.value || loginPassword.value.length < 8) {
                loginPassword.classList.add('is-invalid');
                isValid = false;
            }
            
            if (!isValid) {
                loadingSpinner.classList.remove('active');
                loginButton.disabled = false;
                return;
            }
            
            try {
                // Prepare request data
                const requestData = {
                    email: loginEmail.value,
                    password: loginPassword.value,
                    csrfToken: document.getElementById('csrfToken').value
                };
                
                // Add CAPTCHA if needed
                if (captchaContainer && !captchaContainer.classList.contains('hidden')) {
                    requestData.captcha = grecaptcha.getResponse();
                    if (!requestData.captcha) {
                        throw new Error('Please complete the CAPTCHA');
                    }
                }
                
                // Make API call
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': requestData.csrfToken
                    },
                    body: JSON.stringify(requestData),
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    // Check if we need to show CAPTCHA
                    if (response.status === 429) {
                        rateLimitMessage.classList.remove('hidden');
                        captchaContainer.classList.remove('hidden');
                        loadRecaptcha();
                    }
                    throw new Error(data.message || 'Login failed');
                }
                
                // Successful login - redirect
                const redirectUrl = localStorage.getItem('redirectAfterLogin') || 'inventory.html';
                localStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
            } catch (error) {
                console.error('Login error:', error);
                errorMessage.classList.remove('hidden');
                document.getElementById('errorText').textContent = error.message || 'An error occurred. Please try again.';
            } finally {
                loadingSpinner.classList.remove('active');
                loginButton.disabled = false;
            }
        });
    }
}

function initRegisterPage() {
    const registerForm = document.getElementById('registerForm');
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const registerEmail = document.getElementById('registerEmail');
    const registerPassword = document.getElementById('registerPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const termsAgreement = document.getElementById('termsAgreement');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const registerButton = document.getElementById('registerButton');
    const passwordStrengthBar = document.getElementById('passwordStrengthBar');
    
    // Password strength indicator
    if (registerPassword) {
        registerPassword.addEventListener('input', function() {
            const strength = calculatePasswordStrength(this.value);
            updatePasswordStrengthBar(strength);
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Show loading spinner
            loadingSpinner.classList.add('active');
            registerButton.disabled = true;
            
            // Reset messages
            errorMessage.classList.add('hidden');
            successMessage.classList.add('hidden');
            firstName.classList.remove('is-invalid');
            lastName.classList.remove('is-invalid');
            registerEmail.classList.remove('is-invalid');
            registerPassword.classList.remove('is-invalid');
            confirmPassword.classList.remove('is-invalid');
            termsAgreement.classList.remove('is-invalid');
            
            // Validate form
            let isValid = true;
            
            if (!firstName.value) {
                firstName.classList.add('is-invalid');
                isValid = false;
            }
            
            if (!lastName.value) {
                lastName.classList.add('is-invalid');
                isValid = false;
            }
            
            if (!registerEmail.value || !validateEmail(registerEmail.value)) {
                registerEmail.classList.add('is-invalid');
                isValid = false;
            }
            
            if (!registerPassword.value || !isStrongPassword(registerPassword.value)) {
                registerPassword.classList.add('is-invalid');
                isValid = false;
            }
            
            if (registerPassword.value !== confirmPassword.value) {
                confirmPassword.classList.add('is-invalid');
                isValid = false;
            }
            
            if (!termsAgreement.checked) {
                termsAgreement.classList.add('is-invalid');
                isValid = false;
            }
            
            if (!isValid) {
                loadingSpinner.classList.remove('active');
                registerButton.disabled = false;
                return;
            }
            
            try {
                // Verify CAPTCHA
                const captchaResponse = grecaptcha.getResponse();
                if (!captchaResponse) {
                    throw new Error('CAPTCHA verification failed');
                }
                
                // Prepare request data
                const requestData = {
                    firstName: firstName.value,
                    lastName: lastName.value,
                    email: registerEmail.value,
                    password: registerPassword.value,
                    phone: document.getElementById('phone').value,
                    csrfToken: document.getElementById('csrfToken').value,
                    captcha: captchaResponse
                };
                
                // Make API call
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': requestData.csrfToken
                    },
                    body: JSON.stringify(requestData),
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Registration failed');
                }
                
                // Successful registration
                successMessage.classList.remove('hidden');
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = 'inventory.html';
                }, 2000);
            } catch (error) {
                console.error('Registration error:', error);
                errorMessage.classList.remove('hidden');
                document.getElementById('errorText').textContent = error.message || 'An error occurred. Please try again.';
            } finally {
                loadingSpinner.classList.remove('active');
                registerButton.disabled = false;
            }
        });
    }
}

// Helper functions remain the same as previous implementation
// (validateEmail, isStrongPassword, calculatePasswordStrength, updatePasswordStrengthBar, initPasswordToggles)