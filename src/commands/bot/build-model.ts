import { flags, SfdxCommand } from '@salesforce/command';
import {  Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);
const puppeteer = require('puppeteer');
const fs = require('fs');

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('bot-sfdx-utils', 'bot');

interface IdAndName {
  Id: string
  DeveloperName: string
  VersionNumber: string
  Status: string
}

export default class BuildModel extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    ``
  ];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    name: flags.string({ char: 'n', description: messages.getMessage('nameFlagDescription'), required: true }),
    botversion: flags.string({ char: 'b', description: messages.getMessage('botversionFlagDescription') }),
    debug: flags.boolean({ char: 'l', description: messages.getMessage('debugFlagDescription') })
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const conn = this.org.getConnection();
    if (this.flags.debug && !fs.existsSync('tmp')) {
      fs.mkdirSync('tmp');
    }

    let result = await conn.query<IdAndName>(`SELECT DeveloperName,Id  FROM BotDefinition where DeveloperName='${this.flags.name}'`);
    if (!result.records || result.records.length <= 0) {
      throw new SfdxError(messages.getMessage('errorNoBotResults', [this.flags.name]));
    }
    let botId = result.records[0].Id;
    if (this.flags.botversion) {
      result = await conn.query<IdAndName>(`SELECT Id,DeveloperName,VersionNumber,Status FROM BotVersion where BotDefinitionId='${botId}' and DeveloperName='${this.flags.botversion}'`);
    } else {
      this.ux.log(`No version specified. Looking for the active version`);
      result = await conn.query<IdAndName>(`SELECT Id,DeveloperName,VersionNumber,Status FROM BotVersion where BotDefinitionId='${botId}' and Status='Active'`);

    }
    if (!result.records || result.records.length <= 0) {
      throw new SfdxError(messages.getMessage('errorNoVersionFound', [this.flags.name]));
    }
    let botVerId = result.records[0].Id, versionNumber = result.records[0].VersionNumber, botStatus = result.records[0].Status;
    this.ux.log(`Found Bot ${botId}, Version#${versionNumber}: ${botVerId} , Status: ${botStatus}`)
    if (botStatus == 'Active') {
      this.ux.warn(`[${botId}:${botVerId}] - Bot version is Active. Deactivating the bot. The embedded bot on your website will not work until this script completes`);
      //Inactive the bot before building the model
      await this.changeBotStatus(this.flags.name,versionNumber,botId, botVerId,false)
      this.ux.warn(`[${botId}:${botVerId}] - Deactivated Bot Version. Building model now.`);
      await this.buildModelForBotVersion(this.flags.name,versionNumber,botId, botVerId);
      this.ux.warn(`[${botId}:${botVerId}] - Model building kicked off. Activating bot now.`);
      await this.changeBotStatus(this.flags.name,versionNumber,botId, botVerId,true);
    } else {
      await this.buildModelForBotVersion(this.flags.name,versionNumber,botId, botVerId);
    }
    // Return an object to be displayed with --json
    return { "status": "ok" };
  }

  async buildModelForBotVersion(botName:string, versionNumber:string, botId: string, botVersionId: string) {
    const timestamp:string = `BuildModel_${botName}_v${versionNumber}_${new Date().toISOString()}`;

    const conn = this.org.getConnection();
    let browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    let page = await browser.newPage();
    const setupHome = `/chatbots/botBuilder.app#/bot/model/dashboard?botId=${botId}&versionId=${botVersionId}`;
    let urlToGo = `${conn.instanceUrl}/secur/frontdoor.jsp?sid=${conn.accessToken}&retURL=${encodeURIComponent(setupHome)}`;
    await page.goto(urlToGo);
    await page.waitForNavigation();
    await page.waitForTimeout(10 * 1000);
    if (this.flags.debug) {
      this.ux.log(`[${botId}:${botVersionId}] - Logged into Setup`);
      await page.screenshot({
        path: `./tmp/${timestamp}_after_login_botbuilder.png`,
        fullPage: true

      });
    }

    let buildModelBtn =  await page.$x("//button[contains(., 'Build Model')]");
    if (buildModelBtn) {
      await buildModelBtn[0].click();
      await page.waitForTimeout(5 * 1000);
      if (this.flags.debug) {
        this.ux.log(`[${botId}:${botVersionId}] - Clicked Build Model`);
        await page.screenshot({
          path: `./tmp/${timestamp}_after_buildmodelbtn_clicked.png`,
          fullPage: true

        });
      }
    }

    await browser.close();
  }

  async changeBotStatus(botName:string, versionNumber:string, botId: string, botVersionId: string,activate:boolean) {
    const timestamp:string = `BuildModel_${activate?'Activate':'Deactivate'}_${botName}_v${versionNumber}_${new Date().toISOString()}`;
    const conn = this.org.getConnection();
    let browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    let page = await browser.newPage();
    const setupHome = `/chatbots/botBuilder.app#/bot/dialogs/detail?botId=${botId}&versionId=${botVersionId}`;
    let urlToGo = `${conn.instanceUrl}/secur/frontdoor.jsp?sid=${conn.accessToken}&retURL=${encodeURIComponent(setupHome)}`;
    await page.goto(urlToGo);
    await page.waitForNavigation();
    await page.waitForTimeout(10 * 1000);
    if (this.flags.debug) {
      this.ux.log(`[${botId}:${botVersionId}] - Logged into Setup`);
      await page.screenshot({
        path: `./tmp/${timestamp}_after_login_botbuilder.png`,
        fullPage: true

      });
    }

    if (activate) {
      let botActivateBtn = await page.$x("//button[@name='btnBotActivate']");
      if (botActivateBtn) {
        await botActivateBtn[0].click();
        if (this.flags.debug) {
          this.ux.log(`[${botId}:${botVersionId}] - Clicked Activate Button`);
          await page.screenshot({
            path: `./tmp/${timestamp}_after_botactivate_clicked.png`,
            fullPage: true

          });
        }
      }
    } else if (!activate) {
      let botActivateBtn = await page.$x("//button[@name='btnBotDeactivate']");
      if (botActivateBtn) {
        await botActivateBtn[0].click();
        await page.waitForTimeout(5 * 1000);
        if (this.flags.debug) {
          this.ux.log(`[${botId}:${botVersionId}] - Clicked Deactivate Button`);
          await page.screenshot({
            path: `./tmp/${timestamp}_after_botdeactivate_clicked.png`,
            fullPage: true

          });
        }
        let confirmBtn= await page.$x("//button[text()='Yes']");
        if(confirmBtn){
          await confirmBtn[0].click();
          await page.waitForTimeout(3 * 1000);
          if (this.flags.debug) {
            this.ux.log(`[${botId}:${botVersionId}] - Confirmed deactivation Button`);
            await page.screenshot({
              path: `./tmp/${timestamp}_after_botconfirm_clicked.png`,
              fullPage: true
            });
          }
        }

      }
      
    }


    await browser.close();
  }

}
