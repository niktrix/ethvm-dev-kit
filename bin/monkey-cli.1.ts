#!/usr/bin/env node

// Source in progress (everything is harcoded, so don't use it blindly)
// TODO: Support custom params to allow having different address, different number of txs and many more

import * as commander from 'commander'
import * as Ora from 'ora'
import * as EthereumTx from 'ethereumjs-tx'
import * as rpc from '@enkrypt.io/json-rpc2'
import * as EthUtil from 'ethereumjs-util'
import { Tx } from '../server/src/models/Tx';
const  data = require( "./ganacheacc.json")
let abi = require('ethereumjs-abi')

let encoded = abi.simpleEncode( "balanceOf(address):(uint256)", "0x0000000000000000000000000000000000000000" )

let accounts = data.accounts
let from = data.from.address
let fromprivatekey = data.from.key
let tokencontract = data.tokencontract
let contractaddress;


const version = '0.1.0'

const ora = new Ora({
  spinner: 'dots',
  color: 'yellow'
})

const r = rpc.Client.$create(7545, 'localhost')
declare const Buffer

let txParams = {
  from: from,
  to: '0x53d5f815e1ffb43297cdDf1E4C94950ae464c912',
  nonce: '0x00',
  gas: '0x7B0C',
  data: null,
  gasPrice: '0x000000001',
  value: '0x1'
}

commander.description('Ethereum utility that helps to create random txs to aid in development').version(version, '-v, --version')

class Transaction{
  r:any;
  ora:any;
  constructor(RPCClient:any, Ora:any){
    this.r = RPCClient;
    this.ora = Ora
  }
  send(txParams:any, privateKey:Buffer, count:number) : Promise<any>{
    let contractaddress;
    return new Promise((resolve, reject) => {
      this.r.call('eth_getTransactionCount',[txParams.from, 'latest'],(e: Error, res: any): void => {
        let nonce = parseInt(res)
        txParams.nonce = "0x"+nonce.toString(16);
        contractaddress = EthUtil.generateAddress(EthUtil.toBuffer(txParams.from), EthUtil.toBuffer(txParams.nonce))
        const tx = new EthereumTx(txParams)
        tx.sign(privateKey)
        const serializedTx = '0x' + tx.serialize().toString('hex')
        this.r.call('eth_sendRawTransaction',  [serializedTx], (e: Error, res: any): void => {
          if (e) {
            reject(e)
            return
          }
          resolve({"res":res,"contractaddress":EthUtil.bufferToHex(contractaddress)})
        })
      })
    })
  }

  ethcall(txParams:any, privateKey:Buffer, count:number) : Promise<any>{
    let contractaddress;
    txParams.nonce = null
    return new Promise((resolve, reject) => {
      this.r.call('eth_call',  [txParams,"latest"], (e: Error, res: any): void => {
        if (e) {
          reject(e)
          return
        }
        resolve({"res":res})
      })

    })
  }
}


let t = new Transaction(r, ora);
commander
  .command('run')
  .alias('r')
  .action(function() {
    ora.text = 'Randomizing txs...'
    ora.start()

    fillandsend(txParams,accounts,t,ora)
  })

  commander
  .command('fill')
  .alias('r')
  .action(function() {
    ora.text = 'Randomizing txs...'
    ora.start()
    fillAccountsWithEther(txParams,accounts,t,ora)
  })

  commander
  .command('deploy')
  .alias('d')
  .action(function() {
    ora.text = 'Randomizing txs...'
    ora.start()
    contractTxs(txParams,accounts,t,ora)
  })

  commander
  .command('balance')
  .alias('b')
  .action(function(address) {
    ora.text = 'getting bal of ' + address
    ora.start()
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

commander.parse(process.argv)

 async function fillAccountsWithEther(txParams,accounts,t,ora) : Promise<any>{
     for (let account of accounts) {
      txParams.to = account.address
      txParams.value = '0x2000000000000000'
      let privateKey = Buffer.from(fromprivatekey, 'hex')
      try {
        ora.info('sending tx')
        let done = await t.send(txParams, privateKey, 0)
        ora.info(`${JSON.stringify(done)}`);
        ora.info('sent tx')
      } catch (error) {
        ora.fail(`${JSON.stringify(error)}`);
      }
  }
    ora.succeed('Filled all accounts with ether  ')
    ora.stopAndPersist()
    return Promise.resolve()
}

async function sendRandomTX(txParams, accounts, t, ora) : Promise<any>{
  let i =0;
  while (i < 20) {
    let to = Math.floor(Math.random() * (accounts.length-1))
    let from = Math.floor(Math.random() * (accounts.length-1))
    txParams.to = accounts[to].address
    txParams.from = accounts[from].address
    let privateKey = Buffer.from(accounts[from].key, 'hex')
    try {
      ora.info('sending tx to ')
      ora.info(`${JSON.stringify(txParams.to)}`);
      let done = await t.send(txParams, privateKey, 0)
      ora.info('txhash')
      ora.info(`${JSON.stringify(done.res)}`);
    } catch (error) {
      ora.fail(`${JSON.stringify(error)}`);
    }
    i++;
   }
   ora.succeed('sent Random txs   ' , accounts.length-1)
   ora.stopAndPersist()
  return Promise.resolve()
}

async function fillandsend(txParams,accounts,t,ora) : Promise<any>{
  let balance = await checkBalance(txParams.from)
  ora.info("balance")
  ora.info(balance)
  if(parseInt(balance, 16) > 1000000000000000000){
    await fillAccountsWithEther(txParams,accounts,t,ora)
    await sendRandomTX(txParams,accounts,t,ora)
   // await contractTxs(txParams,accounts,t,ora)
    return Promise.resolve()
  }
  ora.warn("Not enough balance in from Account, Fill atleast 100 ETH")
}

async function contractTxs(txParams,accounts,t,ora) : Promise<any>{
  let privateKey = Buffer.from(fromprivatekey, 'hex')
  txParams.to = null;
  txParams.value =null;
  txParams.data = tokencontract.data;
  txParams.gas = "0x47B760"
  try {
    ora.info('deploying contract ')
    let done = await t.send(txParams, privateKey, 0)
    ora.info('contractaddress')
    ora.info(`${JSON.stringify(done.contractaddress)}`);
    contractaddress = done.contractaddress;
     } catch (error) {
    ora.fail(`${JSON.stringify(error)}`);
  }
  txParams.to = contractaddress;
  txParams.value =null;
  txParams.gas = "0x47B760"
  // send token to all accounts
  for (let account of accounts) {
    txParams.data = EthUtil.bufferToHex(abi.simpleEncode( "transfer(address,uint256):(bool)", account.address , 6000 ));
      try {
        ora.info('calling transfer ')
        ora.info(`${JSON.stringify(txParams)}`);
        let done = await t.send(txParams, privateKey, 0)
        ora.info('txhash')
        ora.info(`${JSON.stringify(done.res)}`);
        } catch (error) {
        ora.fail(`${JSON.stringify(error)}`);
      }
  }
  return Promise.resolve()
}

async function checkBalance(addr) : Promise<any>{
  return new Promise((resolve, reject) => {
    r.call('eth_getBalance',  [addr,"latest"], (e: Error, res: any): void => {
    if (e) {
      reject(e)
    }
     resolve(res)
  })
 })
}

async function txDetails(txhash) : Promise<any>{
  return new Promise((resolve, reject) => {
    r.call('eth_getTransactionByHash',  [txhash], (e: Error, res: any): void => {
    if (e) {
      reject(e)
    }
     resolve(res)
  })
 })
}

  // get token balance
  // txParams.data = EthUtil.bufferToHex(abi.simpleEncode( "balanceOf(address):(uint256)", txParams.to ));
  // try {
  //   ora.info('calling contract ')
  //   ora.info(`${JSON.stringify(txParams)}`);

  //   let done = await t.ethcall(txParams, privateKey, 0)
  //   ora.info('txhash')
  //   ora.info(`${JSON.stringify(done)}`);
  //    } catch (error) {
  //   ora.fail(`${JSON.stringify(error)}`);
  // }
