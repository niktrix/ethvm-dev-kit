#!/usr/bin/env node

import * as rpc from '@enkrypt.io/json-rpc2'
import * as commander from 'commander'
import * as EthereumTx from 'ethereumjs-tx'
import * as Ora from 'ora'

const version = '0.1.0'

const ora = new Ora({
  spinner: 'dots',
  color: 'yellow'
})

const r = rpc.Client.$create(9545, 'localhost')

commander.description('Ethereum utility that helps to create random txs to aid in development').version(version, '-v, --version')

commander
  .command('run')
  .alias('r')
  .action(() => {
    ora.text = 'Randomizing txs...'
    ora.start()

    const privateKey = Buffer.from('577b57b339118ec72b2bf69dad1840296b11ff4333ae0de704888cd346f7eadd', 'hex')

    const txParams = {
      from: '0xaD4A113E28C7857dB9f24336e4ED83F6dd883DF7',
      to: '0xd46e8dd67c5d32be8058bb8eb970870f07244567',
      nonce: '0x00',
      gas: '0x05',
      gasPrice: '0x00009184e',
      value: '0x0000000000000000010'
    }

    const tx = new EthereumTx(txParams)
    tx.sign(privateKey)

    const serializedTx = '0x' + tx.serialize().toString('hex')

    r.call(
      'eth_sendRawTransaction',
      [serializedTx],
      (e: Error, res: any): void => {
        if (e) {
          ora.clear()
          ora.fail(`${JSON.stringify(e)}`)
          ora.stopAndPersist()
          return
        }

        ora.succeed('Txs sent!')
        ora.stopAndPersist()
      }
    )
  })

commander.parse(process.argv)
