
/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 * Copyright (c) 2011, Research In Motion Limited.
 */

cordova.PluginManager = (function (webworksPluginManager) {
    "use strict";

    /**
     * Private list of HTML 5 audio objects, indexed by the Cordova media object ids
     */
    var audioObjects = {},
        retInvalidAction = { "status" : Cordova.callbackStatus.INVALID_ACTION, "message" : "Action not found" },
        retAsyncCall = { "status" : Cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" },
        cameraAPI = {
            execute: function (webWorksResult, action, args, win, fail) {
                switch (action) {
                case 'takePicture':
                    blackberry.media.camera.takePicture(win, fail, fail);
                    return retAsyncCall;
                }
                return retInvalidAction;
            }
        },
        deviceAPI = {
            execute: function (webWorksResult, action, args, win, fail) {
                if (action === 'getDeviceInfo') {
                    return {"status" : Cordova.callbackStatus.OK,
                            "message" : {
                                "version" : blackberry.system.softwareVersion,
                                "name" : blackberry.system.model,
                                "uuid" : blackberry.identity.PIN,
                                "platform" : "PlayBook",
                                "cordova" : "1.5.0"
                            }
                    };
                }
                return retInvalidAction;
            }
        },
        loggerAPI = {
            execute: function (webWorksResult, action, args, win, fail) {
                switch (action) {
                case 'log':
                    console.log(args);
                    return {"status" : Cordova.callbackStatus.OK,
                            "message" : 'Message logged to console: ' + args};
                }
                return retInvalidAction;
            }
        },
        mediaAPI = {
            execute: function (webWorksResult, action, args, win, fail) {
                if (!args.length) {
                    return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
                }

                var id = args[0],
                    audio = audioObjects[id],
                    result;

                switch (action) {
                case 'startPlayingAudio':
                    if (args.length === 1) {
                        result = {"status" : 9, "message" : "Media source argument not found"};

                    }

                    if (audio) {
                        audio.pause();
                        audioObjects[id] = undefined;
                    }

                    audio = audioObjects[id] = new Audio(args[1]);
                    audio.play();

                    result = {"status" : 1, "message" : "Audio play started" };
                    break;
                case 'stopPlayingAudio':
                    if (!audio) {
                        return {"status" : 2, "message" : "Audio Object has not been initialized"};
                    }

                    audio.pause();
                    audioObjects[id] = undefined;

                    result = {"status" : 1, "message" : "Audio play stopped" };
                    break;
                case 'seekToAudio':
                    if (!audio) {
                        result = {"status" : 2, "message" : "Audio Object has not been initialized"};
                    } else if (args.length === 1) {
                        result = {"status" : 9, "message" : "Media seek time argument not found"};
                    } else {
                        try {
                            audio.currentTime = args[1];
                        } catch (e) {
                            console.log('Error seeking audio: ' + e);
                            return {"status" : 3, "message" : "Error seeking audio: " + e};
                        }

                        result = {"status" : 1, "message" : "Seek to audio succeeded" };
                    }
                    break;
                case 'pausePlayingAudio':
                    if (!audio) {
                        return {"status" : 2, "message" : "Audio Object has not been initialized"};
                    }

                    audio.pause();

                    result = {"status" : 1, "message" : "Audio paused" };
                    break;
                case 'getCurrentPositionAudio':
                    if (!audio) {
                        return {"status" : 2, "message" : "Audio Object has not been initialized"};
                    }

                    result = {"status" : 1, "message" : audio.currentTime };
                    break;
                case 'getDuration':
                    if (!audio) {
                        return {"status" : 2, "message" : "Audio Object has not been initialized"};
                    }

                    result = {"status" : 1, "message" : audio.duration };
                    break;
                case 'startRecordingAudio':
                    if (args.length <= 1) {
                        result = {"status" : 9, "message" : "Media start recording, insufficient arguments"};
                    }

                    blackberry.media.microphone.record(args[1], win, fail);
                    result = retAsyncCall;
                    break;
                case 'stopRecordingAudio':
                    break;
                case 'release':
                    if (audio) {
                        audioObjects[id] = undefined;
                        audio.src = undefined;
                        //delete audio;
                    }

                    result = {"status" : 1, "message" : "Media resources released"};
                    break;
                default:
                    result = retInvalidAction;
                }

                return result;
            }
        },
        mediaCaptureAPI = {
            execute: function (webWorksResult, action, args, win, fail) {
                var limit = args[0],
                    pictureFiles = [],
                    captureMethod;

                function captureCB(filePath) {
                    var mediaFile;

                    if (filePath) {
                        mediaFile = new MediaFile();
                        mediaFile.fullPath = filePath;
                        pictureFiles.push(mediaFile);
                    }

                    if (limit > 0) {
                        limit--;
                        blackberry.media.camera[captureMethod](win, fail, fail);
                        return;
                    }

                    win(pictureFiles);

                    return retAsyncCall;
                }

                switch (action) {
                    case 'getSupportedAudioModes':
                    case 'getSupportedImageModes':
                    case 'getSupportedVideoModes':
                        return {"status": Cordova.callbackStatus.OK, "message": []};
                    case 'captureImage':
                        captureMethod = "takePicture";
                        captureCB();
                        break;
                    case 'captureVideo':
                        captureMethod = "takeVideo";
                        captureCB();
                        break;
                    case 'captureAudio':
                        return {"status": Cordova.callbackStatus.INVALID_ACTION, "message": "captureAudio is not currently supported"};
                }

                return retAsyncCall;
            }
        },

        networkAPI = {
            execute: function (webWorksResult, action, args, win, fail) {
                var connectionType = Connection.NONE,
                    eventType = "offline",
                    callbackID,
                    request;

                /**
                 * For PlayBooks, we currently only have WiFi connections, so return WiFi if there is
                 * any access at all.
                 * TODO: update if/when PlayBook gets other connection types...
                 */
                switch (action) {
                case 'getConnectionInfo':
                    if (blackberry.system.hasDataCoverage()) {
                        connectionType = Connection.WIFI;
                        eventType = "online";
                    }

                    //Register an event handler for the networkChange event
                    callbackID = blackberry.events.registerEventHandler("networkChange", win);

                    //pass our callback id down to our network extension
                    request = new blackberry.transport.RemoteFunctionCall("org/apache/cordova/getConnectionInfo");
                    request.addParam("networkStatusChangedID", callbackID);
                    request.makeSyncCall();

                    return { "status": Cordova.callbackStatus.OK, "message": {"type": connectionType, "event": eventType } };
                }
                return retInvalidAction;
            }
        },

        notificationAPI = {
            execute: function (webWorksResult, action, args, win, fail) {
                if (args.length !== 3) {
                  return {"status" : 9, "message" : "Notification action - " + action + " arguments not found"};

                }

                //Unpack and map the args
                var msg = args[0],
                    title = args[1],
                    btnLabel = args[2],
                    btnLabels;

                switch (action) {
                case 'alert':
                    blackberry.ui.dialog.customAskAsync.apply(this, [ msg, [ btnLabel ], win, { "title" : title } ]);
                    return retAsyncCall;
                case 'confirm':
                    btnLabels = btnLabel.split(",");
                    blackberry.ui.dialog.customAskAsync.apply(this, [msg, btnLabels, win, {"title" : title} ]);
                    return retAsyncCall;
                }
                return retInvalidAction;

            }
        },
        fileAPI = {
            execute: function (webWorksResult, action, args, win, fail) {
                if (!(args.length >= 1)) {
                    return {"status" : 9, "message" : "Notification action - " + action + " arguments not found"};

                }

                //Unpack and map the args
                var fileName = args[0];
                switch (action) {
                    case 'readAsText':
                        var encoding = args[1];

                        blackberry.io.file.readFile(fileName, function(fullPath, blobData){
                                var data = blackberry.utils.blobToString(blobData, encoding);
                                win(data);
                            },
                            false);

                        return retAsyncCall;
                    case 'readAsDataURL':
                        var encoding = 'BASE64';

                        blackberry.io.file.readFile(fileName, function(fullPath, stringData){
                                var data = blackberry.utils.stringToBlob(stringData, encoding);
                                win(data);
                            },
                            false);
                        return retAsyncCall;
                    case 'write':
                        var data = args[1];
                        var position = args[2]; //Not used
                        blackberry.io.file.saveFile(fileName,data);
                        win();
                        return retAsyncCall;
                }
                return retInvalidAction;

            }
        },
        accelerationAPI = {
            execute: function (webWorksResult, action, args, win, fail) {
                switch (action) {
                    case 'getAcceleration':
                     var accEvent =   window.addEventListener('devicemotion', function(event) {

                            var ax =  event.accelerationIncludingGravity.x;
                            var ay =  event.accelerationIncludingGravity.y;
                            var az =  event.accelerationIncludingGravity.z;
                            win(new Acceleration(ax,ay,az));
                            window.removeEventListener(accEvent);
                        }, true);

                        return retAsyncCall;
                    case 'setTimeout':
                        if(args[0]){
                        accelerationTimeout = args[0];
                        }
                        return retAsyncCall;
                    case 'getTimeout':
                                if(accelerationTimeout){
                                    win(accelerationTimeout);
                                }else{
                                    fail();
                                }
                        return retAsyncCall;
                }
                return retInvalidAction;

            }
        },
        geolocationAPI = {
            execute: function (webWorksResult, action, args, win, fail) {
                var id = args[0];
                switch (action) {
                    case 'getAcceleration':

                        navigator.geolocation.getCurrentPosition(
                            function(position) {
                                navigator._geo.listeners[id].success(new Coordinates
                                    (position.latitude,
                                        position.longitude,
                                        position.accuracy,
                                        position.altitude,
                                        position.heading,
                                        position.speed,
                                        position.altitudeAccuracy));
                            },
                            function(error) {
                                navigator._geo.listeners[id].fail(error);
                            }
                        );
                        return retAsyncCall;
                    case 'watchPosition':
                        var  maximumAge = args[1],
                            timeout = args[2],
                            enableHighAccuracy = args[3];

                        _cordovaGeoWatchID = navigator.geolocation.watchPosition(
                            //OnSuccess
                            function(position){
                                navigator._geo.listeners[id].success(new Coordinates
                                    (position.latitude,
                                        position.longitude,
                                        position.accuracy,
                                        position.altitude,
                                        position.heading,
                                        position.speed,
                                        position.altitudeAccuracy));

                            },  //OnError
                            function(error){
                                navigator._geo.listeners[id].fail(error);

                            }, //Options
                            {
                                maximumAge: maximumAge,
                                timeout: timeout,
                                enableHighAccuracy: enableHighAccuracy
                            }
                        );

                        return retAsyncCall;
                    case 'stop':
                        navigator.geolocation.clearWatch(id);
                        return retAsyncCall;
                }
                return retInvalidAction;

            }
        },
        fileTransferAPI = {
            execute: function (webWorksResult, action, args, win, fail) {
                var id = args[0];
                switch (action) {
                    case 'download':
//                        Cordova.exec(castSuccess, errorCallback, 'FileTransfer',
//                            'download', [ source, target ]);

                        return retAsyncCall;
                    case 'upload':
//                        Cordova.exec(successCallback, errorCallback, 'FileTransfer', 'upload',
//                            [ filePath, server, fileKey, fileName, mimeType, params, debug,
//                                chunkedMode ]);

                        return retAsyncCall;
                    case 'stop':
                        return retAsyncCall;
                }
                return retInvalidAction;

            }
        },

        plugins = {
            'Camera' : cameraAPI,
            'Device' : deviceAPI,
            'Logger' : loggerAPI,
            'Media' : mediaAPI,
            'MediaCapture' : mediaCaptureAPI,
            'Network Status' : networkAPI,
            'Notification' : notificationAPI
        };

    cordova.PlayBookPluginManager = function () {
        Cordova.onNativeReady.fire();
    };

    cordova.PlayBookPluginManager.prototype.exec = function (win, fail, clazz, action, args) {
        var wwResult = webworksPluginManager.exec(win, fail, clazz, action, args);

        //We got a sync result or a not found from WW that we can pass on to get a native mixin
        //For async calls there's nothing to do
        if ((wwResult.status === Cordova.callbackStatus.OK ||
          wwResult.status === Cordova.callbackStatus.CLASS_NOT_FOUND_EXCEPTION) &&
          plugins[clazz]) {
            return plugins[clazz].execute(wwResult.message, action, args, win, fail);
        }

        return wwResult;
    };

    cordova.PlayBookPluginManager.prototype.resume = function () {};
    cordova.PlayBookPluginManager.prototype.pause = function () {};
    cordova.PlayBookPluginManager.prototype.destroy = function () {};

    //Instantiate it
    return new cordova.PlayBookPluginManager();
}(new cordova.WebWorksPluginManager()));
