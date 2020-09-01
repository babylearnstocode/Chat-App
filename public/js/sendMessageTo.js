import axios from 'axios';

export const sendMessageTo = async (msg, contact) => {
  const res = await axios({
    method: 'POST',
    url: `/api/v1/messages/with/${contact}`,
    data: {
      message: msg
    }
  });

  return res;
};
