# Visuaalinen uudelleenrakennus

## Vertailu ja valittu suunta

Vertailun perustana käyttäjän toimittama Wild n Chill -kuvakaappaus, [pelin virallinen kuvamateriaaliluettelo](https://www.wombatbrawler.com/wnc-press-kit) ja [Steamin demosivu](https://store.steampowered.com/app/4628650/Wild_n_Chill_Demo/). Steam kuvaa pelin rauhalliseksi eräselviytymiseksi, jossa kerätään, metsästetään, kalastetaan ja rakennetaan leiriä koiran seurassa. Videolinkkejä etsittiin, mutta videon varsinaista toistoa tai asennettua demoa ei tässä toteutusajossa tarkastettu; niiden katsomista ei väitetä.

Käyttäjän kuvassa olennaista on metsän massojen sommittelu: tummat lähioksat kehystävät kuvaa, sammaleinen kaatunut runko ja kallio tuovat etualalle painoa, ja kaukainen metsä häviää kylmään usvaan. Vanhan prototyypin tiheäkin suorakulmiopiirto jäi tästä kauas. Pelkkä piirtoalustan suurentaminen ei ratkaissut muotojen, värimassojen ja materiaalien ongelmaa.

Uudessa toteutuksessa vaihdettiin koko visuaalinen perusta. Alkuperäinen imagegen-panoraama toimii maaston kuvituksena. Vaeltaja, koira ja riista saivat omat läpinäkyvät sprite-atlakset. Niitä näytetään avainasentoina, ei koko taustaan leivottuina hahmoina. Poimittavat esineet ovat taustasta erillisiä, niiden varjot ja sijainnit seuraavat polkua. Lopullinen pelimaailma piirretään pieneen pikselikerrokseen ennen suurennusta, jotta myös ohjelmalliset objektit ja efektit pysyvät pikselimäisinä.

Ensimmäisessä kuvatarkistuksessa metsä oli selvästi yksityiskohtaisempi kuin geometriset hahmot ja esineet. Sen vuoksi hahmojen ensimmäistä koodipiirtoversiota ei jätetty lopulliseksi: luotiin erilliset sprite-kuvat, pienennettiin ja luonnollistettiin keräilykohteet sekä lisättiin rungon pintaan hajanaisempaa tekstuuria.

## Säilytetty ja parannettu

Ylä- ja oikean reunan hover-valikot, hiirellä käytettävä reppu, käsityöt, paperikartta, muistilista, selviytymisarvot, koira, kyykistyminen, riistan pakeneminen, metsästys, kalastus, leiri, erakon vaihtokauppa, päivä/yö, sää ja äänet. Käsitöissä kaikki reseptit ovat nähtävissä ja vaaditun työkalun reseptiin pääsee suoraan. Valikot pysäyttävät peliajan, jotta reseptejä voi lukea rauhassa.

Kyykyssä havaintoetäisyys on 42 % seisovan hahmon vastaavasta etäisyydestä. Eläimillä on erillinen pakenemistila ja rauhoittumisviive, joten ne eivät välittömästi käänny takaisin. Jousen nuoli seuraa hiirellä tähdättyä suuntaa. Kajo reagoi liikkeellelähtöön viiveellä ja saa jäädä istumaan tai nuuskimaan.

## Omat materiaalit ja palautettavuus

Pelin koodi, nimet, käyttöliittymä, ikonit ja äänet ovat tämän projektin toteutusta. Kuvitukset on tuotettu tätä peliä varten imagegenillä. Wild n Chillin tiedostoja tai koodia ei ole otettu käyttöön. Tyylillinen esikuva ei tarkoita, että prototyyppi olisi identtinen, lisensoitu tai tekijän hyväksymä.

Edellinen kokonaisuus on säilytetty työtilan `work/pine-and-ember-before-astra`-kansiossa. Myös vanha selaintallennus säilytetään erillisessä avaimessa. Uusi peli kirjoittaa vain v2-tallennusta.
