# Swadit
A visual editor for Swagger files. 

This is a complete rewrite of the first version ([Demo](https://swadit.misc-net.de) of the first version). Instead of AngularJS and JavaScript, this version is based on TypeScript and Angular4, which are much more suitable for the given tasks. However, it will take some time until feature parity is reached (at least to a certain extend).

## Prepare
Althought Swadit is only run within a browser, you'll need [Node](https://nodejs.org) to install all dependencies and compile the typescript sources to javascript:
```
npm install
npm run build
```
The deployable files can then be found in the 'dist' folder.

If you want Swagger UI to be integrated into Swadit, simply clone my fork of the Swagger UI repository into the Swadit folder as "swagger-ui":
```
cd swadit
git clone https://github.com/denis-martin/swagger-ui.git swagger-ui
```
This fork includes minor adaptations to fetch the currently loaded Swagger file from Swadit into Swagger UI as blob-URLs. This means that the Swagger file is handed over to Swagger UI locally within the browser without any server support.

## Run
Swadit can either be run from a web server (after the build, simply throw all files in the dist folder on a web space) or locally with [NW.js](https://nwjs.io/).

During development, you may run a live server with @angular/cli:
```
ng serve
```

## Acknowledgements

The template is based on [SB-Admin-BS4-Angular-4](https://github.com/start-angular/SB-Admin-BS4-Angular-4). This is also a good source for more information on how to set up the development environment. If you are new to Angular 2+, I'd recommend to visit the [Getting Started Guide at angular.io](https://angular.io/guide/quickstart).

## Copyright & License

Copyright 2017 Denis Martin.

swadit is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

swadit is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with swadit.  If not, see <http://www.gnu.org/licenses/>.