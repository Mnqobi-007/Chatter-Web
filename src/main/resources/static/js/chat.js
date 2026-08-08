// chat.js - Updated with corrected API endpoints

class ChatApp {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.currentContact = null;
        this.contacts = [];
        this.messages = {};
        this.apiBase = '/api';
        this.wsEndpoint = 'ws';

        // DOM elements
        this.contactList = document.getElementById('contactList');
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendMessageBtn');
        this.chatContactName = document.getElementById('chatContactName');
        this.chatContactAvatar = document.getElementById('chatContactAvatar');
        this.chatContactStatus = document.getElementById('chatContactStatus');
        this.chatContactStatusText = document.getElementById('chatContactStatusText');
        this.currentUsername = document.getElementById('currentUsername');
        this.searchInput = document.getElementById('searchContacts');
        this.emptyState = document.getElementById('emptyState');
        this.activeChat = document.getElementById('activeChat');

        this.init();
    }

    init() {
        if (!auth.isAuthenticated) {
            window.location.href = `${this.apiBase}/`;
            return;
        }

        // Set username
        if (this.currentUsername) {
            this.currentUsername.textContent = auth.username;
        }

        this.setupEventListeners();
        this.loadContacts();
        this.connectWebSocket();
        this.loadLocalMessages();
    }

    setupEventListeners() {
        // Send message
        this.sendBtn?.addEventListener('click', () => this.sendMessage());
        this.messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Search contacts
        this.searchInput?.addEventListener('input', () => this.filterContacts());

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterContacts(btn.dataset.tab);
            });
        });

        // Add contact - using the corrected /api/contacts endpoint
        document.getElementById('addContactForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addContact();
        });
        document.getElementById('addContactBtn')?.addEventListener('click', () => {
            document.getElementById('addContactModal')?.classList.add('active');
        });
        document.getElementById('addContactModalClose')?.addEventListener('click', () => {
            document.getElementById('addContactModal')?.classList.remove('active');
        });
        // Close add contact modal on backdrop click
        document.getElementById('addContactModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.target.classList.remove('active');
            }
        });
        
        // Logout from chat page
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            auth.logout();
        });

        // File/image sharing
        document.getElementById('attachFileBtn')?.addEventListener('click', () => {
            document.getElementById('fileInput')?.click();
        });
        document.getElementById('fileInput')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.uploadAndSendFile(file);
            e.target.value = ''; // reset so picking the same file twice still fires 'change'
        });
    }

    connectWebSocket() {
        const token = auth.token;
        const socket = new SockJS(`${this.apiBase}/${this.wsEndpoint}`);
        this.stompClient = Stomp.over(socket);

        this.stompClient.connect(
            { Authorization: `Bearer ${token}` },
            () => {
                console.log('✅ WebSocket connected');
                this.connected = true;
                this.subscribeToMessages();
                this.updateUserStatus('online');
            },
            (error) => {
                console.error('❌ WebSocket connection failed:', error);
                this.connected = false;
                this.updateUserStatus('offline');
                setTimeout(() => this.connectWebSocket(), 5000);
            }
        );
    }

    subscribeToMessages() {
        // Subscribe to private messages
        this.stompClient.subscribe('/user/queue/private', (message) => {
            const msg = JSON.parse(message.body);
            this.handleNewMessage(msg);
        });

        // Subscribe to status updates (if implemented)
        this.stompClient.subscribe('/user/queue/status', (message) => {
            try {
                const status = JSON.parse(message.body);
                this.handleStatusUpdate(status);
            } catch(e) {
                console.warn('Invalid status update:', e);
            }
        });

        console.log('📨 Subscribed to private messages');
    }

    async loadContacts() {
        try {
            const response = await auth.authFetch(`${this.apiBase}/contacts`);
            
            if (response.ok) {
                const users = await response.json();
                // Map User objects to contact format
                this.contacts = users.map(user => ({
                    id: user.username,
                    name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() || user.username : user.username,
                    avatar: user.profilePicture || `https://i.pravatar.cc/50?img=${Math.floor(Math.random() * 70)}`,
                    online: user.online || false,
                    lastMessage: '',
                    timestamp: '',
                    unread: 0,
                    email: user.email,
                    userId: user.id
                }));
            } else {
                console.error('Failed to load contacts');
                // Fallback to mock data
                this.loadMockContacts();
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
            this.loadMockContacts();
        }
        this.renderContacts();
    }

    loadMockContacts() {
        this.contacts = [
            { id: 'alice', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/50?img=1', online: true, lastMessage: 'Hey! How are you?', timestamp: '10:30 AM', unread: 2 },
            { id: 'bob', name: 'Bob Smith', avatar: 'https://i.pravatar.cc/50?img=2', online: false, lastMessage: 'See you tomorrow!', timestamp: '9:15 AM', unread: 0 },
            { id: 'charlie', name: 'Charlie Brown', avatar: 'https://i.pravatar.cc/50?img=3', online: true, lastMessage: 'Thanks for your help!', timestamp: 'Yesterday', unread: 1 },
            { id: 'diana', name: 'Diana Prince', avatar: 'https://i.pravatar.cc/50?img=4', online: true, lastMessage: 'That sounds great! 😊', timestamp: 'Yesterday', unread: 0 },
            { id: 'eve', name: 'Eve Wilson', avatar: 'https://i.pravatar.cc/50?img=5', online: false, lastMessage: 'Can we reschedule?', timestamp: '2 days ago', unread: 3 },
            { id: 'frank', name: 'Frank Castle', avatar: 'https://i.pravatar.cc/50?img=6', online: false, lastMessage: "I'll be there", timestamp: '2 days ago', unread: 0 },
        ];
    }

    renderContacts(filter = 'all') {
        if (!this.contactList) return;

        let filtered = [...this.contacts];

        if (filter === 'online') filtered = filtered.filter(c => c.online);
        else if (filter === 'unread') filtered = filtered.filter(c => c.unread > 0);

        const searchTerm = this.searchInput?.value.toLowerCase() || '';
        filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(searchTerm) ||
            c.id.toLowerCase().includes(searchTerm)
        );

        if (filtered.length === 0) {
            this.contactList.innerHTML = `
                <div class="empty-state" style="padding: 2rem;">
                    <p style="color: var(--text-muted);">No contacts found</p>
                </div>
            `;
            return;
        }

        this.contactList.innerHTML = filtered.map(contact => `
            <div class="contact-item ${this.currentContact?.id === contact.id ? 'active' : ''}"
                 data-id="${contact.id}" onclick="window.chatApp.selectContact('${contact.id}')">
                <div class="avatar">
                    <img src="${contact.avatar}" alt="${contact.name}" onerror="this.src='https://i.pravatar.cc/50?img=${Math.floor(Math.random() * 70)}'">
                    <span class="status-indicator ${contact.online ? 'online' : 'offline'}"></span>
                </div>
                <div class="contact-info">
                    <h4>${contact.name}</h4>
                    <div class="last-message">${contact.lastMessage || 'No messages yet'}</div>
                </div>
                <div class="contact-meta">
                    <span class="time">${contact.timestamp || ''}</span>
                    ${contact.unread > 0 ? `<span class="unread-badge">${contact.unread}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    filterContacts(tab = 'all') {
        const activeTab = document.querySelector('.tab-btn.active');
        const filter = activeTab ? activeTab.dataset.tab : 'all';
        this.renderContacts(filter);
    }

    selectContact(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;

        this.currentContact = contact;
        this.loadMessages(contactId);

        this.renderContacts();
        this.showChatArea(contact);

        if (contact.unread > 0) {
            contact.unread = 0;
            this.renderContacts();
            this.markMessagesAsRead(contactId);
        }
    }

    showChatArea(contact) {
        if (this.emptyState) this.emptyState.classList.add('hidden');
        if (this.activeChat) this.activeChat.classList.remove('hidden');

        this.chatContactName.textContent = contact.name;
        this.chatContactAvatar.src = contact.avatar;
        this.chatContactStatus.className = `status-indicator ${contact.online ? 'online' : 'offline'}`;
        this.chatContactStatusText.textContent = contact.online ? 'Online' : 'Offline';
        this.chatContactStatusText.className = `contact-status ${contact.online ? 'online' : ''}`;

        this.messageInput?.focus();
    }

    loadMessages(contactId) {
        if (!this.chatMessages) return;

        const messages = this.messages[contactId] || [];
        if (messages.length === 0) {
            this.fetchMessages(contactId);
            return;
        }
        this.renderMessages(messages);
    }

    // Using the corrected /api/chat/history endpoint
    async fetchMessages(contactId) {
        try {
            const response = await auth.authFetch(`${this.apiBase}/chat/history/${contactId}`);
            if (response.ok) {
                const messages = await response.json();
                this.messages[contactId] = messages;
                this.renderMessages(messages);
                this.saveLocalMessages();
            } else {
                console.error('Failed to fetch messages:', await response.text());
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    }

    renderMessages(messages) {
        if (!this.chatMessages) return;

        if (!messages || messages.length === 0) {
            this.chatMessages.innerHTML = `
                <div class="empty-state" style="padding: 2rem;">
                    <p style="color: var(--text-muted);">No messages yet. Say hello! 👋</p>
                </div>
            `;
            return;
        }

        let html = '';
        let lastDate = '';

        messages.forEach(msg => {
            const msgDate = new Date(msg.timestamp);
            const dateStr = msgDate.toLocaleDateString();

            if (dateStr !== lastDate) {
                html += `<div class="message-date-divider"><span>${this.formatDate(dateStr)}</span></div>`;
                lastDate = dateStr;
            }

            const isSent = msg.sender === auth.username;
            const status = msg.read ? 'read' : (msg.delivered ? 'delivered' : 'sent');
            const bodyHtml = msg.fileUrl ? this.renderFileBubble(msg) : this.escapeHtml(msg.message);

            html += `
                <div class="message-wrapper ${isSent ? 'sent' : 'received'}">
                    <div class="message-bubble">${bodyHtml}</div>
                    <div class="message-meta">
                        <span class="time">${msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        ${isSent ? `<span class="status ${status}">${this.getStatusIcon(status)}</span>` : ''}
                    </div>
                </div>
            `;
        });

        this.chatMessages.innerHTML = html;
        this.scrollToBottom();
    }

    sendMessage() {
        if (!this.messageInput || !this.currentContact) return;

        const content = this.messageInput.value.trim();
        if (!content) return;

        const message = {
            message: content,
            receiver: this.currentContact.id,
            sender: auth.username,
            timestamp: new Date().toISOString(),
            delivered: false,
            read: false
        };

        // Optimistic update
        this.addMessageToUI(message, true);
        this.messageInput.value = '';

        if (this.connected && this.stompClient) {
            this.stompClient.send('/chat/chat.private', {}, JSON.stringify(message));
        } else {
            this.sendMessageViaRest(message);
        }
    }

    handleNewMessage(message) {
        // Ensure message has valid timestamp
        if (!message.timestamp) {
            message.timestamp = new Date().toISOString();
        }
        
        const isCurrent = this.currentContact && message.sender === this.currentContact.id;

        if (!this.messages[message.sender]) {
            this.messages[message.sender] = [];
        }
        this.messages[message.sender].push(message);
        this.saveLocalMessages();

        const contact = this.contacts.find(c => c.id === message.sender);
        if (contact) {
            contact.lastMessage = message.message;
            contact.timestamp = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (!isCurrent) {
                contact.unread = (contact.unread || 0) + 1;
            }
            this.renderContacts();
        }

        if (isCurrent) {
            this.addMessageToUI(message, false);
        }
    }

    addMessageToUI(message, isSent) {
        if (!this.chatMessages) return;

        const msgDate = new Date(message.timestamp || Date.now());
        const bodyHtml = message.fileUrl ? this.renderFileBubble(message) : this.escapeHtml(message.message);
        const html = `
            <div class="message-wrapper ${isSent ? 'sent' : 'received'}">
                <div class="message-bubble">${bodyHtml}</div>
                <div class="message-meta">
                    <span class="time">${msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    ${isSent ? `<span class="status sent">✓</span>` : ''}
                </div>
            </div>
        `;

        const emptyState = this.chatMessages.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        this.chatMessages.insertAdjacentHTML('beforeend', html);
        this.scrollToBottom();
    }

    // Renders an inline <img> for images, or a download link for other file types.
    // fileUrl is a relative path like "/chat/files/<uuid>.png" returned by the
    // upload endpoint, so it needs the apiBase prefix to resolve correctly.
    renderFileBubble(message) {
        const url = `${this.apiBase}${message.fileUrl}`;
        const isImage = message.fileType && message.fileType.startsWith('image/');
        if (isImage) {
            return `<img src="${url}" alt="${this.escapeHtml(message.message || 'shared image')}" style="max-width: 240px; border-radius: 8px; display: block;">`;
        }
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" download>📎 ${this.escapeHtml(message.message || 'Download file')}</a>`;
    }

    markMessagesAsRead(contactId) {
        // This would be implemented if you have a read receipt endpoint
        // For now, just update local state
        const messages = this.messages[contactId] || [];
        messages.forEach(msg => {
            if (msg.sender === contactId && !msg.read) {
                msg.read = true;
            }
        });
        this.saveLocalMessages();
    }

    handleStatusUpdate(status) {
        const contact = this.contacts.find(c => c.id === status.userId);
        if (contact) {
            contact.online = status.status === 'online';
            this.renderContacts();

            if (this.currentContact && this.currentContact.id === status.userId) {
                this.chatContactStatus.className = `status-indicator ${contact.online ? 'online' : 'offline'}`;
                this.chatContactStatusText.textContent = contact.online ? 'Online' : 'Offline';
                this.chatContactStatusText.className = `contact-status ${contact.online ? 'online' : ''}`;
            }
        }
    }

    updateUserStatus(status) {
        if (this.connected && this.stompClient) {
            try {
                this.stompClient.send('/chat/chat.status', {}, JSON.stringify({
                    userId: auth.username,
                    status: status
                }));
            } catch(e) {
                console.warn('Could not send status update:', e);
            }
        }
    }

    // Using the corrected /api/contacts/add endpoint
    async addContact() {
        const usernameInput = document.getElementById('contactUsername');
        const username = usernameInput?.value.trim();
        
        if (!username) {
            auth.showError('addContactForm', 'Please enter a username');
            return;
        }

        try {
            const response = await auth.authFetch(`${this.apiBase}/contacts/add`, {
                method: 'POST',
                body: JSON.stringify({ username })
            });

            const data = await response.json();

            if (response.ok) {
                document.getElementById('addContactModal').classList.remove('active');
                if (usernameInput) usernameInput.value = '';
                this.loadContacts();
                auth.showSuccess(`Added ${username} to contacts!`);
            } else {
                auth.showError('addContactForm', data.message || 'Failed to add contact');
            }
        } catch (error) {
            console.error('Add contact error:', error);
            auth.showError('addContactForm', 'Connection error. Please try again.');
        }
    }

    // Using the corrected /api/chat/send endpoint
    async sendMessageViaRest(message) {
        try {
            const response = await auth.authFetch(`${this.apiBase}/chat/send`, {
                method: 'POST',
                body: JSON.stringify(message)
            });
            if (!response.ok) {
                console.error('Failed to send message via REST');
                const errorText = await response.text();
                console.error('Error response:', errorText);
            }
        } catch (error) {
            console.error('REST send error:', error);
        }
    }

    async uploadAndSendFile(file) {
        if (!this.currentContact) {
            console.warn('Select a contact before sending a file');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await auth.authFetch(`${this.apiBase}/chat/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                console.error('Upload failed:', err.message || response.statusText);
                return;
            }

            const uploaded = await response.json();

            const message = {
                message: uploaded.originalName,
                fileUrl: uploaded.fileUrl,
                fileType: uploaded.contentType,
                receiver: this.currentContact.id,
                sender: auth.username,
                timestamp: new Date().toISOString(),
                delivered: false,
                read: false
            };

            // Optimistic update, same pattern as sendMessage()
            this.addMessageToUI(message, true);

            if (this.connected && this.stompClient) {
                this.stompClient.send('/chat/chat.private', {}, JSON.stringify(message));
            } else {
                this.sendMessageViaRest(message);
            }
        } catch (error) {
            console.error('File upload error:', error);
        }
    }

    // Helpers
    formatDate(dateStr) {
        const today = new Date().toLocaleDateString();
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
        if (dateStr === today) return 'Today';
        if (dateStr === yesterday) return 'Yesterday';
        return dateStr;
    }

    getStatusIcon(status) {
        switch(status) {
            case 'sent': return '✓';
            case 'delivered': return '✓✓';
            case 'read': return '✓✓';
            default: return '✓';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }

    saveLocalMessages() {
        try {
            localStorage.setItem(`chat_messages_${auth.username}`, JSON.stringify(this.messages));
        } catch (e) {}
    }

    loadLocalMessages() {
        try {
            const data = localStorage.getItem(`chat_messages_${auth.username}`);
            if (data) {
                this.messages = JSON.parse(data);
                // Ensure all messages have timestamp
                Object.keys(this.messages).forEach(key => {
                    this.messages[key] = this.messages[key].map(msg => {
                        if (!msg.timestamp) msg.timestamp = new Date().toISOString();
                        return msg;
                    });
                });
            }
        } catch (e) {}
    }
}

// Initialize chat when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.chat-page')) {
        window.chatApp = new ChatApp();
    }
});

window.ChatApp = ChatApp;