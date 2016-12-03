
SwaditApp.controller('SwaditParameterDefinitionsController', function ($scope, $attrs)
{
	$scope.param = $attrs.param;
	$scope.isRootDefinition = $attrs.isRootDefinition;

	$scope.inChanged = function(oldIn, isRef)
	{
		if (isRef) {
			console.log("inChanged: " + oldIn + " -> " + $scope.param.$ref);
			if (oldIn == undefined || oldIn == "") {
				if (confirm("Using a reference ($ref) will remove the rest of the parameter definition. Do you want to continue?")) {
					angular.forEach($scope.param, function (value, key) {
						if (key != "$ref") {
							delete $scope.param[key];
						}
					});
					console.log($scope.param);
				} else {
					delete $scope.param.$ref;
				}
			} else {
				if ($scope.param.$ref == "" || $scope.param.$ref == undefined) {
					delete $scope.param.$ref;
					$scope.param.type = "string";
					$scope.param.in = "query";
				}
			}

		} else {
			// according to http://swagger.io/specification/#parameterObject
			if (oldIn == "body" && $scope.param.in != "body") {
				if (confirm("Changing the parameter location from 'body' to any other value will erase the schema definition. Do you want to continue?")) {
					delete $scope.param.schema;
					$scope.param.type = "string";
				} else {
					$scope.param.in = "body";
				}

			} else if (oldIn != "body" && $scope.param.in == "body") {
				if (confirm("Changing the parameter location to 'body' will erase the type definition. Do you want to continue?")) {
					Object.keys($scope.param).forEach(function(v) {
						if (v != "name" && 
							v != "in" && 
							v != "description" &&
							v != "required" && 
							v != "schema") 
						{
							delete $scope.param[v];
						}
					});
					$scope.param.schema = { type: "string" };
				} else {
					$scope.param.in = oldIn;
				}
			}
		}
	}
}) // SwaditParameterDefinitionsController
