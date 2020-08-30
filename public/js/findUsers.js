import axios from 'axios';
import { htmlToElement } from './utils';

export const findUsers = async (arg, contactsBody) => {
  const res = await axios({
    method: 'POST',
    url: `/api/v1/users/search`,
    data: {
      input: arg
    }
  });

  let searchResults = res.data.data.users;
  let searchTemplate = '';
  if (arg !== '') {
    searchResults.forEach((user) => {
      searchTemplate += `<li>
    <div class='d-flex bd-highlight contactCard' data-contact='${JSON.stringify(
      user
    )}' )>
        <div class='img_cont'>
          <img class='rounded-circle user_img' src='/img/avatars/${user.photo}'>
          <span class='online_icon'> </span>
        </div>

        <div class='user_info'>
          <span>${user.name} </span>
        </div>
    </div>
    </li>`;
    });
  }
  searchTemplate = htmlToElement(`<ul> ${searchTemplate} </ul>`);
  contactsBody.replaceChild(searchTemplate, contactsBody.firstChild);

  return;
};
