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

const conversationsArea = document.querySelector('.contacts');
const logoutButton = document.querySelector('.logoutBtn');
const searchInput = document.querySelector('.search');
const contactsBody = document.querySelector('.contacts_body');

//Delication
let currentUser;
let contactUser;

if (contactsBody) {
  currentUser = JSON.parse(contactsBody.dataset.currentUser);
  setInterval(async () => {
    const conversations = await getAllConversations(
      conversationsArea,
      messageArea
    );
    contactsEvent();

    //Join new logged user to every rooms
    socket.emit('join', conversations);
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

const contactsEvent = () => {
  if (contactCards) {
    const contactCardsArray = [...contactCards];
    contactCardsArray.forEach((card) => {
      card.addEventListener('click', async () => {
        let contactData = JSON.parse(card.dataset.contact);
        contactUser = contactData;

        await getMessagesWith(contactData, messageArea);

        const messageForm = document.querySelector('.form--message');
        const messageInput = document.getElementById('inputMessage');
        if (messageForm && messageInput) {
          const contactId = messageForm.dataset.contactId;

          messageForm.addEventListener('submit', async (e) => {
            if (messageInput.value !== '') {
              e.preventDefault();
              const resMessage = await sendMessageTo(
                messageInput.value,
                contactId
              );
              const conversation = resMessage.data.data.returnedConversation;
              const msg = resMessage.data.data.newMessage;
              socket.emit('chat message from client', conversation, msg);
              messageInput.value = '';
            }
          });
          messageInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && messageInput.value !== '') {
              e.preventDefault();

              const resMessage = await sendMessageTo(
                messageInput.value,
                contactId
              );
              const conversation = resMessage.data.data.returnedConversation;
              const msg = resMessage.data.data.newMessage;

              socket.emit('chat message from client', conversation, msg);
              messageInput.value = '';
            }
          });
        }
      });
    });
  }
};
contactsEvent();

if (searchInput) {
  searchInput.addEventListener('keyup', async (e) => {
    await findUsers(e.target.value, contactsBody, messageArea);
    contactsEvent();
  });
}

//Socket io events

//Send messages to server

window.addEventListener('beforeunload', () => {
  socket.close();
});

//Receiver and handler socket from server
if (conversationsArea && messageArea) {
  socket.on('chat message from server', async (message) => {
    let body;

    if (
      message.sendTo._id === contactUser._id ||
      message.sender._id === contactUser._id
    ) {
      if (message.sender._id !== currentUser._id) {
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

      messageArea.childNodes[1].insertAdjacentHTML('beforeend', body);
      await getAllConversations(conversationsArea, currentUser);
    }
  });
}
