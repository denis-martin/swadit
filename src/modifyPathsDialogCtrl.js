
SwaditApp.controller('SwaditUiModifyPathsDialogController', function ($scope, $uibModalInstance, dialogType)
{
	$scope.dialogType = dialogType;

	$scope.ok = function () 
	{
        $uibModalInstance.close({ removeAllTags: $scope.removeAllTags, tagsToAdd: $scope.tagsToAdd });
	};

	$scope.cancel = function () 
	{
		$uibModalInstance.dismiss('cancel');
	};

}) // SwaditUiModifyPathsDialogController
