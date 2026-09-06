# Pixabay-äänet Timbertrailissa

## Käyttöönotto 6.9.2026

Peli käyttää 53:een äänitapahtumaan sovitettuja näytteitä 27 Pixabay-tallenteesta. Mukana ovat kalastus, metsä- ja lattia-askeleet, kerääminen ja työkalut, mökin toiminnot, kirja ja valintapalaute, Kajo sekä linnut, puro, tuuli ja sade. Musiikki ja yön hyönteisäänet säilyvät synteettisinä. Kaikkien asennettujen äänten nimet, tekijät, yksittäiset Pixabay-lähdesivut, latauspäivä, leikkauskohdat ja tarkistustila löytyvät [äänirekisteristä](audio/library.json).

Näytteet on leikattu, muutettu 24 kHz:n mono-WAV-tiedostoiksi, tasattu ja häivytetty. Pankin koko on noin 2,3 MB. Kelauksen, jarrun, tuulen ja sateen näytteissä on saumaa tasaava 120 ms:n limitys. Kelaus/jarru seuraavat kalastuksen kuormitusta, ja ne pysähtyvät toiminnon päättyessä, tauolla ja mykistettäessä. Tulesta soi vain yksittäisiä lyhyitä räsähdyksiä pitkillä hiljaisilla väleillä.

**Kuunteluarvio on tekemättä.** `reviewed: true` tarkoittaa lähteen ja teknisen tiedoston tarkistusta; `listeningReviewed: false` kertoo tämän rajan erikseen. Kaikki 53 näytettä on dekoodattu oikeassa selaimessa, ja siellä on tarkistettu myös kelaus–jarru-vaihto, keskeytys, tauko ja mykistys. Tämä ei todista äänen miellyttävyyttä tai luonnollisuutta. Esimerkiksi jarrun lähde on perhokela, ja sen sopivuus virveliin tulee arvioida pelissä kuunnellen.

## Hakeminen ja lataaminen

[Pixabayn julkisessa API:ssa](https://pixabay.com/api/docs/) ei ole dokumentoitua äänitehostehakua (tarkistettu 6.9.2026). API-avainta ei tarvita. `npm run sounds -- search` näyttää hakulinkkejä; `npm run sounds -- search reelWind` tai vapaa hakusana tarkentaa hakua.

Hakutuloksen oikean reunan latauspainiketta voi käyttää suoraan. Tallenna samalla tuloksen nimi, tekijä ja lähdesivun linkki. Suosi ilmaista Pixabay-tulosta, älä sponsoroitua mainosta. Kirjautuminen voi olla tarpeen; salasanaa tai evästeitä ei kopioida projektin tiedostoihin.

Tässä työssä sisäinen selain näytti latausvahvistuksen kirjoittamatta useimpia tiedostoja levylle. Ratkaisu oli käynnistää valitun tuloksen esikuuntelu, tunnistaa selaimen kyseisellä sivulla havaitsema julkinen MP3-tiedosto ja tallentaa se paikallisesti. Älä arvaa osoitteita tai käytä dokumentoimattomia haku-API-kutsuja. Jos sivu vaatii ihmistarkistuksen tai estää pääsyn, jätä se käyttäjän hoidettavaksi. Pelin runtime käyttää vain paikallisia tiedostoja, ei Pixabay-CDN:ää.

Alkuperäiset lataukset, analyysit ja valmistelureseptit ovat paikallisessa `work/audio/`-kansiossa, joka ei siirry Gitiin tai julkaisuun. Julkaisu kopioi vain rekisteröidyt pelinäytteet. Älä jaa alkuperäisten tallenteiden latauskokoelmaa: [Content License](https://pixabay.com/service/license-summary/) ja [täydet ehdot](https://pixabay.com/service/terms/) koskevat käyttöä osana peliä. Muut mahdolliset oikeudet on arvioitava lähdekohtaisesti.

## Yhden äänen vaihtaminen

Tallenna MP3/WAV/OGG ja paikallinen `work/audio/recipe.json`. Esimerkki on täytettävä ennen tuontia:

```json
{
  "event": "reelWind",
  "file": "prepared-reel.wav",
  "title": "Fishing reel",
  "creator": "AudioPapkin",
  "source": "https://pixabay.com/sound-effects/film-special-effects-fishing-reel-302355/",
  "downloadedOn": "2026-09-06",
  "reviewed": false,
  "listeningReviewed": false,
  "loop": true,
  "notes": "Täytä lähde- ja teknisen tarkistuksen sekä mahdollisen kuuntelun jälkeen.",
  "offset": 0,
  "duration": 1.68,
  "gain": 0.55
}
```

`file` on suhteessa reseptiin. `offset` ja `duration` ovat sekunteja. `loop: true` on tuettu vain tapahtumille `reelWind`, `reelDrag`, `wind` ja `rain`. Muut ovat kertanäytteitä. Ilman loop-asetusta kelan näyte saa kestää enintään 0,26 s ja jarrun 0,12 s. Valmistele loopin sauma ennen tuontia. Käytä lyhyitä puhtaita toimintotehosteita.

Tarkistettu resepti tuodaan komennolla `npm run sounds -- import work/audio/recipe.json`. Komento kopioi tiedoston sisältötiivisteellä nimettynä ja vaihtaa tapahtuman rekisterimerkinnän; vanhaa tiedostoa ei poisteta. `npm run sounds -- check` tarkistaa rekisterin ja tiedostojen eheyden. Työkalu ei kuuntele tai tarkista oikeuksia automaattisesti.

Testaa HTTP-palvelimella tai Pagesissa; `file://` voi estää näytteiden lataamisen. Epäonnistunut tai kesken oleva lataus käyttää synteettistä varatehostetta eikä soita vanhaa tapahtumaa jälkikäteen. Aja projektin testit, salaisuustarkistus, build ja tuotantoasset-tarkistus ennen julkaisua. Tarkista pelissä kuunnellen erityisesti loopit, askeleet, toistuvat keräilyäänet, etäisyydet ja äänenvoimakkuus.
