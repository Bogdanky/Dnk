# Arhitectura - Dnk Bot

Documentatie tehnica: cum sunt organizate modulele, cum circula datele, si de ce anumite decizii au fost luate asa.

## Principii generale

- **Command handler dinamic** - `index.js` citeste tot ce e in `commands/` la pornire si populeaza `client.commands` (o `Collection`, cheia fiind `command.data.name`). Nu exista un fisier central cu lista de comenzi - orice fisier nou din `commands/` cu `data` + `execute` e incarcat automat.
- **Persistenta = fisiere JSON simple**, nu baza de date. Justificare: volum mic de date (un singur bot, cateva servere), zero dependinte externe de configurat, usor de inspectat/backup manual. Fiecare "store" (`config-store.js`, `warn-store.js` etc.) expune functii `get`/`set` si scrie sincron pe disc la fiecare modificare - simplu, dar suficient pentru scara actuala. Daca botul ar creste mult (sute de servere, scriere concurenta intensa), ar merita migrat la SQLite sau o baza reala.
- **Secrete in `.env`, configurare per-server in `data/*.json`.** Tokenul si cheile API nu se schimba des si sunt globale -> `.env`. Rolul de moderator, canalul de tichete etc. difera per server si se schimba din Discord de catre admini -> stocare per-`guildId` in `config-store.js`, nu `.env`.

## Fisiere din radacina (non-`commands/`)

| Fisier | Responsabilitate |
|---|---|
| `index.js` | Bootstrap: creeaza `Client`, incarca comenzile, inregistreaza toti listener-ii de evenimente Discord |
| `deploy-commands.js` | Script separat, rulat manual, care trimite metadata comenzilor (`SlashCommandBuilder.toJSON()`) la Discord REST API |
| `config-store.js` | `getGuildConfig(guildId)` / `setGuildConfig(guildId, updates)` - citeste/scrie `data/ticket-config.json`. Returneaza mereu un obiect cu valori implicite (`nsfwFilterEnabled: false`, `prefix: '!'` etc.) suprapuse cu ce e salvat efectiv, ca restul codului sa nu trebuiasca sa verifice `undefined` peste tot |
| `warn-store.js` | CRUD pe avertismente, cheie dubla `guildId` -> `userId` -> array de `{reason, moderatorId, timestamp}` |
| `giveaway-store.js` | CRUD pe giveaway-uri active/incheiate, cheie = `messageId` |
| `reaction-role-store.js` | Mapare `messageId` -> `{emojiKey: roleId}`. `emojiKey` e ID-ul emoji-ului pentru cele custom, sau caracterul unicode pentru cele standard |
| `starboard-store.js` | Mapare simpla `originalMessageId` -> `starboardMessageId`, ca sa stim daca un mesaj popular a fost deja postat pe starboard (si sa-i editam count-ul, nu sa-l duplicam) |
| `audit-log.js` | `sendLog(client, guildId, embed)` trimite un embed in canalul de log configurat (daca exista). `fetchExecutor(guild, auditLogType, targetId)` cauta in audit log-ul Discord al serverului o intrare recenta (sub 10s) care tinteste un anumit user, ca sa aflam cine a facut o actiune (ex: cine a dat kick) |
| `nsfw-filter.js` | `isImageNsfw(url)` - trimite URL-ul unei imagini catre API-ul api4ai/nsfw3 (RapidAPI) si returneaza `true`/`false`/`null` (null = fara cheie API configurata) |
| `prefix-commands.js` | `Map<string, {description, execute}>` - set restrans de comenzi text (`!ping` etc.), separat de slash commands |

## Flux de evenimente (`index.js`)

```
clientReady
  -> seteaza prezenta botului
  -> porneste setInterval (30s) pentru giveaway-uri expirate

interactionCreate
  -> isChatInputCommand()  -> client.commands.get(name).execute(interaction)
  -> isButton() + customId 'ticket_close' -> ticket.js -> closeTicket(interaction)

messageCreate
  -> daca incepe cu prefixul configurat -> prefix-commands.js
  -> altfel, daca are atasamente imagine + filtru NSFW activ -> nsfw-filter.js -> sterge daca e flagged

guildMemberAdd    -> welcome message (config-store) + autorole
guildMemberRemove -> audit-log.fetchExecutor(MemberKick) -> kick sau "a plecat"
guildBanAdd       -> audit-log.fetchExecutor(MemberBanAdd) -> log cu moderator + motiv
guildMemberUpdate -> compara communicationDisabledUntilTimestamp -> log timeout aplicat/eliminat
messageDelete     -> log continut + autor + canal (daca mesajul nu era partial necached)

messageReactionAdd/Remove
  -> reaction-role-store: daca (messageId, emojiKey) are o mapare -> adauga/scoate rolul
  -> daca emoji == ⭐ -> starboard: verifica prag, posteaza/editeaza in canalul de starboard
```

## De ce tichete = canale, nu threads

Discord ofera doua moduri de a izola o conversatie: **private threads** sau **canale text separate cu permission overwrites**. S-au ales canalele pentru:

- Nu depind de nivelul de boost al serverului (private threads au avut limitari legate de asta in trecut).
- Nu se arhiveaza automat dupa perioada de inactivitate ca threads.
- Permission overwrites explicite (`ViewChannel` deny pe `@everyone`, allow pe user + rol de mod) sunt mai usor de inteles si de auditat decat apartenenta la un thread.

Owner-ul tichetului e identificat prin `channel.topic` (`ticket-owner:<userId>`), nu printr-o baza de date separata - suficient pentru volumul actual si usor de citit manual daca e nevoie.

## De ce `/config` grupeaza mai multe setari intr-o singura comanda

Discord permite maxim 100 de slash commands per aplicatie (nu e o problema de volum aici), dar o comanda separata per setare (`/set-welcome`, `/set-autorole`, `/set-logchannel`...) ar polua lista de comenzi vizibile adminilor. Subcomenzile (`/config welcome`, `/config autorole` etc.) grupeaza logic toate setarile administrative intr-un singur punct de intrare, la fel cum `/ticket` si `/warn` grupeaza actiunile lor specifice.

## Permisiuni: doua straturi, intentionat suprapuse

Comenzile sensibile (`/reload`, `/shutdown`, `/booba`) au **doua** verificari independente:

1. `setDefaultMemberPermissions(PermissionFlagsBits.Administrator)` pe `SlashCommandBuilder` - filtreaza la nivel de Discord cine *vede si poate incerca* comanda.
2. Verificare manuala `interaction.user.id !== process.env.OWNER_ID` in `execute()` - filtreaza la nivel de cod cine *chiar poate rula* logica.

Asta permite ca ownerul botului sa ramana singurul care poate rula efectiv aceste comenzi, chiar daca alti administratori de server (care vad comanda datorita stratului 1) incearca sa o foloseasca.

## Intents si Partials - de ce fiecare

| Intent | Motiv |
|---|---|
| `Guilds` | De baza, necesar pentru orice interactiune cu sloturi de server |
| `GuildMessages` + `MessageContent` (privilegiat) | Citirea continutului mesajelor si atasamentelor - necesar pentru filtrul NSFW si prefix commands |
| `GuildMembers` (privilegiat) | `guildMemberAdd`/`guildMemberRemove`/`guildMemberUpdate` - welcome, autorole, audit log |
| `GuildModeration` | `guildBanAdd` pentru audit log |
| `GuildMessageReactions` | `messageReactionAdd`/`Remove` - reaction roles si starboard |

`Partials: [Message, Reaction, User, GuildMember]` sunt necesare pentru ca reactiile/mesajele la care botul nu era "martor" direct (de exemplu adaugate inainte ca botul sa fi pornit, sau pe mesaje vechi necachuite) sa poata fi totusi procesate - fara ele, evenimentele pe obiecte necachuite nu se declanseaza deloc.

## Limitari cunoscute / posibile imbunatatiri viitoare

- Persistenta JSON nu suporta bine scrieri concurente masive - suficient acum, dar ar trebui migrat la SQLite daca botul creste mult.
- Starboard-ul nu retrage un mesaj din starboard daca reactiile scad sub prag - se editeaza doar count-ul cand creste.
- Giveaway-urile nu au un `/giveaway reroll` (re-alegere de castigatori) - usor de adaugat daca e nevoie.
- Prefix commands acopera doar un subset de comenzi (nu toate cele din `commands/`) - decizie deliberata, ca sa nu se dubleze tot codul intre cele doua sisteme.
