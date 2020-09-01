import axios from 'axios';
import { htmlToElement } from './utils';
import { getMessagesWith } from './getMessagesWith';

export const getAllConversations = async (conversationsArea, msgArea) => {
  const res = await axios({
    method: 'GET',
    url: `/api/v1/messages/conversations`
  });

  let side, contactData;
  const { conversations, user } = res.data.data;

  conversationsArea.innerHTML = '';
  conversations.forEach((conversation) => {
    if (conversation.user1._id === user) {
      contactData = conversation.user2;
    } else {
      contactData = conversation.user1;
    }
    side = ` <li>
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

    side = htmlToElement(side);
    // console.log(contactData);

    conversationsArea.insertAdjacentElement('beforeend', side);
  });

  return conversations;
};
