import {onBeforeLoad} from '../support/mock_chrome.js';
import {login} from '../login';
const Ae = require('@aeternity/aepp-sdk').Universal;
import { FUNGIBLE_TOKEN_CONTRACT } from '../../../src/popup/utils/constants';
import { account, generateHdWallet, getHdWalletAccount } from '../utils';
import { initializeSDK } from '../../../src/popup/utils/helper';


const deployContract = async() => {
    
    return new Promise(async (resolve,reject) => {
        let wallet = generateHdWallet(account.secretKey);
        let acc = {
            publicKey:account.publicKey,
            secretKey:getHdWalletAccount(wallet, 0).secretKey
        }
        let sdk = await initializeSDK(this, { account:acc }, true)
        
        let bytecode = (await sdk.contractCompile(FUNGIBLE_TOKEN_CONTRACT)).bytecode
        let deployed = await sdk.contractDeploy(bytecode, FUNGIBLE_TOKEN_CONTRACT, [ `"AE TEST"`, '8', `"AET"` ])

        let call = await sdk.contractCall(FUNGIBLE_TOKEN_CONTRACT, deployed.address,"mint",[account.publicKey,"1000000"])
        resolve (deployed)
    })
}
const openTokensPage = () => {
    login()
    cy
    .visit('popup/popup.html',{onBeforeLoad})
    .get('.ae-loader')
    .should('not.be.visible')
    .get('#settings')
    .click()
    .get('.utilities')
    .click()
    .get('.fungible-tokens')
    .click()
    .get('.add-token')
    .click()
}
const addToken = () => {
    cy
    .get('.token-contract')
    .clear()
    .type( deployContract().then(res => {
        return res.address
    }) ) 
    .wait(7000)
    .get('.to-confirm-add')
    .click()
    .wait(1000)
    .get('.ae-button.add-token')
    .click()
    .get('.ae-modal-light')
    .get('.buttons > .ae-button')
    .click()
}
const addSubAccount = () => {
    cy
    .get('#account > button')
    .click()
    .get(':nth-child(2) > .triggerhidedd > .newSubaccount')
    .should('be.visible')
    .click()
    .get('.addaccount')
    .should('be.visible')
    .get('.icon-btn > .ae-icon-plus')
    .click()
    .get('.add-form')
    .should('be.visible')
    .get('.ae-input')
    .type('Subacc')
    .get('.ae-button')
    .click()
    .get('.ae-modal-light')
    .get('.buttons > .ae-button')
    .click()
    .get('#settings > button')
    .click()
    .get('.dropdown-holder > :nth-child(1) > .ae-button')
    .should('contain','My Account')
    .click()
    .get('.ae-card-main > .ae-address')
    .click()
    .get('#account > button')
    .click()
    .get('.ae-list.dropdown-holder > :nth-child(1)')
    .click()
}




describe("Test cases for Allowances Page", () => {

    it("open Utilities page then Allowances page and back to account", () => {
        login();
        cy
        .visit("popup/popup.html",{onBeforeLoad})
        .get('#settings')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .get('#utilities')
        .should('be.visible')
        .click()
        .get('.dropdown-holder')
        .should('not.be.visible')
        .get('.settingslist')
        .should('be.visible')
        .get('.allowances')
        .should('be.visible')
        .click()
        .get('.backbutton')
        .should('be.visible')
        .click()
        .get('.backbutton')
        .should('be.visible')
        .click()
        .get('.ae-card.primary')
        .should('be.visible')
    });
   
    
    it("open create allowance page, validate all fields and create allowance", () => {
        openTokensPage()
        addToken()
        addSubAccount()
        cy
        .get('#settings')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .get('#utilities')
        .should('be.visible')
        .click()
        .get('.dropdown-holder')
        .should('not.be.visible')
        .get('.settingslist')
        .should('be.visible')
        .get('.allowances')
        .should('be.visible')
        .click()
        .get('.createAllowance')
        .should('be.visible')
        .click()

        .get('.ae-button')
        .should('contain', 'Create')
        .should('be.visible')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('div>main')
        .should('contain', 'Please, select token!')
        .should('be.visible')
        .get('.buttons > .ae-button')
        .click()
        .get('.ae-modal-light')
        .should('not.be.visible')
        
        .get('.allowance-token-dropdown').select('AE TEST')
        .get('.ae-button')
        .should('contain', 'Create')
        .should('be.visible')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('h1')
        .should('contain', 'Incorrect address')
        .should('be.visible')
        .get('.buttons > .ae-button')
        .click()
        .get('.ae-modal-light')
        .should('not.be.visible')

        .get('.allowance-address > .ae-input-box > .ae-input')
        .type('ak_asdasd3423')
        .get('.ae-button')
        .should('contain', 'Create')
        .should('be.visible')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('h1')
        .should('contain', 'Incorrect address')
        .should('be.visible')
        .get('.buttons > .ae-button')
        .click()
        .get('.allowance-address > .ae-input-box > .ae-input')
        .clear()
        .type('123123123')
        .get('.ae-button')
        .should('contain', 'Create')
        .should('be.visible')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('h1')
        .should('contain', 'Incorrect address')
        .should('be.visible')
        .get('.buttons > .ae-button')
        .click()
        .get('.allowance-address > .ae-input-box > .ae-input')
        .clear()
        .type('address')
        .get('.ae-button')
        .should('contain', 'Create')
        .should('be.visible')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('h1')
        .should('contain', 'Incorrect address')
        .should('be.visible')
        .get('.buttons > .ae-button')
        .click()
        .get('.allowance-address > .ae-input-box > .ae-input')
        .clear()
        .type('ak_26jiGAScn8BMaxrwUbK2XY1b5xLPM52kYwiVnjirY9jtsFtojx')

        .get('.allowance-value > .ae-input-box > .ae-input')
        .clear()
        .get('.ae-button')
        .should('contain', 'Create')
        .should('be.visible')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('main>div')
        .should('contain', 'Please fill in all fields correctly!')
        .should('be.visible')
        .get('.buttons > .ae-button')
        .click()
        .get('.allowance-value > .ae-input-box > .ae-input')
        .clear()
        .type('-1')
        .get('.ae-button')
        .should('contain', 'Create')
        .should('be.visible')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('main>div')
        .should('contain', 'Please, enter valid and positive number!')
        .should('be.visible')
        .get('.buttons > .ae-button')
        .click()
        .get('.allowance-value > .ae-input-box > .ae-input')
        .clear()
        .type('eee')
        .get('.ae-button')
        .should('contain', 'Create')
        .should('be.visible')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('main>div')
        .should('contain', 'Please fill in all fields correctly!')
        .should('be.visible')
        .get('.buttons > .ae-button')
        .click()
        .get('.allowance-value > .ae-input-box > .ae-input')
        .clear()
        .type('50')
        .get('.ae-button')
        .should('contain', 'Create')
        .should('be.visible')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('.buttons > .ae-button')
        .click()
    })

    
    it("create allowance from Main account for Subaccount, then change to Subaccount and add the AET token, then see all your allowances, then get the added allowance", () => {
        openTokensPage()
        addToken()
        addSubAccount()
        cy
        .get('#settings')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .get('#utilities')
        .should('be.visible')
        .click()
        .get('.dropdown-holder')
        .should('not.be.visible')
        .get('.settingslist')
        .should('be.visible')
        .get('.allowances')
        .should('be.visible')
        .click()
        .get('.createAllowance')
        .should('be.visible')
        .click()

        .get('.allowance-token-dropdown').select('AE TEST')
        .get('.allowance-address > .ae-input-box > .ae-input')
        .clear()
        .type('ak_26jiGAScn8BMaxrwUbK2XY1b5xLPM52kYwiVnjirY9jtsFtojx')
        .get('.allowance-value > .ae-input-box > .ae-input')
        .clear()
        .type('250')
        .get('.ae-button')
        .should('contain', 'Create')
        .should('be.visible')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('h1')
        .should('contain','Successfully added')
        .get('.buttons > .ae-button')
        .click()

        .get('#account > button')
        .click()
        .get(':nth-child(2) > .subAccountInfo > .subAccountName')
        .should('contain','Subacc')
        .click()
        .get('#settings')
        .click()
        .get('.utilities')
        .click()
        .get('.fungible-tokens')
        .click()
        .get('.add-token')
        .click()
        addToken()

        cy
        .get('.backbutton')
        .click()
        .get('.backbutton')
        .click()
        .get('.allowances')
        .should('be.visible')
        .click()
        .get('.seeAllAllowance')
        .should('be.visible')
        .click()
        .get('.allowance-token-dropdown').select('AE TEST')
        .get('.ae-list')
        .should('be.visible')
        .get('.ae-list-item')
        .get('.ae-badge')
        .should('contain','250 AET')

        .get('.ae-button')
        .should('be.visible')
        .should('contain','Get it')
        .click()
        .get('h3')
        .should('contain','Transfer allowance')
        .should('be.visible')
        .get(':nth-child(5) > .ae-input-box > .ae-input')
        .should('be.disabled')
        .get(':nth-child(6) > .ae-input-box > .ae-input')
        .should('be.visible')
        .should('not.be.disabled')
        .get('.ae-button')
        .should('contain','Transfer')
        .should('have.class','transferAllowance')
        .click()
        .wait(3000)
        .get('.flex-align-start > .balance')
        .should('contain','250 AET')
        .wait(5000)
        .get('.confirm')
        .should('not.be.disabled')
        .click()
        .wait(2000)
        .get('.ae-card')
        .should("be.visible")
    });

    it("create allowance then try again to create same allowance, then change the existent allowance with validations before that", () => {
        openTokensPage()
        addToken()
        cy
        .get('#settings')
        .click()
        .get('.dropdown-holder')
        .should('be.visible')
        .get('#utilities')
        .should('be.visible')
        .click()
        .get('.dropdown-holder')
        .should('not.be.visible')
        .get('.settingslist')
        .should('be.visible')
        .get('.allowances')
        .should('be.visible')
        .click()
        .get('.createAllowance')
        .should('be.visible')
        .click()

        .get('.allowance-token-dropdown').select('AE TEST')
        .get('.allowance-address > .ae-input-box > .ae-input')
        .clear()
        .type('ak_26jiGAScn8BMaxrwUbK2XY1b5xLPM52kYwiVnjirY9jtsFtojx')
        .get('.allowance-value > .ae-input-box > .ae-input')
        .clear()
        .type('250')
        .get('.ae-button')
        .should('contain', 'Create')
        .should('be.visible')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('h1')
        .should('contain','Successfully added')
        .get('.buttons > .ae-button')
        .click()

        .get('.backbutton')
        .click()
        .get('.createAllowance')
        .should('be.visible')
        .click()

        .get('.allowance-token-dropdown').select('AE TEST')
        .get('.allowance-address > .ae-input-box > .ae-input')
        .clear()
        .type('ak_26jiGAScn8BMaxrwUbK2XY1b5xLPM52kYwiVnjirY9jtsFtojx')
        .get('.allowance-value > .ae-input-box > .ae-input')
        .clear()
        .type('250')
        .get('.ae-button')
        .should('contain', 'Create')
        .should('be.visible')
        .click()

        .get('.allowanceExistError')
        .should('be.visible')
        .should('contain','This Allowance already exist. If you want to change it click here')
        .get('.anchor-here-btn')
        .should('be.visible')
        .click()
        .wait(1000)
        .get('h3')
        .should("contain",'Change Allowance')
        .get('.allowance-symbol')
        .should('be.disabled')
        .get('.allowance-address')
        .should('be.disabled')
        .get('.allowanceExistError')
        .should("contain",'Current allowed allowance amount is 999750 AET')

        .get('.allowance-value > .ae-input-box > .ae-input')
        .clear()
        .type('-1')
        .get('.ae-button')
        .should("contain",'Change')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('main > div')
        .should('contain','Please, enter valid and positive number!')
        .get('.buttons > .ae-button')
        .click()
        .get('.allowance-value > .ae-input-box > .ae-input')
        .clear()
        .type('999751')
        .get('.ae-button')
        .should("contain",'Change')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('main > div')
        .should('contain','The requested amount cannot be spent.')
        .get('.buttons > .ae-button')
        .click()
        .get('.allowance-value > .ae-input-box > .ae-input')
        .clear()
        .type('750')
        .get('.ae-button')
        .should("contain",'Change')
        .click()
        .get('.ae-modal-light')
        .should('be.visible')
        .get('main > div')
        .should('contain','Allowance for this account was successfuly changed!')
        .get('.buttons > .ae-button')
        .click()
        .wait(2000)
        .get('.ae-card')
        .should("be.visible")
    });
});