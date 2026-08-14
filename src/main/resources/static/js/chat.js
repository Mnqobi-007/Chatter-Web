class ChatApp {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.currentContact = null;
        this.contacts = [];
        this.messages = {};
        this.typingTimeout = null;
        this.isTyping = false;
        this.apiBase = '/api';
        this.wsEndpoint = 'ws';
        this.messagePage = 0;
        this.hasMoreMessages = true;
        this.isLoadingMessages = false;

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
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Typing indicator
        this.messageInput?.addEventListener('input', () => {
            this.handleTyping();
        });

        // Search contacts
        this.searchInput?.addEventListener('input', () => this.filterContacts());

        // Contact selection
        this.contactList?.addEventListener('click', (e) => {
            const item = e.target.closest('.contact-item[data-id]');
            if (item) this.selectContact(item.dataset.id);
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterContacts(btn.dataset.tab);
            });
        });

        // Add contact
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
        document.getElementById('addContactModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.target.classList.remove('active');
            }
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            auth.logout();
        });

        // File sharing
        document.getElementById('attachFileBtn')?.addEventListener('click', () => {
            document.getElementById('fileInput')?.click();
        });
        document.getElementById('fileInput')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.uploadAndSendFile(file);
            e.target.value = '';
        });

        // Scroll to load more messages
        this.chatMessages?.addEventListener('scroll', () => {
            if (this.chatMessages.scrollTop === 0 && this.hasMoreMessages && !this.isLoadingMessages) {
                this.loadMoreMessages();
            }
        });
    }

    connectWebSocket() {
        const token = auth.token;
        if (!token) {
            console.error('No token available for WebSocket connection');
            return;
        }

        const socket = new SockJS(`${this.apiBase}/${this.wsEndpoint}`);
        this.stompClient = Stomp.over(socket);

        // Increase heartbeat intervals to keep connection alive
        this.stompClient.heartbeat.outgoing = 20000;
        this.stompClient.heartbeat.incoming = 20000;

        this.stompClient.connect(
            { Authorization: `Bearer ${token}` },
            () => {
                console.log('✅ WebSocket connected');
                this.connected = true;
                this.subscribeToMessages();
                this.updateUserStatus('online');

                // Check for undelivered messages
                this.fetchUnreadMessages();
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
        if (!this.stompClient || !this.stompClient.connected) return;

        // Subscribe to private messages
        this.stompClient.subscribe('/user/queue/private', (message) => {
            const msg = JSON.parse(message.body);
            this.handleNewMessage(msg);
        });

        // Subscribe to read receipts
        this.stompClient.subscribe('/user/queue/read', (message) => {
            try {
                const data = JSON.parse(message.body);
                this.handleReadReceipt(data);
            } catch(e) {
                console.warn('Invalid read receipt:', e);
            }
        });

        // Subscribe to typing indicators
        this.stompClient.subscribe('/user/queue/typing', (message) => {
            try {
                const data = JSON.parse(message.body);
                this.handleTypingIndicator(data);
            } catch(e) {
                console.warn('Invalid typing indicator:', e);
            }
        });

        // Subscribe to status updates
        this.stompClient.subscribe('/user/queue/status', (message) => {
            try {
                const status = JSON.parse(message.body);
                this.handleStatusUpdate(status);
            } catch(e) {
                console.warn('Invalid status update:', e);
            }
        });

        console.log('📨 Subscribed to all message channels');
    }

    async loadContacts() {
        try {
            const response = await auth.authFetch(`${this.apiBase}/contacts`);

            if (response.ok) {
                const users = await response.json();
                this.contacts = users.map(user => ({
                    id: user.username,
                    name: user.displayName || user.username,
                    avatar: user.profilePicture || `https://i.pravatar.cc/50?img=${Math.floor(Math.random() * 70)}`,
                    online: user.online || false,
                    lastMessage: user.lastMessage || '',
                    timestamp: user.lastMessageTime ? this.formatTime(user.lastMessageTime) : '',
                    unread: user.unreadCount || 0,
                    email: user.email
                }));
            } else {
                console.error('Failed to load contacts');
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
            { id: 'charlie', name: 'Charlie Brown', avatar: 'https://i.pravatar.cc/50?img=3', online: true, lastMessage: 'Thanks for your help!', timestamp: 'Yesterday', unread: 1 }
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

        // Sort by timestamp (most recent first)
        filtered.sort((a, b) => {
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return a.timestamp.localeCompare(b.timestamp);
        });

        this.contactList.innerHTML = filtered.map(contact => `
            <div class="contact-item ${this.currentContact?.id === contact.id ? 'active' : ''}"
                 data-id="${this.escapeHtml(contact.id)}">
                <div class="avatar">
                    <img src="${this.escapeHtml(contact.avatar)}" alt="${this.escapeHtml(contact.name)}"
                         onerror="this.src='https://i.pravatar.cc/50?img=${Math.floor(Math.random() * 70)}'">
                    <span class="status-indicator ${contact.online ? 'online' : 'offline'}"></span>
                </div>
                <div class="contact-info">
                    <h4>${this.escapeHtml(contact.name)}</h4>
                    <div class="last-message">${this.escapeHtml(contact.lastMessage || 'No messages yet')}</div>
                </div>
                <div class="contact-meta">
                    <span class="time">${this.escapeHtml(contact.timestamp || '')}</span>
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
        this.messagePage = 0;
        this.hasMoreMessages = true;
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

    async loadMessages(contactId) {
        if (!this.chatMessages) return;

        const messages = this.messages[contactId] || [];
        if (messages.length === 0) {
            await this.fetchMessages(contactId, 0);
            return;
        }
        this.renderMessages(messages);
    }

    async fetchMessages(contactId, page) {
        try {
            const response = await auth.authFetch(
                `${this.apiBase}/chat/history/${contactId}?page=${page}&size=50`
            );

            if (response.ok) {
                const data = await response.json();
                const messages = data.content || [];

                if (!this.messages[contactId]) {
                    this.messages[contactId] = [];
                }

                if (page === 0) {
                    this.messages[contactId] = messages;
                } else {
                    this.messages[contactId] = [...messages, ...this.messages[contactId]];
                }

                this.hasMoreMessages = !data.last;
                this.renderMessages(this.messages[contactId]);
                this.saveLocalMessages();

                if (page === 0) {
                    this.scrollToBottom();
                }
            } else {
                console.error('Failed to fetch messages:', await response.text());
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    }

    async loadMoreMessages() {
        if (!this.currentContact || this.isLoadingMessages || !this.hasMoreMessages) return;

        this.isLoadingMessages = true;
        this.messagePage++;
        await this.fetchMessages(this.currentContact.id, this.messagePage);
        this.isLoadingMessages = false;
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

        // Sort messages by timestamp ascending for display
        const sortedMessages = [...messages].sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        sortedMessages.forEach(msg => {
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

        // Maintain scroll position when loading older messages
        if (this.messagePage > 0) {
            // Keep scroll position after adding older messages
            const firstMessage = this.chatMessages.querySelector('.message-wrapper');
            if (firstMessage) {
                const rect = firstMessage.getBoundingClientRect();
                const containerRect = this.chatMessages.getBoundingClientRect();
                // This is a simple approach - you might want to use scrollTop preservation
            }
        }
    }

    sendMessage() {
        if (!this.messageInput || !this.currentContact) return;

        const content = this.messageInput.value.trim();
        if (!content) return;

        // Check message length
        if (content.length > 1000) {
            auth.showError('messageInput', 'Message cannot exceed 1000 characters');
            return;
        }

        const message = {
            message: content,
            receiver: this.currentContact.id,
            sender: auth.username,
            timestamp: new Date().toISOString(),
            delivered: false,
            read: false,
            fileUrl: null,
            fileType: null,
            fileName: null
        };

        this.addMessageToUI(message, true);
        this.messageInput.value = '';
        this.isTyping = false;

        if (this.connected && this.stompClient) {
            this.stompClient.send('/chat/chat.private', {}, JSON.stringify(message));
        } else {
            this.sendMessageViaRest(message);
        }
    }

    handleNewMessage(message) {
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
            contact.lastMessage = message.message || (message.fileUrl ? '📎 File' : '');
            contact.timestamp = this.formatTime(new Date(message.timestamp));
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

    renderFileBubble(message) {
        const url = `${this.apiBase}${message.fileUrl}`;
        const isImage = message.fileType && message.fileType.startsWith('image/');
        const fileName = message.fileName || 'File';

        if (isImage) {
            return `<img src="${url}" alt="${this.escapeHtml(fileName)}" style="max-width: 240px; border-radius: 8px; display: block; cursor: pointer;" onclick="window.open('${url}', '_blank')">`;
        }
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" download="${this.escapeHtml(fileName)}">📎 ${this.escapeHtml(fileName)}</a>`;
    }

    handleTyping() {
        if (!this.currentContact || !this.connected) return;

        if (!this.isTyping) {
            this.isTyping = true;
            this.sendTypingIndicator(true);
        }

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            this.sendTypingIndicator(false);
        }, 3000);
    }

    sendTypingIndicator(isTyping) {
        if (this.stompClient && this.connected) {
            this.stompClient.send('/chat/chat.typing', {}, JSON.stringify({
                receiver: this.currentContact.id,
                typing: isTyping
            }));
        }
    }

    handleTypingIndicator(data) {
        const contact = this.contacts.find(c => c.id === data.sender);
        if (contact && this.currentContact && this.currentContact.id === data.sender) {
            const statusText = this.chatContactStatusText;
            if (data.typing) {
                statusText.textContent = 'Typing...';
                statusText.className = 'contact-status typing';
            } else {
                statusText.textContent = contact.online ? 'Online' : 'Offline';
                statusText.className = `contact-status ${contact.online ? 'online' : ''}`;
            }
        }
    }

    async markMessagesAsRead(contactId) {
        const messages = this.messages[contactId] || [];
        messages.forEach(msg => {
            if (msg.sender === contactId && !msg.read) {
                msg.read = true;
            }
        });
        this.saveLocalMessages();

        if (this.connected && this.stompClient) {
            this.stompClient.send('/chat/chat.read', {}, JSON.stringify({ sender: contactId }));
        }
    }

    handleReadReceipt(data) {
        const contact = this.contacts.find(c => c.id === data.receiver);
        if (contact) {
            const messages = this.messages[contact.id] || [];
            messages.forEach(msg => {
                if (msg.sender === auth.username && !msg.read) {
                    msg.read = true;
                }
            });
            this.saveLocalMessages();

            if (this.currentContact && this.currentContact.id === contact.id) {
                // Update UI for read receipts
                const statusElements = this.chatMessages.querySelectorAll('.message-wrapper.sent .status');
                statusElements.forEach(el => {
                    if (el.textContent === '✓✓') return;
                    el.textContent = '✓✓';
                    el.className = 'status read';
                });
            }
        }
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

    async fetchUnreadMessages() {
        try {
            const response = await auth.authFetch(`${this.apiBase}/chat/unread`);
            if (response.ok) {
                const unread = await response.json();
                unread.forEach(msg => {
                    if (!this.messages[msg.sender]) {
                        this.messages[msg.sender] = [];
                    }
                    this.messages[msg.sender].push(msg);
                });
                this.saveLocalMessages();
            }
        } catch (error) {
            console.error('Failed to fetch unread messages:', error);
        }
    }

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
                await this.loadContacts();
                auth.showSuccess(`Added ${username} to contacts!`);
            } else {
                auth.showError('addContactForm', data.message || 'Failed to add contact');
            }
        } catch (error) {
            console.error('Add contact error:', error);
            auth.showError('addContactForm', 'Connection error. Please try again.');
        }
    }

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

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            auth.showError('fileInput', 'File size cannot exceed 10MB');
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
                auth.showError('fileInput', err.message || 'Upload failed');
                return;
            }

            const uploaded = await response.json();

            const message = {
                message: uploaded.originalName || file.name,
                fileUrl: uploaded.fileUrl,
                fileType: uploaded.contentType,
                fileName: uploaded.originalName || file.name,
                receiver: this.currentContact.id,
                sender: auth.username,
                timestamp: new Date().toISOString(),
                delivered: false,
                read: false
            };

            this.addMessageToUI(message, true);

            if (this.connected && this.stompClient) {
                this.stompClient.send('/chat/chat.private', {}, JSON.stringify(message));
            } else {
                this.sendMessageViaRest(message);
            }
        } catch (error) {
            console.error('File upload error:', error);
            auth.showError('fileInput', 'File upload failed');
        }
    }

    formatTime(date) {
        if (!(date instanceof Date)) date = new Date(date);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
        if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diff < 172800000) return 'Yesterday';
        return date.toLocaleDateString();
    }

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
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        if (this.chatMessages) {
            setTimeout(() => {
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            }, 100);
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
                Object.keys(this.messages).forEach(key => {
                    this.messages[key] = this.messages[key].map(msg => {
                        if (!msg.timestamp) msg.timestamp = new Date().toISOString();
                        return msg;
                    });
                });
            }
        } catch (e) {}
    }

    // Clean up on page unload
    cleanup() {
        this.updateUserStatus('offline');
        if (this.stompClient) {
            try {
                this.stompClient.disconnect();
            } catch(e) {}
        }
    }
}

// Initialize chat when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.chat-page')) {
        window.chatApp = new ChatApp();
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.chatApp) {
        window.chatApp.cleanup();
    }
});

window.ChatApp = ChatApp;