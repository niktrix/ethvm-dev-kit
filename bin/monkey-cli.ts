#!/usr/bin/env node

// Source in progress (everything is harcoded, so don't use it blindly)
// TODO: Support custom params to allow having different address, different number of txs and many more

import * as rpc from '@enkrypt.io/json-rpc2'
import commander from 'commander'
import * as abi  from 'ethereumjs-abi'
import  EthereumTx from 'ethereumjs-tx'
import * as EthUtil from 'ethereumjs-util'
import Ora from 'ora'
import data from  "./ganacheacc.json"

const accounts = data.accounts
const from = data.from.address
const fromprivatekey = data.from.key
const tokencontract = data.tokencontract


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
  res:string;
  contractaddress:string;
}

const txParams = {
  from,
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
          resolve({"res":res,"contractaddress":EthUtil.bufferToHex(ca)})
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
      const privateKey = Buffer.from(fromprivatekey, 'hex')
      try {
        ora.info('sending tx to ' + txParams.to)
        const done = await send(txParams, privateKey)
        ora.info('Txhash '+JSON.stringify(done.res));
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
      ora.info('sending tx to '+ JSON.stringify(txParams.to))
      const done = await send(txParams, privateKey)
      ora.info('txhash '+ JSON.stringify(done.res))
     } catch (error) {
      ora.fail(JSON.stringify(error));
     }
    i++;
   }
   ora.succeed('sent Random txs   ' + (accounts.length-1))
   ora.stopAndPersist()
  return Promise.resolve()
}

async function fillandsend(txParams:Txp) : Promise<any>{
  const balance = await checkBalance(txParams.from)
  ora.info("balance")
  ora.info(balance)
  if(parseInt(balance, 16) > 1000000000000000000){
    await fillAccountsWithEther(txParams)
    await sendRandomTX(txParams)
   // await contractTxs(txParams,accounts,t,ora)
    return Promise.resolve()
  }
  ora.warn("Not enough balance in from Account, Fill atleast 100 ETH")
}

async function contractTxs(txParams:Txp) : Promise<any>{
  const privateKey = Buffer.from(fromprivatekey, 'hex')
  let  contractaddress:string = ''
  txParams.to = '';
  txParams.value ='';
  txParams.data = tokencontract.data;
  txParams.gas = "0x47B760"
  try {
    ora.info('deploying contract ')
    const done = await send(txParams, privateKey)
    ora.info('contractaddress ', JSON.stringify(done.contractaddress))
    contractaddress = done.contractaddress;
    } catch (error) {
    ora.fail(JSON.stringify(error));
  }
  txParams.to = contractaddress;
  txParams.value ='';
  txParams.gas = "0x47B760"
  // send token to all accounts
  for (const account of accounts) {
    txParams.data = EthUtil.bufferToHex(abi.simpleEncode( "transfer(address,uint256):(bool)", account.address , 6000 ));
      try {
        ora.info('calling transfer ')
        ora.info(JSON.stringify(txParams));
        const done = await send(txParams, privateKey)
        ora.info('txhash ' + JSON.stringify(done.res))
        ora.info(JSON.stringify(done.res));
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
    fillandsend(txParams)
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
