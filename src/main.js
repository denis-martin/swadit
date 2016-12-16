function is_nwjs() { try { return (typeof require('nw.gui') !== "undefined"); } catch (e) { return false; } }

if (is_nwjs()) {
	SwaggerParser = require('swagger-parser');
}
var YAML = SwaggerParser.YAML;

var Swadit = null;

var SwaditApp = angular.module('SwaditApp', ['ui.layout', 'ui.bootstrap', 'monospaced.elastic', 'puElasticInput', 'ui.ace'])

.controller('SwaditController', function($scope, $uibModal, $anchorScroll, $location, $timeout, $window) // root controller
{
	Swadit = this;
	Swadit.version = '0.12';
	Swadit.thinking = "Loading...";
	Swadit.methods = ['get', 'post', 'put', 'delete'];
	Swadit.api = { info: { title: "Swadit" } };
	
	Swadit.activePanel = 'panelHeader';
	Swadit.activePath = '';
	Swadit.activeMethod = '';
	
	Swadit.newParamKey = '';
	Swadit.newDefinitionKey = '';
	Swadit.newPath = '';

	Swadit.filterText = {};
	Swadit.filterSorted = {};
	Swadit.filteredKeys = {};

	Swadit.selectedPaths = {};

	Swadit.parser = new SwaggerParser();
	Swadit.downloadUrl = '';
	Swadit.blob = null;
	Swadit.addSource = true;
	Swadit.filesToAdd = {};
	Swadit.filesToAddIndex = 0;
	
	document.title = "Swadit (c) Denis Martin v" + Swadit.version;
	
	Swadit.uiNew = function() 
	{
		if (confirm("Are you sure you want to create a new file? All current changes (if any) will be lost.")) {
			console.log('uiNew');
			Swadit.openFile("new.yaml");
		}
	}
	
	Swadit.uiOpen = function() 
	{
		var modalInstance = $uibModal.open({
			animation: true,
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: 'ui/fileDialog.html',
			controller: 'SwaditUiFileDialogController',
			//controllerAs: 'SwaditUi',
			//size: size, // 'lg', 'sm'
			resolve: {
				dialogType: function () { return "fileOpen"; },
			}
		});

		modalInstance.result.then(function (f) {
			console.log('uiOpen ', f);
			//Swadit.openFile(is_nwjs() ? f[0].path : null, f[0]);
			Swadit.openFile(null, f[0]);
			Swadit.activePanel = 'panelHeader';
		}, function () {
			// cancel
		});
	}

	Swadit.uiAdd = function() 
	{
		if (Swadit.activePanel == 'panelSwagger' && 
			$scope.swaggerModified &&
			!confirm("Changes in text editor will be lost unless committed. Do you want to continue?"))
		{
			return;
		}

		var modalInstance = $uibModal.open({
			animation: true,
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: 'ui/fileDialog.html',
			controller: 'SwaditUiFileDialogController',
			//controllerAs: 'SwaditUi',
			//size: size, // 'lg', 'sm'
			resolve: {
				dialogType: function () { return "fileAdd"; },
			}
		});

		modalInstance.result.then(function (files) {
			console.log('uiAdd ', files);
			Swadit.selectedPaths = {};
			Swadit.filesToAddIndex = 0;
			Swadit.filesToAdd = files;
			Swadit.addFile(null, Swadit.filesToAdd[Swadit.filesToAddIndex]);
			//angular.forEach(files, f => Swadit.addFile(null, f));
			//Swadit.activePanel = 'panelHeader';
		}, function () {
			// cancel
		});
	}

	Swadit.uiSave = function() 
	{
		if (Swadit.activePanel == 'panelSwagger' && 
			$scope.swaggerModified &&
			!confirm("Changes in text editor won't be saved unless committed. Do you want to continue?"))
		{
			return;
		}

		Swadit.createDownloadUrl();

		var modalInstance = $uibModal.open({
			animation: true,
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: 'ui/fileDialog.html',
			controller: 'SwaditUiFileDialogController',
			//controllerAs: 'SwaditUi',
			//size: size, // 'lg', 'sm'
			resolve: {
				dialogType: function () { return "fileSave"; },
			}
		});

		modalInstance.result.then(function (f) {
			// ok
		}, function () {
			// cancel
		});
	}

	Swadit.uiSwagger = function(lineSearch, section, subsection)
	{
		if (Swadit.activePanel  != 'panelSwagger') {
			Swadit.activePanel = 'panelSwagger';
			Swadit.showText();
		}
		if (lineSearch) {
			$timeout(function() {
				if (section == "paths") {
					if (lineSearch.indexOf('{') >= 0) {
						lineSearch = lineSearch.replace(/\{/g, "\\{");
						lineSearch = lineSearch.replace(/\}/g, "\\}");
						lineSearch = "  '" + lineSearch + "':";
					} else {
						lineSearch = "  " + lineSearch + ":";
					}
				} else if (section == "parameters" || section == "definitions" || section == "responses") {
					Swadit.editor.find("^" + section + ":$", {
						caseSensitive: true,
						regExp: true,
						wrap: true
					});
					lineSearch = "  " + lineSearch + ":";
				}
				Swadit.editor.find("^" + lineSearch + "( \\{\\})?$", {
					caseSensitive: true,
					regExp: true,
					wrap: true
				});
				if (section == "paths" && subsection) {
					Swadit.editor.find("^    " + subsection + "\:( \\{\\})?$", {
						caseSensitive: true,
						regExp: true,
						wrap: true
					});
				}
			}, 0);
		}
	}

	Swadit.uiSwaggerUi = function() 
	{
		Swadit.createDownloadUrl();
		Swadit.showPanel('panelSwaggerUi');
	}

	Swadit.uiSwadoc = function() 
	{
		Swadit.createDownloadUrl();
		Swadit.showPanel('panelSwadoc');
	}

	Swadit.uiSelectPathsBy = function() 
	{
		var modalInstance = $uibModal.open({
			animation: true,
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: 'ui/selectPathsByDialog.html',
			controller: 'SwaditUiSelectPathsByDialogController',
			//controllerAs: 'SwaditUi',
			//size: size, // 'lg', 'sm'
			resolve: {
				dialogType: function () { return "selectPathsBy"; },
			}
		});

		modalInstance.result.then(function (selectBy) {
			if (selectBy.tag) {
				console.log('uiSelectPathsBy ', selectBy.tag);
				angular.forEach(Swadit.api.paths, function(po, p) {
					angular.forEach(po, function(mo, m) {
						if (mo.tags && mo.tags.indexOf(selectBy.tag) > -1) {
							Swadit.selectedPaths[p] = true;
						}
					});
				});
			}

			if (selectBy.names) {
				console.log('uiSelectPathsBy ', selectBy.names);
				var paths = selectBy.names.split("\n");
				angular.forEach(Swadit.api.paths, function(po, p) {
					var i = paths.indexOf(p);
					if (i > -1) {
						Swadit.selectedPaths[p] = true;
						paths.splice(i, 1);
					}
				});
				if (paths.length > 0) {
					console.log("Paths not found:", paths);
					alert("" + paths.length + " paths could not be found (see developer console for details).");
				}
			}
		}, function () {
			// cancel
		});
	}

	Swadit.uiModifySelectedPaths = function() 
	{
		var modalInstance = $uibModal.open({
			animation: true,
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: 'ui/modifyPathsDialog.html',
			controller: 'SwaditUiModifyPathsDialogController',
			//controllerAs: 'SwaditUi',
			//size: size, // 'lg', 'sm'
			resolve: {
				dialogType: function () { return "modifyPaths"; },
			}
		});

		modalInstance.result.then(function (modifyDialogResult) {
			console.log('uiModifySelectedPaths ', modifyDialogResult);
			if (modifyDialogResult.removeAllTags) {
				angular.forEach(Swadit.selectedPaths, function(po, p) {
					angular.forEach(Swadit.api.paths[p], function(mo, m) {
						if (m != "parameters" && Swadit.api.paths[p][m].tags) {
							delete Swadit.api.paths[p][m].tags;
						}
					});
				});
			}
			if (modifyDialogResult.tagsToAdd) {
				var tags = modifyDialogResult.tagsToAdd.split("\n");
				angular.forEach(Swadit.selectedPaths, function(po, p) {
					angular.forEach(Swadit.api.paths[p], function(mo, m) {
						if (m != "parameters") {
							if (!Swadit.api.paths[p][m].tags) {
								Swadit.api.paths[p][m].tags = []
							}
							angular.forEach(tags, t => Swadit.api.paths[p][m].tags.push(t));
						}
					});
				});
			}
		}, function () {
			// cancel
		});
	}

	Swadit.showPanel = function(panel)
	{
		console.log(Swadit.activePanel, $scope.swaggerModified);
		if (Swadit.activePanel == 'panelSwagger' && 
			$scope.swaggerModified &&
			!confirm("Changes will be lost. Do you want to continue?"))
		{
			return false;
		}
		else 
		{
			Swadit.activePanel = panel;
		}
		return true;
	}

	Swadit.createDownloadUrl = function()
	{
		this.cleanUp();
		var content = YAML.stringify(JSON.parse(angular.toJson(this.api))); // need to remove angular's private variables
		Swadit.blob = new Blob([ content ], { type : 'text/plain' });
		if (Swadit.downloadUrl != '') {
			(window.URL || window.webkitURL).revokeObjectURL(Swadit.downloadUrl);
		}
		Swadit.downloadUrl = (window.URL || window.webkitURL).createObjectURL(Swadit.blob);
		console.log("Download URL: " + Swadit.downloadUrl);
	}

	Swadit.openFile = function(pathName, fobj)
	{
		Swadit.thinking = "Loading file...";
		Swadit.api = {};
		if (pathName) {
			SwaggerParser.parse(pathName)
				.then(Swadit.swaggerLoaded)
				.catch(Swadit.swaggerLoadingError);
		} else {
			var reader = new FileReader();
			reader.onload = function(e) {
				try {
					SwaggerParser.parse(YAML.parse(e.target.result))
						.then(Swadit.swaggerLoaded)
						.catch(Swadit.swaggerLoadingError);
				} catch (ex) {
					Swadit.swaggerLoadingError(ex);
				}
			}
			reader.readAsText(fobj);
		}
	}

	Swadit.addFile = function(pathName, fobj)
	{
		Swadit.thinking = "Loading file...";
		console.log("addFile", pathName, fobj);
		if (pathName) {
			SwaggerParser.parser.parse(pathName)
				.then(function(api) { return Swadit.mergeSwagger(api, fobj.name); })
				.catch(Swadit.swaggerLoadingError);
		} else {
			var reader = new FileReader();
			reader.onload = function(e) {
				try {
					SwaggerParser.parse(YAML.parse(e.target.result))
						.then(function(api) { return Swadit.mergeSwagger(api, fobj.name); })
						.catch(Swadit.swaggerLoadingError);
				} catch (ex) {
					console.log("addFile ex", fobj);
					Swadit.swaggerLoadingError(ex);
				}
			}
			reader.readAsText(fobj);
		}
	}

	Swadit.swaggerLoadingError = function(err)
	{
		alert("Error loading YAML: " + err);
		console.log("error loading yaml: ", err)
		
		var currentApi = Swadit.api;
		Swadit.api = { info: { title: "Loading file..." } };
		$scope.$apply();
		$timeout(function() {
			Swadit.api = currentApi;
			if (Swadit.activePanel == "panelSwagger")
				Swadit.showText();
		}, 0);
	}

	Swadit.swaggerLoaded = function(api)
	{
		console.log("success");
		Swadit.thinking = "";
		Swadit.api = api;
		
		$scope.$apply();
		if (Swadit.activePanel == "panelSwagger")
			Swadit.showText();
	}

	Swadit.mergeSwagger = function(api, sourceName)
	{
		console.log("mergeSwagger", api, sourceName);
		Swadit.thinking = "";

		var addedPath = [];
		var replacedPath = [];
		var addedParameters = [];
		var replacedParameters = [];
		var addedDefinitions = [];
		var replacedDefinitions = [];
		
		if (api.hasOwnProperty('paths')) {
			Object.keys(api.paths).forEach(function(element) {
				if (Swadit.api.paths.hasOwnProperty(element)) {
					// replace path
					console.log("Replacing " + element);
					Swadit.api.paths[element] = api.paths[element];
					replacedPath.push(element);

				} else {
					// add new path
					console.log("Adding " + element);
					Swadit.api.paths[element] = api.paths[element];
					addedPath.push(element);
				}
				if (Swadit.addSource && sourceName) {
					angular.forEach(Swadit.api.paths[element], function(v, k) {
						if (k != "parameters") {
							if (!v.description) {
								v.description = "";
							}
							v.description = "Source: " + sourceName + "\n\n" + v.description;
						}
					});
				}
				Swadit.selectedPaths[element] = true;
			});
			console.log("Replaced paths", replacedPath);
			console.log("Added paths", addedPath);
		}

		if (api.hasOwnProperty('parameters')) {
			Object.keys(api.parameters).forEach(function(element) {
				if (Swadit.api.parameters.hasOwnProperty(element)) {
					// replace path
					console.log("Replacing " + element);
					Swadit.api.parameters[element] = api.parameters[element];
					replacedParameters.push(element);

				} else {
					// add new path
					console.log("Adding " + element);
					Swadit.api.parameters[element] = api.parameters[element];
					addedParameters.push(element);
				}
			});
			console.log("Replaced parameters", replacedParameters);
			console.log("Added parameters", addedParameters);
		}

		if (api.hasOwnProperty('definitions')) {
			Object.keys(api.definitions).forEach(function(element) {
				if (Swadit.api.definitions.hasOwnProperty(element)) {
					// replace path
					console.log("Replacing " + element);
					Swadit.api.definitions[element] = api.definitions[element];
					replacedDefinitions.push(element);

				} else {
					// add new path
					console.log("Adding " + element);
					Swadit.api.definitions[element] = api.definitions[element];
					addedDefinitions.push(element);
				}
			});
			console.log("Replaced definitions", replacedDefinitions);
			console.log("Added definitions", addedDefinitions);
		}
		
		Swadit.filesToAddIndex++;
		if (Swadit.filesToAddIndex < Swadit.filesToAdd.length) {
			Swadit.addFile(null, Swadit.filesToAdd[Swadit.filesToAddIndex]);
			
		} else {
			Swadit.filesToAdd = {};
			
			var currentApi = Swadit.api;
			Swadit.api = { info: { title: "Loading file..." } };
			$scope.$apply();
			$timeout(function() { 
				Swadit.api = currentApi;
				if (Swadit.activePanel == "panelSwagger")
					Swadit.showText();
			}, 0);
		}
	}
	
	Swadit.newParameterDefinition = function(paramKey)
	{
		if (paramKey == "") {
			alert("Please enter a parameter key.");
			return;
		} 
		
		if (Swadit.api.parameters == null) {
			Swadit.api.parameters = {};
			
			// recreate order (move paths and definitions object behind parameters)
			var paths = Swadit.api.paths;
			delete Swadit.api.paths;
			Swadit.api.paths = paths;
			
			if (Swadit.api.hasOwnProperty("definitions")) {
				var definitions = Swadit.api.definitions;
				delete Swadit.api.definitions;
				Swadit.api.definitions = definitions;
			}
		}
		
		if (Swadit.api.parameters.hasOwnProperty(paramKey)) {
			alert("Parameter definition already exists.");
			
		} else {
			Swadit.api.parameters[paramKey] = { name: paramKey, in: "query", type: "string" }; 
			Swadit.newParamKey = '';
		}

		$location.hash("parameterContainer-" + paramKey);
		$anchorScroll();
	}
	
	// note: method on scope, not on object
	$scope.renameParameterDefinition = function(paramKey, newParamKey)
	{
		if (newParamKey == undefined || newParamKey == '' || newParamKey == paramKey) { return; }

		if (Swadit.api.parameters[newParamKey]) {
			alert("Path '" + newParamKey + "' already exists.");
			this.paramName = paramKey;
			return;
		}

		if (confirm("Rename parameter key from '" + paramKey + "' to '" + newParamKey + "'?")) {
			console.log("Renaming parameter key: " + paramKey + " -> " + newParamKey);
			Swadit.api.parameters = Swadit.renameObjectKey(Swadit.api.parameters, paramKey, newParamKey);
		} else {
			this.paramName = paramKey; // this = $scope of ng-repeat; $scope itself is the parent scope
		}
	}
	
	Swadit.deleteParameterDefinition = function(paramKey)
	{
		if (confirm("Do you really want to delete the parameter definition '" + paramKey + "'?")) {
			delete Swadit.api.parameters[paramKey];
		}
	}
	
	Swadit.addPath = function(path)
	{
		if (path == "") {
			alert("Please enter a path.");
			return;
		} 
		
		if (Swadit.api.paths == null) {
			Swadit.api.paths = {};
			
			// recreate order (move definitions object behind paths)
			if (Swadit.api.hasOwnProperty("definitions")) {
				var definitions = Swadit.api.definitions;
				delete Swadit.api.definitions;
				Swadit.api.definitions = definitions;
			}
		}
		
		if (path[0] != '/') {
			path = "/" + path;
		}

		if (Swadit.api.paths.hasOwnProperty(path)) {
			alert("Path already exists.");
			
		} else {
			Swadit.api.paths[path] = { }; 
			Swadit.newPath = '';
		}
		
		$location.hash("pathContainer-" + path);
		$anchorScroll();
		Swadit.activePath = path;
	}
	
	/*Swadit.deletePath = function(path)
	{
		if (confirm("Do you really want to delete the path '" + path + "'?")) {
			delete Swadit.api.paths[path];
		}
	}*/
	
	// note: method on scope, not on object
	$scope.renamePath = function(path, newPath)
	{
		if (newPath == undefined || newPath == '' || newPath == path) { return; }

		if (Swadit.api.paths[newPath]) {
			alert("Path '" + newPath + "' already exists.");
			this.pathName = path;
			return;
		}

		if (confirm("Change path from '" + path + "' to '" + newPath + "'?")) {
			console.log("Changing path: " + path + " -> " + newPath);
			Swadit.api.paths = Swadit.renameObjectKey(Swadit.api.paths, path, newPath);
			Swadit.activePath = newPath;
		} else {
			this.pathName = path; // this = $scope of ng-repeat; $scope itself is the parent scope
		}
	}

	Swadit.getNumberOfSelectedPaths = function() 
	{
		return Object.keys(Swadit.selectedPaths).length;
	}

	Swadit.changeSelectedPath = function(path, event)
	{
		if (Swadit.selectedPaths.hasOwnProperty(path)) {
			delete Swadit.selectedPaths[path];
		} else { 
			Swadit.selectedPaths[path] = true;
		}
	}
	
	Swadit.selectAllPaths = function()
	{
		angular.forEach(Object.keys(Swadit.api.paths), p => Swadit.selectedPaths[p] = true);
	}

	Swadit.deselectAllPaths = function()
	{
		Swadit.selectedPaths = {};
	}

	Swadit.deleteSelectedPaths = function()
	{
		var paths = Object.keys(Swadit.selectedPaths);
		if (paths.length == 0) {
			alert("Please select a path.");
		} else if (confirm("Delete " + paths.length + " paths?")) {
			angular.forEach(paths, p => delete Swadit.api.paths[p]);
			Swadit.selectedPaths = {};
		}
	}

	Swadit.inverseSelectedPaths = function()
	{
		var paths = Object.keys(Swadit.selectedPaths);
		if (paths.length == 0) {
			Swadit.selectAllPaths();
		} else if (paths.length == Object.keys(Swadit.api.paths).length) {
			Swadit.deselectAllPaths();
		} else {
			angular.forEach(Swadit.api.paths, function(v, k) {
				if (Swadit.selectedPaths[k]) {
					delete Swadit.selectedPaths[k];
				} else {
					Swadit.selectedPaths[k] = true;
				}
			});
		}
	}

	Swadit.changeMethodForPath = function(path, method, event)
	{
		var create = event.target.checked;
		if (create) {
			console.log("Create method " + method + " for path " + path);
			Swadit.api.paths[path][method] = { responses: { default: { description: "Default response" } } };
			
			// reorder methods
			var newMethods = {};
			for (var i = 0; i < Swadit.methods.length; i++) {
				if (Swadit.api.paths[path].hasOwnProperty(Swadit.methods[i])) {
					newMethods[Swadit.methods[i]] = Swadit.api.paths[path][Swadit.methods[i]]
				}
			}
			Swadit.api.paths[path] = newMethods;
			
		} else {
			console.log("Remove method " + method + " for path " + path);
			if (confirm("Are you sure that want to delete EVERYTHING for '" + method.toUpperCase() + " " + path + "'?"))
			{
				delete Swadit.api.paths[path][method];
			}
			else
			{
				event.target.checked = true;
			}
		}
		Swadit.activePath = path;
		Swadit.activeMethod = method;
	}
	
	Swadit.pathGoToMethod = function(path, method)
	{
		Swadit.activePath=path;
		if (Swadit.api.paths[path].hasOwnProperty(method)) {
			if (Swadit.showPanel('panelMethod')) {
				Swadit.activeMethod=method;
				Swadit.activeMethodObj =  Swadit.api.paths[path][method];
			}
		} else {
			alert('Method does not exist. Tick checkbox first to create the method for this path.')
		}
	}

	Swadit.newDefinition = function(defKey) 
	{
		if (defKey == "") {
			alert("Please enter a definition key.");
			return;
		} 
		
		if (Swadit.api.definitions == null) {
			Swadit.api.definitions = {};
		}
		
		if (Swadit.api.definitions.hasOwnProperty(defKey)) {
			alert("Definition key already exists.");
			
		} else {
			Swadit.api.definitions[defKey] = { type: "string" }; 
			Swadit.newDefinitionKey = '';
		}

		$location.hash("definitionContainer-" + defKey);
		$anchorScroll();
	}

	// note: method on scope, not on object
	$scope.renameDefinition = function(defKey, defName) 
	{
		if (defName == undefined || defName == '' || defKey == defName) { return; }

		if (Swadit.api.definitions[defName]) {
			alert("Definition '" + defName + "' already exists.");
			this.defName = defKey;
			return;
		}

		if (confirm("Rename definition '" + defKey + "' to '" + defName + "'?")) {
			console.log("Renaming definition: " + defKey + " -> " + defName);
			Swadit.api.definitions = Swadit.renameObjectKey(Swadit.api.definitions, defKey, defName);
		} else {
			this.defName = defKey; // this = $scope of ng-repeat; $scope itself is the parent scope
		}
	}

	Swadit.deleteDefinition = function(defKey) 
	{
		if (confirm("Delete definition '" + defKey + "'? All child objects will be lost.")) {
			console.log("Deleting definition: " + defKey);
			delete Swadit.api.definitions[defKey];
		}
	}

	Swadit.newResponse = function(respKey) 
	{
		if (respKey == "") {
			alert("Please enter a response key.");
			return;
		} 
		
		if (Swadit.api.responses == null) {
			Swadit.api.responses = {};
		}
		
		if (Swadit.api.responses.hasOwnProperty(respKey)) {
			alert("Response key already exists.");
			
		} else {
			Swadit.api.responses[respKey] = { "description": respKey + " response" }; 
			Swadit.newResponseKey = '';
		}

		$location.hash("responseContainer-" + respKey);
		$anchorScroll();
	}

	// note: method on scope, not on object
	$scope.renameResponse = function(respKey, respName) 
	{
		if (respName == undefined || respName == '' || respKey == respName) { return; }

		if (Swadit.api.responses[respName]) {
			alert("Response '" + respName + "' already exists.");
			this.respName = respKey;
			return;
		}

		if (confirm("Rename response key '" + respKey + "' to '" + respName + "'?")) {
			console.log("Renaming response key: " + respKey + " -> " + respName);
			Swadit.api.responses = Swadit.renameObjectKey(Swadit.api.responses, respKey, respName);
		} else {
			this.respName = respKey; // this = $scope of ng-repeat; $scope itself is the parent scope
		}
	}

	Swadit.deleteResponse = function(respKey) 
	{
		if (confirm("Delete response '" + respKey + "'? All child objects will be lost.")) {
			console.log("Deleting response: " + respKey);
			delete Swadit.api.responses[respKey];
		}
	}

	Swadit.newConsume = function(consume)
	{
		if (consume != undefined && consume != "") {
			if (Swadit.api.consumes == undefined) {
				Swadit.api.consumes = [];
				// recreate order (move paths and definitions objects to the end)
				var paths = Swadit.api.paths;
				delete Swadit.api.paths;
				Swadit.api.paths = paths;
				
				if (Swadit.api.hasOwnProperty("definitions")) {
					var definitions = Swadit.api.definitions;
					delete Swadit.api.definitions;
					Swadit.api.definitions = definitions;
				}
			}
			if (Swadit.api.consumes.indexOf(consume) >= 0) {
				alert("MIME type already exists in 'consumes'");
			} else {
				Swadit.api.consumes.push(consume);
				$scope.newConsumeType = "";
			}
		}
	}

	Swadit.deleteConsume = function(consume)
	{
		if (confirm("Remove MIME type '" + consume + "' from consumes?")) {
			Swadit.api.consumes.splice(Swadit.api.consumes.indexOf(consume), 1);
		}
		if (Swadit.api.consumes.length == 0) {
			delete Swadit.api.consumes;
		}
	}

	Swadit.newProduce = function(produce)
	{
		if (produce != undefined && produce != "") {
			if (Swadit.api.produces == undefined) {
				Swadit.api.produces = [];
				// recreate order (move paths and definitions objects to the end)
				var paths = Swadit.api.paths;
				delete Swadit.api.paths;
				Swadit.api.paths = paths;
				
				if (Swadit.api.hasOwnProperty("definitions")) {
					var definitions = Swadit.api.definitions;
					delete Swadit.api.definitions;
					Swadit.api.definitions = definitions;
				}
			}
			if (Swadit.api.produces.indexOf(produce) >= 0) {
				alert("MIME type already exists in 'produces'");
			} else {
				Swadit.api.produces.push(produce);
				$scope.newProduceType = "";
			}
		}
	}

	Swadit.deleteProduce = function(produce, method)
	{
		if (confirm("Remove MIME type '" + produce + "' from produces?")) {
			Swadit.api.produces.splice(Swadit.api.produces.indexOf(produce), 1);
		}
		if (Swadit.api.produces.length == 0) {
			delete Swadit.api.produces;
		}
	}

	Swadit.newTag = function(tagName)
	{
		if (tagName != undefined && tagName != "") {
			if (Swadit.api.tags == undefined) {
				Swadit.api.tags = [];
			}
			var hasTag = false;
			angular.forEach(Swadit.api.tags, t => hasTag = hasTag || t.name==tagName);
			if (hasTag) {
				alert("Tag already exists.");
				return false;
			} else {
				Swadit.api.tags.push({ name: tagName });
			}
		}
		return true;
	}

	Swadit.deleteTag = function(tagName)
	{
		if (confirm("Remove tag '" + tagName + "' from tags?")) {
			var tagIndex;
			angular.forEach(Swadit.api.tags, (t,i) => { if (tagName==t.name) tagIndex=i });
			if (tagIndex != undefined) {
				Swadit.api.tags.splice(tagIndex, 1);
			}
		}
		if (Swadit.api.tags.length == 0) {
			delete Swadit.api.tags;
		}
	}
	
	Swadit.cleanUp = function()
	{
		Swadit.clearEmptyStringProperties(Swadit.api);

		if (Swadit.api.hasOwnProperty("info")) {
			Swadit.clearEmptyStringProperties(Swadit.api.info);

			if (Swadit.api.info.hasOwnProperty("contact")) {
				if (Swadit.clearEmptyStringProperties(Swadit.api.info.contact)) {
					delete Swadit.api.info.contact;
				}
			}
			if (Swadit.api.info.hasOwnProperty("license")) {
				if (Swadit.clearEmptyStringProperties(Swadit.api.info.license)) {
					delete Swadit.api.info.license;
				}
			}
			if (Swadit.api.info.hasOwnProperty("externalDocs")) {
				if (Swadit.clearEmptyStringProperties(Swadit.api.info.externalDocs)) {
					delete Swadit.api.info.externalDocs;
				}
			}
		}

		if (Swadit.api.hasOwnProperty("parameters")) {
			if (Swadit.api.parameters == null || Object.keys(Swadit.api.parameters).length == 0) {
				delete Swadit.api["parameters"];
			} else {
				Object.keys(Swadit.api.parameters).forEach(function (key) {
					// remove non-mandatory empty attributes
					Object.keys(Swadit.api.parameters[key]).forEach(function (subkey) {
						if (subkey != "name" &&
							subkey != "in" &&
							subkey != "type" &&
							subkey != "items" &&
							subkey != "schema" &&
							Swadit.api.parameters[key][subkey] == "")
						{
							delete Swadit.api.parameters[key][subkey];
						}
						else if (subkey == "required" &&
							Swadit.api.parameters[key][subkey] == false)
						{
							delete Swadit.api.parameters[key][subkey];
						}
					});
				});
			}
		}

		if (Swadit.api.hasOwnProperty("definitions")) {
			if (Swadit.api.definitions == null || Object.keys(Swadit.api.definitions).length == 0) {
				delete Swadit.api["definitions"];

			} else {
				angular.forEach(Swadit.api.definitions, function(value, key) {
					Swadit.recursiveCleanUpSchema(value);
				});
			}
		}
	}

	Swadit.clearEmptyStringProperties = function(obj)
	{
		var empty = true;
		angular.forEach(obj, (v,k) => {
			if (obj[k] == "") {
				delete obj[k];
			} else {
				empty = false;
			}
		});
		return empty;
	}

	Swadit.recursiveCleanUpSchema = function(schema)
	{
		Swadit.cleanUpSchema(schema);
		if (schema.hasOwnProperty("properties")) {
			angular.forEach(schema.properties, function(value, key) {
				Swadit.recursiveCleanUpSchema(value);
			});
		}
		if (schema.hasOwnProperty("items")) {
			Swadit.recursiveCleanUpSchema(schema.items);
		}
	}

	Swadit.cleanUpSchema = function(schema)
	{
		if (schema.type == "array") {
			if (schema.hasOwnProperty("properties")) {
				delete schema.properties;
			}
			if (schema.hasOwnProperty("format")) {
				delete schema.format;
			}

		} else if (schema.type == "object") {
			if (schema.hasOwnProperty("items")) {
				delete schema.items;
			}
			if (schema.hasOwnProperty("format")) {
				delete schema.format;
			}

		} else {
			if (schema.hasOwnProperty("items")) {
				delete schema.items;
			}
			if (schema.hasOwnProperty("properties")) {
				delete schema.properties;
			}
		}
		if (schema.description == "") { delete schema.description; }
		if (schema.format == "") { delete schema.format; }
		// todo: check for additional optional attributes
	}
	
	Swadit.showText = function()
	{
		this.cleanUp();
		var api = JSON.parse(angular.toJson(this.api)); // need to remove angular's private variables
		
		$scope.apiAsString = YAML.stringify(api);

		Swadit.thinking = "Validating file...";
		SwaggerParser.validate(api)
			.then(function(api) {
				Swadit.thinking = "";
				$scope.swaggerModified = false;
				$scope.swaggerValidation = "Swagger validation passed."
				$scope.swaggerValidationError = "";

				console.log("This API is a valid Swagger file.");

				Swadit.editor.resize();
				$scope.$apply();
			})
			.catch(function(err) {
				Swadit.thinking = "";
				$scope.swaggerModified = false;
				$scope.swaggerValidation = "Swagger validation error:"
				$scope.swaggerValidationError = err.message;

				console.log("Swagger validation error: ", err.message);

				Swadit.editor.resize();
				$scope.$apply();
			});
	}

	Swadit.validateSwagger = function(commit)
	{
		var newApi;
		try {
			newApi = YAML.parse($scope.apiAsString);
		} catch (err) {
			$scope.swaggerValidation = "Swagger parsing error (changes not committed):"
			$scope.swaggerValidationError = err.message;
			return;
		}

		Swadit.thinking = "Validating file...";
		SwaggerParser.validate(newApi)
			.then(function(api) {
				Swadit.thinking = "";
				$scope.swaggerValidation = "Swagger validation passed."
				$scope.swaggerValidationError = "";

				console.log("This API is a valid Swagger file.");

				if (commit) {
					Swadit.api = { info: { title: "Loading..." } };
					$scope.swaggerModified = false;

					// Cannot use 'api' parameter since it is dereferenced.
					// We could use option { $refs: { internal: false, external: false } },
					// however, external files will then not be used for validation.
					// External $refs are not yet supported, but when it will be supported,
					// we don't want to run into this issue again.
					$timeout(function() { Swadit.api = YAML.parse($scope.apiAsString); }, 0);
				}
				
				$scope.$apply();
			})
			.catch(function(err) {
				Swadit.thinking = "";
				$scope.swaggerValidation = "Swagger validation error (changes not committed):"
				$scope.swaggerValidationError = err.message;

				console.log("Swagger validation error: ", err.message);

				$scope.$apply();
			});
	}

	$scope.aceLoaded = function(_editor) {
		// Options
		Swadit.editor = _editor;
	};

	$scope.aceChanged = function(_editor) 
	{
		if ($scope.swaggerValidation != "") {
			$scope.swaggerValidation = "";
		}
		if ($scope.swaggerModified == false) {
			$scope.swaggerModified = true;
		}
	};
	
	Swadit.isActivePanel = function(panel)
	{
		return Swadit.activePanel == panel;
	}
	
	Swadit.getFilteredKeys = function(objName)
	{
		if (objName == undefined || Swadit.api[objName] == undefined) {
			return undefined;
		}

		var text = Swadit.filterText[objName] ? Swadit.filterText[objName] : "";
		var sorted = Swadit.filterSorted[objName] ? Swadit.filterSorted[objName] : false;

		if (Swadit.filteredKeys[objName] == undefined ||
			Swadit.filteredKeys[objName].object != Swadit.api[objName] ||
			Swadit.filteredKeys[objName].text != text ||
			Swadit.filteredKeys[objName].sorted != sorted)
		{
			Swadit.filteredKeys[objName] = {
				object: Swadit.api[objName],
				text: text,
				sorted: sorted,
				array: []
			};
		}

		var newArray = [];
		if (text != undefined && text != "") {
			text = text.toLowerCase();
			angular.forEach(Object.keys(Swadit.api[objName]), function(key) {
				if (key.toLowerCase().indexOf(text) >= 0) {
					newArray.push(key);
				}
			});
		} else {
			newArray = Object.keys(Swadit.api[objName]);
		}
		if (sorted) {
			newArray = newArray.sort(function(a, b) {
				var al = a.toLowerCase();
				var bl = b.toLowerCase();
				return al == bl ? 0 : ((al > bl) ? 1 : -1); 
			});
		}

		// compare with existing array
		if (newArray.length != Swadit.filteredKeys[objName].array.length) {
			Swadit.filteredKeys[objName].array = newArray;
			//console.log(newArray);
			return newArray;

		} else {
			angular.forEach(Swadit.filteredKeys[objName].array, function(v, i) {
				if (v != newArray[i]) {
					Swadit.filteredKeys[objName].array = newArray;
					//console.log(newArray);
					return newArray;
				}
			});
		}
		return Swadit.filteredKeys[objName].array;
	}

	Swadit.renameObjectKey = function(obj, key, newKey) 
	{
		var newObj = {};
		Object.keys(obj).forEach(function (k) {
			if (k != key) {
				newObj[k] = obj[k];
			} else {
				newObj[newKey] = obj[key];
			}
		});
		return newObj;
	}

	Swadit.openFile("petstore.yaml");
	
}) // SwaditController

.config(
	['$compileProvider', function ($compileProvider) {
		// whitelist blob:// URLs
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
	}]
);
