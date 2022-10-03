const crypto = require('crypto');

require("dotenv").config();

// Getting initialization vector
const getIV = () => {
    const resizedIV = Buffer.allocUnsafe(16);
    const iv = crypto.createHash('sha256').update(process.env.ENCRYPT_IV).digest();
    iv.copy(resizedIV);
    return resizedIV;
}

exports.encrypt = (data, secretKey) => {
    const key = crypto.createHash('sha256').update(secretKey).digest();
    const cipher = crypto.createCipheriv('aes256', key, this.getIV());

    // Encrypting data
    let encryptedData = cipher.update(data);

    // Combining with the last chunk of encoded information
    encryptedData = Buffer.concat([encryptedData, cipher.final()]);

    return encryptedData.toString('hex');
}

exports.decrypt = (data, secretKey) => {
    const key = crypto.createHash('sha256').update(secretKey).digest();
    const decipher = crypto.createDecipheriv('aes256', key, this.getIV());
    const encryptedData = Buffer.from(data, 'hex');

    // Encrypting data
    let decryptedData = decipher.update(encryptedData);

    // Combining with the last chunk of encoded information
    decryptedData = Buffer.concat([decryptedData, decipher.final()]);

    return decryptedData.toString();
}