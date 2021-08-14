import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';

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



interface BotVersion {
  Id: string
  Status: string
  DeveloperName: string
  VersionNumber: string
}


export default class ListVersions extends SfdxCommand {

  public static description = messages.getMessage('intentCmdDesc');

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

    let result = await conn.query<IdAndName>(`SELECT DeveloperName,Id,MasterLabel  FROM BotDefinition where DeveloperName='${this.flags.name}'`);
    if (!result.records || result.records.length <= 0) {
      throw new SfdxError(messages.getMessage('errorNoBotResults', [this.flags.name]));
    }
    let botDefnId = result.records[0].Id;
    this.ux.log(`Found Bot [Id: ${result.records[0].Id}, DeveloperName: ${result.records[0].DeveloperName}, Name: ${result.records[0].MasterLabel}]`);
    let botVersions = await conn.query<BotVersion>(`select Id,Status,DeveloperName,VersionNumber from BotVersion where BotDefinitionId='${botDefnId}' and Status='Active'`);
    if (!botVersions.records || botVersions.records.length <= 0) {
      throw new SfdxError(messages.getMessage('errorNoActiveVersions', [this.flags.name]));
    } else {
      this.ux.log(`Found Active Bot Version [Id: ${botVersions.records[0].Id}, DeveloperName: ${botVersions.records[0].DeveloperName}, VersionNumber: ${botVersions.records[0].VersionNumber}]`);

      let botMetadataAndVersions = await conn.metadata.readSync('Bot', [`${result.records[0].DeveloperName}`]);
      let listOfIntents = this.getAllBotIntents(botMetadataAndVersions);
      let tableColumnData = {
        columns: [
          { key: 'label', label: 'Label' },
          { key: 'developerName', label: 'Developer Name' },
        ]
      }
      this.ux.table(listOfIntents, tableColumnData);
      return listOfIntents;
    }
    return null;
  }

  private getAllBotIntents(botMetadataAndVersions) {
    return botMetadataAndVersions.botMlDomain.mlIntents.map(function (mlIntent) {
      return {
        "developerName": mlIntent.developerName,
        "label": mlIntent.label
      };
    })
  }

  
}
