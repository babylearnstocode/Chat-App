const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Message = require('../../models/messageModel');
const Conversation = require('../../models/conversationModel');

dotenv.config({ path: `./config.env` });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  // .connect(process.env.DATABASELOCAL, {
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB connection successful'));

//Delete from DB
const deleteData = async () => {
  try {
    await Message.deleteMany();
    await Conversation.deleteMany();

    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
