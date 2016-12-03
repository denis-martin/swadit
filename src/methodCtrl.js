
SwaditApp.controller('SwaditMethodController', function ($scope)
{
	$scope.newTag = function(tag, method)
	{
		if (tag != undefined && tag != "") {
			if (method.tags == undefined) {
				method.tags = [];
			}
			if (method.tags.indexOf(tag) >= 0) {
				alert("Tag already exists.");
			} else {
				method.tags.push(tag);
				this.newTagType = "";
			}
		}
	}

	$scope.deleteTag = function(tag, method)
	{
		if (confirm("Remove tag '" + tag + "' from method?")) {
			method.tags.splice(method.tags.indexOf(tag), 1);
		}
		if (method.tags.length == 0) {
			delete method.tags;
		}
	}

	$scope.newConsume = function(consume, method)
	{
		if (consume != undefined && consume != "") {
			if (method.consumes == undefined) {
				method.consumes = [];
			}
			if (method.consumes.indexOf(consume) >= 0) {
				alert("MIME type already exists in 'consumes'");
			} else {
				method.consumes.push(consume);
				this.newConsumeType = "";
			}
		}
	}

	$scope.deleteConsume = function(consume, method)
	{
		if (confirm("Remove MIME type '" + consume + "' from method consumes?")) {
			method.consumes.splice(method.consumes.indexOf(consume), 1);
		}
		if (method.consumes.length == 0) {
			delete method.consumes;
		}
	}

	$scope.newProduce = function(produce, method)
	{
		if (produce != undefined && produce != "") {
			if (method.produces == undefined) {
				method.produces = [];
			}
			if (method.produces.indexOf(produce) >= 0) {
				alert("MIME type already exists in 'produces'");
			} else {
				method.produces.push(produce);
				this.newProduceType = "";
			}
		}
	}

	$scope.deleteProduce = function(produce, method)
	{
		if (confirm("Remove MIME type '" + produce + "' from method produces?")) {
			method.produces.splice(method.produces.indexOf(produce), 1);
		}
		if (method.produces.length == 0) {
			delete method.produces;
		}
	}

	$scope.newParameter = function(method)
	{
		if (method.parameters == undefined) {
			method.parameters = [];
		}
		method.parameters.push({ in: "query", type: "string" });	
	}

	$scope.deleteParameter = function(param, method)
	{
		if (confirm("Remove parameter '" + (param.$ref ? param.$ref : param.name) + "' from method?")) {
			method.parameters.splice(method.parameters.indexOf(param), 1);
		}
		if (method.parameters.length == 0) {
			delete method.parameters;
		}
	}

	$scope.newResponse = function(newResponseCode, respObj)
	{
		if (Swadit.api.paths[Swadit.activePath][Swadit.activeMethod].responses == undefined) {
			Swadit.api.paths[Swadit.activePath][Swadit.activeMethod].responses = {};
		}
		if (Swadit.api.paths[Swadit.activePath][Swadit.activeMethod].responses[newResponseCode] != undefined) {
			alert("Response code '" + newResponseCode + "' already exists.");
			return;
		}
		Swadit.api.paths[Swadit.activePath][Swadit.activeMethod].responses[newResponseCode] = respObj ? respObj : {};
		if (!respObj && httpStatusCodes[newResponseCode] != undefined) {
			Swadit.api.paths[Swadit.activePath][Swadit.activeMethod].responses[newResponseCode].description = httpStatusCodes[newResponseCode];
		}
		
		// resort response codes
		var otherResponses = {}
		angular.forEach(Swadit.api.paths[Swadit.activePath][Swadit.activeMethod].responses, function(value, key) {
			if (key > newResponseCode) {
				otherResponses[key] = value;
				delete Swadit.api.paths[Swadit.activePath][Swadit.activeMethod].responses[key];
			}
		});
		angular.forEach(otherResponses, function(value, key) {
			Swadit.api.paths[Swadit.activePath][Swadit.activeMethod].responses[key] = value;
		});
		this.newResponseCode = "";
	}

	$scope.deleteResponse = function(responseCode)
	{
		if (confirm("Are you sure you want to remove response code '" + responseCode + "'?")) {
			delete Swadit.api.paths[Swadit.activePath][Swadit.activeMethod].responses[responseCode];
		}
	}

	$scope.renameResponseCode = function(responseCode, newResponseCode)
	{
		if (newResponseCode == undefined || newResponseCode == "" || responseCode == newResponseCode) {
			this.renamedResponseCode = responseCode;
			return;
		}

		if (Swadit.api.paths[Swadit.activePath][Swadit.activeMethod].responses[newResponseCode]) {
			alert("Response '" + newResponseCode + "' already exists.");
			this.renamedResponseCode = responseCode;
			return;
		}

		if (confirm("Change response code from '" + responseCode + "' to '" + newResponseCode + "'?")) {
			var respObj = Swadit.api.paths[Swadit.activePath][Swadit.activeMethod].responses[responseCode];
			delete Swadit.api.paths[Swadit.activePath][Swadit.activeMethod].responses[responseCode];
			this.newResponse(newResponseCode, respObj);
		} else {
			this.renamedResponseCode = responseCode;
		}
	}

	$scope.refChanged = function(oldRef)
	{
		console.log("refChanged: " + oldRef + " -> " + this.responseDef.$ref);
		if (oldRef == undefined || oldRef == "") {
			if (confirm("Using a reference ($ref) will remove the rest of the response definition. Do you want to continue?")) {
				var curScope = this;
				angular.forEach(this.responseDef, function (value, key) {
					if (key != "$ref") {
						console.log(key);
						delete curScope.responseDef[key];
					}
				});
				console.log(this.responseDef);
			} else {
				delete this.responseDef.$ref;
			}
		} else {
			if (this.responseDef.$ref == "" || this.responseDef.$ref == undefined) {
				delete this.responseDef.$ref;
				if (httpStatusCodes[this.responseCode]) {
					this.responseDef.description = httpStatusCodes[this.responseCode];
				}
			}
		}
	}

}) // SwaditMethodController
