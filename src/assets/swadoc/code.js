function is_nwjs() { try { return (typeof require('nw.gui') !== "undefined"); } catch (e) { return false; } }

if (is_nwjs()) {
	SwaggerParser = require('swagger-parser');
}
var YAML = SwaggerParser.YAML;

var Swadoc = null;

angular.module('SwadocApp', ['ngSanitize', 'hc.marked'])

.controller('SwadocController', function($scope) // root controller
{
	Swadoc = this;
	Swadoc.version = '0.1';
	Swadoc.thinking = "";
	Swadoc.api = {};

	Swadoc.openFile = function(pathName, fobj)
	{
		console.log("Opening", pathName, fobj);
		Swadoc.thinking = "Generating documentation...";
		if (pathName) {
			SwaggerParser.parse(pathName)
				.then(Swadoc.swaggerLoaded)
				.catch(Swadoc.swaggerLoadingError);
		} else {
			var reader = new FileReader();
			reader.onload = function(e) {
				try {
					SwaggerParser.parse(YAML.parse(e.target.result))
						.then(Swadoc.swaggerLoaded)
						.catch(Swadoc.swaggerLoadingError);
				} catch (ex) {
					Swadoc.swaggerLoadingError(ex);
				}
			}
			reader.readAsText(fobj);
		}
	}

	Swadoc.swaggerLoadingError = function(err)
	{
		alert("Error loading YAML: " + err);
		Swadoc.thinking = "";
		console.log("error loading yaml: ", err)
	}

	Swadoc.swaggerLoaded = function(api)
	{
		console.log("loaded");
		Swadoc.thinking = "Validating...";
		SwaggerParser.validate(api)
			.then(Swadoc.swaggerValidated)
			.catch(Swadoc.swaggerLoadingError);
	}

	Swadoc.swaggerValidated = function(api)
	{
		console.log("validated");
		Swadoc.thinking = "";
		Swadoc.api = api;
		document.title = Swadoc.api.info.title;
		
		$scope.$apply();

		if (window.parent && window.parent.Swadit && window.parent.Swadit.activePath) {
			window.location = "#" + Swadoc.getPathAnchor(window.parent.Swadit.activePath);
		}
	}

	Swadoc.setPath = function(path)
	{
		window.location.hash = "#" + Swadoc.getPathAnchor(path);
	}

	Swadoc.print = function()
	{
		console.log("printing");
		window.print();
	}

	Swadoc.getLength = function(obj)
	{
		if (!obj) { return 0; }
		return Object.keys(obj).length;
	}

	Swadoc.getSortedKeys = function(objName)
	{
		if (objName == undefined || Swadoc.api[objName] == undefined) {
			return undefined;
		}

		var newArray = Object.keys(Swadoc.api[objName]);
		newArray = newArray.sort(function(a, b) {
			var al = a.toLowerCase();
			var bl = b.toLowerCase();
			//console.log(al, bl, al>bl);
			return al == bl ? 0 : ((al > bl) ? 1 : -1); 
		});

		return newArray;
	}
	
	Swadoc.getPathAnchor = function(path)
	{
		return path.replace(/\//g, "-");
	}

	Swadoc.hasParameters = function(path, method)
	{
		var param = 0;
		if (Swadoc.api.paths[path].parameters) {
			angular.forEach(Swadoc.api.paths[path].parameters, function(v, k) {
				if (v.in != "body") {
					param += 1;
				}
			});
		}
		if (Swadoc.api.paths[path][method].parameters) {
			angular.forEach(Swadoc.api.paths[path][method].parameters, function(v, k) {
				if (v.in != "body") {
					param += 1;
				}
			});
		}
		return (param > 0);
	}
	
	Swadoc.getParameters = function(path, method)
	{
		var newArray = [];
		if (Swadoc.api.paths[path].parameters) {
			newArray = newArray.concat(Swadoc.api.paths[path].parameters);
		}
		if (Swadoc.api.paths[path][method].parameters) {
			newArray = newArray.concat(Swadoc.api.paths[path][method].parameters);
		}
		return newArray;
	}

	Swadoc.getRequestBody = function(path, method)
	{
		var params = Swadoc.getParameters(path, method);
		for (p of params) {
			if (p.in == "body") {
				return p;
			}
		}
		return null;
	}

	Swadoc.getConsumes = function(path, method)
	{
		var newArray = [];
		if (Swadoc.api.paths[path][method].consumes) {
			newArray = Swadoc.api.paths[path][method].consumes;
		} else {
			newArray = Swadoc.api.consumes;
		}
		return newArray;
	}

	Swadoc.getProduces = function(path, method)
	{
		var newArray = [];
		if (Swadoc.api.paths[path][method].produces) {
			newArray = Swadoc.api.paths[path][method].produces;
		} else {
			newArray = Swadoc.api.produces;
		}
		return newArray;
	}

	if (window.parent.Swadit) {
		Swadoc.openFile(null, window.parent.Swadit.blob);
	} else {
		Swadoc.openFile("../petstore.yaml");
	}
})

.controller('SwadocSchemaController', function ($scope)
{
	$scope.flatProperties = [];

	$scope.getCountArray = function(n)
	{
		return new Array(n);
	}

	$scope.flattenObject = function(schema, level)
	{
		angular.forEach(schema.properties, function(v, k) {
			var required = schema.required ? schema.required.indexOf(k)>-1 : false;
			$scope.flatProperties.push({ "prop": k, "def": v, "level": level, "required": required });
			if (v.type=='object') {
				$scope.flattenObject(v, level+1);
			} else if (v.type=='array' && v.items.type=='object') {
				$scope.flattenObject(v.items, level+1);
			}
		});
	}

	$scope.getExample = function(schema, noReadOnly)
	{
		var res;
		if (schema.type == "string") {
			if (schema.example) {
				res = schema.example;
			} else if (schema.default) {
				res = schema.default;
			} else {
				res = "string";
			}
		} else if (schema.type == "boolean") {
			if (schema.example) {
				res = schema.example;
			} else if (schema.default) {
				res = schema.default;
			} else {
				res = false;
			}
		} else if (schema.type == "number" || schema.type == "integer") {
			if (schema.example) {
				res = schema.example;
			} else if (schema.default) {
				res = schema.default;
			} else {
				res = 0;
			}
		} else if (schema.type == "array") {
			if (schema.example) {
				res = schema.example;
			} else if (schema.default) {
				res = schema.default;
			} else {
				res = [ $scope.getExample(schema.items, noReadOnly) ];
			}
		} else if (schema.type == "object") {
			if (schema.example) {
				res = schema.example;
			} else if (schema.default) {
				res = schema.default;
			} else {
				res = {};
				angular.forEach(schema.properties, function(v, k) {
					res[k] = $scope.getExample(v, noReadOnly);
				});
			}
		}
		return res;
	}

	$scope.getExampleMarked = function(schema, noReadOnly)
	{
		return "```json\n" + JSON.stringify($scope.getExample(schema, noReadOnly), null, 2) + "\n```";
	}
})

.config(
	['$compileProvider', function ($compileProvider) {
		// whitelist blob:// URLs
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob|chrome-extension):/);
	}]
)

.config(['markedProvider', function (markedProvider) {
  markedProvider.setOptions({
    gfm: true,
    tables: true,
    highlight: function (code, lang) {
      if (lang) {
        return hljs.highlight(lang, code, true).value;
      } else {
        return hljs.highlightAuto(code).value;
      }
    }
  });
}]);