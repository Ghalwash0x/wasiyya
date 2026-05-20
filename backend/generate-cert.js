const fs = require('fs');
const path = require('path');
const certsDir = path.join(__dirname, 'certs');

const selfsigned = require('selfsigned');
const attrs = [{ name: 'commonName', value: 'localhost' }];

Promise.resolve(selfsigned.generate(attrs, { days: 365, keySize: 2048 }))
    .then(pems => {
        const keyData  = pems.private || pems.key || pems.serviceKey;
        const certData = pems.cert    || pems.certificate;

        fs.writeFileSync(path.join(certsDir, 'server.key'),  keyData);
        fs.writeFileSync(path.join(certsDir, 'server.cert'), certData);
        console.log('✅ Certificate generated!');
    })
    .catch(err => console.error('ERROR:', err.message));
