const socket = io();

// DOM Elements
const usernameScreen = document.getElementById('usernameScreen');
const roomOptionsScreen = document.getElementById('roomOptionsScreen');
const chatScreen = document.getElementById('chatScreen');
const usernameInput = document.getElementById('usernameInput');
const continueBtn = document.getElementById('continueBtn');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomIdInput = document.getElementById('roomIdInput');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const messagesDiv = document.getElementById('messages');
const usernameDisplay = document.getElementById('usernameDisplay');
const chatUsernameDisplay = document.getElementById('chatUsernameDisplay');
const roomIdDisplay = document.getElementById('roomIdDisplay');
const roomCreator = document.getElementById('roomCreator');
const userCount = document.getElementById('userCount');

let currentUsername = '';
let currentRoomId = '';

// Event Listeners
continueBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
        currentUsername = username;
        usernameDisplay.textContent = username;
        usernameScreen.classList.add('hidden');
        roomOptionsScreen.classList.remove('hidden');
    }
});

createRoomBtn.addEventListener('click', () => {
    socket.emit('createRoom', currentUsername);
});

joinRoomBtn.addEventListener('click', () => {
    const roomId = roomIdInput.value.trim();
    if (roomId) {
        socket.emit('joinRoom', { roomId, username: currentUsername });
    }
});

sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Socket Events
socket.on('roomCreated', ({ roomId, username }) => {
    currentRoomId = roomId;
    showChatScreen(roomId, username);
    addSystemMessage(`${roomId}`);
});

socket.on('roomJoined', ({ roomId, username }) => {
    currentRoomId = roomId;
    showChatScreen(roomId, username);
    addSystemMessage(`You joined the room!`);
});

socket.on('error', (message) => {
    alert(message);
});

socket.on('message', ({ username, message, time }) => {
    addMessage(username, message, time);
});

socket.on('userJoined', ({ username, users }) => {
    addSystemMessage(`${username} joined the room`);
    updateUserCount(users.length);
});

socket.on('userLeft', ({ username, users }) => {
    addSystemMessage(`${username} left the room`);
    updateUserCount(users.length);
});

// Helper Functions
function sendMessage() {
    const message = messageInput.value.trim();
    if (message && currentRoomId) {
        socket.emit('sendMessage', {
            roomId: currentRoomId,
            message,
            username: currentUsername
        });
        messageInput.value = '';
    }
}

function showChatScreen(roomId, username) {
    roomOptionsScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    roomIdDisplay.textContent = roomId;
    chatUsernameDisplay.textContent = username;
    roomCreator.textContent = username;
}

function addMessage(username, message, time) {
    const messageElement = document.createElement('div');
    messageElement.className = 'flex flex-col space-y-1';
    
    const isCurrentUser = username === currentUsername;
    const messageClass = isCurrentUser ? 'bg-blue-600 ml-auto' : 'bg-gray-700';
    
    messageElement.innerHTML = `
        <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-400">${time}</span>
            <span class="font-bold ${isCurrentUser ? 'text-blue-300' : 'text-green-300'}">${username}</span>
        </div>
        <div class="${messageClass} rounded-lg px-4 py-2 max-w-[70%] ${isCurrentUser ? 'rounded-tr-none' : 'rounded-tl-none'}">
            ${message}
        </div>
    `;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'text-center text-gray-400 text-sm py-2';
    messageElement.textContent = message;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateUserCount(count) {
    userCount.textContent = count;
} 