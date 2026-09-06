# Pixabay-äänet Timbertrailiin

Tarkistettu 6.9.2026: [Pixabayn julkinen API](https://pixabay.com/api/docs/) tarjoaa kuvia ja videoita, ei dokumentoitua äänitehostehakua. API-avainta ei tarvita. Käytämme tavallista verkkohakua ja Pixabayn omaa latauspainiketta, sitten paikallista tuontia. Työkalu ei ole automaattinen Pixabay-latauspalvelu.

## Käyttäjälle

Voit pyytää esimerkiksi ”etsi Pixabaystä parempi virvelin jarruääni”. Avustaja käyttää alla olevia hakuja, tarkistaa lähdesivut ja etsii sopivat ehdokkaat. Jos lataus vaatii kirjautumisen tai ihmistarkistuksen, tee se itse selaimessa. Salasanaa tai API-avainta ei anneta avustajalle.

Ladatun MP3-tiedoston voi tallentaa projektin `work/audio/`-kansioon. Anna myös äänen Pixabay-sivun linkki. Avustaja hoitaa tuonnin, ajoituksen ja voimakkuuden. Alkuperäiset lataukset ja mahdollinen lisenssitodistus säilytetään paikallisesti `work/audio/`-kansiossa. Pelin äänenvoimakkuus ja mykistys koskevat myös näitä ääniä.

## Haku ja ensimmäiset ehdokkaat

`npm run sounds -- search` näyttää toimintoihin sopivat hakulinkit. `npm run sounds -- search reelWind` hakee kelaukseen, `reelDrag` jarruun. Myös vapaa englanninkielinen hakusana toimii: `npm run sounds -- search "wooden chest"`.

Nämä ovat **kuuntelemattomia ehdokkaita**, eivät peliin asennettuja tai äänenlaadultaan hyväksyttyjä:

| Toiminto | Ehdokas | Tekijä |
| --- | --- | --- |
| Kelaus | [Fishing reel](https://pixabay.com/sound-effects/film-special-effects-fishing-reel-302355/) | AudioPapkin |
| Kelaus | [Spinning reel](https://pixabay.com/sound-effects/technology-spinning-reel-27903/) | tosha73 (Freesound), Pixabay: freesound_community |
| Jarru | [Fly Reel Fish Pulling Saricione](https://pixabay.com/sound-effects/film-special-effects-fly-reel-fish-pulling-saricione-94671/) | paulprit (Freesound), Pixabay: freesound_community |

Viimeinen on perhokelan ääni: arvioi kuuntelemalla sopivuus virveliin. Pelkkä nimi ei riitä valintaan.

## Tuonti avustajalle

1. Avaa hakulinkit tai hae verkosta `site:pixabay.com/sound-effects/` ja toimintoon sopivat sanat. Tarkista yksittäinen lähdesivu, tekijä ja lisenssi. Valitse oikea ilmainen Pixabay-tulos, ei sponsoroitua mainosta.
2. Lataa normaalilla latauspainikkeella. Älä käytä keksittyä audio-API:a tai pysyviä CDN-linkkejä. Jos kirjautuminen/ihmistarkistus estää lataamisen, kerro täsmällisesti käyttäjältä tarvittava vaihe.
3. Kuuntele ja valitse puhdas kohta ilman puhetta/musiikkia. Säilytä latauksen lähdetiedot ja mahdollinen todistus. [Content License](https://pixabay.com/service/license-summary/) sallii ilmaisen käytön ja muokkauksen ehtojensa mukaisesti; [täydet ehdot](https://pixabay.com/service/terms/) kieltävät erillisen jakelun sellaisenaan. Käytä ääntä osana peliä, älä julkaise alkuperäisten äänien latauskirjastoa. Muiden oikeuksia tai yksittäisen tallenteen alkuperää ei voi päätellä pelkästä hakutuloksesta.
4. Tee paikallinen `work/audio/recipe.json`. Esimerkki alla on täytettävä ja kuunneltava ennen kuin `reviewed` muutetaan todeksi. `file` on suhteessa reseptiin; muut ajat sekunteja. `notes` kuvaa kuuntelun ja muokkaukset.

```json
{
  "event": "reelWind",
  "file": "fishing-reel.mp3",
  "title": "Fishing reel",
  "creator": "AudioPapkin",
  "source": "https://pixabay.com/sound-effects/film-special-effects-fishing-reel-302355/",
  "downloadedOn": "2026-09-06",
  "reviewed": false,
  "notes": "Täytä kuuntelun jälkeen: valittu kohta ja lähteen/lisenssin tarkistus.",
  "offset": 0,
  "duration": 0.24,
  "gain": 0.3
}
```

5. `npm run sounds -- import work/audio/recipe.json` kopioi tiedoston yksilöllisellä sisältötiivisteellä ja päivittää `assets/audio/library.json`-rekisterin. Sama toiminto korvautuu rekisterissä, vanhaa tiedostoa ei poisteta. Tuonti tarkistaa metatiedot, tiedoston otsakkeen ja kokorajan; se ei kuuntele ääntä eikä tarkista tekijänoikeuksia automaattisesti.
6. Testaa peli HTTP-palvelimella tai Pagesissa. `audio-samples.js` esilataa rekisterin Web Audioon. Latautuva, puuttuva tai selaimelle sopimaton ääni käyttää vanhaa synteettistä ääntä; myöhässä valmistunutta toimintoa ei soiteta jälkikäteen. `file://`-avaus voi estää tallenneäänien latauksen. Kelauksen näyte saa kestää enintään 0,26 s ja jarrun 0,12 s nykyisen toistorytmin vuoksi. Lyhyet häivytykset vähentävät napsahduksia. Tämä on lyhyiden toimintotehosteiden tuki, ei jatkuvien luontoäänien tai musiikin tuonti.
7. Säädä kuunnellen voimakkuus ja katkaisukohta. Tarkista erityisesti kelauksen/jarrun toisto, vapautus, tauko ja mykistys. Aja projektin neljä julkaisutarkistusta. Build kopioi vain rekisteröidyt äänet; alkuperäiset lataukset ja reseptit eivät siirry Pagesiin.

Alkutilassa rekisteri on tyhjä: tämän järjestelyn mukana ei ole vielä ladattu Pixabay-ääniä.
