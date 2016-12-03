
SwaditApp.controller('SwaditUiFileDialogController', function ($scope, $uibModalInstance, dialogType)
{
	$scope.dialogType = dialogType;
	$scope.downloadUrl = Swadit.downloadUrl; // global definition for releasing blob-URL

	if (dialogType == "fileOpen") {
		$scope.modalTitle = "Open Swagger File";
		$scope.modalHint = "Note: Any existing changes will be lost if opening a new file.";

	} else if (dialogType == "fileAdd") {
		$scope.modalTitle = "Add Swagger File";
		$scope.modalHint = "Note: Matching existing endpoints (paths), properties and definitions will be removed and replaced by the ones specified in the file to be added.";

	} else if (dialogType == "fileSave") {
		$scope.modalTitle = "Save Swagger File";
		$scope.modalHint = "Note: This tool is still in ALPHA state. You should at least verify the resulting YAML in Swagger Editor.";

		var api = JSON.parse(angular.toJson(Swadit.api)); // need to remove angular's private variables
		SwaggerParser.validate(api)
			.then(function(api) {
				console.log("This API is a valid Swagger file.");
			})
			.catch(function(err) {
				$scope.modalHint = "Swagger validation error. See \"Swagger\" tab on main window for details.";
				$scope.modalHintType = "error";
				console.error("Swagger validation error: " + err.message);
			}
		);
		
	} else {
		$scope.modalTitle = "Swadit";
		$scope.modalHint = "";
	}

	$scope.ok = function () 
	{
		if (dialogType == "fileOpen" || dialogType == "fileAdd") {
			var f = document.getElementById('modalFileInput').files;
			if (f != undefined && f.length > 0) {
				$uibModalInstance.close(f);
			} else {
				alert("Please specify a file.");
			}
		} else {
			$uibModalInstance.dismiss('ok');
		}
	};

	$scope.cancel = function () 
	{
		$uibModalInstance.dismiss('cancel');
	};

}) // SwaditUiFileDialogController
