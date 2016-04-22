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

    $scope.interval = 2;

    $scope.filesToUpload = [];

    $scope.updateInterval = function () {
        $rootScope.currentInterval = $scope.interval;
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
                    path = '/iptable/true';
                }
                else if (files[i].Data.LogType == "Switch") {
                    $rootScope.currentData.SwitchStats.push(files[i]);
                    path = '/switch/true';
                }
                else if (files[i].Data.LogType == "Ethernet") {
                    $rootScope.currentData.EthernetStats.push(files[i]);
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

            var inputBandwidthSeries = [];
            var outputBandwidthSeries = [];
            var forwardBandwidthSeries = [];


            var registrationDetails = ipFile.Data.Messages[0].DataItems;
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

                    inputBandwidthSeries.push({
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

                    outputBandwidthSeries.push({
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

                    forwardBandwidthSeries.push({
                        name: registrationDetails[j].id,
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
                        } else {

                            var prevData = ipFile.Data.Messages[j - 1].DataItems[inputIndex];

                            var bytesPrevious = parseInt(prevData.Bytes);
                            var bytesCurrent = parseInt(dataItems[inputIndex].Bytes);

                            inputBandwidthSeries[inputIndex].data.push(((bytesCurrent - bytesPrevious) * .008) / ($rootScope.currentInterval * 60)); //convert B/s to kb/s
                        }

                        inputIndex++;
                    }
                    if (dataItems[k].Chain == "OUTPUT") {
                        outputByteSeries[outputIndex].data.push(parseInt(dataItems[k].Bytes));
                        outputPacketSeries[outputIndex].data.push(parseInt(dataItems[k].Packets));

                        if (j == 1) {
                            outputBandwidthSeries[outputIndex].data.push(0);
                        } else {

                            var prevData = ipFile.Data.Messages[j - 1].DataItems[outputIndex];

                            var bytesPrevious = parseInt(prevData.Bytes);
                            var bytesCurrent = parseInt(dataItems[outputIndex].Bytes);

                            //will need to divide on interval once its implemented
                            outputBandwidthSeries[outputIndex].data.push(((bytesCurrent - bytesPrevious) * .008) / ($rootScope.currentInterval * 60)); //convert B/s to kb/s
                        }

                        outputIndex++;
                    }
                    if (dataItems[k].Chain == "FORWARD") {
                        forwardByteSeries[forwardIndex].data.push(parseInt(dataItems[k].Bytes));
                        forwardPacketSeries[forwardIndex].data.push(parseInt(dataItems[k].Packets));

                        if (j == 1) {
                            forwardBandwidthSeries[forwardIndex].data.push(0);
                        } else {

                            var prevData = ipFile.Data.Messages[j - 1].DataItems[forwardIndex];

                            var bytesPrevious = parseInt(prevData.Bytes);
                            var bytesCurrent = parseInt(dataItems[forwardIndex].Bytes);

                            //will need to divide on interval once its implemented
                            forwardBandwidthSeries[forwardIndex].data.push(((bytesCurrent - bytesPrevious) * .008) / ($rootScope.currentInterval * 60)); //convert B/s to kb/s
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
                var dataItems = ethernetFile.Data.Messages[j].DataItems;

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


            $scope.files[i].Charts.push(errorChart);

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

            var ingressBandwidthSeries = [];
            var egressBandwidthSeries = [];


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
                ingressBandwidthSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });
                egressBandwidthSeries.push({
                    name: registrationDetails[j].ID,
                    data: []
                });
            }

            //move this logic into core library?
            for (var j = 1; j < messageCount - 1; j++) {
                var dataItems = switchFile.Data.Messages[j].DataItems;

                for (var k = 0; k < dataItems.length - 1; k++) {

                    ingressByteSeries[k].data.push(parseInt(dataItems[k].IngressBytes));
                    egressByteSeries[k].data.push(parseInt(dataItems[k].EgressBytes));

                    ingressMulticastSeries[k].data.push(parseInt(dataItems[k].IngressMulticast));
                    egressMulticastSeries[k].data.push(parseInt(dataItems[k].EgressMulticast));

                    ingressBroadcastSeries[k].data.push(parseInt(dataItems[k].IngressBroadcast));
                    egressBroadcastSeries[k].data.push(parseInt(dataItems[k].EgressBroadcast));

                    ingressUnicastSeries[k].data.push(parseInt(dataItems[k].IngressuUnicast));
                    egressUnicastSeries[k].data.push(parseInt(dataItems[k].EgressUnicast));

                    if (j == 1) {
                        ingressBandwidthSeries[k].data.push(0);
                        egressBandwidthSeries[k].data.push(0);
                    } else {

                        var prevData = switchFile.Data.Messages[j - 1].DataItems[k];

                        var ingressPrevious = parseInt(prevData.IngressBytes);
                        var ingressCurrent = parseInt(dataItems[k].IngressBytes);
                        var egressPrevious = parseInt(prevData.EgressBytes);
                        var egressCurrent = parseInt(dataItems[k].EgressBytes);

                        //will need to divide on interval once its implemented
                        ingressBandwidthSeries[k].data.push(((ingressCurrent - ingressPrevious) * .008) / ($rootScope.currentInterval * 60)); //convert B/s to kb/s
                        egressBandwidthSeries[k].data.push(((egressCurrent - egressPrevious) * .008) / ($rootScope.currentInterval * 60));

                    }
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

            var ingressBandwidthChart = $scope.buildSwitchChart('Ingress Bandwidth', 'kb/s', ingressBandwidthSeries);
            var egressBandwidthChart = $scope.buildSwitchChart('Egress Bandwidth', 'kb/s', egressBandwidthSeries);

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

