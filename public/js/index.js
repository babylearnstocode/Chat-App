import { login, signup, logout } from './login';
import '@babel/polyfill';
import { getMessagesWith } from './getMessagesWith';
import { sendMessageTo } from './sendMessageTo';
import { findUsers } from './findUsers';
import { getAllConversations } from './getAllConversations';

//socket connection
const socket = io();
//DOM elements
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const contactCards = document.getElementsByClassName('contactCard');
const messageArea = document.querySelector('.msg_area');
const messageForm = document.querySelector('.form--message');
const messageInput = document.getElementById('inputMessage');
const conversationsArea = document.querySelector('.contacts');
const logoutButton = document.querySelector('.logoutBtn');
const searchInput = document.querySelector('.search');
const contactsBody = document.querySelector('.contacts_body');

//Delication
let conversation;
let contactData;
let currentUser;
if (contactsBody) {
  currentUser = JSON.parse(contactsBody.dataset.currentUser);
  setInterval(async () => {
    await getAllConversations(conversationsArea, currentUser);
    contactsRender();
  }, 2000);
}
if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('inputEmail').value;
    const password = document.getElementById('inputPassword').value;
    login(email, password);
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('inputName').value;
    const email = document.getElementById('inputEmail').value;
    const password = document.getElementById('inputPassword').value;
    const passwordConfirm = document.getElementById('confirmPassword').value;
    signup(name, email, password, passwordConfirm);
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', logout);
}

const contactsRender = () => {
  if (contactCards) {
    const contactCardsArray = [...contactCards];
    contactCardsArray.forEach((card) => {
      card.addEventListener('click', async () => {
        if (card.dataset.conversation) {
          conversation = JSON.parse(card.dataset.conversation);
        }
        contactData = JSON.parse(card.dataset.contact);

        await getMessagesWith(contactData, messageArea);
      });
    });
  }
};

if (searchInput) {
  searchInput.addEventListener('keyup', async (e) => {
    await findUsers(e.target.value, contactsBody);
    contactsRender();
  });
}

contactsRender();

//Socket io events

//Send messages to server
if (messageForm && messageInput) {
  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    socket.emit('chat message from client', conversation, messageInput.value);
    messageInput.value = '';
  });

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      socket.emit('chat message from client', conversation, messageInput.value);
      messageInput.value = '';
    }
  });
}
window.addEventListener('beforeunload', () => {
  socket.close();
});

//Receiver and handler socket from server
if (conversationsArea) {
  socket.on('chat message from server', async (msg) => {
    const resMessage = await sendMessageTo(msg, contactData);
    await getAllConversations(conversationsArea, currentUser);
    const message = resMessage.data.data;

    let body;
    if (message.sender === contactData._id) {
      body = ` <div class="d-flex justify-content-start mb-4">
          <div class="img_cont_msg">
            <img class="rounded-circle user_img_msg" src="/img/avatars/${message.sender.photo}" alt="" />
            </div>
            <div class="msg_container">
              ${message.message}
              <span class="msg_time"> </span>
          </div>
        </div>`;
    } else {
      body = ` <div class="d-flex justify-content-end mb-4">
      <div class="msg_container_send">
        ${message.message}
        <span class="msg_time_send"></span>
      </div>
      <div class="img_cont_msg">
        <img class="rounded-circle user_img_msg" src="/img/avatars/${message.sender.photo}" alt="" />
      </div>
    </div>`;
    }

    contactsRender();

    messageArea.childNodes[1].insertAdjacentHTML('beforeend', body);
  });
}
