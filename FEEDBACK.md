# Feedback

Bug reports and suggestions submitted from the app's feedback button are appended
below automatically (via the Cloudflare Worker in `feedback-worker/`).

---
### 2026-06-21T16:21:18.925Z

_Astra Militarum list — Astra Militarum · Strike Force · Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

La finestra di bug che si apre è decentrata e èetà è oltre il limite superiore della pagina.

Assieme alla segnalazione di errore dovrebbe essere presente anche un dump della lista corrente per circostanziare meglio gli errori.

Frasi come "Up to 4 Kasrkin Troopers can each have their hot-shot lasgun replaced with one of the following:*1 flamer 1 grenade launcher 1 hot-shot volley gun 1 meltagun 1 plasma gun free · max 10" devono essere interpretate come che ognuna di quelle armi puo essere messa ed ogni opzione arma dev'essere una opzione diversa, non un'unica opzione che puo essere presa tot volte. Inoltre nei Kaserkin per esempio non la fa prendere fino a 4 volte ma fino al massimo del numero dei modelli dell'unità

---
### 2026-06-21T16:54:27.860Z

_Space Marines list — Space Marines · Strike Force · Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

Quando ci sono opzioni arma a spunta che diventano non piu selezionabili dovrebbero essere grigiate non diventare un + n - fisso a 0. Stessa cosa per le + n - che altremodo diventano non piu selezionabili dovrebbero venir grigiate


<details><summary>Current list</summary>

```json
{
  "id": "mqo0scw3pu48e50",
  "name": "Space Marines list",
  "factionId": "SM",
  "battleSizeId": "2",
  "detachmentIds": [
    "000001119",
    "000900007"
  ],
  "units": [
    {
      "uid": "mqo0uhbvmwxnuqy",
      "datasheetId": "000004167",
      "name": "Suboden Khan",
      "pointsCost": 100,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo0vbw7vvknnqs",
      "datasheetId": "000001606",
      "name": "Assault Intercessor Squad",
      "pointsCost": 75,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Thunder hammer (instead of astartes chainsword)",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "Plasma pistol (instead of heavy bolt pistol)",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo0wfic1j1luds",
      "datasheetId": "000002722",
      "name": "Repulsor Executioner",
      "pointsCost": 240,
      "pointsLabel": "1 model (1st-2nd unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "This model can be equipped with 1 ironhail heavy stubber.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "This model can be equipped with 1 Icarus rocket pod.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "This model’s macro plasma incinerator can be replaced with 1 heavy laser destroyer.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo0wvuzelw86gg",
      "datasheetId": "000002722",
      "name": "Repulsor Executioner",
      "pointsCost": 240,
      "pointsLabel": "1 model (1st-2nd unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "This model can be equipped with 1 ironhail heavy stubber.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "This model can be equipped with 1 Icarus rocket pod.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "This model’s macro plasma incinerator can be replaced with 1 heavy laser destroyer.",
          "cost": 0,
          "qty": 1
        }
      ]
    }
  ],
  "createdAt": 1782060462147,
  "updatedAt": 1782060703179,
  "subFaction": "White Scars"
}
```
</details>

---
### 2026-06-21T17:25:47.263Z

_Space Marines list — Space Marines · Strike Force · Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

Gli stratagemmi applicati sono sbagliati, non tengono conto del requisito di psyker o veicle fly


<details><summary>Current list</summary>

```json
{
  "id": "mqo1yakixzjtept",
  "name": "Space Marines list",
  "factionId": "SM",
  "battleSizeId": "2",
  "detachmentIds": [
    "000001119",
    "000000994"
  ],
  "units": [
    {
      "uid": "mqo20aqvezef4em",
      "datasheetId": "000001191",
      "name": "Stormraven Gunship",
      "pointsCost": 280,
      "pointsLabel": "1 model (1st unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo21ztqy5fezl8",
      "datasheetId": "000001606",
      "name": "Assault Intercessor Squad",
      "pointsCost": 75,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo22j6uiok7avs",
      "datasheetId": "000002266",
      "name": "Librarian",
      "pointsCost": 60,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    }
  ],
  "createdAt": 1782062418690,
  "updatedAt": 1782062616486,
  "subFaction": "White Scars"
}
```
</details>

---
### 2026-06-21T17:29:33.392Z

_Space Marines list — Space Marines · Strike Force · Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

le sezioni weapons dovrebbero essere formattate come delle tabelle più leggibili


<details><summary>Current list</summary>

```json
{
  "id": "mqo1yakixzjtept",
  "name": "Space Marines list",
  "factionId": "SM",
  "battleSizeId": "2",
  "detachmentIds": [
    "000001119",
    "000000994"
  ],
  "units": [
    {
      "uid": "mqo20aqvezef4em",
      "datasheetId": "000001191",
      "name": "Stormraven Gunship",
      "pointsCost": 280,
      "pointsLabel": "1 model (1st unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo21ztqy5fezl8",
      "datasheetId": "000001606",
      "name": "Assault Intercessor Squad",
      "pointsCost": 75,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo22j6uiok7avs",
      "datasheetId": "000002266",
      "name": "Librarian",
      "pointsCost": 60,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo27y85fsnuz1k",
      "datasheetId": "000004167",
      "name": "Suboden Khan",
      "pointsCost": 100,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "attachedToUid": "mqo282vyrv708ym"
    },
    {
      "uid": "mqo282vyrv708ym",
      "datasheetId": "000002712",
      "name": "Outrider Squad",
      "pointsCost": 140,
      "pointsLabel": "6 models",
      "variantKey": "6 models",
      "modelCount": 6,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "1 Invader ATV",
          "cost": 60,
          "qty": 1
        },
        {
          "name": "An Invader ATV’s onslaught gatling cannon can be replaced with 1 multi-melta.",
          "cost": 0,
          "qty": 1
        }
      ]
    }
  ],
  "createdAt": 1782062418690,
  "updatedAt": 1782062893240,
  "subFaction": "White Scars"
}
```
</details>

---
### 2026-06-21T18:33:24.291Z

_New40k List Builder — 11th edition · #new40k · Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

Metti la possibilità di aggiungere distaccamenti e unità tra i preferiti che compariranno in cima della lista di riferimento. Aggiungi una barra di ricerca anche per i detachment. Sopra ancora ai preferiti dovranno essere in lista i distaccamenti selezionati. Per i distaccamenti aggiungi anche come dato la lista degli enanchement che sblocca.

---
### 2026-06-21T18:57:53.505Z

_Space Marines list — Space Marines · Strike Force · Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

Per aiutare la visualizzazione sul cellulare i pulsanti contestuali devono rimanere al loro posto anche quando si zoomma


<details><summary>Current list</summary>

```json
{
  "id": "mqnridxkdhsrk52",
  "name": "Space Marines list",
  "factionId": "SM",
  "battleSizeId": "2",
  "detachmentIds": [
    "000001119",
    "000900007"
  ],
  "units": [
    {
      "uid": "mqnrjjmvfu9nrhg",
      "datasheetId": "000004167",
      "name": "Suboden Khan",
      "pointsCost": 100,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "attachedToUid": "mqnrk20y9lpiilo"
    },
    {
      "uid": "mqnrk20y9lpiilo",
      "datasheetId": "000002712",
      "name": "Outrider Squad",
      "pointsCost": 140,
      "pointsLabel": "6 models",
      "variantKey": "6 models",
      "modelCount": 6,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "1 Invader ATV",
          "cost": 60,
          "qty": 1
        },
        {
          "name": "An Invader ATV’s onslaught gatling cannon can be replaced with 1 multi-melta.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqnrl62f4b4ah4i",
      "datasheetId": "000002255",
      "name": "Sternguard Veteran Squad",
      "pointsCost": 100,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": []
    }
  ],
  "createdAt": 1782044880392,
  "updatedAt": 1782045133539,
  "subFaction": "White Scars"
}
```
</details>

---
### 2026-06-21T19:00:24.200Z

_Space Marines list — Space Marines · Strike Force · Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

Rapid ingress cannot target aircrafts


<details><summary>Current list</summary>

```json
{
  "id": "mqnridxkdhsrk52",
  "name": "Space Marines list",
  "factionId": "SM",
  "battleSizeId": "2",
  "detachmentIds": [
    "000001119",
    "000900007"
  ],
  "units": [
    {
      "uid": "mqnrjjmvfu9nrhg",
      "datasheetId": "000004167",
      "name": "Suboden Khan",
      "pointsCost": 100,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "attachedToUid": "mqnrk20y9lpiilo"
    },
    {
      "uid": "mqnrk20y9lpiilo",
      "datasheetId": "000002712",
      "name": "Outrider Squad",
      "pointsCost": 140,
      "pointsLabel": "6 models",
      "variantKey": "6 models",
      "modelCount": 6,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "1 Invader ATV",
          "cost": 60,
          "qty": 1
        },
        {
          "name": "An Invader ATV’s onslaught gatling cannon can be replaced with 1 multi-melta.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqnrl62f4b4ah4i",
      "datasheetId": "000002255",
      "name": "Sternguard Veteran Squad",
      "pointsCost": 100,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": []
    },
    {
      "uid": "mqo5gasz8et531q",
      "datasheetId": "000001191",
      "name": "Stormraven Gunship",
      "pointsCost": 280,
      "pointsLabel": "1 model (1st unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    }
  ],
  "createdAt": 1782044880392,
  "updatedAt": 1782068297654,
  "subFaction": "White Scars"
}
```
</details>

---
### 2026-06-21T19:04:53.666Z

_Space Marines list — Space Marines · Strike Force · Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

Sotto le opzioni arma che aggiungono un profilo arma metti il profilo dell'arma che verrà aggiunta


<details><summary>Current list</summary>

```json
{
  "id": "mqnridxkdhsrk52",
  "name": "Space Marines list",
  "factionId": "SM",
  "battleSizeId": "2",
  "detachmentIds": [
    "000001119",
    "000900007"
  ],
  "units": [
    {
      "uid": "mqnrjjmvfu9nrhg",
      "datasheetId": "000004167",
      "name": "Suboden Khan",
      "pointsCost": 100,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "attachedToUid": "mqnrk20y9lpiilo"
    },
    {
      "uid": "mqnrk20y9lpiilo",
      "datasheetId": "000002712",
      "name": "Outrider Squad",
      "pointsCost": 140,
      "pointsLabel": "6 models",
      "variantKey": "6 models",
      "modelCount": 6,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "1 Invader ATV",
          "cost": 60,
          "qty": 1
        },
        {
          "name": "An Invader ATV’s onslaught gatling cannon can be replaced with 1 multi-melta.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqnrl62f4b4ah4i",
      "datasheetId": "000002255",
      "name": "Sternguard Veteran Squad",
      "pointsCost": 100,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": []
    },
    {
      "uid": "mqo5gasz8et531q",
      "datasheetId": "000001191",
      "name": "Stormraven Gunship",
      "pointsCost": 280,
      "pointsLabel": "1 model (1st unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": []
    }
  ],
  "createdAt": 1782044880392,
  "updatedAt": 1782068621643,
  "subFaction": "White Scars"
}
```
</details>

---
### 2026-06-21T19:54:01.035Z

_New list — 11th edition · #new40k · Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

Chiedi un nome e un punteggio massimo per la creazione della lista. A seconda del punteggio massimo preseleziona la grandezza della battaglia, ma aspetta comunque la conferma dell'utente che prema su crea

---
### 2026-06-21T20:06:55.879Z

_Emperor’s Children list — Emperor’s Children · Strike Force · Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

Non viene aggiunto il costo in punti degli autocannon sul defiler. Controlla se altri equipaggiamenti hanno costo in punti ed aggiorna tutto.


<details><summary>Current list</summary>

```json
{
  "id": "mqo7g26q4kmzldi",
  "name": "Emperor’s Children list",
  "factionId": "EC",
  "battleSizeId": "2",
  "detachmentIds": [
    "000001036",
    "000900003"
  ],
  "units": [
    {
      "uid": "mqo7spqs0wli4yy",
      "datasheetId": "000004083",
      "name": "Lucius the Eternal",
      "pointsCost": 130,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7suoxfd6zwlr",
      "datasheetId": "000004087",
      "name": "Daemon Prince of Slaanesh with Wings",
      "pointsCost": 205,
      "pointsLabel": "1 model (1st unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7t0u7kc8iwk9",
      "datasheetId": "000004078",
      "name": "Lord Exultant",
      "pointsCost": 80,
      "pointsLabel": "1 model (1st-2nd unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Rapture lash (instead of plasma pistol)",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7t5j2j96b3rb",
      "datasheetId": "000004078",
      "name": "Lord Exultant",
      "pointsCost": 80,
      "pointsLabel": "1 model (1st-2nd unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Rapture lash (instead of plasma pistol)",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7u5ff4u4lhgx",
      "datasheetId": "000004091",
      "name": "Maulerfiend",
      "pointsCost": 130,
      "pointsLabel": "1 model (1st-2nd unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7udrl5hjzesc",
      "datasheetId": "000004090",
      "name": "Chaos Spawn",
      "pointsCost": 70,
      "pointsLabel": "2 models",
      "variantKey": "2 models",
      "modelCount": 2,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7uiyigrbycao",
      "datasheetId": "000004208",
      "name": "Defiler",
      "pointsCost": 290,
      "pointsLabel": "1 model (1st unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Heavy reaper autocannon (instead of heavy baleflamer)",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "Heavy reaper autocannon (instead of heavy missile launcher)",
          "cost": 0,
          "qty": 1
        }
      ]
    }
  ],
  "createdAt": 1782071645714,
  "updatedAt": 1782072344335
}
```
</details>

---
### 2026-06-21T20:08:32.370Z

_Emperor’s Children list — Emperor’s Children · Strike Force · Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

Meltagun e plasmagun non sono alternativi per i Tormentors


<details><summary>Current list</summary>

```json
{
  "id": "mqo7g26q4kmzldi",
  "name": "Emperor’s Children list",
  "factionId": "EC",
  "battleSizeId": "2",
  "detachmentIds": [
    "000001036",
    "000900003"
  ],
  "units": [
    {
      "uid": "mqo7spqs0wli4yy",
      "datasheetId": "000004083",
      "name": "Lucius the Eternal",
      "pointsCost": 130,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7suoxfd6zwlr",
      "datasheetId": "000004087",
      "name": "Daemon Prince of Slaanesh with Wings",
      "pointsCost": 205,
      "pointsLabel": "1 model (1st unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7t0u7kc8iwk9",
      "datasheetId": "000004078",
      "name": "Lord Exultant",
      "pointsCost": 80,
      "pointsLabel": "1 model (1st-2nd unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Rapture lash (instead of plasma pistol)",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7t5j2j96b3rb",
      "datasheetId": "000004078",
      "name": "Lord Exultant",
      "pointsCost": 80,
      "pointsLabel": "1 model (1st-2nd unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Rapture lash (instead of plasma pistol)",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7u5ff4u4lhgx",
      "datasheetId": "000004091",
      "name": "Maulerfiend",
      "pointsCost": 130,
      "pointsLabel": "1 model (1st-2nd unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7udrl5hjzesc",
      "datasheetId": "000004090",
      "name": "Chaos Spawn",
      "pointsCost": 70,
      "pointsLabel": "2 models",
      "variantKey": "2 models",
      "modelCount": 2,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7uiyigrbycao",
      "datasheetId": "000004208",
      "name": "Defiler",
      "pointsCost": 290,
      "pointsLabel": "1 model (1st unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Heavy reaper autocannon (instead of heavy baleflamer)",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "Heavy reaper autocannon (instead of heavy missile launcher)",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7wzm8loth2or",
      "datasheetId": "000004095",
      "name": "Daemonettes",
      "pointsCost": 90,
      "pointsLabel": "10 models",
      "variantKey": "10 models",
      "modelCount": 10,
      "requiresDetachment": "Carnival of Excess",
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7x29svuyllw9",
      "datasheetId": "000004095",
      "name": "Daemonettes",
      "pointsCost": 90,
      "pointsLabel": "10 models",
      "variantKey": "10 models",
      "modelCount": 10,
      "requiresDetachment": "Carnival of Excess",
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7x1x96cqxwnf",
      "datasheetId": "000004095",
      "name": "Daemonettes",
      "pointsCost": 90,
      "pointsLabel": "10 models",
      "variantKey": "10 models",
      "modelCount": 10,
      "requiresDetachment": "Carnival of Excess",
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7x9bazg70twg",
      "datasheetId": "000004080",
      "name": "Infractors",
      "pointsCost": 85,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7xml0ojncqcb",
      "datasheetId": "000004079",
      "name": "Tormentors",
      "pointsCost": 80,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "The Obsessionist’s bolt pistol can be replaced with 1 plasma pistol.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "The Obsessionist’s power sword can be replaced with 1 rapture lash.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "For every 5 models in this unit, 1 Tormentor’s boltgun can be replaced with 1 meltagun.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "1 Tormentor can be equipped with 1 icon of excess.",
          "cost": 0,
          "qty": 1
        }
      ]
    }
  ],
  "createdAt": 1782071645714,
  "updatedAt": 1782072479654
}
```
</details>

---
### 2026-06-21T20:13:53.725Z

_Emperor’s Children list — Emperor’s Children · Strike Force · Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

Sul testo degli Enanchements metti da che battagliore provengono. Metti un tooltip col testo dell'enanchement.


<details><summary>Current list</summary>

```json
{
  "id": "mqo7g26q4kmzldi",
  "name": "Emperor’s Children list",
  "factionId": "EC",
  "battleSizeId": "2",
  "detachmentIds": [
    "000001036",
    "000900003"
  ],
  "units": [
    {
      "uid": "mqo7spqs0wli4yy",
      "datasheetId": "000004083",
      "name": "Lucius the Eternal",
      "pointsCost": 130,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7suoxfd6zwlr",
      "datasheetId": "000004087",
      "name": "Daemon Prince of Slaanesh with Wings",
      "pointsCost": 205,
      "pointsLabel": "1 model (1st unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7t0u7kc8iwk9",
      "datasheetId": "000004078",
      "name": "Lord Exultant",
      "pointsCost": 80,
      "pointsLabel": "1 model (1st-2nd unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Rapture lash (instead of plasma pistol)",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7t5j2j96b3rb",
      "datasheetId": "000004078",
      "name": "Lord Exultant",
      "pointsCost": 80,
      "pointsLabel": "1 model (1st-2nd unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Rapture lash (instead of plasma pistol)",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7u5ff4u4lhgx",
      "datasheetId": "000004091",
      "name": "Maulerfiend",
      "pointsCost": 130,
      "pointsLabel": "1 model (1st-2nd unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "This model’s lasher tendrils can be replaced with 2 magma cutters.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7udrl5hjzesc",
      "datasheetId": "000004090",
      "name": "Chaos Spawn",
      "pointsCost": 70,
      "pointsLabel": "2 models",
      "variantKey": "2 models",
      "modelCount": 2,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7uiyigrbycao",
      "datasheetId": "000004208",
      "name": "Defiler",
      "pointsCost": 290,
      "pointsLabel": "1 model (1st unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Heavy reaper autocannon (instead of heavy baleflamer)",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "Heavy reaper autocannon (instead of heavy missile launcher)",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7wzm8loth2or",
      "datasheetId": "000004095",
      "name": "Daemonettes",
      "pointsCost": 90,
      "pointsLabel": "10 models",
      "variantKey": "10 models",
      "modelCount": 10,
      "requiresDetachment": "Carnival of Excess",
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7x29svuyllw9",
      "datasheetId": "000004095",
      "name": "Daemonettes",
      "pointsCost": 90,
      "pointsLabel": "10 models",
      "variantKey": "10 models",
      "modelCount": 10,
      "requiresDetachment": "Carnival of Excess",
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7x1x96cqxwnf",
      "datasheetId": "000004095",
      "name": "Daemonettes",
      "pointsCost": 90,
      "pointsLabel": "10 models",
      "variantKey": "10 models",
      "modelCount": 10,
      "requiresDetachment": "Carnival of Excess",
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7x9bazg70twg",
      "datasheetId": "000004080",
      "name": "Infractors",
      "pointsCost": 85,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "The Obsessionist’s bolt pistol can be replaced with 1 plasma pistol.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "The Obsessionist’s power sword can be replaced with 1 rapture lash.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7yzqhjppjtn2",
      "datasheetId": "000004080",
      "name": "Infractors",
      "pointsCost": 85,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "The Obsessionist’s bolt pistol can be replaced with 1 plasma pistol.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "The Obsessionist’s power sword can be replaced with 1 rapture lash.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7xml0ojncqcb",
      "datasheetId": "000004079",
      "name": "Tormentors",
      "pointsCost": 80,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "The Obsessionist’s bolt pistol can be replaced with 1 plasma pistol.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "The Obsessionist’s power sword can be replaced with 1 rapture lash.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "For every 5 models in this unit, 1 Tormentor’s boltgun can be replaced with 1 meltagun.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "1 Tormentor can be equipped with 1 icon of excess.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7zn4uzhe1f1f",
      "datasheetId": "000004089",
      "name": "Flawless Blades",
      "pointsCost": 190,
      "pointsLabel": "6 models",
      "variantKey": "6 models",
      "modelCount": 6,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": []
    },
    {
      "uid": "mqo80le5y0ddea3",
      "datasheetId": "000004088",
      "name": "Noise Marines",
      "pointsCost": 145,
      "pointsLabel": "6 models (1st-2nd unit)",
      "variantKey": "6 models",
      "modelCount": 6,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Up to 2 Noise Marines can each replace their sonic blaster with 1 blastmaster.",
          "cost": 0,
          "qty": 2
        }
      ]
    },
    {
      "uid": "mqo80rntctn4vyz",
      "datasheetId": "000004093",
      "name": "Chaos Rhino",
      "pointsCost": 80,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Combi-weapon",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "This model can be equipped with 1 havoc launcher or can replace 1 combi-bolter with 1 havoc launcher.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo821062cbn6m7",
      "datasheetId": "000004098",
      "name": "Seekers",
      "pointsCost": 80,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "requiresDetachment": "Carnival of Excess",
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "1 Seeker that is not equipped with a daemonic icon can be equipped with 1 instrument of Chaos.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "1 Seeker that is not equipped with an instrument of Chaos can be equipped with 1 daemonic icon.",
          "cost": 0,
          "qty": 1
        }
      ]
    }
  ],
  "createdAt": 1782071645714,
  "updatedAt": 1782072678361
}
```
</details>

---
### 2026-06-21T20:15:16.190Z

_Emperor’s Children list — Emperor’s Children · Strike Force · Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

In generale su questa lista nessuno degli enanchements controlla correttamente i requisiti delle keyword. Penso sia così per tutti gli enanchements della codebase e bisognerebbe verificare


<details><summary>Current list</summary>

```json
{
  "id": "mqo7g26q4kmzldi",
  "name": "Emperor’s Children list",
  "factionId": "EC",
  "battleSizeId": "2",
  "detachmentIds": [
    "000001036",
    "000900003"
  ],
  "units": [
    {
      "uid": "mqo7spqs0wli4yy",
      "datasheetId": "000004083",
      "name": "Lucius the Eternal",
      "pointsCost": 130,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7suoxfd6zwlr",
      "datasheetId": "000004087",
      "name": "Daemon Prince of Slaanesh with Wings",
      "pointsCost": 205,
      "pointsLabel": "1 model (1st unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7t0u7kc8iwk9",
      "datasheetId": "000004078",
      "name": "Lord Exultant",
      "pointsCost": 80,
      "pointsLabel": "1 model (1st-2nd unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Rapture lash (instead of plasma pistol)",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7t5j2j96b3rb",
      "datasheetId": "000004078",
      "name": "Lord Exultant",
      "pointsCost": 80,
      "pointsLabel": "1 model (1st-2nd unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Rapture lash (instead of plasma pistol)",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7u5ff4u4lhgx",
      "datasheetId": "000004091",
      "name": "Maulerfiend",
      "pointsCost": 130,
      "pointsLabel": "1 model (1st-2nd unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "This model’s lasher tendrils can be replaced with 2 magma cutters.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7udrl5hjzesc",
      "datasheetId": "000004090",
      "name": "Chaos Spawn",
      "pointsCost": 70,
      "pointsLabel": "2 models",
      "variantKey": "2 models",
      "modelCount": 2,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7uiyigrbycao",
      "datasheetId": "000004208",
      "name": "Defiler",
      "pointsCost": 290,
      "pointsLabel": "1 model (1st unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Heavy reaper autocannon (instead of heavy baleflamer)",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "Heavy reaper autocannon (instead of heavy missile launcher)",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7wzm8loth2or",
      "datasheetId": "000004095",
      "name": "Daemonettes",
      "pointsCost": 90,
      "pointsLabel": "10 models",
      "variantKey": "10 models",
      "modelCount": 10,
      "requiresDetachment": "Carnival of Excess",
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7x29svuyllw9",
      "datasheetId": "000004095",
      "name": "Daemonettes",
      "pointsCost": 90,
      "pointsLabel": "10 models",
      "variantKey": "10 models",
      "modelCount": 10,
      "requiresDetachment": "Carnival of Excess",
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7x1x96cqxwnf",
      "datasheetId": "000004095",
      "name": "Daemonettes",
      "pointsCost": 90,
      "pointsLabel": "10 models",
      "variantKey": "10 models",
      "modelCount": 10,
      "requiresDetachment": "Carnival of Excess",
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo7x9bazg70twg",
      "datasheetId": "000004080",
      "name": "Infractors",
      "pointsCost": 85,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "The Obsessionist’s bolt pistol can be replaced with 1 plasma pistol.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "The Obsessionist’s power sword can be replaced with 1 rapture lash.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7yzqhjppjtn2",
      "datasheetId": "000004080",
      "name": "Infractors",
      "pointsCost": 85,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "The Obsessionist’s bolt pistol can be replaced with 1 plasma pistol.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "The Obsessionist’s power sword can be replaced with 1 rapture lash.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7xml0ojncqcb",
      "datasheetId": "000004079",
      "name": "Tormentors",
      "pointsCost": 80,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "The Obsessionist’s bolt pistol can be replaced with 1 plasma pistol.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "The Obsessionist’s power sword can be replaced with 1 rapture lash.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "For every 5 models in this unit, 1 Tormentor’s boltgun can be replaced with 1 meltagun.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "1 Tormentor can be equipped with 1 icon of excess.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo7zn4uzhe1f1f",
      "datasheetId": "000004089",
      "name": "Flawless Blades",
      "pointsCost": 190,
      "pointsLabel": "6 models",
      "variantKey": "6 models",
      "modelCount": 6,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": []
    },
    {
      "uid": "mqo80le5y0ddea3",
      "datasheetId": "000004088",
      "name": "Noise Marines",
      "pointsCost": 145,
      "pointsLabel": "6 models (1st-2nd unit)",
      "variantKey": "6 models",
      "modelCount": 6,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Up to 2 Noise Marines can each replace their sonic blaster with 1 blastmaster.",
          "cost": 0,
          "qty": 2
        }
      ]
    },
    {
      "uid": "mqo80rntctn4vyz",
      "datasheetId": "000004093",
      "name": "Chaos Rhino",
      "pointsCost": 80,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "Combi-weapon",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "This model can be equipped with 1 havoc launcher or can replace 1 combi-bolter with 1 havoc launcher.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo821062cbn6m7",
      "datasheetId": "000004098",
      "name": "Seekers",
      "pointsCost": 80,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "requiresDetachment": "Carnival of Excess",
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "1 Seeker that is not equipped with a daemonic icon can be equipped with 1 instrument of Chaos.",
          "cost": 0,
          "qty": 1
        },
        {
          "name": "1 Seeker that is not equipped with an instrument of Chaos can be equipped with 1 daemonic icon.",
          "cost": 0,
          "qty": 1
        }
      ]
    }
  ],
  "createdAt": 1782071645714,
  "updatedAt": 1782072678361
}
```
</details>

---
### 2026-06-21T20:19:17.068Z

_Space Marines list — Space Marines · Strike Force · Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

La barra assoluta di riassunto di punti dp ed enanchements su cellulare sfora infiniti della.pagina dx e sx


<details><summary>Current list</summary>

```json
{
  "id": "mqnridxkdhsrk52",
  "name": "Space Marines list",
  "factionId": "SM",
  "battleSizeId": "2",
  "detachmentIds": [
    "000001119",
    "000900007"
  ],
  "units": [
    {
      "uid": "mqnrjjmvfu9nrhg",
      "datasheetId": "000004167",
      "name": "Suboden Khan",
      "pointsCost": 100,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "attachedToUid": "mqnrk20y9lpiilo"
    },
    {
      "uid": "mqnrk20y9lpiilo",
      "datasheetId": "000002712",
      "name": "Outrider Squad",
      "pointsCost": 140,
      "pointsLabel": "6 models",
      "variantKey": "6 models",
      "modelCount": 6,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "1 Invader ATV",
          "cost": 60,
          "qty": 1
        },
        {
          "name": "An Invader ATV’s onslaught gatling cannon can be replaced with 1 multi-melta.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqnrl62f4b4ah4i",
      "datasheetId": "000002255",
      "name": "Sternguard Veteran Squad",
      "pointsCost": 100,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": []
    },
    {
      "uid": "mqo5gasz8et531q",
      "datasheetId": "000001191",
      "name": "Stormraven Gunship",
      "pointsCost": 280,
      "pointsLabel": "1 model (1st unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": []
    }
  ],
  "createdAt": 1782044880392,
  "updatedAt": 1782068621643,
  "subFaction": "White Scars"
}
```
</details>

---
### 2026-06-21T20:24:40.673Z

_Space Marines list — Space Marines · Strike Force · Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

Non c'è visibilità delle unità a cui le unità possono unirsi con leader o come support. Non c'è controllo sulle unità che sono già unite ad una unità. L'unità a cui non ci si può aggiungere dovrebbe essere grigia ed indicare quale altro character occupa quello slot. Ricorda che ogni unità può avere un leader ed un supporto. Alle unità dovrebbe essere possibile aggiungere un nome custom e nel caso di leader e supporto allegati dovrebbe essere usato il nome custom come indicazione di slot già occupato nella lista


<details><summary>Current list</summary>

```json
{
  "id": "mqnridxkdhsrk52",
  "name": "Space Marines list",
  "factionId": "SM",
  "battleSizeId": "2",
  "detachmentIds": [
    "000001119",
    "000900007"
  ],
  "units": [
    {
      "uid": "mqnrjjmvfu9nrhg",
      "datasheetId": "000004167",
      "name": "Suboden Khan",
      "pointsCost": 100,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "attachedToUid": "mqnrk20y9lpiilo"
    },
    {
      "uid": "mqnrk20y9lpiilo",
      "datasheetId": "000002712",
      "name": "Outrider Squad",
      "pointsCost": 140,
      "pointsLabel": "6 models",
      "variantKey": "6 models",
      "modelCount": 6,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "1 Invader ATV",
          "cost": 60,
          "qty": 1
        },
        {
          "name": "An Invader ATV’s onslaught gatling cannon can be replaced with 1 multi-melta.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqnrl62f4b4ah4i",
      "datasheetId": "000002255",
      "name": "Sternguard Veteran Squad",
      "pointsCost": 100,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": []
    },
    {
      "uid": "mqo5gasz8et531q",
      "datasheetId": "000001191",
      "name": "Stormraven Gunship",
      "pointsCost": 280,
      "pointsLabel": "1 model (1st unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": []
    },
    {
      "uid": "mqo8e4g7i1p74og",
      "datasheetId": "000001157",
      "name": "Intercessor Squad",
      "pointsCost": 150,
      "pointsLabel": "10 models",
      "variantKey": "10 models",
      "modelCount": 10,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqo8ein0o0o1txz",
      "datasheetId": "000002773",
      "name": "Apothecary",
      "pointsCost": 40,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "attachedToUid": "mqo8e4g7i1p74og"
    },
    {
      "uid": "mqo8em2r3upgciv",
      "datasheetId": "000002775",
      "name": "Ancient",
      "pointsCost": 40,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "attachedToUid": "mqo8e4g7i1p74og"
    },
    {
      "uid": "mqo8eyeihad7iuv",
      "datasheetId": "000000073",
      "name": "Captain",
      "pointsCost": 80,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "attachedToUid": "mqo8e4g7i1p74og"
    }
  ],
  "createdAt": 1782044880392,
  "updatedAt": 1782073298761,
  "subFaction": "White Scars"
}
```
</details>

---
### 2026-06-21T20:43:33.651Z

_Space Marines list — Space Marines · Strike Force · Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

La card delle sternguard mi pare non abbiano il profilo del loro fucile base


<details><summary>Current list</summary>

```json
{
  "id": "mqnridxkdhsrk52",
  "name": "Space Marines list",
  "factionId": "SM",
  "battleSizeId": "2",
  "detachmentIds": [
    "000001119",
    "000900007"
  ],
  "units": [
    {
      "uid": "mqnrjjmvfu9nrhg",
      "datasheetId": "000004167",
      "name": "Suboden Khan",
      "pointsCost": 100,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "attachedToUid": "mqnrk20y9lpiilo"
    },
    {
      "uid": "mqnrk20y9lpiilo",
      "datasheetId": "000002712",
      "name": "Outrider Squad",
      "pointsCost": 140,
      "pointsLabel": "6 models",
      "variantKey": "6 models",
      "modelCount": 6,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": [
        {
          "name": "1 Invader ATV",
          "cost": 60,
          "qty": 1
        },
        {
          "name": "An Invader ATV’s onslaught gatling cannon can be replaced with 1 multi-melta.",
          "cost": 0,
          "qty": 1
        }
      ]
    },
    {
      "uid": "mqo93b1dopplgbt",
      "datasheetId": "000002255",
      "name": "Sternguard Veteran Squad",
      "pointsCost": 100,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": []
    },
    {
      "uid": "mqo5gasz8et531q",
      "datasheetId": "000001191",
      "name": "Stormraven Gunship",
      "pointsCost": 280,
      "pointsLabel": "1 model (1st unit)",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": []
    },
    {
      "uid": "mqo8e4g7i1p74og",
      "datasheetId": "000001157",
      "name": "Intercessor Squad",
      "pointsCost": 80,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "wargearCosts": []
    }
  ],
  "createdAt": 1782044880392,
  "updatedAt": 1782074413583,
  "subFaction": "White Scars"
}
```
</details>

---
### 2026-06-22T06:58:52.003Z

_Space Marines list — Space Marines · Strike Force · Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36_

In datasheet oltre a armi e regole speciali aggiungi due sezioni per i datasheet per cui sono non vuote: Leader e support, con le unita per cui quell'unità può unirsi rispettivamente come leader o come support


<details><summary>Current list</summary>

```json
{
  "id": "mqouzem6l15b85j",
  "name": "Space Marines list",
  "factionId": "SM",
  "battleSizeId": "2",
  "detachmentIds": [
    "000001119",
    "000000994"
  ],
  "units": [
    {
      "uid": "mqov21e6yx7yo3j",
      "datasheetId": "000004167",
      "name": "Suboden Khan",
      "pointsCost": 100,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqov24o6nolz8ay",
      "datasheetId": "000002709",
      "name": "Kor’sarro Khan",
      "pointsCost": 55,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqov2dke8pnz0as",
      "datasheetId": "000002266",
      "name": "Librarian",
      "pointsCost": 60,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "attachedToUid": "mqov3625uyapoyg"
    },
    {
      "uid": "mqov2ofhokq2t5x",
      "datasheetId": "000002773",
      "name": "Apothecary",
      "pointsCost": 40,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false,
      "attachedToUid": "mqov3625uyapoyg"
    },
    {
      "uid": "mqov3625uyapoyg",
      "datasheetId": "000001157",
      "name": "Intercessor Squad",
      "pointsCost": 80,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": false,
      "warlord": false,
      "customName": "Joey's"
    },
    {
      "uid": "mqov3k9am6g5dsp",
      "datasheetId": "000002775",
      "name": "Ancient",
      "pointsCost": 40,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    }
  ],
  "createdAt": 1782111179454,
  "updatedAt": 1782111399430,
  "subFaction": "White Scars"
}
```
</details>

---
### 2026-06-22T08:15:56.809Z

_New40k List Builder — 11th edition · #new40k · Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0_

Solo per verificare che funzioni <3

---
### 2026-06-22T08:49:03.440Z

_Il mio regno per un cavallo — Adeptus Custodes · Strike Force · Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0_

Forse potresti inserire un tag che indichi, Epic Hero, Warlord, ecc


<details><summary>Current list</summary>

```json
{
  "id": "mqoxzgdrja4ru5j",
  "name": "Il mio regno per un cavallo",
  "factionId": "AC",
  "battleSizeId": "2",
  "detachmentIds": [
    "000900047",
    "000000863"
  ],
  "units": [
    {
      "uid": "mqoz1lxns9qpnmd",
      "datasheetId": "000004074",
      "name": "Sanctifiers",
      "pointsCost": 100,
      "pointsLabel": "9 models",
      "variantKey": "9 models",
      "modelCount": 9,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz1on3xnaa9b7",
      "datasheetId": "000000870",
      "name": "Vindicare Assassin",
      "pointsCost": 110,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz1r1h2arfrkm",
      "datasheetId": "000003828",
      "name": "Daemonhost",
      "pointsCost": 40,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz1tu90owlfci",
      "datasheetId": "000004174",
      "name": "Aquila Kill Team",
      "pointsCost": 100,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz1ut1vt07wd8",
      "datasheetId": "000004174",
      "name": "Aquila Kill Team",
      "pointsCost": 100,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz1w9376p46jh",
      "datasheetId": "000000871",
      "name": "Callidus Assassin",
      "pointsCost": 100,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz1xcpcrqg7ah",
      "datasheetId": "000000871",
      "name": "Callidus Assassin",
      "pointsCost": 100,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz1yz7v2czhj6",
      "datasheetId": "000000873",
      "name": "Culexus Assassin",
      "pointsCost": 85,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz206lwpsn6yu",
      "datasheetId": "000000873",
      "name": "Culexus Assassin",
      "pointsCost": 85,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz22yxt045ybp",
      "datasheetId": "000002761",
      "name": "Damned Legionnaires",
      "pointsCost": 90,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz23pbqydkjbw",
      "datasheetId": "000002761",
      "name": "Damned Legionnaires",
      "pointsCost": 90,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz252p5fi1891",
      "datasheetId": "000002761",
      "name": "Damned Legionnaires",
      "pointsCost": 90,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz290nlvyou3a",
      "datasheetId": "000003826",
      "name": "Indomitor Kill Team",
      "pointsCost": 120,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz2dvnvnp173c",
      "datasheetId": "000000875",
      "name": "Inquisitor Karamazov",
      "pointsCost": 140,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz2g9dw25fvqn",
      "datasheetId": "000002765",
      "name": "Navigator",
      "pointsCost": 60,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz2i5jmy02m54",
      "datasheetId": "000002765",
      "name": "Navigator",
      "pointsCost": 60,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz2j1aoxfkkaa",
      "datasheetId": "000002765",
      "name": "Navigator",
      "pointsCost": 60,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz2nrr6ivyrmq",
      "datasheetId": "000003827",
      "name": "Spectrus Kill Team",
      "pointsCost": 90,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz2papc633y3i",
      "datasheetId": "000003827",
      "name": "Spectrus Kill Team",
      "pointsCost": 90,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz2ta88o3fe3q",
      "datasheetId": "000003824",
      "name": "Proteus Kill Team",
      "pointsCost": 160,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz3326ejrhb9b",
      "datasheetId": "000003828",
      "name": "Daemonhost",
      "pointsCost": 40,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    }
  ],
  "createdAt": 1782116220591,
  "updatedAt": 1782118098429
}
```
</details>

---
### 2026-06-22T08:51:05.551Z

_Aeldari list — Aeldari · Strike Force · Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0_

Non viene controllata la presenza o meno dei personaggi richiedi dal detachment. Non viene controllato il fatto che epic eroes non ynnari non possono essere presi assieme a yvraine o Yncarne


<details><summary>Current list</summary>

```json
{
  "id": "mqoz0hxhfckff3y",
  "name": "Aeldari list",
  "factionId": "AE",
  "battleSizeId": "2",
  "detachmentIds": [
    "000001022",
    "000900025"
  ],
  "units": [
    {
      "uid": "mqoz5ou3zq26rxp",
      "datasheetId": "000002542",
      "name": "Yvraine",
      "pointsCost": 100,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    },
    {
      "uid": "mqoz5ryzu7vbb8w",
      "datasheetId": "000000571",
      "name": "Asurmen",
      "pointsCost": 135,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": false,
      "warlord": false
    }
  ],
  "createdAt": 1782117948869,
  "updatedAt": 1782118195163
}
```
</details>

---
### 2026-06-22T08:52:34.507Z

_Il mio regno per un cavallo — Adeptus Custodes · Strike Force · Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0_

Forse puoi indicare nel menu dell'unità quante volte al massimo può essere presa. Es Damned Legionaires (max 4)


<details><summary>Current list</summary>

```json
{
  "id": "mqoxzgdrja4ru5j",
  "name": "Il mio regno per un cavallo",
  "factionId": "AC",
  "battleSizeId": "2",
  "detachmentIds": [
    "000900047",
    "000000863"
  ],
  "units": [
    {
      "uid": "mqoz1on3xnaa9b7",
      "datasheetId": "000000870",
      "name": "Vindicare Assassin",
      "pointsCost": 110,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM",
      "customName": "Vindicare Assassin"
    },
    {
      "uid": "mqoz1r1h2arfrkm",
      "datasheetId": "000003828",
      "name": "Daemonhost",
      "pointsCost": 40,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz1tu90owlfci",
      "datasheetId": "000004174",
      "name": "Aquila Kill Team",
      "pointsCost": 100,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz1ut1vt07wd8",
      "datasheetId": "000004174",
      "name": "Aquila Kill Team",
      "pointsCost": 100,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": true,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz1w9376p46jh",
      "datasheetId": "000000871",
      "name": "Callidus Assassin",
      "pointsCost": 100,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz206lwpsn6yu",
      "datasheetId": "000000873",
      "name": "Culexus Assassin",
      "pointsCost": 85,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz290nlvyou3a",
      "datasheetId": "000003826",
      "name": "Indomitor Kill Team",
      "pointsCost": 120,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz2dvnvnp173c",
      "datasheetId": "000000875",
      "name": "Inquisitor Karamazov",
      "pointsCost": 140,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": true,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": true,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz2g9dw25fvqn",
      "datasheetId": "000002765",
      "name": "Navigator",
      "pointsCost": 60,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz2i5jmy02m54",
      "datasheetId": "000002765",
      "name": "Navigator",
      "pointsCost": 60,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz2j1aoxfkkaa",
      "datasheetId": "000002765",
      "name": "Navigator",
      "pointsCost": 60,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz2nrr6ivyrmq",
      "datasheetId": "000003827",
      "name": "Spectrus Kill Team",
      "pointsCost": 90,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz2papc633y3i",
      "datasheetId": "000003827",
      "name": "Spectrus Kill Team",
      "pointsCost": 90,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz2ta88o3fe3q",
      "datasheetId": "000003824",
      "name": "Proteus Kill Team",
      "pointsCost": 160,
      "pointsLabel": "5 models",
      "variantKey": "5 models",
      "modelCount": 5,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz3326ejrhb9b",
      "datasheetId": "000003828",
      "name": "Daemonhost",
      "pointsCost": 40,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz5sgfjqb58w8",
      "datasheetId": "000002761",
      "name": "Damned Legionnaires",
      "pointsCost": 180,
      "pointsLabel": "10 models",
      "variantKey": "10 models",
      "modelCount": 10,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz6cdkrswaihm",
      "datasheetId": "000002761",
      "name": "Damned Legionnaires",
      "pointsCost": 180,
      "pointsLabel": "10 models",
      "variantKey": "10 models",
      "modelCount": 10,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz6h63xq979lw",
      "datasheetId": "000002761",
      "name": "Damned Legionnaires",
      "pointsCost": 180,
      "pointsLabel": "10 models",
      "variantKey": "10 models",
      "modelCount": 10,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": false,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    },
    {
      "uid": "mqoz70wefb8npmx",
      "datasheetId": "000003815",
      "name": "Watch Master",
      "pointsCost": 95,
      "pointsLabel": "1 model",
      "variantKey": "1 model",
      "modelCount": 1,
      "isEpicHero": false,
      "isBattleline": false,
      "isCharacter": true,
      "isAlly": true,
      "warlord": false,
      "allyKeyword": "AGENTS OF THE IMPERIUM"
    }
  ],
  "createdAt": 1782116220591,
  "updatedAt": 1782118275493
}
```
</details>
