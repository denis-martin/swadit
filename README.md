[![Build Status](https://travis-ci.org/denis-martin/swadit.svg?branch=master)](https://travis-ci.org/denis-martin/swadit)

# Swadit
A visual editor for Swagger/OpenAPI files supporting the 'API first' approach ([Demo](https://swadit.froschbach.io)): Design your API first, then start coding with generated code stubs!

Currently supported features include:
*  Design your REST API visually (no need to understand the Swagger/OpenAPI specification).
*  Preview your API with a single click in Swagger UI.
*  Generate a preview for printing a PDF file.
*  Open/save your API as Swagger/OpenAPI file.
*  For the expert: Edit the Swagger/OpenAPI source of your API in YAML format (with validation).

Swadit is completely run within your browser:
*  No need to install server-side software (except for a web server, of course).
*  Your API definition remains within your browser and is not sent to any server. You may even use, e.g., [NW.js](https://nwjs.io/) to run it as a local tool, so not even a web server is necessary (see below).

More information can be found [here](https://froschbach.io/apps/swadit/).

## Prepare
Althought Swadit is only run within a browser, you'll need [Node](https://nodejs.org) to install all dependencies:
```
npm install
```

Since the print preview (swadoc) is a standalone Node package, you'll need to install its dependencies separately:
```
cd src/assets/swadoc
npm install
cd ../../..
```

Finally, compile the typescript sources to javascript:
```
npm run build
```

The deployable files can then be found in the 'dist' folder.


## Run
Swadit can either be run from a web server (after the build, simply throw all files in the dist folder on a web space) or locally with [NW.js](https://nwjs.io/).

During development, you may run a live server with @angular/cli:
```
ng serve
```

## History

This is a complete rewrite of the [first version](https://github.com/denis-martin/swadit/tree/javascript) ([Demo](https://swaditjs.misc-net.de) of the first version). Instead of AngularJS and JavaScript, this new version is based on TypeScript and Angular4, which are much more suitable for the given tasks. However, it will take some time until feature parity is reached (at least to a certain extend).


## Acknowledgements

The template is based on [SB-Admin-BS4-Angular-4](https://github.com/start-angular/SB-Admin-BS4-Angular-4). This is also a good source for more information on how to set up the development environment. If you are new to Angular 2+, I'd recommend to visit the [Getting Started Guide at angular.io](https://angular.io/guide/quickstart).


## Copyright & License

Copyright 2016-2018 Denis Martin.

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