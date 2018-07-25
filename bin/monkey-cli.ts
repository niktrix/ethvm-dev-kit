#!/usr/bin/env node

import * as rpc from '@enkrypt.io/json-rpc2'
import commander from 'commander'
import * as abi  from 'ethereumjs-abi'
import  EthereumTx from 'ethereumjs-tx'
import * as EthUtil from 'ethereumjs-util'
import Ora from 'ora'
import data from  "./accounts.json"

const { accounts, tokencontract, from } = data
const version = '0.1.0'
const ora = new Ora({
  spinner: 'dots',
  color: 'yellow'
})
const r = rpc.Client.$create(7545, 'localhost')

interface Txp {
  from: string;
  to: string;
  nonce?: string;
  gas?: string;
  data?: any;
  gasPrice?: string;
  value?: string;
}

interface Result {
  res: string;
  contractAddress: string;
}

const txParams = {
  from: from.address,
  to: '0x53d5f815e1ffb43297cdDf1E4C94950ae464c912',
  nonce: '0x00',
  gas: '0x7B0C',
  data: null,
  gasPrice: '0x000000001',
  value: '0x1'
}

commander.description('Ethereum utility that helps to create random txs to aid in development').version(version, '-v, --version')

function send(txP:Txp, privateKey:Buffer) : Promise<Result>{
    let ca;
    return new Promise((resolve, reject) => {
      r.call('eth_getTransactionCount',[txP.from, 'latest'],(e: Error, res: any): void => {
        const nonce = parseInt(res)
        txP.nonce = "0x"+nonce.toString(16);
        ca = EthUtil.generateAddress(EthUtil.toBuffer(txP.from), EthUtil.toBuffer(txP.nonce))
        const tx = new EthereumTx(txP)
        tx.sign(privateKey)
        const serializedTx = '0x' + tx.serialize().toString('hex')
        r.call('eth_sendRawTransaction',  [serializedTx], (e: Error, res: any): void => {
          if (e) {
            reject(e)
            return
          }
          resolve({"res":res,"contractAddress":EthUtil.bufferToHex(ca)})
          return
        })
      })
    })
  }

  function ethcall(txParams:Txp) : Promise<any>{
    txParams.nonce = ''
    return new Promise((resolve, reject) => {
      r.call('eth_call',  [txParams,"latest"], (e: Error, res: any): void => {
        if (e) {
          reject(e)
          return
        }
        resolve({"res":res})
        return
      })
    })
  }

 async function fillAccountsWithEther(txParams:Txp) : Promise<any>{
     for (const account of accounts) {
      txParams.to = account.address
      txParams.value = '0x2000000000000000'
      const privateKey = Buffer.from(from.key, 'hex')
      try {
        ora.info(`sending ${txParams.value} wei  to   ${txParams.to}` )
        const done = await send(txParams, privateKey)
        ora.info(`Txhash ${JSON.stringify(done.res)}`);
       } catch (error) {
        ora.fail(JSON.stringify(error));
       }
  }
    ora.succeed('Filled all accounts with ether  ')
    ora.stopAndPersist()
    return Promise.resolve()
}

async function sendRandomTX(txParams:Txp) : Promise<any>{
  let i =0;
  while (i < 20) {
    const to = Math.floor(Math.random() * (accounts.length-1))
    const from = Math.floor(Math.random() * (accounts.length-1))
    txParams.to = accounts[to].address
    txParams.from = accounts[from].address
    const privateKey = Buffer.from(accounts[from].key, 'hex')
    try {
      ora.info(`sending tx to   ${JSON.stringify(txParams.to)}`)
      const done = await send(txParams, privateKey)
      ora.info(`txhash ${JSON.stringify(done.res)}`)
     } catch (error) {
      ora.fail(JSON.stringify(error));
     }
    i++;
   }
   ora.succeed('sent Random txs   ' + (accounts.length-1))
   ora.stopAndPersist()
  return Promise.resolve()
}

async function fillAndSend(txParams:Txp) : Promise<any>{
  const balance = await checkBalance(txParams.from)
  ora.info(`balance ${balance}`)
  if(parseInt(balance, 16) > 1000000000000000000){
    await fillAccountsWithEther(txParams)
    await sendRandomTX(txParams)
   // await contractTxs(txParams,accounts,t,ora)
    return Promise.resolve()
  }
  ora.warn('Not enough balance in Account, Fill at least 100 ETH')
}

async function contractTxs(txParams:Txp) : Promise<any>{
  const privateKey = Buffer.from(from.key, 'hex')
  let  contractAddress:string = ''
  txParams.to = '';
  txParams.value ='';
  txParams.data = tokencontract.data;
  txParams.gas = "0x47B760"
  try {
    ora.info('deploying contract ')
    const done = await send(txParams, privateKey)
    ora.info(`contractaddress ${done.contractAddress}`)
    contractAddress = done.contractAddress;
    } catch (error) {
    ora.fail(JSON.stringify(error));
  }
  txParams.to = contractAddress;
  txParams.value ='';
  txParams.gas = "0x47B760"
  // send token to all accounts
  for (const account of accounts) {
    txParams.data = EthUtil.bufferToHex(abi.simpleEncode( "transfer(address,uint256):(bool)", account.address , 6000 ));
      try {
        ora.info(`calling transfer of contract address  ${JSON.stringify(txParams.to)}`)
        const done = await send(txParams, privateKey)
        ora.info(`txhash ${JSON.stringify(done.res)}`)
        } catch (error) {
        ora.fail(JSON.stringify(error));
      }
  }
  return Promise.resolve()
}

async function checkBalance(addr) : Promise<any>{
  return new Promise((resolve, reject) => {
    r.call('eth_getBalance',  [addr,"latest"], (e: Error, res: any): void => {
    if (e) {
      reject(e)
      return
    }
     resolve(res)
     return
  })
 })
}

async function txDetails(txhash) : Promise<any>{
  return new Promise((resolve, reject) => {
    r.call('eth_getTransactionByHash',  [txhash], (e: Error, res: any): void => {
    if (e) {
      reject(e)
      return
    }
     resolve(res)
     return
  })
 })
}

commander
  .command('run')
  .alias('r')
  .action( () => {
    ora.text = 'Randomizing txs...'
    ora.start()
    fillAndSend(txParams)
  })

  commander
  .command('fill')
  .alias('r')
  .action(() => {
    ora.text = 'Fill accounts with ether ...'
    ora.start()
    fillAccountsWithEther(txParams)
  })

  commander
  .command('deploy')
  .alias('d')
  .action( () => {
    ora.text = 'Deploy token contract and send tokens to all account...'
    ora.start()
    contractTxs(txParams)
  })

  commander
  .command('balance')
  .alias('b')
  .action( (address) => {
    ora.text = 'getting bal of ' + address
    ora.start()
    r.call('eth_getBalance',  [address,"latest"], (e: Error, res: any): void => {
      if (e) {
        ora.clear()
        ora.fail(JSON.stringify(e))
        ora.stopAndPersist()
        return
      }
      ora.succeed('balabnce  !')
      ora.stopAndPersist()
    })
  })

commander.parse(process.argv)
