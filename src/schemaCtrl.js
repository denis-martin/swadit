
SwaditApp.controller('SwaditSchemaController', function ($scope, $attrs) // object schema controller
{
	$scope.schema = $attrs.schema;
	$scope.isRootDefinition = $attrs.isRootDefinition;
	$scope.visibility = {}; // visibility of sub-schemas

	$scope.$watch(function() { return  $attrs.schema; }, 
		function(newValue, oldValue) {
			if (newValue) {
				$scope.schema = $attrs.schema;
			}
		});

	$scope.toggleVisibility = function(propKey) 
	{
		if ($scope.visibility[propKey]) {
			$scope.visibility[propKey] = false;
		} else {
			$scope.visibility[propKey] = true;
		}
	}

	$scope.removeRequired = function(propKey)
	{
		if ($scope.schema.required) {
			var i = $scope.schema.required.indexOf(propKey);
			if (i > -1) {
				$scope.schema.required.splice(i, 1);
				if ($scope.schema.required.length == 0) {
					delete $scope.schema.required;
				}
			}
		}
	}

	$scope.toggleRequired = function(propKey) 
	{
		if ($scope.schema.required) {
			var i = $scope.schema.required.indexOf(propKey);
			if (i > -1) {
				$scope.schema.required.splice(i, 1);
				if ($scope.schema.required.length == 0) {
					delete $scope.schema.required;
				}
			} else {
				$scope.schema.required.push(propKey);
			}
		} else {
			$scope.schema.required = [ propKey ];
		}
	}

	$scope.getPropertyPreview = function(propSchema) 
	{
		if (propSchema.$ref == undefined || propSchema.$ref == '') {
			if (propSchema.type=='array') {
				if (propSchema.items.$ref == undefined || propSchema.items.$ref == '') {
					return 'array ('+propSchema.items.type+')';
				} else {
					return 'array ('+propSchema.items.$ref+')';
				}
			} else {
				return propSchema.type;
			}
		} else {
			return propSchema.$ref;
		}
	}

	$scope.newSchemaProperty = function(newPropName) 
	{
		if (newPropName == "") { return; }
		if (!$scope.schema.hasOwnProperty("properties")) {
			$scope.schema["properties"] = {};
		}
		if ($scope.schema.properties.hasOwnProperty(newPropName)) {
			alert("Parameter '" + newPropName + "' already exists.");
			return;
		}
		$scope.schema.properties[newPropName] = { type: "string" };
		this.newPropName = "";
	}

	$scope.renameSchemaProperty = function(propKey, propName) 
	{
		if (propKey == propName) { return; }

		if ($scope.schema.properties[propName]) {
			alert("Property '" + propName + "' already exists.");
			return;
		}

		if (confirm("Rename property '" + propKey + "' to '" + propName + "'?")) {
			console.log("Renaming schema property: " + propKey + " -> " + propName);
			var wasRequired = $scope.schema.required && ($scope.schema.required.indexOf(propKey) > -1);
			if (wasRequired) {
				$scope.removeRequired(propKey);
			}
			$scope.schema.properties = Swadit.renameObjectKey($scope.schema.properties, propKey, propName);
			if (wasRequired) {
				$scope.toggleRequired(propName);
			}
		} else {
			this.propName = propKey; // this = $scope of ng-repeat; $scope itself is the parent scope
		}
	}

	$scope.deleteSchemaProperty = function(propKey) 
	{
		if (confirm("Delete property '" + propKey + "'? All child objects will be lost.")) {
			console.log("Deleting schema property: " + propKey);
			$scope.removeRequired(propKey);
			delete $scope.schema.properties[propKey];
		}
	}

	$scope.schemaTypeChanged = function(oldSchemaType, isRef)
	{
		if (isRef) {
			console.log("SchemaTypeChange: " + oldSchemaType + " -> " + $scope.schema.$ref);
			if (oldSchemaType == undefined || oldSchemaType == "") {
				if (confirm("Using a reference ($ref) will remove the rest of the schema definition. Do you want to continue?")) {
					angular.forEach($scope.schema, function (value, key) {
						if (key != "$ref") {
							delete $scope.schema[key];
						}
					});
					console.log($scope.schema);
				} else {
					delete $scope.schema.$ref;
				}
			} else {
				if ($scope.schema.$ref == "" || $scope.schema.$ref == undefined) {
					delete $scope.schema.$ref;
					$scope.schema.type = "string";
				}
			}

		} else {
			console.log("SchemaTypeChange: " + oldSchemaType + " -> " + $scope.schema.type);
			if (oldSchemaType == "object" && $scope.schema.type != "object" && $scope.schema.properties != undefined) {
				if (Object.keys($scope.schema.properties).length > 0) {
					if (confirm("Changing the property type from 'object' to something else will remove all sub-properties. Do you want to continue?")) {
						delete $scope.schema.properties;
					} else {
						$scope.schema.type = oldSchemaType;
					}
				} else {
					delete $scope.schema.properties; // is already empty
				}

			} else if (oldSchemaType == "array" && $scope.schema.type != "array" && $scope.schema.items != undefined) {
				if (confirm("Changing the property type from 'array' to something else will remove the array's item type definition. Do you want to continue?")) {
					delete $scope.schema.items;
				} else {
					$scope.schema.type = oldSchemaType;
				}

			} else if (oldSchemaType != "object" && oldSchemaType != "array" && $scope.schema.format != undefined) {
				if ($scope.schema.format.length > 0) {
					if (confirm("Changing the property type will remove the format definition. Do you want to continue?")) {
						delete $scope.schema.format;
					} else {
						$scope.schema.type = oldSchemaType;
					}
				}
			}

			if ($scope.schema.type == "array" && $scope.schema.items == undefined) {
				$scope.schema.items = { type: "string" };
			}

			$scope.onExampleChange("default");
			$scope.onExampleChange("example");	
		}
	}

	$scope.onExampleChange = function(prop)
	{
		if ($scope.verify == undefined) { $scope.verify = {}; }
		delete $scope.verify[prop];

		if ($scope.schema[prop] == "") {
			delete $scope.schema[prop];

		} else if ($scope.schema[prop] != undefined) {
			if ($scope.schema.type == "number" && typeof($scope.schema[prop]) != "number") {
				var s = $scope.schema[prop];
				if (Number(s) == s && s.substr(s.length-1, 1) != ".") {
					$scope.schema[prop] = Number(s);
				} else {
					$scope.verify[prop] = "Value does not conform to type";
				}

			} else if ($scope.schema.type == "integer") {
				var s = $scope.schema[prop];
				if (Number(s) == parseInt(s) && s.substr(s.length-1, 1) != ".") {
					$scope.schema[prop] = parseInt(s);
				} else {
					$scope.verify[prop] = "Value does not conform to type";
				}
				
			} else if ($scope.schema.type == "boolean" && typeof($scope.schema[prop]) != "boolean") {
				if ($scope.schema[prop] == "true") {
					$scope.schema[prop] = true;

				} else if ($scope.schema[prop] == "false") {
					$scope.schema[prop] = false;

				} else {
					$scope.verify[prop] = "Value does not conform to type";
				}
				
			}  else if ($scope.schema.type == "string" && typeof($scope.schema[prop]) != "string") {
				$scope.schema[prop] = String($scope.schema[prop]);
				
			}
		}
	}

}) // SwaditSchemaController
