bot-sfdx-utils
===============

SFDX plugins for automation around Einstein Bots. These are tasks that are currently not exposed via the metadata api.

## Commands

- `sfdx bot:change-status` : To activate and deactivate a specific version of an Einstein Bot
- `sfdx bot:build-model` : To build the NLP model for a specific version of an Einstein Bot.
- `sfdx bot:list-versions` : List all versions in the org for a given bot


## `sfdx bot:change-status`

### Parameters

- `-n` or `--name` : DeveloperName of the Einstein Bot
- `-b` or `--botversion` : Version to activate or deactivate
- `-a` or `--activate` : Activate the bot.
- `-d` or `--deactivate`: Deactivate the bot
- `-l` or `--debug` : Verbose logging including screenshots of the bot activation/deactivation process

__Note:__ : either `-a` or `-d` can be used at the same time and not both


### Example

```
$ sfdx bot:change-status -d -n MyFirstBot -b v2 --debug -u mydevorg

Found Bot 0Xx5e000000kMlkYAE, Version#2: 0Xx5e000000kMlkYAE , Status: Active
[0Xx5e000000kMlkYAE:0Xx5e000000kMlkYAE] - Logged into Setup
[0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Clicked Deactivate Button
[0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Confirmed deactivation Button

$ sfdx bot:change-status -d -n MyFirstBot -b v9 --debug -u mydevorg

Found Bot 0Xx5e000000kMlkYAE, Version#9: 0Xx5e000000kMlkYAE , Status: Inactive
ERROR running bot:change-status:  The bot version you are trying to activate is already inactive.

$ sfdx bot:change-status -a -n MyFirstBot -b v9 --debug -u mydevorg

Found Bot 0Xx5e000000kMlkYAE, Version#9: 0X95e000000l4qrCAA , Status: Inactive
[0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Logged into Setup
[0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Clicked Activate Button
```

## `sfdx bot:build-model`

### Parameters

- `-n` or `--name` : DeveloperName of the Einstein Bot
- `-b` or `--botversion` : Version to activate or deactivate
- `-l` or `--debug` : Verbose logging including screenshots of the bot activation/deactivation process

__Note:__ : If your bot is activate when trying to build the model, the command will deactivate the bot , kick of the model building proces and then reactivate the bot. During this time the bot might not be available to your website.

### Example

```
$ sfdx bot:build-model -n "MyFirstBot" -b "v9" --debug -u mydevorg

Found Bot 0Xx5e000000kMlkYAE, Version#9: 0X95e000000l4qrCAA , Status: Active
WARNING: [0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Bot version is Active. Deactivating the bot. The embedded bot on your website will not work until this script completes
[0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Logged into Setup
[0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Clicked Deactivate Button
[0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Confirmed deactivation Button
WARNING: [0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Deactivated Bot Version. Building model now.
[0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Logged into Setup
[0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Clicked Build Model
WARNING: [0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Model building kicked off. Activating bot now.
[0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Logged into Setup
[0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Clicked Activate Button
```


## `sfdx bot:list-versions`

__Parameters__

- `-n` or `--name` : DeveloperName of the Einstein Bot


### Example

```
$ sfdx bot:change-status -d -n MyFirstBot -b v2 --debug -u mydevorg

Found Bot 0Xx5e000000kMlkYAE, Version#2: 0Xx5e000000kMlkYAE , Status: Active
[0Xx5e000000kMlkYAE:0Xx5e000000kMlkYAE] - Logged into Setup
[0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Clicked Deactivate Button
[0Xx5e000000kMlkYAE:0X95e000000l4qrCAA] - Confirmed deactivation Button
```