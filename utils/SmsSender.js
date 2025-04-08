// utils/smsSender.js
const coolsms = require('coolsms-node-sdk').default;

const messageService = new coolsms(
  process.env.COOLSMS_API_KEY,
  process.env.COOLSMS_API_SECRET
);

exports.sendSMS = async ({ to, text }) => {
  try {
    const response = await messageService.sendOne({
      to,
      from: process.env.COOLSMS_SENDER_NUMBER,
      text,
    });
    console.log('문자 발송 완료:', response);
    return response;
  } catch (error) {
    console.error('문자 발송 실패:', error.message);
    throw new Error('SMS 발송 실패');
  }
};
