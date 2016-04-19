'use strict'

//Define an angular module for our app
var myApp = angular.module('myApp', ['ngRoute', 'highcharts-ng']);
//Define Routing for the application

//TODOS: Create a directive for chart building
//Clean up unused services from controllers/directives


myApp.run(function ($rootScope) {
    $rootScope.currentIPData = [];
    $rootScope.currentEthernetData = [];
    $rootScope.currentSwitchData = [];

})

myApp.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider
            .when('/home', {
                templateUrl: 'partials/home.html',
                controller: 'homeController'
            })
            .when('/iptable/:uploadRedirect', {
                templateUrl: 'partials/iptable.html',
                controller: 'ipController'
            })
            .when('/switch/:uploadRedirect', {
                templateUrl: 'partials/switch.html',
                controller: 'switchController'
            }).
            when('/ethernet/:uploadRedirect', {
                templateUrl: 'partials/ethernet.html',
                controller: 'ethernetController'
            }).
           otherwise({
               redirectTo: '/home'
           });


    }]);

//change http to file upload control
myApp.controller('homeController', ['$scope', '$http', '$routeParams', '$location', '$rootScope', function ($scope, $http, $routeParams, $location, $rootScope) {

    $scope.filesToUpload = [];

    $scope.selectFile = function () {
        var files = event.target.files;

        for (var i = 0; i < files.length; i++) {
            var fr = new FileReader();
            fr.onload = $scope.receivedText;
            fr.readAsText(files[i]);
        }

    };

    $scope.receivedText = function (e) {
        var lines = e.target.result;
        $scope.filesToUpload.push(JSON.parse(lines));
    }

    $scope.upload = function () {
        var data = $scope.filesToUpload;
        var path = null;

        for (var i = 0; i < data.length; i++) {
            if (data[i]) {
                if (data[i].LogType == "IPTable") {
                    $rootScope.currentIPData.push(data[i]);
                    path = '/iptable/true';
                }
                else if (data[i].LogType == "Switch") {
                    $rootScope.currentSwitchData.push(data[i]);
                    path = '/switch/true';
                }
                else if (data[i].LogType == "Ethernet") {
                    $rootScope.currentEthernetData.push(data[i]);
                    path = '/ethernet/true';
                }

                else {
                    alert("File is not a valid log file");
                    return;
                }
            }
            else {
                alert("Error uploading data, make sure a valid file was selected before uploading");
                return;
            }
        }

        if (path) {
            $location.path(path);
        }

    };
}]);

myApp.controller('ipController', ['$scope', '$rootScope', '$routeParams', function ($scope, $rootScope, $routeParams) {

    $scope.charts = [];

    //duplicate make a chart building service
    $scope.buildIPChart = function (title, units, series) {
        var chart = {
            options: {
                chart: {
                    type: 'line',
                    zoomType: 'x'
                }
            },
            title:
            {
                text: title,
                x: -20 //center
            },
            credits: {
                enabled: false
            },
            rangeSelector: {
                enabled: false //can probably use this in the future
            },
            xAxis:
            {
                title:
                {
                    text: 'Elapsed Time (mins)'
                },
                labels: {
                    formatter: function () {
                        return (this.value * 2);
                    }
                }
            },
            yAxis: {
                title:
                {
                    text: units
                },
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: 'silver'
                }]
            },
            plotOptions: {
                series: {
                    compare: 'value'
                }
            },
            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>'
            },
            series: series
        };

        return chart;
    }

    $scope.loadCharts = function () {

        for (var i = 0; i < $rootScope.currentIPData.length; i++) {

            var messageCount = $rootScope.currentIPData[i].Messages.length - 2; //dont take into account the registration message or the mock obj at the end

            var inputByteSeries = [];
            var outputByteSeries = [];
            var forwardByteSeries = [];

            var inputPacketSeries = [];
            var outputPacketSeries = [];
            var forwardPacketSeries = [];


            var registrationDetails = $rootScope.currentIPData[i].Messages[0].DataItems;
            for (var j = 0; j < registrationDetails.length; j++) {

                if (registrationDetails[j].chain == "INPUT") {
                    inputByteSeries.push({
                        name: registrationDetails[j].id,
                        data: []
                    });

                    inputPacketSeries.push({
                        name: registrationDetails[j].id,
                        data: []
                    });
                }
                if (registrationDetails[j].chain == "OUTPUT") {
                    outputByteSeries.push({
                        name: registrationDetails[j].id,
                        data: []
                    });

                    outputPacketSeries.push({
                        name: registrationDetails[j].id,
                        data: []
                    });
                }
                if (registrationDetails[j].chain == "FORWARD") {
                    forwardByteSeries.push({
                        name: registrationDetails[j].id,
                        data: [],
                        visible: false
                    });

                    forwardPacketSeries.push({
                        name: registrationDetails[j].id,
                        data: [],
                        visible: false
                    });
                }


            }

            //move this logic into core library?
            for (var j = 1; j < messageCount - 1; j++) {
                var dataItems = $rootScope.currentIPData[i].Messages[j].DataItems;

                var inputIndex = 0;
                var outputIndex = 0;
                var forwardIndex = 0;

                for (var k = 0; k < dataItems.length - 1; k++) {
                    if (dataItems[k].Chain == "INPUT") {
                        inputByteSeries[inputIndex].data.push(parseInt(dataItems[k].Bytes));
                        inputPacketSeries[inputIndex].data.push(parseInt(dataItems[k].Packets));
                        inputIndex++;
                    }
                    if (dataItems[k].Chain == "OUTPUT") {
                        outputByteSeries[outputIndex].data.push(parseInt(dataItems[k].Bytes));
                        outputPacketSeries[outputIndex].data.push(parseInt(dataItems[k].Packets));
                        outputIndex++;

                    }
                    if (dataItems[k].Chain == "FORWARD") {
                        forwardByteSeries[forwardIndex].data.push(parseInt(dataItems[k].Bytes));
                        forwardPacketSeries[forwardIndex].data.push(parseInt(dataItems[k].Packets));
                        forwardIndex++;
                    }
                }
            }

            //does not separate presentation code from logic and data. need to write a directive for this
            var inputBytesChart = $scope.buildIPChart('Input Bytes', 'Bytes', inputByteSeries);
            var inputPacketsChart = $scope.buildIPChart('Input Packets', 'Packets', inputPacketSeries);

            var outputBytesChart = $scope.buildIPChart('Output Bytes', 'Bytes', outputByteSeries);
            var outputPacketsChart = $scope.buildIPChart('Output Packets', 'Packets', outputPacketSeries);

            var forwardBytesChart = $scope.buildIPChart('Forward Bytes', 'Bytes', forwardByteSeries);
            var forwardPacketsChart = $scope.buildIPChart('Forward Packets', 'Packets', forwardPacketSeries);


            $scope.charts.push(inputBytesChart);
            $scope.charts.push(inputPacketsChart);

            $scope.charts.push(outputBytesChart);
            $scope.charts.push(outputPacketsChart);

            $scope.charts.push(forwardBytesChart);
            $scope.charts.push(forwardPacketsChart);

        }
    }

    if (typeof $rootScope.currentIPData !== 'undefined' &&
	typeof $routeParams.uploadRedirect !== 'undefined' &&
        //$routeParams.uploadRedirect !== 'false' && need to figure out a way to persist charts through navigation
	$rootScope.currentIPData.length > 0) {
        $scope.loadCharts();
    }



}]);

myApp.controller('ethernetController', ['$scope', '$rootScope', '$routeParams', function ($scope, $rootScope, $routeParams) {

    $scope.charts = [];

    $scope.buildEthernetChart = function (title, units, series) {
        var chart = {
            options: {
                chart: {
                    type: 'line',
                    zoomType: 'x'
                }
            },
            title:
            {
                text: title,
                x: -20 //center
            },
            credits: {
                enabled: false
            },
            rangeSelector: {
                enabled: false //can probably use this in the future
            },
            xAxis:
            {
                title:
                {
                    text: 'Elapsed Time (mins)'
                },
                labels: {
                    formatter: function () {
                        return (this.value * 2);
                    }
                }
            },
            yAxis: {
                title:
                {
                    text: units
                },
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: 'silver'
                }]
            },
            plotOptions: {
                series: {
                    compare: 'value'
                }
            },
            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>'
            },
            series: series
        };

        return chart;
    }

    $scope.loadCharts = function () {

        for (var i = 0; i < $rootScope.currentEthernetData.length; i++) {
            var messageCount = $rootScope.currentEthernetData[i].Messages.length - 2; //dont take into account the registration message or the mock obj at the end

            //fill series data;
            var receivedPacketSeries = [];
            var transmittedPacketSeries = [];

            var errorDrilldown = [];
            var errorSeries = [
            {
                name: 'Rx Errors',
                data: []
            },
            {
                name: 'Rx Dropped',
                data: []
            },
            {
                name: 'Rx Overruns',
                data: []
            },
            {
                name: 'Rx Frame',
                data: []
            },
            {
                name: 'Tx Errors',
                data: []
            },
            {
                name: 'Tx Dropped',
                data: []
            },
            {
                name: 'Tx Overruns',
                data: []
            },
            {
                name: 'TxCarrier',
                data: []
            },
            {
                name: 'TxCollisions',
                data: []
            }
            ];




            //get series categories from registration message
            var registrationDetails = $rootScope.currentEthernetData[i].Messages[0].DataItems;
            for (var j = 0; j < registrationDetails.length; j++) {
                receivedPacketSeries.push({
                    name: registrationDetails[j].InterfaceName,
                    data: []
                });

                transmittedPacketSeries.push({
                    name: registrationDetails[j].InterfaceName,
                    data: []
                });

                for (var k = 0; k < errorSeries.length; k++) {
                    var drillId = registrationDetails[j].InterfaceName + '-' + k;
                    errorSeries[k].data.push({ name: registrationDetails[j].InterfaceName, y: 0, drilldown: drillId })
                    errorDrilldown.push({
                        type: 'line',
                        id: drillId,
                        data: [
                            /* {name: 'Test A', y: 2}, //return to fix later
                            {name: 'Test B', y: 3}, */
                        ]
                    })
                }
            }

            //move this logic into core library?
            for (var j = 1; j < messageCount - 1; j++) {
                var dataItems = $rootScope.currentEthernetData[i].Messages[j].DataItems;

                for (var k = 0; k < dataItems.length; k++) {
                    receivedPacketSeries[k].data.push(parseInt(dataItems[k].RxGood));
                    transmittedPacketSeries[k].data.push(parseInt(dataItems[k].TxGood));

                    errorSeries[0].data[k].y = parseInt(dataItems[k].RxErrors); //probably a better way to handle this
                    errorSeries[1].data[k].y = parseInt(dataItems[k].RxDropped);
                    errorSeries[2].data[k].y = parseInt(dataItems[k].RxOverruns);
                    errorSeries[3].data[k].y = parseInt(dataItems[k].RxFrame);
                    errorSeries[4].data[k].y = parseInt(dataItems[k].TxErrors);
                    errorSeries[5].data[k].y = parseInt(dataItems[k].TxDropped);
                    errorSeries[6].data[k].y = parseInt(dataItems[k].TxOverruns);
                    errorSeries[7].data[k].y = parseInt(dataItems[k].TxCarrier);
                    errorSeries[8].data[k].y = parseInt(dataItems[k].TxCollisions);

                    /* errorSeries[0].data[j].y = 2; //test data
                    errorSeries[1].data[j].y = 4;
                    errorSeries[2].data[j].y = 6;
                    errorSeries[3].data[j].y = 8;
                    errorSeries[4].data[j].y = 10;
                    errorSeries[5].data[j].y = 12;
                    errorSeries[6].data[j].y = 14;
                    errorSeries[7].data[j].y = 16;
                    errorSeries[8].data[j].y = 18; */
                }


            }


            var receivedPacketsChart = $scope.buildEthernetChart('Received Packets', 'Received Packets', receivedPacketSeries);
            var transmittedPacketsChart = $scope.buildEthernetChart('Transmitted Packets', 'Transmitted Packets', transmittedPacketSeries);

            //will need to move this into a service as well
            var errorChart = {
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Errors'
                },
                xAxis: {
                    type: 'category'
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Total Errors'
                    }
                },
                tooltip: {
                    headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                    pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        '<td style="padding:0"><b>{point.y}</b></td></tr>',
                    footerFormat: '</table>',
                    shared: true,
                    useHTML: true
                },
                plotOptions: {
                    column: {
                        pointPadding: 0.2,
                        borderWidth: 0
                    }
                },
                series: errorSeries,
                drilldown: {
                    series: errorDrilldown
                }
            };

            $scope.charts.push(errorChart);
            $scope.charts.push(receivedPacketsChart);
            $scope.charts.push(transmittedPacketsChart);

        }
    }

    if (typeof $rootScope.currentEthernetData !== 'undefined' && $rootScope.currentEthernetData.length > 0) {
        $scope.loadCharts();
    }

}]);

myApp.controller('switchController', ['$scope', '$rootScope', '$routeParams', function ($scope, $rootScope, $routeParams) {

    $scope.charts = [];

    //duplicate make a chart building service
    $scope.buildSwitchChart = function (title, units, series) {
        var chart = {
            options: {
                chart: {
                    type: 'line',
                    zoomType: 'x'
                }
            },
            title:
            {
                text: title,
                x: -20 //center
            },
            credits: {
                enabled: false
            },
            rangeSelector: {
                enabled: false //can probably use this in the future
            },
            xAxis:
            {
                title:
                {
                    text: 'Elapsed Time (mins)'
                },
                labels: {
                    formatter: function () {
                        return (this.value * 2);
                    }
                }
            },
            yAxis: {
                title:
                {
                    text: units
                },
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: 'silver'
                }]
            },
            plotOptions: {
                series: {
                    compare: 'value'
                }
            },
            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>'
            },
            series: series
        };

        return chart;
    }

    $scope.loadCharts = function () {

        for (var i = 0; i < $rootScope.currentSwitchData.length; i++) {
            var messageCount = $rootScope.currentSwitchData[i].Messages.length - 2; //dont take into account the registration message or the mock obj at the end

            //building series data will go here
            var ingressByteSeries = [];
            var egressByteSeries = [];

            var ingressMulticastSeries = [];
            var egressMulticastSeries = [];

            var ingressBroadcastSeries = [];
            var egressBroadcastSeries = [];

            var ingressUnicastSeries = [];
            var egressUnicastSeries = [];


            var registrationDetails = $rootScope.currentSwitchData[i].Messages[0].DataItems;
            for (var j = 0; j < registrationDetails.length; j++) {

                ingressByteSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });
                egressByteSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });

                ingressMulticastSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });
                egressMulticastSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });

                ingressBroadcastSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });
                egressBroadcastSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });

                ingressUnicastSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });
                egressUnicastSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });

            }

            //move this logic into core library?
            for (var j = 1; j < messageCount - 1; j++) {
                var dataItems = $rootScope.currentSwitchData[i].Messages[j].DataItems;

                for (var k = 0; k < dataItems.length - 1; k++) {

                    ingressByteSeries[k].data.push(parseInt(dataItems[k].IngressBytes));
                    egressByteSeries[k].data.push(parseInt(dataItems[k].EgressBytes));

                    ingressMulticastSeries[k].data.push(parseInt(dataItems[k].IngressMulticast));
                    egressMulticastSeries[k].data.push(parseInt(dataItems[k].EgressMulticast));

                    ingressBroadcastSeries[k].data.push(parseInt(dataItems[k].IngressBroadcast));
                    egressBroadcastSeries[k].data.push(parseInt(dataItems[k].EgressBroadcast));

                    ingressUnicastSeries[k].data.push(parseInt(dataItems[k].IngressuUnicast));
                    egressUnicastSeries[k].data.push(parseInt(dataItems[k].EgressUnicast));

                }
            }

            //does not separate presentation code from logic and data. need to write a directive for this
            var ingressBytesChart = $scope.buildSwitchChart('Ingress Bytes', 'Bytes', ingressByteSeries);
            var egressBytesChart = $scope.buildSwitchChart('Egress Bytes', 'Bytes', egressByteSeries);

            var ingressMulticastChart = $scope.buildSwitchChart('Ingress Multicast', 'Packets', ingressMulticastSeries);
            var egressMulticastChart = $scope.buildSwitchChart('Egress Multicast', 'Packets', egressMulticastSeries);

            var ingressBroadcastChart = $scope.buildSwitchChart('Ingress Broadcast', 'Packets', ingressBroadcastSeries);
            var egressBroadcastChart = $scope.buildSwitchChart('Egress Broadcast', 'Packets', egressBroadcastSeries);

            var ingressUnicastChart = $scope.buildSwitchChart('Ingress Unicast', 'Packets', ingressUnicastSeries);
            var egressUnicastChart = $scope.buildSwitchChart('Egress Unicast', 'Packets', egressUnicastSeries);


            $scope.charts.push(ingressBytesChart);
            $scope.charts.push(egressBytesChart);

            $scope.charts.push(ingressMulticastChart);
            $scope.charts.push(egressMulticastChart);

            $scope.charts.push(ingressBroadcastChart);
            $scope.charts.push(egressBroadcastChart);

            $scope.charts.push(ingressUnicastChart);
            $scope.charts.push(egressUnicastChart);

        }

    }

    if (typeof $rootScope.currentSwitchData !== 'undefined' && $rootScope.currentSwitchData.length > 0) {
        $scope.loadCharts();
    }

}]);



//directives start here
myApp.directive('customOnChange', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var onChangeFunc = scope.$eval(attrs.customOnChange);
            element.bind('change', onChangeFunc);
        }
    };
});

