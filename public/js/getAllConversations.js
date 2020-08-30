import axios from 'axios';
import { htmlToElement } from './utils';

export const getAllConversations = async (conversationsArea, currentUser) => {
  const res = await axios({
    method: 'GET',
    url: `/api/v1/messages/conversations`
  });

  let side, contactData;
  const conversations = res.data.data;

  conversationsArea.innerHTML = '';
  conversations.forEach((conversation) => {
    if (conversation.user1._id === currentUser._id) {
      contactData = conversation.user2;
    } else {
      contactData = conversation.user1;
    }
    side = ` <li id=${conversation._id}>
      <div class='d-flex bd-highlight contactCard' data-contact='${JSON.stringify(
        contactData
      )}' data-conversation='${JSON.stringify(conversation)}')>
          <div class='img_cont'> 
            <img class='rounded-circle user_img' src='/img/avatars/${
              contactData.photo
            }'>
            <span class='online_icon'> </span>
          </div>
  
          <div class='user_info'> 
            <span>${contactData.name} </span>
            <p>${conversation.message} </p>
          </div>
      </div>
      </li>`;
    conversationsArea.insertAdjacentHTML('beforeend', side);
  });

  return res;
};
