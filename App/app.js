'use strict'

//Define an angular module for our app
var myApp = angular.module('myApp', ['ngRoute', 'highcharts-ng']);
//Define Routing for the application

//TODOS: Create a directive for chart building
//Clean up unused services from controllers/directives


myApp.run(function ($rootScope) {

    $rootScope.currentData = {
        IPStats: [],
        EthernetStats: [],
        SwitchStats: []
    };

    $rootScope.currentInterval = 2;
    $rootScope.currentDeltaOption = false;
})

myApp.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider
            .when('/home', {
                templateUrl: 'partials/home.html',
                controller: 'homeController'
            })
            .when('/iptable', {
                templateUrl: 'partials/iptable.html',
                controller: 'ipController'
            })
            .when('/switch', {
                templateUrl: 'partials/switch.html',
                controller: 'switchController'
            }).
            when('/ethernet', {
                templateUrl: 'partials/ethernet.html',
                controller: 'ethernetController'
            }).
			when('/help', {
                templateUrl: 'partials/help.html',
				controller: 'helpController'
            }).
           otherwise({
               redirectTo: '/home'
           });


    }]);

	myApp.controller('helpController', ['$scope', '$http', '$routeParams', '$location', '$rootScope', function ($scope, $http, $routeParams, $location, $rootScope){
		
	}]);
	
//change http to file upload control
myApp.controller('homeController', ['$scope', '$http', '$routeParams', '$location', '$rootScope', function ($scope, $http, $routeParams, $location, $rootScope) {

    $scope.interval = 2;

    $scope.displayPacketDelta = false;

    $scope.filesToUpload = [];

    $scope.updateOptions = function () {
        $rootScope.currentInterval = $scope.interval;
        $rootScope.currentDeltaOption = $scope.displayPacketDelta;
    }

    $scope.selectFile = function () {
        var files = event.target.files;

        for (var i = 0; i < files.length; i++) {
            var fr = new FileReader();

            fr.onload = (function (f) {
                return function (e) {
                    var lines = e.target.result;
                    var name = f.name;
                    $scope.filesToUpload.push({
                        Name: name,
                        Data: JSON.parse(lines)
                    });
                };
            })(files[i]);

            fr.readAsText(files[i]);
        }

    };

    $scope.upload = function () {
        var files = $scope.filesToUpload;
        var path = null;

        for (var i = 0; i < files.length; i++) {
            if (files[i] && files[i].Data) {
                if (files[i].Data.LogType == "IPTable") {
                    $rootScope.currentData.IPStats.push(files[i]);
                    path = '/iptable';
                }
                else if (files[i].Data.LogType == "Switch") {
                    $rootScope.currentData.SwitchStats.push(files[i]);
                    path = '/switch';
                }
                else if (files[i].Data.LogType == "Ethernet") {
                    $rootScope.currentData.EthernetStats.push(files[i]);
                    path = '/ethernet';
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
        $scope.filesToUpload = [];
    };

}]);

myApp.controller('ipController', ['$scope', '$rootScope', '$routeParams', function ($scope, $rootScope, $routeParams) {

    $scope.files = [];
    $scope.selectedIndex = 0;

    $scope.$watch(function () {
        return $rootScope.currentInterval;
    }, function () {
        if (typeof $rootScope.currentData !== 'undefined' && $rootScope.currentData.IPStats.length > 0) {
            $scope.files = [];
            $scope.loadCharts();
        }
    }, true);

    $scope.$watch(function () {
        return $rootScope.currentDeltaOption;
    }, function () {
        if (typeof $rootScope.currentData !== 'undefined' && $rootScope.currentData.IPStats.length > 0) {
            $scope.files = [];
            $scope.loadCharts();
        }
    }, true);

    //duplicate make a chart building service
    $scope.buildIPChart = function (title, units, series) {
        var chart = {
            options: {
                chart: {
                    type: 'line',
                    zoomType: 'x'
                },
                tooltip: {
                    pointFormat: '<span>{series.name}</span>: <b>{point.y}</b><br/>'
                },
                legend: {
					itemWidth: 1000,
					width: 1000,
                    labelFormatter: function () {
						var label = this.index + ": " + this.name;
						return '<span>' + label + '</span></br>';
					}
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
                        return (this.value * $rootScope.currentInterval);
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
            series: series
        };

        return chart;
    }

    $scope.selectFile = function (index) {
        $scope.selectedIndex = index;
    }

    $scope.isShowing = function (index) {
        return $scope.selectedIndex === index;
    }

    $scope.loadCharts = function () {


        for (var i = 0; i < $rootScope.currentData.IPStats.length; i++) {
            $scope.files.push({
                Name: $rootScope.currentData.IPStats[i].Name,
                Charts: []
            });
        }


        for (var i = 0; i < $rootScope.currentData.IPStats.length; i++) {

            var ipFile = $rootScope.currentData.IPStats[i];
            var messageCount = ipFile.Data.Messages.length - 2; //dont take into account the registration message or the mock obj at the end

            var inputByteSeries = [];
            var outputByteSeries = [];
            var forwardByteSeries = [];

            var inputPacketSeries = [];
            var outputPacketSeries = [];
            var forwardPacketSeries = [];

            var inputPacketDeltaSeries = [];
            var outputPacketDeltaSeries = [];
            var forwardPacketDeltaSeries = [];

            var inputBandwidthSeries = [];
            var outputBandwidthSeries = [];
            var forwardBandwidthSeries = [];


            var registrationDetails = ipFile.Data.Messages[0].DataItems;
            for (var j = 0; j < registrationDetails.length; j++) {

                if (registrationDetails[j].chain == "INPUT") {
                    inputByteSeries.push({
                        name: registrationDetails[j].description,
                        data: []
                    });

                    inputPacketSeries.push({
                        name: registrationDetails[j].description,
                        data: []
                    });

                    inputPacketDeltaSeries.push({
                        name: registrationDetails[j].description,
                        data: []
                    });

                    inputBandwidthSeries.push({
                        name: registrationDetails[j].description,
                        data: []
                    });
                }
                if (registrationDetails[j].chain == "OUTPUT") {
                    outputByteSeries.push({
                        name: registrationDetails[j].description,
                        data: []
                    });

                    outputPacketSeries.push({
                        name: registrationDetails[j].description,
                        data: []
                    });

                    outputPacketDeltaSeries.push({
                        name: registrationDetails[j].description,
                        data: []
                    });

                    outputBandwidthSeries.push({
                        name: registrationDetails[j].description,
                        data: []
                    });
                }
                if (registrationDetails[j].chain == "FORWARD") {
                    forwardByteSeries.push({
                        name: registrationDetails[j].description,
                        data: [],
                        visible: false
                    });

                    forwardPacketSeries.push({
                        name: registrationDetails[j].description,
                        data: [],
                        visible: false
                    });

                    forwardPacketDeltaSeries.push({
                        name: registrationDetails[j].description,
                        data: [],
                        visible: false
                    });

                    forwardBandwidthSeries.push({
                        name: registrationDetails[j].description,
                        data: [],
                        visible: false
                    });
                }
            }

            //move this logic into core library?
            for (var j = 1; j < messageCount - 1; j++) {
                var dataItems = ipFile.Data.Messages[j].DataItems;

                var inputIndex = 0;
                var outputIndex = 0;
                var forwardIndex = 0;

                for (var k = 0; k < dataItems.length - 1; k++) {
                    if (dataItems[k].Chain == "INPUT") {
                        inputByteSeries[inputIndex].data.push(parseInt(dataItems[k].Bytes));
                        inputPacketSeries[inputIndex].data.push(parseInt(dataItems[k].Packets));

                        if (j == 1) {
                            inputBandwidthSeries[inputIndex].data.push(0);
                            inputPacketDeltaSeries[inputIndex].data.push(0);
                        } else {

                            var prevData = ipFile.Data.Messages[j - 1].DataItems[inputIndex];

                            var packetsPrevious = parseInt(prevData.Packets)
                            var packetsCurrent = parseInt(dataItems[inputIndex].Packets);

                            var bytesPrevious = parseInt(prevData.Bytes);
                            var bytesCurrent = parseInt(dataItems[inputIndex].Bytes);

                            inputBandwidthSeries[inputIndex].data.push(((bytesCurrent - bytesPrevious) * .008) / ($rootScope.currentInterval * 60)); //convert B/s to kb/s
                            inputPacketDeltaSeries[inputIndex].data.push(packetsCurrent - packetsPrevious);
                        }

                        inputIndex++;
                    }
                    if (dataItems[k].Chain == "OUTPUT") {
                        outputByteSeries[outputIndex].data.push(parseInt(dataItems[k].Bytes));
                        outputPacketSeries[outputIndex].data.push(parseInt(dataItems[k].Packets));

                        if (j == 1) {
                            outputBandwidthSeries[outputIndex].data.push(0);
                            outputPacketDeltaSeries[outputIndex].data.push(0);
                        } else {

                            var prevData = ipFile.Data.Messages[j - 1].DataItems[outputIndex];

                            var packetsPrevious = parseInt(prevData.Packets)
                            var packetsCurrent = parseInt(dataItems[outputIndex].Packets);

                            var bytesPrevious = parseInt(prevData.Bytes);
                            var bytesCurrent = parseInt(dataItems[outputIndex].Bytes);

                            //will need to divide on interval once its implemented
                            outputBandwidthSeries[outputIndex].data.push(((bytesCurrent - bytesPrevious) * .008) / ($rootScope.currentInterval * 60)); //convert B/s to kb/s
                            outputPacketDeltaSeries[outputIndex].data.push(packetsCurrent - packetsPrevious);
                        }

                        outputIndex++;
                    }
                    if (dataItems[k].Chain == "FORWARD") {
                        forwardByteSeries[forwardIndex].data.push(parseInt(dataItems[k].Bytes));
                        forwardPacketSeries[forwardIndex].data.push(parseInt(dataItems[k].Packets));

                        if (j == 1) {
                            forwardBandwidthSeries[forwardIndex].data.push(0);
                            forwardPacketDeltaSeries[forwardIndex].data.push(0);
                        } else {

                            var prevData = ipFile.Data.Messages[j - 1].DataItems[forwardIndex];

                            var packetsPrevious = parseInt(prevData.Packets)
                            var packetsCurrent = parseInt(dataItems[forwardIndex].Packets);

                            var bytesPrevious = parseInt(prevData.Bytes);
                            var bytesCurrent = parseInt(dataItems[forwardIndex].Bytes);

                            //will need to divide on interval once its implemented
                            forwardBandwidthSeries[forwardIndex].data.push(((bytesCurrent - bytesPrevious) * .008) / ($rootScope.currentInterval * 60)); //convert B/s to kb/s
                            forwardPacketDeltaSeries[forwardIndex].data.push(packetsCurrent - packetsPrevious);
                        }

                        forwardIndex++;

                    }
                }
            }

            //does not separate presentation code from logic and data. need to write a directive for this
            var inputBytesChart = $scope.buildIPChart('Input Bytes', 'Bytes', inputByteSeries);
            var inputPacketsChart = $scope.buildIPChart('Input Packets', 'Packets', inputPacketSeries);
            var inputBandwidthChart = $scope.buildIPChart('Input Bandwidth', 'kb/s', inputBandwidthSeries);

            var outputBytesChart = $scope.buildIPChart('Output Bytes', 'Bytes', outputByteSeries);
            var outputPacketsChart = $scope.buildIPChart('Output Packets', 'Packets', outputPacketSeries);
            var outputBandwidthChart = $scope.buildIPChart('Output Bandwidth', 'kb/s', outputBandwidthSeries);

            var forwardBytesChart = $scope.buildIPChart('Forward Bytes', 'Bytes', forwardByteSeries);
            var forwardPacketsChart = $scope.buildIPChart('Forward Packets', 'Packets', forwardPacketSeries);
            var forwardBandwidthChart = $scope.buildIPChart('Forward Bandwidth', 'kb/s', forwardBandwidthSeries);

            if ($rootScope.currentDeltaOption) {
                inputPacketsChart = $scope.buildIPChart('Input Packets', 'Packets Delta', inputPacketDeltaSeries);
                outputPacketsChart = $scope.buildIPChart('Output Packets', 'Packets Delta', outputPacketDeltaSeries);
                forwardPacketsChart = $scope.buildIPChart('Forward Packets', 'Packets Delta', forwardPacketDeltaSeries);
            }



            $scope.files[i].Charts.push(inputBytesChart);
            $scope.files[i].Charts.push(inputPacketsChart);
            $scope.files[i].Charts.push(inputBandwidthChart);

            $scope.files[i].Charts.push(outputBytesChart);
            $scope.files[i].Charts.push(outputPacketsChart);
            $scope.files[i].Charts.push(outputBandwidthChart);

            $scope.files[i].Charts.push(forwardBytesChart);
            $scope.files[i].Charts.push(forwardPacketsChart);
            $scope.files[i].Charts.push(forwardBandwidthChart);

        }


    }

    if (typeof $rootScope.currentData !== 'undefined' && $rootScope.currentData.IPStats.length > 0) {
        $scope.loadCharts();
    }



}]);

myApp.controller('ethernetController', ['$scope', '$rootScope', '$routeParams', function ($scope, $rootScope, $routeParams) {

    $scope.files = [];
    $scope.selectedIndex = 0;

    $scope.$watch(function () {
        return $rootScope.currentInterval;
    }, function () {
        if (typeof $rootScope.currentData !== 'undefined' && $rootScope.currentData.EthernetStats.length > 0) {
            $scope.files = [];
            $scope.loadCharts();
        }
    }, true);

    $scope.$watch(function () {
        return $rootScope.currentDeltaOption;
    }, function () {
        if (typeof $rootScope.currentData !== 'undefined' && $rootScope.currentData.EthernetStats.length > 0) {
            $scope.files = [];
            $scope.loadCharts();
        }
    }, true);

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
                        return (this.value * $rootScope.currentInterval);
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

    $scope.selectFile = function (index) {
        $scope.selectedIndex = index;
    }

    $scope.isShowing = function (index) {
        return $scope.selectedIndex === index;
    }

    $scope.loadCharts = function () {


        for (var i = 0; i < $rootScope.currentData.EthernetStats.length; i++) {
            $scope.files.push({
                Name: $rootScope.currentData.EthernetStats[i].Name,
                Charts: []
            });
        }

        for (var i = 0; i < $rootScope.currentData.EthernetStats.length; i++) {

            var ethernetFile = $rootScope.currentData.EthernetStats[i];
            var messageCount = ethernetFile.Data.Messages.length - 2; //dont take into account the registration message or the mock obj at the end

            //fill series data;
            var receivedPacketSeries = [];
            var transmittedPacketSeries = [];

            var receivedPacketDeltaSeries = []
            var transmittedPacketDeltaSeries = [];

            var statusSeries = [];

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
            var registrationDetails = ethernetFile.Data.Messages[0].DataItems;
            for (var j = 0; j < registrationDetails.length; j++) {
                receivedPacketSeries.push({
                    name: registrationDetails[j].InterfaceName,
                    data: []
                });

                transmittedPacketSeries.push({
                    name: registrationDetails[j].InterfaceName,
                    data: []
                });

                receivedPacketDeltaSeries.push({
                    name: registrationDetails[j].InterfaceName,
                    data: []
                });

                transmittedPacketDeltaSeries.push({
                    name: registrationDetails[j].InterfaceName,
                    data: []
                });

                statusSeries.push({
                    name: registrationDetails[j].InterfaceName,
                    data: []
                });

                for (var k = 0; k < errorSeries.length; k++) {
					var drillId = registrationDetails[j].InterfaceName + '-' + k;
                    errorSeries[k].data.push({ name: registrationDetails[j].InterfaceName, y: 0, drilldown: drillId});
					errorDrilldown.push({
                         type: 'line',
                         id: drillId,
                         data: []
                         
                     });
                }
            }

            //move this logic into core library?
            for (var j = 1; j <= messageCount; j++) {
                var dataItems = ethernetFile.Data.Messages[j].DataItems;
				
				var drillIndex = 0;
                for (var k = 0; k < dataItems.length; k++) {
                    receivedPacketSeries[k].data.push(parseInt(dataItems[k].RxGood));
                    transmittedPacketSeries[k].data.push(parseInt(dataItems[k].TxGood));

                    if (j == 1) {
                        receivedPacketSeries[k].data.push(0);
                        transmittedPacketSeries[k].data.push(0);
                    } else {

                        var prevData = ethernetFile.Data.Messages[j - 1].DataItems[k];

                        var rxPrevious = parseInt(prevData.RxGood)
                        var rxCurrent = parseInt(dataItems[k].RxGood);

                        var txPrevious = parseInt(prevData.TxGood)
                        var txCurrent = parseInt(dataItems[k].TxGood);

                        receivedPacketDeltaSeries[k].data.push(rxCurrent - rxPrevious);
                        transmittedPacketDeltaSeries[k].data.push(txCurrent - txPrevious);
                    }

                    statusSeries[k].data.push(parseInt(dataItems[k].Status));
					
					
                    errorSeries[0].data[k].y = parseInt(dataItems[k].RxErrors); 
                    errorSeries[1].data[k].y = parseInt(dataItems[k].RxDropped);
                    errorSeries[2].data[k].y = parseInt(dataItems[k].RxOverruns);
                    errorSeries[3].data[k].y = parseInt(dataItems[k].RxFrame);
                    errorSeries[4].data[k].y = parseInt(dataItems[k].TxErrors);
                    errorSeries[5].data[k].y = parseInt(dataItems[k].TxDropped);
                    errorSeries[6].data[k].y = parseInt(dataItems[k].TxOverruns);
                    errorSeries[7].data[k].y = parseInt(dataItems[k].TxCarrier);
                    errorSeries[8].data[k].y = parseInt(dataItems[k].TxCollisions); 

					
					errorDrilldown[drillIndex].data.push({x:j, y: parseInt(dataItems[k].RxErrors)});
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].RxDropped)}); 
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].RxOverruns)}); 
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].RxFrame)}); 
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].TxErrors)}); 
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].TxDropped)}); 
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].TxOverruns)}); 
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].TxCarrier)}); 
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].TxCollisions)})
					++drillIndex;
                }


            }


            var receivedPacketsChart = $scope.buildEthernetChart('Received Packets', 'Received Packets', receivedPacketSeries);
            var transmittedPacketsChart = $scope.buildEthernetChart('Transmitted Packets', 'Transmitted Packets', transmittedPacketSeries);

            if ($rootScope.currentDeltaOption) {
                receivedPacketsChart = $scope.buildEthernetChart('Received Packets', 'Received Packets Delta', receivedPacketDeltaSeries);
                transmittedPacketsChart = $scope.buildEthernetChart('Transmitted Packets', 'Transmitted Packets Delta', transmittedPacketDeltaSeries);
            }

            var statusChart = $scope.buildEthernetChart('Status', 'Status', statusSeries);

            //will need to move this into a service as well
            var errorChart = {
                options: {
                    chart: {
                        type: 'column'
                    },
					drilldown: {
						series: errorDrilldown
					}
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
                series: errorSeries
                
            };


            $scope.files[i].Charts.push(errorChart);

            $scope.files[i].Charts.push(statusChart);

            $scope.files[i].Charts.push(receivedPacketsChart);
            $scope.files[i].Charts.push(transmittedPacketsChart);


        }
    }

    if (typeof $rootScope.currentData !== 'undefined' && $rootScope.currentData.EthernetStats.length > 0) {
        $scope.loadCharts();
    }

}]);

myApp.controller('switchController', ['$scope', '$rootScope', '$routeParams', function ($scope, $rootScope, $routeParams) {

    $scope.files = [];
    $scope.selectedIndex = 0;


    $scope.$watch(function () {
        return $rootScope.currentInterval;
    }, function () {
        if (typeof $rootScope.currentData !== 'undefined' && $rootScope.currentData.SwitchStats.length > 0) {
            $scope.files = [];
            $scope.loadCharts();
        }
    }, true);


    $scope.$watch(function () {
        return $rootScope.currentDeltaOption;
    }, function () {
        if (typeof $rootScope.currentData !== 'undefined' && $rootScope.currentData.SwitchStats.length > 0) {
            $scope.files = [];
            $scope.loadCharts();
        }
    }, true);

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
                        return (this.value * $rootScope.currentInterval);
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

    $scope.selectFile = function (index) {
        $scope.selectedIndex = index;
    }

    $scope.isShowing = function (index) {
        return $scope.selectedIndex === index;
    }

    $scope.loadCharts = function () {

        for (var i = 0; i < $rootScope.currentData.SwitchStats.length; i++) {
            $scope.files.push({
                Name: $rootScope.currentData.SwitchStats[i].Name,
                Charts: []
            });
        }


        for (var i = 0; i < $rootScope.currentData.SwitchStats.length; i++) {
            var switchFile = $rootScope.currentData.SwitchStats[i];
            var messageCount = switchFile.Data.Messages.length - 2; //dont take into account the registration message or the mock obj at the end

            //building series data will go here
            var ingressByteSeries = [];
            var egressByteSeries = [];

            var ingressMulticastSeries = [];
            var egressMulticastSeries = [];

            var ingressBroadcastSeries = [];
            var egressBroadcastSeries = [];

            var ingressUnicastSeries = [];
            var egressUnicastSeries = [];

            var ingressMulticastDeltaSeries = [];
            var egressMulticastDeltaSeries = [];

            var ingressBroadcastDeltaSeries = [];
            var egressBroadcastDeltaSeries = [];

            var ingressUnicastDeltaSeries = [];
            var egressUnicastDeltaSeries = [];

            var ingressBandwidthSeries = [];
            var egressBandwidthSeries = [];

            var statusSeries = [];

			var errorDrilldown = [];
            var errorSeries = [
			{
			    name: 'Ingress Pause',
			    data: []
			},
            {
                name: 'Ingress Undersize',
                data: []
            },
            {
                name: 'Ingress Fragments',
                data: []
            },
            {
                name: 'Ingress Oversize',
                data: []
            },
            {
                name: 'Ingress Jabber',
                data: []
            },
            {
                name: 'Inress Rx Error',
                data: []
            },
            {
                name: 'Ingress Fcs Error',
                data: []
            },
            {
                name: 'Egress Pause',
                data: []
            },
            {
                name: 'Egress Excessive',
                data: []
            },
            {
                name: 'Egress Collisions',
                data: []
            },
            {
                name: 'Egress Other',
                data: []
            }
            ];

            var registrationDetails = switchFile.Data.Messages[0].DataItems;
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

                ingressMulticastDeltaSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });
                egressMulticastDeltaSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });

                ingressBroadcastDeltaSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });
                egressBroadcastDeltaSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });

                ingressUnicastDeltaSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });
                egressUnicastDeltaSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });

                ingressBandwidthSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });
                egressBandwidthSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });

                statusSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });

                for (var k = 0; k < errorSeries.length; k++) {
					var drillId = registrationDetails[j].ID + '-' + k;
                    errorSeries[k].data.push({ name: registrationDetails[j].ID, y: 0, drilldown: drillId });
					errorDrilldown.push({
                         type: 'line',
                         id: drillId,
                         data: []
                     });
                }
            }

            //move this logic into core library?
            for (var j = 1; j <= messageCount; j++) {
                var dataItems = switchFile.Data.Messages[j].DataItems;

				var drillIndex = 0;
                for (var k = 0; k < dataItems.length - 1; k++) {

                    ingressByteSeries[k].data.push(parseInt(dataItems[k].IngressBytes));
                    egressByteSeries[k].data.push(parseInt(dataItems[k].EgressBytes));

                    ingressMulticastSeries[k].data.push(parseInt(dataItems[k].IngressMulticast));
                    egressMulticastSeries[k].data.push(parseInt(dataItems[k].EgressMulticast));

                    ingressBroadcastSeries[k].data.push(parseInt(dataItems[k].IngressBroadcast));
                    egressBroadcastSeries[k].data.push(parseInt(dataItems[k].EgressBroadcast));

                    ingressUnicastSeries[k].data.push(parseInt(dataItems[k].IngressUnicast));
                    egressUnicastSeries[k].data.push(parseInt(dataItems[k].EgressUnicast));

                    if (j == 1) {
                        ingressBandwidthSeries[k].data.push(0);
                        egressBandwidthSeries[k].data.push(0);

                        ingressMulticastDeltaSeries[k].data.push(0);
                        egressMulticastDeltaSeries[k].data.push(0);

                        ingressBroadcastDeltaSeries[k].data.push(0);
                        egressBroadcastDeltaSeries[k].data.push(0);

                        ingressUnicastDeltaSeries[k].data.push(0);
                        egressUnicastDeltaSeries[k].data.push(0);
                    } else {

                        var prevData = switchFile.Data.Messages[j - 1].DataItems[k];

                        var unicastIngressPrevious = parseInt(prevData.IngressUnicast);
                        var unicastIngressCurrent = parseInt(dataItems[k].IngressUnicast);

                        var unicastEgressPrevious = parseInt(prevData.EgressUnicast);
                        var unicastEgressCurrent = parseInt(dataItems[k].EgressUnicast);

                        var broadcastIngressPrevious = parseInt(prevData.IngressBroadcast);
                        var broadcastIngressCurrent = parseInt(dataItems[k].IngressBroadcast);

                        var broadcastEgressPrevious = parseInt(prevData.EgressBroadcast);
                        var broadcastEgressCurrent = parseInt(dataItems[k].EgressBroadcast);

                        var multicastIngressPrevious = parseInt(prevData.IngressMulticast);
                        var multicastIngressCurrent = parseInt(dataItems[k].IngressMulticast);

                        var multicastEgressPrevious = parseInt(prevData.EgressMulticast);
                        var multicastEgressCurrent = parseInt(dataItems[k].EgressMulticast);

                        var ingressPrevious = parseInt(prevData.IngressBytes);
                        var ingressCurrent = parseInt(dataItems[k].IngressBytes);
                        var egressPrevious = parseInt(prevData.EgressBytes);
                        var egressCurrent = parseInt(dataItems[k].EgressBytes);

                        //will need to divide on interval once its implemented
                        ingressBandwidthSeries[k].data.push(((ingressCurrent - ingressPrevious) * .008) / ($rootScope.currentInterval * 60)); //convert B/s to kb/s
                        egressBandwidthSeries[k].data.push(((egressCurrent - egressPrevious) * .008) / ($rootScope.currentInterval * 60));

                        ingressUnicastDeltaSeries[k].data.push(unicastIngressCurrent - unicastIngressPrevious);
                        egressUnicastDeltaSeries[k].data.push(unicastEgressCurrent - unicastEgressPrevious);

                        ingressBroadcastDeltaSeries[k].data.push(broadcastIngressCurrent - broadcastIngressPrevious);
                        egressBroadcastDeltaSeries[k].data.push(broadcastEgressCurrent - broadcastEgressPrevious);

                        ingressMulticastDeltaSeries[k].data.push(multicastIngressCurrent - multicastIngressPrevious);
                        egressMulticastDeltaSeries[k].data.push(multicastEgressCurrent - multicastEgressPrevious);
                    }

                    statusSeries[k].data.push(parseInt(dataItems[k].Status));


                    errorSeries[0].data[k].y = parseInt(dataItems[k].IngressPause); 
                    errorSeries[1].data[k].y = parseInt(dataItems[k].IngressUndersize);
                    errorSeries[2].data[k].y = parseInt(dataItems[k].IngressFragments);
                    errorSeries[3].data[k].y = parseInt(dataItems[k].IngressOversize);
                    errorSeries[4].data[k].y = parseInt(dataItems[k].IngressJabber);
                    errorSeries[5].data[k].y = parseInt(dataItems[k].IngressRxErr);
                    errorSeries[6].data[k].y = parseInt(dataItems[k].IngressFcsErr);
                    errorSeries[7].data[k].y = parseInt(dataItems[k].EgressPause);
                    errorSeries[8].data[k].y = parseInt(dataItems[k].EgressExcessive);
                    errorSeries[9].data[k].y = parseInt(dataItems[k].EgressCollisions);
                    errorSeries[10].data[k].y = parseInt(dataItems[k].EgressOther);
					
					errorDrilldown[drillIndex].data.push({x:j, y: parseInt(dataItems[k].IngressPause)});
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].IngressUndersize)}); 
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].IngressFragments)}); 
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].IngressOversize)}); 
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].IngressJabber)}); 
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].IngressRxErr)}); 
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].IngressFcsErr)}); 
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].EgressPause)}); 
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].EgressExcessive)})
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].EgressCollisions)}); 
					errorDrilldown[++drillIndex].data.push({x:j, y: parseInt(dataItems[k].EgressOther)})
					++drillIndex;

                }
            }

            var errorChart = {
                options: {
                    chart: {
                        type: 'column',
                        zoomType: 'x'
                    },
					drilldown: {
						series: errorDrilldown
					}
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
                series: errorSeries
            };

            //does not separate presentation code from logic and data. need to write a directive for this
            var ingressBytesChart = $scope.buildSwitchChart('Ingress Bytes', 'Bytes', ingressByteSeries);
            var egressBytesChart = $scope.buildSwitchChart('Egress Bytes', 'Bytes', egressByteSeries);

            var ingressMulticastChart = $scope.buildSwitchChart('Ingress Multicast', 'Packets', ingressMulticastSeries);
            var egressMulticastChart = $scope.buildSwitchChart('Egress Multicast', 'Packets', egressMulticastSeries);

            var ingressBroadcastChart = $scope.buildSwitchChart('Ingress Broadcast', 'Packets', ingressBroadcastSeries);
            var egressBroadcastChart = $scope.buildSwitchChart('Egress Broadcast', 'Packets', egressBroadcastSeries);

            var ingressUnicastChart = $scope.buildSwitchChart('Ingress Unicast', 'Packets', ingressUnicastSeries);
            var egressUnicastChart = $scope.buildSwitchChart('Egress Unicast', 'Packets', egressUnicastSeries);

            var ingressBandwidthChart = $scope.buildSwitchChart('Ingress Bandwidth', 'kb/s', ingressBandwidthSeries);
            var egressBandwidthChart = $scope.buildSwitchChart('Egress Bandwidth', 'kb/s', egressBandwidthSeries);

            var statusChart = $scope.buildSwitchChart('Status', 'Status', statusSeries);

            if ($rootScope.currentDeltaOption) {

                ingressMulticastChart = $scope.buildSwitchChart('Ingress Multicast', 'Packets Delta', ingressMulticastDeltaSeries);
                egressMulticastChart = $scope.buildSwitchChart('Egress Multicast', 'Packets Delta', egressMulticastDeltaSeries);

                ingressBroadcastChart = $scope.buildSwitchChart('Ingress Broadcast', 'Packets Delta', ingressBroadcastDeltaSeries);
                egressBroadcastChart = $scope.buildSwitchChart('Egress Broadcast', 'Packets Delta', egressBroadcastDeltaSeries);

                ingressUnicastChart = $scope.buildSwitchChart('Ingress Unicast', 'Packets Delta', ingressUnicastDeltaSeries);
                egressUnicastChart = $scope.buildSwitchChart('Egress Unicast', 'Packets Delta', egressUnicastDeltaSeries);
            }


            $scope.files[i].Charts.push(errorChart);

            $scope.files[i].Charts.push(ingressBytesChart);
            $scope.files[i].Charts.push(egressBytesChart);

            $scope.files[i].Charts.push(ingressMulticastChart);
            $scope.files[i].Charts.push(egressMulticastChart);

            $scope.files[i].Charts.push(ingressBroadcastChart);
            $scope.files[i].Charts.push(egressBroadcastChart);

            $scope.files[i].Charts.push(ingressUnicastChart);
            $scope.files[i].Charts.push(egressUnicastChart);

            $scope.files[i].Charts.push(ingressBandwidthChart);
            $scope.files[i].Charts.push(egressBandwidthChart);

            $scope.files[i].Charts.push(statusChart);

        }

    }

    if (typeof $rootScope.currentData !== 'undefined' && $rootScope.currentData.SwitchStats.length > 0) {
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

