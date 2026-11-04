# Timbertrail — laatutason uudistus, 2.11.2026

Tavoite: yhtenäinen, viimeistelty suomalainen erämaapeli. AAA on käyttäjän
vaatima tavoitetaso, ei automaattisesti annettava hyväksyntä. Tekninen testi,
kuvan arvio, jatkuvan liikkeen pelitesti ja kuuntelu ovat erillisiä todisteita.

## Suunta ja toteutusjärjestys

1. **Maailman luettavuus ja paikan tunne.** Kingdom Two Crownsin suurten
   muotojen hierarkia, Wild n Chillin luonnollinen maasto. Metsästä aukioon,
   pihalle ja rannalle kulkemisen täytyy vaihtaa sommittelua. Korjataan ensin
   toistuva metsäseinä, kuviomainen maa ja kaaviomainen vesi.
2. **Valo ja materiaalit.** Päivä, sade, ilta ja yö saavat eri tunnelman.
   Tuli valaisee oikeita pintoja; heijastus käyttää saman hetken valaistua
   maailmaa. Mökin piha, perustukset, sisätilan ikkunat ja tulisija arvioidaan
   yhdessä. Animaation ja valon täytyy toimia ilman peittäviä efektejä.
3. **Ohjaus ja palautteet.** Klikkaus kertoo mitä tehdään ja millä ehdolla.
   Uusi komento syrjäyttää vanhan, peruutus toimii ja saapumisen toiminto
   toteutuu kerran. Kalastuksen jokainen vaihe, työkalun osuma, koiran
   reagointi ja rakentaminen tarvitsevat luettavan palautteen.
4. **Käyttöliittymä.** Kevyt pysyvä HUD, selkeä aktiivinen tavoite,
   materiaaliltaan lämmin ja yhtenäinen valikko, luettavat toimintopainikkeet.
   Journal, arkku, kauppa ja valmistus säilyttävät sisältönsä. Hyväksytyt
   kuvalliset paperivihjeet säilyvät; litteää laatikkoratkaisua ei palauteta.
5. **Hahmot, eläimet ja esineperheet.** Yhtenäinen pikselitiheys,
   anatomia ja ankkurit kaikissa toiminnoissa. Erityisesti nykyisten vanhojen
   eläin-/keräily-/pihapropien sovitus uuteen maailmaan. Hyvä still ei riitä:
   liike, suunnanvaihto, kuormitus ja toiminnan keskeytys katsotaan.
6. **Ääni, musiikki ja rytmi.** Hiljaiset materiaalikohtaiset askeleet,
   harvat luonnolliset räsähdykset, tilaan sidottu vesi ja kalastus,
   pitkät musiikittomat jaksot. Kuunteluhyväksyntää ei korvata tiedosto-
   tai spektritestillä. Muut testit tehdään mykistettyinä.
7. **Koko pelin hyväksyntä.** Kolme aluetta, kaikki mökin korjaustilat,
   sisätilat, keräily–valmistus–ruoka–lepo–kauppa–kalastus sekä tallennuksen
   jatkaminen. Pitkät FI/EN-tekstit, näppäimistö, eri näyttökoot ja
   ruutuajat. P0/P1-havainto estää kyseisen osa-alueen hyväksynnän.

## Ensimmäinen toteutuskokonaisuus

Riippumaton kuvakriitikko hylkäsi 12.10. näyttöaineistosta kolme kohtaa:
kuviomainen maa, samanlainen metsäseinä eri paikoissa ja kaaviomainen vesi.
Ne korjataan nykyisiin renderöintipolkuihin. Samalla parannetaan
vuorovaikutuskomentojen johdonmukaisuutta ja käyttöliittymän hierarkiaa.
Vertailu tehdään samoilla kameroilla ja pelitiloilla ennen/jälkeen.

## Laadunvalvonta ja säilytys

Pääagentti omistaa sommittelun, arkkitehtuurin, integraation ja hyväksynnän.
Rajattu Terra medium -toteuttaja käsittelee vuorovaikutusta; Astra high
-kriitikko arvioi kuvan itsenäisesti. Kummankaan vihreä raportti ei yksin
hyväksy kokonaisuutta. Havaitut puutteet ja ratkaisemattomat asiat kirjataan.

Työ tehdään vain Timbertrail-visual-overhaul-kansiossa. Alkuperäinen peli,
tallennukset, tunnisteet ja alueyhteydet säilyvät. Käyttäjän 2.11. tarkennus
laajensi uudistuksen myös päävalikon taustaan, kaikkiin valikoihin ja ääniin.
Uusi rantakuvitus ja valikkorakenne tehdään erillisinä tiedostoina.
Tässä toimeksiannossa ei julkaista eikä liitetä etärepositoriota.
