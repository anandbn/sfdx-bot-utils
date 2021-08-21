import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

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
    name: flags.string({ char: 'n', description: messages.getMessage('nameFlagDescription'), required: true }),
    botversion: flags.string({ char: 'b', description: messages.getMessage('botversionFlagDescription') }),
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
    await this.loginAndNavigateToBot(this.flags.name, versionNumber, botId, botVerId);
    // Return an object to be displayed with --json
    return { "status": "ok" };
  }

  async loginAndNavigateToBot(botName: string, versionNumber: string, botId: string, botVersionId: string) {
    const timestamp: string = `TestLogin_${botName}_v${versionNumber}_${new Date().toISOString()}`;

    const conn = this.org.getConnection();
    let browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    let page = await browser.newPage();
    const setupHome = `/chatbots/botBuilder.app#/bot/model/dashboard?botId=${botId}&versionId=${botVersionId}`;
    let urlToGo = `${conn.instanceUrl}/secur/frontdoor.jsp?sid=${conn.accessToken}&retURL=${encodeURIComponent(setupHome)}`;
    try {
      await page.goto(urlToGo);
      await page.waitForNavigation();
      await page.waitForTimeout(10 * 1000);
      this.ux.log(`[${this.flags.name}:${botId}:${botVersionId}] - Logged into Setup`);
      await page.screenshot({
        path: `tmp${path.sep}${timestamp}_after_login_botbuilder.png`,
        fullPage: true

      });
      if (!fs.existsSync(`tmp${path.sep}${timestamp}_after_login_botbuilder.png`)) {
        this.ux.error(`[${this.flags.name}:${botId}:${botVersionId}] - Could not login to org and navigate to bot page`);
      }else{
        this.ux.log(`[${this.flags.name}:${botId}:${botVersionId}] - Logged in and navigated to Bot home page`);
      }
    } catch (error) {
      this.ux.error(`[${this.flags.name}:${botId}:${botVersionId}] - Could not login to org and navigate to bot page: Error Message - ${error.message}`);
      
    }
    await browser.close();

  }


}
