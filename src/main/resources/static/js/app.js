// app.js

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu on link click
    document.querySelectorAll('.nav-links a, .nav-links button').forEach(link => {
        link.addEventListener('click', () => {
            navLinks?.classList.remove('active');
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Demo button
    const demoBtn = document.getElementById('heroDemoBtn');
    if (demoBtn) {
        demoBtn.addEventListener('click', function() {
            const preview = document.querySelector('.hero-chat-preview');
            if (preview) {
                preview.style.transition = 'transform 0.5s ease';
                preview.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    preview.style.transform = 'scale(1)';
                }, 500);
            }
            auth.showSuccess('Check out the chat preview above! 💬');
        });
    }

    // Escape key closes modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });

    // Add toast animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        .form-error { animation: slideIn 0.3s ease; }
        .toast-success { animation: slideIn 0.3s ease; }
        .toast-success.fade-out { animation: fadeOut 0.3s ease; }
    `;
    document.head.appendChild(style);

    console.log('✅ Chatter app initialized successfully!');
});

// Reconnect WebSocket when tab becomes active
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && window.chatApp && !window.chatApp.connected) {
        console.log('🔄 Tab active, reconnecting WebSocket...');
        window.chatApp.connectWebSocket();
    }
});

// Handle online/offline status
window.addEventListener('online', function() {
    console.log('🌐 Network online');
    if (window.chatApp && !window.chatApp.connected) {
        window.chatApp.connectWebSocket();
    }
});

window.addEventListener('offline', function() {
    console.log('🌐 Network offline');
    if (window.chatApp) {
        window.chatApp.updateUserStatus('offline');
    }
});