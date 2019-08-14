/* eslint-disable */
import { dump } from './keystore'
import * as Crypto from '@aeternity/aepp-sdk/es/utils/crypto'

export const addressGenerator = {
  generateKeyPair,
  importPrivateKey
}

export function printUnderscored (key, val) {
  print(`${key}${R.repeat('_', WIDTH - key.length).reduce((a, b) => a += b, '')} ${typeof val !== 'object' ? val : JSON.stringify(val)}`)
}


async function generateKeyPair (passphrase, privateKey) {
  const seedHexStr = await Crypto.hexStringToByte(privateKey.trim())
  const keypair = Crypto.generateKeyPairFromSecret(seedHexStr)
  const keystore = await dump('keystore', passphrase, Buffer.from(privateKey, 'hex'));
  keystore.public_key = "ak_"+Crypto.encodeBase58Check(keypair.publicKey)
  return {
    publicKey: keystore.public_key,
    encryptedPrivateKey: JSON.stringify(keystore)
  };
}

async function importPrivateKey (passphrase, privateKey) {
  const seedHexStr = await Crypto.hexStringToByte(privateKey.trim())
  const keypair = Crypto.generateKeyPairFromSecret(seedHexStr)
  const keystore = await dump('keystore', passphrase, seedHexStr);
  keystore.public_key = "ak_"+Crypto.encodeBase58Check(keypair.publicKey)
  return {
    publicKey: keystore.public_key,
    encryptedPrivateKey: JSON.stringify(keystore),
  };
}
