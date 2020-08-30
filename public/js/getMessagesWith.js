import axios from 'axios';
import { htmlToElement } from './utils';

export const getMessagesWith = async (contact, msgArea) => {
  const res = await axios({
    method: 'GET',
    url: `/api/v1/messages/with/${contact._id}`
  });

  let head = `<div class="card-header msg_head">
  <div class="d-flex bd-highlight">
    <div class="img_cont">
      <img class="rounded-circle user_img" src="/img/avatars/${contact.photo}" alt="" />
      <span class="online_icon"></span>
    </div>
    <div class="user_info">
      <span>${contact.name}</span>
      <p>Online</p>
    </div>
  </div>

</div>`;

  let body;
  msgArea.childNodes[1].innerHTML = '';

  head = htmlToElement(head);
  msgArea.replaceChild(head, msgArea.childNodes[0]);

  res.data.data.forEach((msg) => {
    if (msg.sender._id === contact._id) {
      body = ` <div class="d-flex justify-content-start mb-4">
      <div class="img_cont_msg">
        <img class="rounded-circle user_img_msg" src="/img/avatars/${msg.sender.photo}" alt="" />
        </div>
        <div class="msg_container">
          ${msg.message}
          <span class="msg_time"> </span>
      </div>
    </div>`;
    } else {
      body = ` <div class="d-flex justify-content-end mb-4">
  <div class="msg_container_send">
    ${msg.message}
    <span class="msg_time_send"></span>
  </div>
  <div class="img_cont_msg">
    <img class="rounded-circle user_img_msg" src="/img/avatars/${msg.sender.photo}" alt="" />
  </div>
</div>`;
    }
    msgArea.childNodes[1].insertAdjacentHTML('afterbegin', body);
  });
};
