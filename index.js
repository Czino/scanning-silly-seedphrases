import bip39 from 'bip39'
import * as bitcoin from 'bitcoinjs-lib'
import fetch from 'node-fetch'
import fs from 'fs'
import mnemonics from './silly-seedphrases.js'

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error.message);
});

const startingPoint = Number(process.argv[2] || 0)
const snooze = 3000
const gaplimit = 3
for (let sp = 0; sp < startingPoint; sp++) {
  mnemonics.shift()
}

const sleep = async ms => new Promise(resolve => setTimeout(resolve, ms))

fs.appendFileSync('status.txt', `\nRestart from ${startingPoint}\n`, {})

;(async () => {
  console.log('Scanning silly seed phrases')
  for (let m in mnemonics) {
    const mnemonic = mnemonics[m]
    let message = `\n${(new Date()).getTime()} Scanning: ${Number(m) + Number(startingPoint)} ${mnemonic}`
    console.log(message)
    fs.appendFileSync('status.txt', message, {})

    const seed = bip39.mnemonicToSeedSync(mnemonic)
    const wallet = bitcoin.bip32.fromSeed(seed)

    for (let i = 0; i < gaplimit; i++) {
      try {
        const p2wpkh = bitcoin.payments.p2wpkh({
          pubkey: wallet.derivePath(`m/84'/0'/0'/0/${i}`).publicKey,
        }).address

        let result = await fetch(`https://mempool.space/api/address/${p2wpkh}`)
        result = (await result.json()).chain_stats
        let hadUTXO = result.funded_txo_count > 0 && result.funded_txo_count - result.spent_txo_count === 0
        let hasUTXO = result.funded_txo_count - result.spent_txo_count > 0
        if (hadUTXO) {
          const message = `The seed phrase ${mnemonic} had coins at path m/84'/0'/0'/0/${i}. The address is ${p2wpkh} \n`
          console.log(message)
          fs.appendFileSync('hadcoins.txt', message, {})
        }
        if (hasUTXO) {
          const message = `The seed phrase ${mnemonic} has coins at path m/84'/0'/0'/0/${i}. The address is ${p2wpkh} \n`
          console.log(message)
          fs.appendFileSync('hascoins.txt', message, {})
        }
        await sleep(snooze)

        const p2pkh44 = bitcoin.payments.p2pkh({
          pubkey: wallet.derivePath(`m/44'/0'/0'/0/${i}`).publicKey,
        }).address

        result = await fetch(`https://mempool.space/api/address/${p2pkh44}`)
        result = await result.json()
        hadUTXO = result.funded_txo_count - result.spent_txo_count > 0
        hasUTXO = result.funded_txo_count - result.spent_txo_count > 0
        if (hadUTXO) {
          const message = `The seed phrase ${mnemonic} had coins at path m/44'/0'/0'/0/${i}. The address is ${p2pkh44} \n`
          console.log(message)
          fs.appendFileSync('hadcoins.txt', message, {})
        }
        if (hasUTXO) {
          const message = `The seed phrase ${mnemonic} has coins at path m/44'/0'/0'/0/${i}. The address is ${p2pkh44} \n`
          console.log(message)
          fs.appendFileSync('hascoins.txt', message, {})
        }
        await sleep(snooze)
        const p2pkh32 = bitcoin.payments.p2pkh({
          pubkey: wallet.derivePath(`m/0/${i}`).publicKey,
        }).address

        result = await fetch(`https://mempool.space/api/address/${p2pkh32}`)
        result = await result.json()
        hadUTXO = result.funded_txo_count > 0 && result.funded_txo_count - result.spent_txo_count === 0
        hasUTXO = result.funded_txo_count - result.spent_txo_count > 0
        if (hadUTXO) {
          const message = `The seed phrase ${mnemonic} had coins at path m/0/${i}. The address is ${p2pkh44} \n`
          console.log(message)
          fs.appendFileSync('hadcoins.txt', message, {})
        }
        if (hasUTXO) {
          const message = `The seed phrase ${mnemonic} has coins at path m/0/${i}. The address is ${p2pkh44} \n`
          console.log(message)
          fs.appendFileSync('hascoins.txt', message, {})
        }
        await sleep(snooze)
      } catch(e) {
        console.log(e)
        i--
        await sleep(snooze * 10)
      }
    }
  }
})()
