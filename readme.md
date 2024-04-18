# Evolve Net

Evolve Net - это крипто-блокчейн написанный на языке JavaScript.

Возможности:
- добавление смарт контрактов
- майнинг криптовалюты
- подписание смарт контракта
- создание кошелька
- просмотр баланса всех существующих кошльков

## Api для майнеров

### Запуск
#### Установка зависимостей
Linux и MacOS
```
./requirements_linux.sh
```
Windows
```
./requirements_window.bat
```
#### Запуск
```
./start.sh
```
### Команды
#### help
Выводит все существующие команды
##### Пример:
```
add contract <pathToFile>
```
#### add contract
Добавить свой смарт контракт в блокчейн.
##### Аргументы:
- pathToFile   путь до .js файла с кодом смарт контракта

##### Пример:
```
add contract <pathToFile>
```
#### change dataFolder (cdf)
Позволяет поменять папку в которой хранятся данные блокчейна
##### Аргументы:
- pathToFolder   путь до папки

##### Пример:
```
cdf <pathToFolder>
```
или
```
change dataFolder <pathToFolder>
```
#### connect
Устанавливает соединение с другими нодами в сети
##### Пример:
```
connect
```
#### exit
Выход из клиента блокчейна
##### Пример:
```
exit
```
#### get balances
Выводит балансы всех пользователей
##### Пример:
```
get balances
```
#### get balance
Выводит баланс одного кошелька
##### Аргументы:
- wallet   адресс кошелька

##### Пример:
```
get balance <wallet>
```
#### get blockchain
Получает блокчейн из сети

##### Пример:
```
get blockchain
```
#### validate
Проверяет коррекность блокчейна, который храниться на этом узле
##### Пример:
```
validate
```
#### view
Выдает весь блокчейн

##### Пример:
```
view
```
