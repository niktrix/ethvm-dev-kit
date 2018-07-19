#!/usr/bin/env node

// Source in progress (everything is harcoded, so don't use it blindly)
// TODO: Support custom params to allow having different address, different number of txs and many more

import * as commander from 'commander'
import * as Ora from 'ora'
import * as EthereumTx from 'ethereumjs-tx'
import * as rpc from '@enkrypt.io/json-rpc2'
import { Tx } from '../server/src/models/Tx';
import { Transaction } from './transactions';
const  data = require( "./accounts.json")

const version = '0.1.0'

const ora = new Ora({
  spinner: 'dots',
  color: 'yellow'
})

const r = rpc.Client.$create(9545, 'localhost')
declare const Buffer

var txParams = {
  from: '0x84baaBAd835e6Ca9252658CD6Eae0152f6330C09',
  to: '0x53d5f815e1ffb43297cdDf1E4C94950ae464c912',
  nonce: '0x00',
  gas: '0x5208',
  gasPrice: '0x00009184e',
  value: '0x0000000001000000001'
}

commander.description('Ethereum utility that helps to create random txs to aid in development').version(version, '-v, --version')


var accounts = data.accounts

var t = new Transaction(r,ora);
commander
  .command('run')
  .alias('r')
  .action(function() {
    ora.text = 'Randomizing txs...'
    ora.start()
     for (var _i = 0; _i < 5; _i++) {
      var s = Math.floor(Math.random() * (accounts.length-1)) + 0
      txParams.to = accounts[s].address
      var privateKey = Buffer.from("c0191900e365a48547f29f3b50fa3913c0d6f1519288eab7fcbf54e33337e130", 'hex')
      t.randomize(txParams, privateKey)
     }
  })

  commander
  .command('fill')
  .alias('r')
  .action(function() {
    ora.text = 'Randomizing txs...'
    ora.start()
     randomTx(txParams,accounts,t,ora)
  })

  commander
  .command('balance')
  .alias('b')
  .action(function(address) {
    ora.text = 'getting bal of ' + address
    ora.start()
    const privateKey = Buffer.from('e2314951b1e26f5f24c99e1e410187325fe07659ef55affbd14992c1914b787e', 'hex')

    r.call('eth_getBalance',  [address,"latest"], (e: Error, res: any): void => {
      if (e) {
        ora.clear()
        ora.fail(`${JSON.stringify(e)}`)
        ora.stopAndPersist()
        return
      }
      ora.succeed('balabnce  !')
      ora.stopAndPersist()
    })
  })


 async function randomTx(txParams,accounts,t,ora){
    for (var _i = 0;  _i < accounts.length-1; _i++) {
      txParams.to = accounts[_i].address
      var privateKey = Buffer.from("c0191900e365a48547f29f3b50fa3913c0d6f1519288eab7fcbf54e33337e130", 'hex')
     try {
       ora.info('sending tx')
       var done = await t.randomize(txParams, privateKey)
      ora.info(`${JSON.stringify(done)}`);
    } catch (error) {
      ora.fail(`${JSON.stringify(error)}`);
    }
    ora.info('sent tx')
     }
    ora.succeed('generated   ' , accounts.length-1)
    ora.stopAndPersist()
  }
commander.parse(process.argv)
