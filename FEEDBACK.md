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
