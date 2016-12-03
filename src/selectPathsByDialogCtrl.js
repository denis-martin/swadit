
SwaditApp.controller('SwaditUiSelectPathsByDialogController', function ($scope, $uibModalInstance, dialogType)
{
	$scope.dialogType = dialogType;

	$scope.ok = function () 
	{
        $uibModalInstance.close({ tag: $scope.tag, names: $scope.names });
	};

	$scope.cancel = function () 
	{
		$uibModalInstance.dismiss('cancel');
	};

}) // SwaditUiSelectPathsByDialogController
