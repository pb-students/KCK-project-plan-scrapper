# Opis projektu
## Glowne zalozenia
- Serwer scrapujacy okresowo dane z degry
- Klient konsolowy

## Funkcjonalnosc
- Podczas pierwszego wlaczenia jest przeprowadzana konfiguracja
- Mozliwosc wyswietlenia planu zajec
- Mozliwosc dodania dodatkowych zajec do planu
  - Przedmioty obieralne
  - Przedmioty nieobieralne
- Mozliwosc resetu konfiguracji
- Mozliwosc wyjscia z aplikacji

## Interesujace zagadnienia
osobiscie uwazam, ze interesujacego to tu nic nie ma. Jak dla mnie - zwykla rutyna. To co moze sie komus spodobac to np:
- parser 
  - [L55](backend/parser.js#L55) - funkcja parseClass
- server
    - [L64](backend/server.js#L64) - 5 forow zagniezdzonych
- cli
    - [L138](cli/cli.js#L138) - filtrowanie zajec na dany slot

## Instalacja
```shell
git clone https://github.com/pb-students/KCK-project-schedule-scrapper.git
yarn install
```

### Uruchomianie
```shell
node backend/server.js&
node cli/cli.js
```

# Wnioski
- Na degrze nie ma wpisanych wszystkich wykladow
- Niestandardowe oznaczenia kierunkow na degrze (np: `mat. stos.` i `mat. stosow.`)
- Przedmioty obieralne nie maja ustalonego semestru na degrze
- nie chcialo mi sie uzywac `ncurses`, kiedys juz mialem przyjemnosc uzerania sie z nim w [mineflayer-dashboard](https://github.com/wvffle/mineflayer-dashboard)

## Samoocena
- No lepszego planu zajec to ja dawno nie mialem, a ze konsolowy to i dla mnie lepiej
