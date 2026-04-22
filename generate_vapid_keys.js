const crypto = require('crypto');

const keyPair = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
});

const privateKeyPem = keyPair.privateKey.export({
  type: 'pkcs8',
  format: 'pem'
});

const publicKey = crypto.createPublicKey(keyPair.privateKey);

const publicKeyDer = publicKey.export({
  type: 'spki',
  format: 'der'
});

const vapidPublicKeyBytes = publicKeyDer.slice(-65);
const vapidPublicKey = vapidPublicKeyBytes.toString('base64url');

console.log('=======================================');
console.log('Generated VAPID Keys:');
console.log('');
console.log('Public Key (Url Safe Base64):');
console.log(vapidPublicKey);
console.log('');
console.log('---');
console.log('');
console.log('Private Key (PEM):');
console.log(privateKeyPem);
console.log('=======================================');
