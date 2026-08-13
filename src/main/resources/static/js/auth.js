class AuthManager {
    constructor() {
        this.token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        this.username = localStorage.getItem('username') || sessionStorage.getItem('username');
        this.isAuthenticated = !!this.token;
        this.apiBase = '/api';
        this.init();
    }

    init() {
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Signup form
        document.getElementById('signupForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.signup();
        });

        // Modal toggles
        this.setupModalToggles();

        // Password visibility
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.closest('.password-input').querySelector('input');
                const icon = btn.querySelector('i');
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.replace('fa-eye', 'fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.replace('fa-eye-slash', 'fa-eye');
                }
            });
        });

        // Password strength
        document.getElementById('signupPassword')?.addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value);
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        // Update UI based on auth state
        this.updateUI();

        if (this.isAuthenticated && window.location.pathname === `${this.apiBase}/`) {
            window.location.href = `${this.apiBase}/chats`;
        }
    }

    setupModalToggles() {
        // Open login
        document.querySelectorAll('#navLoginBtn, #heroLoginBtn, #ctaLoginBtn').forEach(btn => {
            btn?.addEventListener('click', () => this.openModal('login'));
        });
        // Open signup
        document.querySelectorAll('#navSignupBtn, #ctaSignupBtn').forEach(btn => {
            btn?.addEventListener('click', () => this.openModal('signup'));
        });
        // Close modals
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn?.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('active');
            });
        });
        // Close on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        });
        // Switch between login and signup
        document.getElementById('switchToSignup')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal('signup');
        });
        document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal('login');
        });
    }

    openModal(type) {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        const modal = document.getElementById(`${type}Modal`);
        if (modal) {
            modal.classList.add('active');
            modal.querySelectorAll('.form-error').forEach(el => el.remove());
        }
    }

    async login() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;

        if (!username || !password) {
            this.showError('loginForm', 'Please fill in all fields');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.refreshToken = data.refreshToken;
                this.username = data.username || username;
                this.isAuthenticated = true;

                if (rememberMe) {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    localStorage.setItem('username', this.username);
                } else {
                    sessionStorage.setItem('authToken', data.token);
                    sessionStorage.setItem('refreshToken', data.refreshToken);
                    sessionStorage.setItem('username', this.username);
                }

                document.getElementById('loginModal').classList.remove('active');
                this.updateUI();
                this.redirectToChat();
            } else {
                this.showError('loginForm', data.message || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('loginForm', 'Connection error. Please try again.');
        }
    }

    async signup() {
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        if (!username || !email || !password || !confirmPassword) {
            this.showError('signupForm', 'Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            this.showError('signupForm', 'Passwords do not match');
            return;
        }
        if (password.length < 8) {
            this.showError('signupForm', 'Password must be at least 8 characters');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username, 
                    email, 
                    password 
                })
            });

            const data = await response.json();

            if (response.ok) {
                document.getElementById('signupModal').classList.remove('active');
                this.showSuccess('Account created successfully! Please login.');
                this.openModal('login');
                document.getElementById('loginUsername').value = username;
            } else {
                this.showError('signupForm', data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showError('signupForm', 'Connection error. Please try again.');
        }
    }

    async refreshAccessToken() {
        if (!this.refreshToken) return false;
        try {
            const response = await fetch(`${this.apiBase}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });
            if (!response.ok) return false;
            const data = await response.json();
            this.token = data.token;
            // keep it in whichever storage was already in use
            (localStorage.getItem('refreshToken') ? localStorage : sessionStorage)
                .setItem('authToken', data.token);
            return true;
        } catch (e) {
            return false;
        }
    }

    logout() {
        if (this.refreshToken) {
            fetch(`${this.apiBase}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            }).catch(() => {});  // don't block logout on network failure
        }
        localStorage.removeItem('refreshToken');  
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('username');
        this.token = null;
        this.username = null;
        this.isAuthenticated = false;
        this.updateUI();
        
        // Disconnect WebSocket if exists
        if (window.chatApp && window.chatApp.stompClient) {
            try {
                window.chatApp.stompClient.disconnect();
            } catch(e) {}
        }
        
        window.location.href = `${this.apiBase}/`;
    }

    updateUI() {
        const navLinks = document.getElementById('navLinks');
        if (!navLinks) return;

        if (this.isAuthenticated) {
            navLinks.innerHTML = `
                <a href="/chats">Chats</a>
                <span class="user-badge" style="color: var(--text-secondary); padding: 0 8px;">${this.username}</span>
                <button class="btn btn-primary btn-sm" id="logoutBtn">Logout</button>
            `;
            document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        } else {
            navLinks.innerHTML = `
                <a href="#" class="active">Home</a>
                <a href="#features">Features</a>
                <a href="#about">About</a>
                <button class="btn btn-primary btn-sm" id="navLoginBtn">Login</button>
                <button class="btn btn-outline btn-sm" id="navSignupBtn">Sign Up</button>
            `;
            document.getElementById('navLoginBtn')?.addEventListener('click', () => this.openModal('login'));
            document.getElementById('navSignupBtn')?.addEventListener('click', () => this.openModal('signup'));
        }
    }

    redirectToChat() {
        if (!window.location.pathname.includes('/chats')) {
            setTimeout(() => window.location.href = `${this.apiBase}/chats`, 500);
        } else {
            if (window.chatApp) {
                window.chatApp.init();
            } else {
                window.location.reload();
            }
        }
    }

    showError(formId, message) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const existing = form.querySelector('.form-error');
        if (existing) existing.remove();

        const error = document.createElement('div');
        error.className = 'form-error';
        error.style.cssText = `
            background: rgba(255, 101, 132, 0.1);
            border: 1px solid rgba(255, 101, 132, 0.3);
            color: #FF6584;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.9rem;
            margin-top: 8px;
        `;
        error.textContent = message;
        form.prepend(error);
        setTimeout(() => error.remove(), 5000);
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: rgba(76, 175, 80, 0.95);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    checkPasswordStrength(password) {
        const bar = document.querySelector('.strength-bar');
        const text = document.querySelector('.strength-text');
        if (!bar || !text) return;

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        const strengths = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const colors = ['#f44336', '#ff9800', '#ffc107', '#4caf50', '#2e7d32'];
        const percentages = [20, 40, 60, 80, 100];

        const index = Math.min(strength, 4);
        bar.style.width = percentages[index] + '%';
        bar.style.background = colors[index];
        text.textContent = `Password strength: ${strengths[index]}`;
        text.style.color = colors[index];
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    getAuthHeaderOnly() {
        return {
            'Authorization': `Bearer ${this.token}`
        };
    }

    async authFetch(url, options = {}) {
        const isFormData = options.body instanceof FormData;
        const buildHeaders = () => isFormData ? this.getAuthHeaderOnly() : this.getAuthHeaders();

        const doFetch = () => fetch(url, {
            ...options,
            headers: { ...buildHeaders(), ...(options.headers || {}) }
        });

        let response = await doFetch();

        if (response.status === 401) {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                response = await doFetch();
            } else {
                this.logout();
            }
        }

        return response;
    }
}

// Initialize auth on page load
const auth = new AuthManager();
window.auth = auth;