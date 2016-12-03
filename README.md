# Swadit
A visual editor for Swagger files ([Demo](https://swadit.misc-net.de)).

## Prepare
Althought Swadit is only run within a browser, you'll need [Node](https://nodejs.org) to install all dependencies:
```
npm install -g bower
npm install
bower install
```

If you want Swagger UI to be integrated into Swadit, simply clone my fork of the Swagger UI repository into the Swadit folder as "swagger-ui":
```
cd swadit
git clone https://github.com/denis-martin/swagger-ui.git swagger-ui
```
This fork includes minor adaptations to fetch the currently loaded Swagger file from Swadit into Swagger UI as blob-URLs. This means that the Swagger file is handed over to Swagger UI locally within the browser without any server support.

## Run
Swadit can either be run from a web server (simply throw all files on a web space) or locally with [NW.js](https://nwjs.io/).
