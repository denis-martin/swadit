
SwaditApp.controller('SwaditResponseDefinitionController', function ($scope, $attrs)
{
	$scope.visibleSchema = false;

	$scope.$watch(function() { return $scope.$parent.responseDef; }, 
		function(newValue, oldValue) {
			$scope.responseDef = $scope.$parent.responseDef;
			$scope.visibleSchema = false;
		});
	
	$scope.isSchemaVisible = function()
	{
		return $scope.visibleSchema;
	}

	$scope.setSchemaVisible = function(val)
	{
		$scope.visibleSchema = val;
	}

	$scope.getSchemaPreview = function(schema) 
	{
		if (schema == undefined) { return ""; }
		if (schema.$ref == undefined || schema.$ref == '') {
			if (schema.type=='array') {
				if (schema.items.$ref == undefined || schema.items.$ref == '') {
					return 'array ('+schema.items.type+')';
				} else {
					return 'array ('+schema.items.$ref+')';
				}
			} else {
				return schema.type;
			}
		} else {
			return schema.$ref;
		}
	}

	$scope.addSchema = function() 
	{
		if ($scope.responseDef.schema != undefined) { return; }
		$scope.responseDef.schema = { type: "string" };
		$scope.visibleSchema = true;
	}

	$scope.removeSchema = function() 
	{
		if ($scope.responseDef.schema == undefined) { return; }
		if (confirm("Schema definition will be removed. Do you want to continue?")) {
			delete $scope.responseDef.schema;
			$scope.visibleSchema = false;
		}
	}

	$scope.addExample = function()
	{
		if (!this.responseDef.examples) {
			this.responseDef.examples = {};
		}
		if (this.responseDef.examples["application/json"]) {
			if (this.responseDef.examples["Please enter a valid MIME type"]) {
				alert("Please define a MIME type for the previous example first.");
			} else {
				alert("Only JSON examples are supported. You may add examples for other MIME types, but you have to use JSON for the actual example.");
				this.responseDef.examples["Please enter a valid MIME type"] = {};
			}
		} else {
			this.responseDef.examples["application/json"] = {}
		}
	}

	$scope.deleteExample = function()
	{
		if (confirm("Delete example for MIME type '" + this.mimeType + "'?")) {
			delete this.responseDef.examples[this.mimeType];
		}
	}

	$scope.renameExample = function(mimeType, renameMimeType) 
	{
		if (mimeType == renameMimeType) { return; }

		if ($scope.responseDef.examples[renameMimeType]) {
			alert("Example for '" + renameMimeType + "' already exists.");
			this.renameMimeType = mimeType;
			return;
		}

		if (confirm("Changing MIME type from '" + mimeType + "' to '" + renameMimeType + "'?")) {
			console.log("Changing MIME type: " + mimeType + " -> " + renameMimeType);
			$scope.responseDef.examples = Swadit.renameObjectKey($scope.responseDef.examples, mimeType, renameMimeType);
		} else {
			this.renameMimeType = mimeType; // this = $scope of ng-repeat; $scope itself is the parent scope
		}
	}

	$scope.exampleToJson = function(example)
	{
		$scope.exampleJson = angular.toJson(example, true);
		console.log(example, $scope.exampleJson);
		return $scope.exampleJson;
	}

	$scope.commitExample = function()
	{
		var ex;
		try {
			ex = JSON.parse(this.exampleJson);
			this.responseDef.examples[this.mimeType] = ex;
			this.exampleToJson(ex);
			this.exampleJson = $scope.exampleJson;
			this.exampleModified = false;
		} catch(e) {
			alert("Error while parsing example: " + e);
		}
	}

	$scope.revertExample = function()
	{
		this.exampleToJson(this.responseDef.examples[this.mimeType]);
		this.exampleJson = $scope.exampleJson;
		this.exampleModified = false;
	}

	$scope.exampleChanged = function()
	{
		this.exampleModified = true;
	}

}) // SwaditResponseDefinitionController
