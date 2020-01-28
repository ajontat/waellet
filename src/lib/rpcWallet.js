import { DEFAULT_NETWORK, networks } from '../popup/utils/constants'
import { stringifyForStorage, parseFromStorage, extractHostName, getAeppAccountPermission, getUniqueId } from '../popup/utils/helper'
import { getAccounts } from '../popup/utils/storage'
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory'
import { RpcWallet } from '@aeternity/aepp-sdk/es/ae/wallet'
import BrowserRuntimeConnection
  from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime'
import Node from '@aeternity/aepp-sdk/es/node'
import { detectBrowser } from '../popup/utils/helper'

global.browser = require('webextension-polyfill');

const rpcWallet = {
    sdk: null,
    network: DEFAULT_NETWORK,
    compiler: networks[DEFAULT_NETWORK].compilerUrl,
    internalUrl: networks[DEFAULT_NETWORK].internalUrl,
    activeAccount: null,
    subaccounts: null,
    accounts: [],
    accountKeyPairs: [],
    created: false,
    createInterval: null,
    controller: null,
    async init(walletController) {
        this.controller = walletController
        let { subaccounts } = await getAccounts()
        this.subaccounts = subaccounts

        this.createInterval = setInterval(async () => {
            if(this.controller.isLoggedIn()) {
                if(!this.created) {
                    this.recreateWallet()
                    clearInterval(this.createInterval)
                }
                this.created = true
            }
        }, 5000)
    },
    async createWallet() {
        this.accountKeyPairs = await Promise.all(this.subaccounts.map(async (a, index) => (
            parseFromStorage(await this.controller.getKeypair({ activeAccount: index, account: a}))
        )))
        
        let activeIdx = await browser.storage.local.get('activeAccount') 
        
        this.accounts = this.accountKeyPairs.map((a) => {
            return MemoryAccount({
                keypair: a
            })
        })
        const context = this
        try {
            const node = await Node({ url: this.internalUrl, internalUrl: this.internalUrl })
            this.sdk  = await RpcWallet({
                nodes: [
                    { name: DEFAULT_NETWORK, instance: node },
                ],
                compilerUrl: this.compiler,
                name: 'Waellet',
                accounts:this.accounts,
                async onConnection (aepp, action) {
                    context.checkAeppPermissions(aepp, action, "connection")
                },
                onDisconnect (msg, client) {
                    client.disconnect()
                },
                async onSubscription (aepp, action) {
                    context.checkAeppPermissions(aepp, action, "subscription")
                },
                async onSign (aepp, action) {
                    context.checkAeppPermissions(aepp, action, "sign", () => {
                        setTimeout(() => {
                            context.showPopup({ aepp, action, type: "sign" })
                        }, 2000)
                        
                    })
                },
                onAskAccounts (aepp, action) {
                    context.checkAeppPermissions(aepp, action, "accounts", () => {
                        setTimeout(() => {
                            context.showPopup({ aepp, action, type: "askAccounts" })
                        }, 2000)
                    })
                }
            })

            if (activeIdx.hasOwnProperty("activeAccount") && !isNaN(activeIdx.activeAccount)) {
                this.sdk.selectAccount(this.accountKeyPairs[activeIdx.activeAccount].publicKey)
                this.activeAccount = this.accountKeyPairs[activeIdx.activeAccount].publicKey
            } else {
                this.sdk.selectAccount(this.accountKeyPairs[0].publicKey)
                this.activeAccount = this.accountKeyPairs[0].publicKey
            }

        } catch(e) {
            console.error(e)
        }
        return this.sdk
    },
    sdkReady(cb) {
        let check = setInterval(() => {
            if(this.sdk) {
                cb()
                clearInterval(check)
            }
        },1000)
        return check
    },
    async checkAeppPermissions (aepp, action, caller, cb )  {
        let { connection: { port: {  sender: { url } } } } = aepp
        let isConnected = await getAeppAccountPermission(extractHostName(url), this.activeAccount)
        if(!isConnected) {
            try {
                let a = caller == "connection" ? action : {}
                let res = await this.showPopup({ action: a, aepp, type: "connectConfirm" })
                if(typeof cb != "undefined") {
                    cb()
                }
            } catch(e) {
                
            }
        } else {
            if (typeof cb == "undefined") {
                action.accept()
            } else {
                cb()
            }
        }
    },

    showPopup ({ action, aepp, type = "connectConfirm" })  {
        const uid = getUniqueId()
        const time = `${Math.floor(Date.now() / 1000)}${uid}`
        const popupWindow = window.open(`/popup/popup.html?t=${time}`, `popup_id_${time}`, 'width=420,height=680', false);
        if (!popupWindow) action.deny()
        let { connection: { port: {  sender: { url } } }, info: { icons, name} } = aepp
        let { protocol } = new URL (url)
        return new Promise((resolve, reject) => {
            popupWindow.window.props = { type, resolve, reject, action, host: extractHostName(url), icons, name, protocol };
        });
    },

    async addConnection(port) {
        const connection = await BrowserRuntimeConnection({ connectionInfo: { id: port.sender.frameId }, port })
        this.sdk.addRpcClient(connection)
        this.sdk.shareWalletInfo(port.postMessage.bind(port))
        setTimeout(() => this.sdk.shareWalletInfo(port.postMessage.bind(port)), 3000)
    },
    getClientsByCond(condition) {
        const clients = Array.from(
            this.sdk.getClients().clients.values()
        )
        .filter(condition)
        return clients
    },
    getAccessForAddress(address) {
        const clients = this.getClientsByCond((client) => client.isConnected())
        const context = this
        clients.forEach(async (client) => {
            let { connection: { port: {  sender: { url } } } } = client
            let isConnected = await getAeppAccountPermission(extractHostName(url), address)
            if (!isConnected) {
                let accept = await this.showPopup({ action: { }, aepp:client, type: "connectConfirm" })
                if(accept) {
                    this.sdk.selectAccount(address)
                }
            } else {
                this.sdk.selectAccount(address)
            }
        })
    },
    changeAccount(payload) {
        this.activeAccount = payload
        this.getAccessForAddress(payload)
        // this.sdk.selectAccount(payload)
    },
    async addAccount(payload) {
        let account = {
            publicKey: payload.address
        }
        let newAccount =  MemoryAccount({
            keypair: parseFromStorage(await this.controller.getKeypair({ activeAccount: payload.idx, account }))
        })
        this.sdk.addAccount(newAccount)
        this.activeAccount = payload.address
        this.getAccessForAddress(payload.address)
    },
    async switchNetwork(payload) {
        this.network = payload
        this.compiler = networks[this.network].compilerUrl
        this.internalUrl = networks[this.network].internalUrl
        const node = await Node({ url:this.internalUrl, internalUrl: this.internalUrl })
        try {
            await this.sdk.addNode(payload, node, true)
        } catch(e) {
            // console.log(e)
        }
        this.sdk.selectNode(this.network)
    },

    async recreateWallet() {
        await this.createWallet()
    }
}

export default rpcWallet