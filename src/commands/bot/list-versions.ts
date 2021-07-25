import { flags, SfdxCommand } from '@salesforce/command';
import {  Messages, SfdxError } from '@salesforce/core';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('bot-sfdx-utils', 'bot');

interface IdAndName {
  Id: string
  DeveloperName: string
  VersionNumber: string
  Status: string
}

export default class ListVersions extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    ``
  ];

  public static args = [{ name: 'file' }];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    name: flags.string({ char: 'n', description: messages.getMessage('nameFlagDescription'), required: true }),
    debug: flags.boolean({ char: 'l', description: messages.getMessage('debugFlagDescription') })
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<IdAndName[]> {
    const conn = this.org.getConnection();

    let result = await conn.query<IdAndName>(`SELECT DeveloperName,Id  FROM BotDefinition where DeveloperName='${this.flags.name}'`);
    if (!result.records || result.records.length <= 0) {
      throw new SfdxError(messages.getMessage('errorNoBotResults', [this.flags.name]));
    }
    let botId = result.records[0].Id;
    result = await conn.query<IdAndName>(`SELECT Id,DeveloperName,VersionNumber,Status FROM BotVersion where BotDefinitionId='${botId}'`);
    if (!result.records || result.records.length <= 0) {
      throw new SfdxError(messages.getMessage('errorNoVersionFound', [this.flags.name]));
    }else{
      let tableColumnData = {
        columns: [
          { key: 'DeveloperName', label: 'Developer Name' },
          { key: 'VersionNumber', label: 'VersionNumber' },
          { key: 'Status', label: 'Status' }
        ]
      }
      this.ux.table(result.records,tableColumnData);
    }
    
    return result.records;
  }

}
