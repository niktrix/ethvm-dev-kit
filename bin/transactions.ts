import * as EthereumTx from 'ethereumjs-tx'

export class Transaction{
  r:any;
  ora:any;

  constructor(RPCClient:any,Ora:any){
    this.r = RPCClient;
    this.ora = Ora
  }

  randomize(txParams:any,privateKey:any,count:number) : Promise<any>{
    return new Promise((resolve, reject) => {
      this.r.call('eth_getTransactionCount',[txParams.from, 'latest'],(e: Error, res: any): void => {
        txParams.nonce = res + count
        console.log(res)
        const tx = new EthereumTx(txParams)
        tx.sign(privateKey)
        const serializedTx = '0x' + tx.serialize().toString('hex')
        this.r.call('eth_sendRawTransaction',  [serializedTx], (e: Error, res: any): void => {
          if (e) {
            reject(e)
            return
          }
          resolve(res)
        })
      })
    })
  }


}

